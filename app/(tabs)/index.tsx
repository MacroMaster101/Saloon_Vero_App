import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View, Text, RefreshControl, StyleSheet, Modal, ScrollView, Platform, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getMyBookings, getServices, getStylists, getStylistReviews, createStylistReview, likeReview, reportReview } from '@/lib/api/queries';
import { resolveConversationId } from '@/lib/api/chat';
import { ServiceCard } from '@/components/services/service-card';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/context/session';
import { LoadingScreen } from '@/components/ui/loading';
import type { Service, Stylist, StylistReview } from '@/types/database';

import { Image } from 'expo-image';
import { avatarSrc } from '@/lib/utils/avatar';
import { getStylistBio } from '@/lib/utils/stylist-bio';
import { getStylistAvatar } from '@/components/stylists/stylist-card';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { computeUpdatedRating, REVIEW_STORAGE_KEYS } from '@/lib/utils/reviews';

type BookingPreview = { reference: string; starts_at: string; status: string };

export default function Home() {
  const { c, Radius, Type, Spacing, Shadow, scheme } = useTheme();
  const { user, isGuest, loading: sessionLoading } = useSession();

  // Swipable Stacked Stylist Cards Layout Constants
  const screenWidth = Dimensions.get('window').width;
  const CARD_WIDTH = 220;
  const CARD_MARGIN = -25;
  const SNAP_INTERVAL = CARD_WIDTH + 2 * CARD_MARGIN; // 170 center-to-center
  const CAROUSEL_PADDING = (screenWidth - CARD_WIDTH) / 2 - CARD_MARGIN; // centers active card on screen

  // Enough copies for a seamless infinite loop without rendering hundreds of
  // cards at once. The recentre logic resets when within 3 lengths of an end,
  // so 7 (3 + middle + 3) is ample. (Was 50 → ~85% fewer mounted cards.)
  const VIRTUAL_REPEATS = 7;

  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [bookings, setBookings] = useState<BookingPreview[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [infoStylist, setInfoStylist] = useState<Stylist | null>(null);

  // Reviews state hooks
  const [reviews, setReviews] = useState<StylistReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'About' | 'Reviews'>('About');
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Engagement: likes & reports (persisted per device)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [engagingId, setEngagingId] = useState<string | null>(null);

  // Load persisted engagement state
  useEffect(() => {
    AsyncStorage.multiGet([REVIEW_STORAGE_KEYS.clientLiked, REVIEW_STORAGE_KEYS.clientReported]).then((pairs) => {
      try {
        const liked = pairs[0][1] ? new Set<string>(JSON.parse(pairs[0][1])) : new Set<string>();
        const reported = pairs[1][1] ? new Set<string>(JSON.parse(pairs[1][1])) : new Set<string>();
        setLikedIds(liked);
        setReportedIds(reported);
      } catch { /* ignore */ }
    });
  }, []);

  useEffect(() => {
    if (infoStylist) {
      setLoadingReviews(true);
      getStylistReviews(infoStylist.id, infoStylist.slug)
        .then((data) => {
          setReviews(data);
          setLoadingReviews(false);
        })
        .catch(() => setLoadingReviews(false));
      setActiveTab('About');
      setIsWritingReview(false);
      setNewReviewName('');
      setNewReviewRating(5);
      setNewReviewComment('');
    } else {
      setReviews([]);
    }
  }, [infoStylist]);

  const handleSubmitReview = async () => {
    if (!infoStylist) return;
    if (!newReviewName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!newReviewComment.trim()) {
      Alert.alert('Required', 'Please enter your review description.');
      return;
    }

    setSubmittingReview(true);
    const res = await createStylistReview(
      infoStylist.id,
      newReviewName.trim(),
      newReviewRating,
      newReviewComment.trim()
    );
    setSubmittingReview(false);

    if (res.ok && res.review) {
      Alert.alert('Review Submitted ✓', 'Thank you for your feedback!');
      setReviews((prev) => [res.review!, ...prev]);

      const { rating: newRatingVal, rating_count: updatedCount } = computeUpdatedRating(infoStylist, newReviewRating);

      const updatedStylists = stylists.map((s) => {
        if (s.id === infoStylist.id) {
          return { ...s, rating: newRatingVal, rating_count: updatedCount };
        }
        return s;
      });
      setStylists(updatedStylists);
      setInfoStylist({ ...infoStylist, rating: newRatingVal, rating_count: updatedCount });

      setIsWritingReview(false);
      setNewReviewName('');
      setNewReviewRating(5);
      setNewReviewComment('');
    } else {
      Alert.alert('Error', res.error || 'Could not submit review. Please try again.');
    }
  };

  const handleLikeReview = async (review: StylistReview) => {
    if (engagingId) return;
    const wasLiked = likedIds.has(review.id);
    const delta: 1 | -1 = wasLiked ? -1 : 1;
    const prevLikedIds = likedIds;

    // Optimistic update
    setReviews((prev) => prev.map((r) =>
      r.id === review.id ? { ...r, likes_count: Math.max(0, (r.likes_count ?? 0) + delta) } : r
    ));
    const newLikedIds = new Set(likedIds);
    if (wasLiked) newLikedIds.delete(review.id); else newLikedIds.add(review.id);
    setLikedIds(newLikedIds);
    await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.clientLiked, JSON.stringify([...newLikedIds]));

    setEngagingId(review.id);
    try {
      await likeReview(review.id, delta);
    } catch {
      // Roll back optimistic UI + persisted state on failure.
      setReviews((prev) => prev.map((r) =>
        r.id === review.id ? { ...r, likes_count: Math.max(0, (r.likes_count ?? 0) - delta) } : r
      ));
      setLikedIds(prevLikedIds);
      await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.clientLiked, JSON.stringify([...prevLikedIds]));
    } finally {
      setEngagingId(null);
    }
  };

  const handleReportReview = (review: StylistReview) => {
    if (reportedIds.has(review.id)) {
      Alert.alert('Already Reported', 'You have already reported this review.');
      return;
    }
    Alert.alert(
      'Report Review?',
      'Flag this review as inappropriate for admin moderation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            const prevReportedIds = reportedIds;
            const newReportedIds = new Set(reportedIds);
            newReportedIds.add(review.id);
            setReportedIds(newReportedIds);
            await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.clientReported, JSON.stringify([...newReportedIds]));
            try {
              await reportReview(review.id);
              Alert.alert('Reported ✓', 'Thank you. Our team will review this.');
            } catch {
              // Roll back so the user can retry the report.
              setReportedIds(prevReportedIds);
              await AsyncStorage.setItem(REVIEW_STORAGE_KEYS.clientReported, JSON.stringify([...prevReportedIds]));
              Alert.alert('Error', 'Could not report this review. Please try again.');
            }
          },
        },
      ]
    );
  };

  const hasAnimated = useRef(false);
  const userId = user?.id;

  const virtualStylists: Stylist[] = stylists.length > 0 ? Array(VIRTUAL_REPEATS).fill(stylists).flat() : [];

  const stylistScrollRef = useRef<ScrollView>(null);
  const [activeStylistIndex, setActiveStylistIndex] = useState(0);
  const autoScrollTimerRef = useRef<any>(null);

  const startAutoScroll = useCallback(() => {
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }
    if (stylists.length <= 1) return;
    autoScrollTimerRef.current = setInterval(() => {
      setActiveStylistIndex((prev) => {
        const next = prev + 1;
        stylistScrollRef.current?.scrollTo({
          x: next * SNAP_INTERVAL,
          animated: true,
        });
        return next;
      });
    }, 4000);
  }, [stylists.length, SNAP_INTERVAL]);

  // Initial scroll to middle index on mount/data load
  useEffect(() => {
    if (!loading && stylists.length > 0) {
      const mid = Math.floor(VIRTUAL_REPEATS / 2) * stylists.length;
      setActiveStylistIndex(mid);
      setTimeout(() => {
        stylistScrollRef.current?.scrollTo({
          x: mid * SNAP_INTERVAL,
          animated: false,
        });
      }, 100);
    }
  }, [loading, stylists.length, SNAP_INTERVAL]);

  useEffect(() => {
    if (!loading) {
      startAutoScroll();
    }
    return () => {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    };
  }, [loading, startAutoScroll]);

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    if (index >= 0 && index < virtualStylists.length && index !== activeStylistIndex) {
      setActiveStylistIndex(index);
      startAutoScroll();

      // Silent boundary reset: snap back to middle index if close to ends
      const realIdx = index % stylists.length;
      const mid = Math.floor(VIRTUAL_REPEATS / 2) * stylists.length;
      if (index < stylists.length * 3 || index > virtualStylists.length - stylists.length * 3) {
        const nextMiddleIndex = mid + realIdx;
        setActiveStylistIndex(nextMiddleIndex);
        setTimeout(() => {
          stylistScrollRef.current?.scrollTo({
            x: nextMiddleIndex * SNAP_INTERVAL,
            animated: false,
          });
        }, 10);
      }
    }
  };

  const load = useCallback(async () => {
    const [serviceRows, stylistRows, bookingRows] = await Promise.all([
      getServices(),
      getStylists(),
      userId ? getMyBookings(userId) : Promise.resolve([]),
    ]);
    setServices(serviceRows);
    setStylists(stylistRows);
    setBookings(bookingRows as BookingPreview[]);
  }, [userId]);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/access' as never);
      return;
    }
    if (sessionLoading || !user) return;
    const start = Date.now();
    load().then(() => {
      const diff = Date.now() - start;
      const minDelay = 800; // Enforce minimum 800ms display for smooth aesthetics
      if (diff < minDelay) {
        setTimeout(() => setLoading(false), minDelay - diff);
      } else {
        setLoading(false);
      }
    });
  }, [sessionLoading, user, load]);

  // Flip after the first data render commits so the initial cascade plays once,
  // and pull-to-refresh re-renders don't replay it.
  useEffect(() => {
    if (!loading) hasAnimated.current = true;
  }, [loading]);

  if (sessionLoading || loading || !user) {
    return <LoadingScreen message="Loading Saloon Vero..." />;
  }

  const firstName = ((user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'there').split(' ')[0];
  const upcoming = bookings.find((booking) => booking.status === 'confirmed' && new Date(booking.starts_at).getTime() >= Date.now());

  // Format booking details for VIP Ticket
  const upcomingDate = upcoming ? new Date(upcoming.starts_at) : null;
  let dayNum = '';
  let weekdayStr = '';
  let monthStr = '';
  let timeStr = '';

  if (upcomingDate) {
    dayNum = String(upcomingDate.getDate());
    weekdayStr = upcomingDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    monthStr = upcomingDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    timeStr = upcomingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  const profilePic = avatarSrc(user.user_metadata, user.email ?? user.id);
  // Guests have no Account page to change the theme from, so give them the
  // theme toggle here. Signed-in users get their avatar (which links to Account,
  // where the theme preference lives).
  const headerRight = isGuest ? (
    <ThemeToggleButton />
  ) : (
    <PressableScale onPress={() => router.push('/(tabs)/account')}>
      <View style={{
        padding: 2,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: c.accent,
        backgroundColor: c.surfaceRaised,
        ...Shadow.sm,
      }}>
        <Image
          source={{ uri: profilePic }}
          style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.bg2 }}
          contentFit="cover"
        />
      </View>
    </PressableScale>
  );

  return (
    <ScreenContainer
      safeTop={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={c.accent}
        />
      }
    >
      <ScreenHeader
        eyebrow="WELCOME BACK"
        title={`Hi, ${firstName}`}
        subtitle="Cuts, colour and care — booked in seconds."
        right={headerRight}
      />

      {/* 1. VIP Booking Ticket / Refresh invitation */}
      {upcoming ? (
        <PressableScale
          onPress={() => router.push('/(tabs)/schedules' as never)}
          style={{ marginBottom: Spacing.md }}
        >
          <LinearGradient
            colors={[c.accent, c.accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: Radius.lg,
              flexDirection: 'row',
              minHeight: 110,
              position: 'relative',
              overflow: 'hidden',
              ...Shadow.md,
            }}
          >
            {/* Ticket Punch holes */}
            <View
              style={{
                position: 'absolute',
                top: -8,
                left: 90 - 8,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: c.bg,
                zIndex: 10,
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: -8,
                left: 90 - 8,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: c.bg,
                zIndex: 10,
              }}
            />

            {/* Left Column: Date Badge */}
            <View
              style={{
                width: 90,
                alignItems: 'center',
                justifyContent: 'center',
                borderRightWidth: 1,
                borderRightColor: 'rgba(255, 255, 255, 0.25)',
                borderStyle: 'dashed',
                paddingVertical: Spacing.sm,
              }}
            >
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 }}>
                {monthStr}
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 30, fontFamily: 'Poppins_800ExtraBold', lineHeight: 32, marginVertical: 2 }}>
                {dayNum}
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 10, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase' }}>
                {weekdayStr}
              </Text>
            </View>

            {/* Right Column: Content details */}
            <View
              style={{
                flex: 1,
                padding: Spacing.md,
                justifyContent: 'center',
                gap: Spacing.xs - 2,
              }}
            >
              <Text style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 9, fontFamily: 'Poppins_700Bold', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Next Appointment
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' }} numberOfLines={1}>
                {upcoming.reference}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <MaterialIcons name="schedule" size={13} color="rgba(255, 255, 255, 0.85)" />
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>
                  {timeStr}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <MaterialIcons name="arrow-forward-ios" size={9} color="rgba(255, 255, 255, 0.65)" style={{ marginLeft: 2 }} />
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 11, fontFamily: 'Poppins_600SemiBold' }}>
                  Tap to manage
                </Text>
              </View>
            </View>
          </LinearGradient>
        </PressableScale>
      ) : (
        /* Empty state card */
        <Card style={{ marginBottom: Spacing.md, padding: 0, overflow: 'hidden' }}>
          <LinearGradient
            colors={[c.accentTint, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ padding: Spacing.md, gap: Spacing.xs }}
          >
            <Text style={[Type.h2, { color: c.fg, fontFamily: 'Poppins_700Bold' }]}>
              Ready for a refresh? ✨
            </Text>
            <Text style={[Type.body, { color: c.fg2, fontSize: 13, lineHeight: 18 }]}>
              Book your next appointment with your favorite stylist in just a few taps.
            </Text>
            <PressableScale
              onPress={() => router.push('/(tabs)/book')}
              style={{
                alignSelf: 'flex-start',
                backgroundColor: c.ctaBg,
                borderRadius: Radius.pill,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm - 2,
                marginTop: Spacing.xs,
                ...Shadow.sm,
              }}
            >
              <Text style={{ color: c.ctaFg, fontFamily: 'Poppins_600SemiBold', fontSize: 12 }}>
                Book Appointment
              </Text>
            </PressableScale>
          </LinearGradient>
        </Card>
      )}

      {/* 2. Quick Actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
        {([
          ['Book Now', '/(tabs)/book', '✂️'],
          ['Schedules', '/(tabs)/schedules', '📅'],
          ['Trends', '/(tabs)/new-things', '✨'],
        ] as const).map(([label, href, icon]) => (
          <PressableScale
            key={label}
            onPress={() => router.push(href as never)}
            style={{
              width: '31.3%',
              borderRadius: Radius.pill,
              backgroundColor: c.surfaceRaised,
              borderWidth: 1,
              borderColor: c.hairline,
              paddingVertical: Spacing.sm + 2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.xs,
              ...Shadow.sm,
            }}
          >
            <Text style={{ fontSize: 14 }}>{icon}</Text>
            <Text style={[Type.label, { color: c.fg, fontSize: 12, fontFamily: 'Poppins_600SemiBold' }]}>
              {label}
            </Text>
          </PressableScale>
        ))}
      </View>

      {/* 3. Loyalty Reward Card */}
      <Card style={{ marginBottom: Spacing.md, padding: 0, overflow: 'hidden', borderWidth: 1, borderColor: c.accent }}>
        <LinearGradient
          colors={scheme === 'dark' ? ['#1A1816', '#26221E'] : ['#FEFBF3', '#F8F1E3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: Spacing.md }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ color: c.accentText, fontFamily: 'Poppins_700Bold', fontSize: 14, letterSpacing: 0.5 }}>
                Vero Club Rewards
              </Text>
              <Text style={{ color: c.fg2, fontSize: 11, fontFamily: 'Poppins_400Regular' }}>
                Complete 5 visits to unlock 15% OFF!
              </Text>
            </View>
            <View style={{ backgroundColor: c.accentTint, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: c.accentText, fontSize: 10, fontFamily: 'Poppins_700Bold' }}>
                BRONZE
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ marginTop: Spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: c.fg, fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>
                3 of 5 visits
              </Text>
              <Text style={{ color: c.accentText, fontSize: 12, fontFamily: 'Poppins_700Bold' }}>
                60%
              </Text>
            </View>
            <View style={{ height: 8, backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ width: '60%', height: '100%', backgroundColor: c.accent, borderRadius: 4 }} />
            </View>
          </View>
        </LinearGradient>
      </Card>

      {/* 4. Featured Services Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm, marginBottom: Spacing.sm }}>
        <Text style={[Type.h2, { color: c.fg, fontFamily: 'Poppins_700Bold' }]}>
          Featured Services
        </Text>
        <Pressable onPress={() => router.push('/(tabs)/book')}>
          <Text style={{ color: c.accentText, fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>
            See All ›
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing.md, paddingHorizontal: 2, paddingBottom: Spacing.sm }}
      >
        {services.slice(0, 5).map((s) => (
          <View key={s.id} style={{ width: 170, height: 215 }}>
            <ServiceCard
              service={s}
              layout="grid"
              onPress={() => router.push(`/booking/${s.id}`)}
            />
          </View>
        ))}
      </ScrollView>

      {/* 5. Meet our Stylists Section */}
      <View style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
        <Text style={[Type.h2, { color: c.fg, fontFamily: 'Poppins_700Bold' }]}>
          Meet our Stylists
        </Text>
      </View>
      <ScrollView
        ref={stylistScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="center"
        onMomentumScrollEnd={handleScrollEnd}
        style={{ paddingVertical: 12, marginVertical: -12 }}
        contentContainerStyle={{ paddingHorizontal: CAROUSEL_PADDING, paddingBottom: Spacing.lg }}
      >
        {virtualStylists.map((s, idx) => {
          const avatarUrl = getStylistAvatar(s.slug, s.name, s.avatar_url);
          const isActive = idx === activeStylistIndex;
          return (
            <PressableScale
              key={`${s.id}-${idx}`}
              onPress={() => setInfoStylist(s)}
              style={{
                width: CARD_WIDTH,
                height: 300,
                marginHorizontal: CARD_MARGIN,
                transform: [{ scale: isActive ? 1.05 : 0.88 }],
                zIndex: isActive ? 10 : 5,
                shadowColor: '#1C1A17',
                shadowOpacity: isActive ? 0.20 : 0.04,
                shadowRadius: isActive ? 16 : 6,
                shadowOffset: { width: 0, height: isActive ? 8 : 3 },
                elevation: isActive ? 8 : 2,
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: Radius.lg,
                  overflow: 'hidden',
                  backgroundColor: c.surfaceRaised,
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                {/* Profile image background */}
                <Image
                  source={{ uri: avatarUrl }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: c.bg2,
                    borderRadius: Radius.lg,
                  }}
                  contentFit="cover"
                  transition={200}
                />

                {/* Gradient Scrim for text readability */}
                <LinearGradient
                  colors={['transparent', 'rgba(18, 17, 16, 0.4)', 'rgba(18, 17, 16, 0.95)']}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 160,
                  }}
                />

                {/* Top Right Floating Rating Badge */}
                <View
                  style={{
                    position: 'absolute',
                    top: Spacing.sm,
                    right: Spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: 'rgba(28, 26, 23, 0.85)',
                    borderColor: 'rgba(217, 166, 72, 0.6)',
                    borderWidth: 1,
                    borderRadius: Radius.sm - 2,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    ...Shadow.sm,
                  }}
                >
                  <Text style={{ fontSize: 10, color: '#D9A648', fontFamily: 'Poppins_700Bold' }}>
                    ★ {s.rating && s.rating_count && s.rating_count > 0 ? Number(s.rating).toFixed(1) : 'New'}
                  </Text>
                </View>

                {/* Stylist Details overlay on the bottom */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: Spacing.md,
                    gap: 4,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_700Bold' }}>
                    {s.name}
                  </Text>
                  
                  <Text style={{ color: '#D9A648', fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>
                    {s.role}
                  </Text>

                  {/* Specialties / Tags */}
                  {!!s.tags && s.tags.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {s.tags.slice(0, 2).map((t) => (
                        <View
                          key={t}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: Radius.sm - 4,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                          }}
                        >
                          <Text style={{ fontSize: 9, color: '#FFFFFF', fontFamily: 'Poppins_500Medium' }}>
                            {t}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Hint */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 10, fontFamily: 'Poppins_600SemiBold' }}>
                      View Bio & Portfolio
                    </Text>
                    <MaterialIcons name="arrow-forward" size={11} color="rgba(255, 255, 255, 0.65)" />
                  </View>
                </View>
                {/* Border overlay to ensure border is never hidden or clipped by image */}
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: Radius.lg,
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive ? c.accent : c.hairline,
                  }}
                />
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      {/* Stylist Details Modal */}
      <Modal
        visible={infoStylist !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoStylist(null)}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 30 : 90}
          tint={scheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        >
          <Pressable style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.md }} onPress={() => setInfoStylist(null)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 360,
                backgroundColor: c.surfaceRaised,
                borderRadius: 24,
                overflow: 'hidden',
                shadowColor: '#1C1A17',
                shadowOpacity: 0.22,
                shadowRadius: 28,
                shadowOffset: { width: 0, height: 10 },
                elevation: 12,
              }}
            >
              {/* Cover Photo & Close Button */}
              {!isWritingReview && (
                <View style={{
                  width: '100%',
                  height: 233,
                  backgroundColor: c.bg2,
                  position: 'relative',
                  borderRadius: 23,
                  overflow: 'hidden',
                }}>
                  {infoStylist && (
                    <Image
                      source={{ uri: getStylistAvatar(infoStylist.slug, infoStylist.name, infoStylist.avatar_url) }}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 23,
                      }}
                      contentFit="cover"
                    />
                  )}
                  
                  {/* Linear gradient on bottom of cover image */}
                  <LinearGradient
                    colors={['transparent', 'rgba(18, 17, 16, 0.5)']}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 60,
                    }}
                  />

                  {/* Close Button overlay */}
                  <Pressable
                    onPress={() => setInfoStylist(null)}
                    style={{
                      position: 'absolute',
                      top: Spacing.md,
                      right: Spacing.md,
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      justifyContent: 'center',
                      alignItems: 'center',
                      ...Shadow.sm,
                    }}
                  >
                    <MaterialIcons name="close" size={20} color="#FFF" />
                  </Pressable>
                </View>
              )}

              {/* Details Content */}
              <View style={{
                padding: Spacing.lg,
                gap: Spacing.md,
                backgroundColor: c.surfaceRaised,
                marginTop: isWritingReview ? Spacing.md : -23,
                borderBottomLeftRadius: 23,
                borderBottomRightRadius: 23,
                overflow: 'hidden',
              }}>
                {infoStylist && (
                  <View style={{ gap: Spacing.sm }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={[Type.h2, { color: c.fg, fontFamily: 'Poppins_700Bold', fontSize: 22 }]}>
                          {infoStylist.name}
                        </Text>
                        <Text style={{ color: c.accentText, marginTop: 2, fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>
                          {infoStylist.role}
                        </Text>
                      </View>
                      
                      {isWritingReview ? (
                        /* Close Button when writing review */
                        <Pressable
                          onPress={() => setInfoStylist(null)}
                          style={{
                            padding: 6,
                          }}
                        >
                          <MaterialIcons name="close" size={24} color={c.fgMuted} />
                        </Pressable>
                      ) : (
                        /* Rating Badge */
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            backgroundColor: scheme === 'dark' ? 'rgba(217, 166, 72, 0.12)' : '#FEF6E4',
                            borderColor: c.accent,
                            borderWidth: 0.5,
                            borderRadius: Radius.sm,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                        >
                          <Text style={{ fontSize: 11, color: c.accentText, fontFamily: 'Poppins_700Bold' }}>
                            ★ {infoStylist.rating && infoStylist.rating_count && infoStylist.rating_count > 0 ? `${Number(infoStylist.rating).toFixed(1)} (${infoStylist.rating_count})` : 'New'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Tab Selector */}
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.hairline, marginBottom: Spacing.sm }}>
                      {(['About', 'Reviews'] as const).map((tab) => {
                        const isSelected = activeTab === tab;
                        return (
                          <Pressable
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={{
                              flex: 1,
                              paddingVertical: Spacing.sm - 2,
                              borderBottomWidth: isSelected ? 2 : 0,
                              borderBottomColor: c.accent,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{
                              fontFamily: isSelected ? 'Poppins_700Bold' : 'Poppins_500Medium',
                              color: isSelected ? c.fg : c.fgMuted,
                              fontSize: 13,
                            }}>
                              {tab}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {activeTab === 'About' ? (
                      <>
                        {/* Specialties / Tags */}
                        {!!infoStylist.tags && infoStylist.tags.length > 0 && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 }}>
                            {infoStylist.tags.map((t) => (
                              <View
                                key={t}
                                style={{
                                  borderColor: c.accent,
                                  borderWidth: 1,
                                  borderRadius: Radius.sm - 2,
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                  backgroundColor: scheme === 'dark' ? 'rgba(217, 166, 72, 0.05)' : 'rgba(194, 144, 54, 0.04)',
                                }}
                              >
                                <Text style={{ fontSize: 9, color: c.accentText, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase' }}>
                                  {t}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        <View style={{ height: 1, backgroundColor: c.hairline, marginVertical: Spacing.xs }} />

                        <View style={{ gap: 4 }}>
                          <Text style={{ color: c.fg, fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>About</Text>
                          <Text style={{ color: c.fg2, fontSize: 12, lineHeight: 18 }}>
                            {getStylistBio(infoStylist.slug)}
                          </Text>
                        </View>

                        <ThemedButton
                          label="Book Appointment"
                          style={{ marginTop: Spacing.md }}
                          onPress={() => {
                            setInfoStylist(null);
                            router.push('/(tabs)/book');
                          }}
                        />
                        {user && (
                          <ThemedButton
                            variant="secondary"
                            label="Message Stylist"
                            style={{ marginTop: Spacing.sm }}
                            onPress={async () => {
                              const stylistId = infoStylist.id;
                              setInfoStylist(null);
                              const id = await resolveConversationId(user.id, stylistId);
                              if (id) router.push(`/messages/${id}` as never);
                            }}
                          />
                        )}
                      </>
                    ) : (
                      // Reviews Tab
                      <View style={{ gap: Spacing.sm }}>
                        {isWritingReview ? (
                          // Redesigned Review Form
                          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
                            <View style={{
                              padding: Spacing.md,
                              borderRadius: Radius.lg,
                              backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                              borderWidth: 1,
                              borderColor: c.hairline,
                              gap: Spacing.sm,
                            }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={{ color: c.fg, fontFamily: 'Poppins_700Bold', fontSize: 16 }}>
                                  Write a Review
                                </Text>
                                <MaterialIcons name="rate-review" size={18} color={c.accent} />
                              </View>

                              <ThemedTextInput
                                label="Your Name"
                                value={newReviewName}
                                onChangeText={setNewReviewName}
                                placeholder="e.g. Amal Perera"
                                icon="person.fill"
                                style={{ marginBottom: Spacing.xs }}
                              />

                              <View style={{
                                backgroundColor: scheme === 'dark' ? 'rgba(217, 166, 72, 0.05)' : 'rgba(194, 144, 54, 0.03)',
                                borderColor: 'rgba(217, 166, 72, 0.15)',
                                borderWidth: 1,
                                borderRadius: Radius.md,
                                padding: Spacing.sm + 2,
                                alignItems: 'center',
                                marginBottom: Spacing.sm,
                              }}>
                                <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: c.fgMuted, marginBottom: Spacing.xs }}>
                                  Select Rating
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 12, marginVertical: 4 }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <PressableScale
                                      key={star}
                                      onPress={() => setNewReviewRating(star)}
                                      style={{ padding: 2 }}
                                    >
                                      <MaterialIcons
                                        name={star <= newReviewRating ? 'star' : 'star-outline'}
                                        size={32}
                                        color={star <= newReviewRating ? '#D9A648' : c.fgMuted}
                                      />
                                    </PressableScale>
                                  ))}
                                </View>
                                <Text style={{ fontSize: 12, fontFamily: 'Poppins_700Bold', color: c.accentText, marginTop: 4 }}>
                                  {newReviewRating === 5 ? '★★★★★ Excellent!' :
                                   newReviewRating === 4 ? '★★★★☆ Very Good' :
                                   newReviewRating === 3 ? '★★★☆☆ Good' :
                                   newReviewRating === 2 ? '★★☆☆☆ Fair' :
                                   '★☆☆☆☆ Poor'}
                                </Text>
                              </View>

                              <ThemedTextInput
                                label="Your Feedback"
                                value={newReviewComment}
                                onChangeText={setNewReviewComment}
                                placeholder="Describe your experience with the stylist..."
                                multiline
                                style={{ height: 70, textAlignVertical: 'top', marginBottom: Spacing.sm }}
                                icon="bubble.left.fill"
                              />

                              <View style={{ gap: Spacing.sm, marginTop: Spacing.xs }}>
                                <ThemedButton
                                  label="Submit Review"
                                  busy={submittingReview}
                                  onPress={handleSubmitReview}
                                />
                                <PressableScale
                                  onPress={() => setIsWritingReview(false)}
                                  style={{
                                    alignItems: 'center',
                                    paddingVertical: Spacing.sm,
                                    borderRadius: Radius.pill,
                                    borderWidth: 1,
                                    borderColor: c.hairline,
                                    backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                                  }}
                                >
                                  <Text style={{ color: c.accentText, fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>
                                    Cancel
                                  </Text>
                                </PressableScale>
                              </View>
                            </View>
                          </ScrollView>
                        ) : (
                          // Reviews List
                          <>
                            {loadingReviews ? (
                              <Text style={{ textAlign: 'center', marginVertical: Spacing.md, color: c.fgMuted, fontSize: 12 }}>
                                Loading reviews...
                              </Text>
                            ) : reviews.length === 0 ? (
                              <Text style={{ textAlign: 'center', marginVertical: Spacing.lg, color: c.fgMuted, fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
                                No reviews yet. Be the first to leave one!
                              </Text>
                            ) : (
                             <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                               <View style={{ gap: Spacing.sm }}>
                                 {reviews.map((rev) => (
                                   <View
                                     key={rev.id}
                                     style={{
                                       borderRadius: Radius.md,
                                       backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                       borderWidth: 1,
                                       borderColor: c.hairline,
                                       overflow: 'hidden',
                                     }}
                                   >
                                     <View style={{ padding: Spacing.sm, gap: Spacing.xs }}>
                                       <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                         <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 12, color: c.fg }}>
                                           {rev.customer_name}
                                         </Text>
                                         <Text style={{ fontSize: 10, color: '#D9A648', fontFamily: 'Poppins_600SemiBold' }}>
                                           {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                         </Text>
                                       </View>
                                       <Text style={{ fontSize: 11, color: c.fg2, lineHeight: 15, fontFamily: 'Poppins_400Regular' }}>
                                         {rev.comment}
                                       </Text>

                                       {/* Like / Report row */}
                                       <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4, borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: 6 }}>
                                         {/* Like button */}
                                         <PressableScale
                                           onPress={() => handleLikeReview(rev)}
                                           accessibilityRole="button"
                                           style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             gap: 4,
                                             paddingHorizontal: 8,
                                             paddingVertical: 3,
                                             borderRadius: Radius.pill,
                                             backgroundColor: likedIds.has(rev.id)
                                               ? 'rgba(224,112,112,0.12)'
                                               : (scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                                             borderWidth: 1,
                                             borderColor: likedIds.has(rev.id) ? 'rgba(224,112,112,0.4)' : c.hairline,
                                           }}
                                         >
                                           <Text style={{ fontSize: 11 }}>{likedIds.has(rev.id) ? '❤️' : '🤍'}</Text>
                                           {(rev.likes_count ?? 0) > 0 && (
                                             <Text style={{ fontSize: 10, fontFamily: 'Poppins_600SemiBold', color: likedIds.has(rev.id) ? '#E07070' : c.fgMuted }}>
                                               {rev.likes_count}
                                             </Text>
                                           )}
                                           <Text style={{ fontSize: 10, fontFamily: 'Poppins_500Medium', color: likedIds.has(rev.id) ? '#E07070' : c.fgMuted }}>
                                             {likedIds.has(rev.id) ? 'Liked' : 'Helpful'}
                                           </Text>
                                         </PressableScale>

                                         {/* Spacer */}
                                         <View style={{ flex: 1 }} />

                                         {/* Report button */}
                                         <PressableScale
                                           onPress={() => handleReportReview(rev)}
                                           accessibilityRole="button"
                                           style={{
                                             flexDirection: 'row',
                                             alignItems: 'center',
                                             gap: 3,
                                             paddingHorizontal: 7,
                                             paddingVertical: 3,
                                             borderRadius: Radius.pill,
                                             backgroundColor: reportedIds.has(rev.id)
                                               ? 'rgba(192,57,43,0.08)'
                                               : 'transparent',
                                             borderWidth: 1,
                                             borderColor: reportedIds.has(rev.id) ? 'rgba(192,57,43,0.3)' : c.hairline,
                                           }}
                                         >
                                           <MaterialIcons
                                             name="flag"
                                             size={11}
                                             color={reportedIds.has(rev.id) ? c.error : c.fgMuted}
                                           />
                                           <Text style={{ fontSize: 10, fontFamily: 'Poppins_500Medium', color: reportedIds.has(rev.id) ? c.error : c.fgMuted }}>
                                             {reportedIds.has(rev.id) ? 'Reported' : 'Report'}
                                           </Text>
                                         </PressableScale>
                                       </View>
                                     </View>
                                   </View>
                                 ))}
                               </View>
                             </ScrollView>
                            )}

                            <ThemedButton
                              variant="secondary"
                              label="Write a Review"
                              style={{ marginTop: Spacing.sm }}
                              onPress={() => setIsWritingReview(true)}
                            />
                          </>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
              {/* Border overlay to ensure border is never hidden or clipped by image */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: c.accent,
                }}
              />
            </Pressable>
          </Pressable>
        </BlurView>
      </Modal>
    </ScreenContainer>
  );
}
