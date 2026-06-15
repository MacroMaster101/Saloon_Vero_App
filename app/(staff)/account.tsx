import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStylists, getStylistReviews, likeReview } from '@/lib/api/queries';
import type { StylistReview } from '@/types/database';
import { updateOwnProfile } from '@/lib/api/profile';
import { useSession } from '@/context/session';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ThemedButton } from '@/components/ui/button';
import { ThemedTextInput } from '@/components/ui/text-input';
import { StaffIconBadge, StaffSectionLabel } from '@/components/staff/staff-ui';
import { StarRow } from '@/components/reviews/star-row';
import { formatRelativeDate } from '@/lib/utils/format';
import { REVIEW_STORAGE_KEYS } from '@/lib/utils/reviews';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/context/theme';

type Stylist = { id: string; name: string; slug?: string };

const HEARTED_KEY = REVIEW_STORAGE_KEYS.staffHearted;

export default function StaffAccount() {
  const { c, Type, Spacing, Radius, scheme } = useTheme();
  const { pref, setPref } = useThemePreference();
  const { user, profile, signOut } = useSession();
  const [stylistName, setStylistName] = useState<string>('-');
  const metadataName = (user?.user_metadata?.full_name as string | undefined) ?? '';
  const metadataPhone = (user?.user_metadata?.phone as string | undefined) ?? '';

  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<StylistReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [heartedIds, setHeartedIds] = useState<Set<string>>(new Set());
  const [heartingId, setHeartingId] = useState<string | null>(null);

  useEffect(() => {
    setName(metadataName || user?.email || '');
    setPhone(metadataPhone);
    setProfileMsg(null);
  }, [metadataName, metadataPhone, user?.email]);

  const fullName = name.trim() || user?.email || 'Staff member';
  const firstName = fullName.split(' ')[0] || 'Staff';
  const initials = fullName.charAt(0).toUpperCase();

  // Load stylist name + reviews
  useFocusEffect(useCallback(() => {
    const stylistId = profile?.stylistId;
    if (!stylistId) return;
    setLoadingReviews(true);
    getStylists().then((stylists) => {
      const match = (stylists as Stylist[]).find((s) => s.id === stylistId);
      setStylistName(match?.name ?? '-');
      // Pass the slug so the fallback-reviews lookup resolves on DB error.
      return getStylistReviews(stylistId, match?.slug);
    })
      .then((rows) => {
        if (rows) setReviews(rows);
        setLoadingReviews(false);
      })
      .catch(() => setLoadingReviews(false));

    // Load persisted hearted set from storage
    AsyncStorage.getItem(HEARTED_KEY).then((raw) => {
      if (raw) {
        try { setHeartedIds(new Set(JSON.parse(raw))); } catch { /* ignore */ }
      }
    });
  }, [profile?.stylistId]));

  async function persistHeartedIds(ids: Set<string>) {
    setHeartedIds(ids);
    await AsyncStorage.setItem(HEARTED_KEY, JSON.stringify([...ids]));
  }

  async function handleHeart(review: StylistReview) {
    if (heartingId) return;
    const wasHearted = heartedIds.has(review.id);
    const delta: 1 | -1 = wasHearted ? -1 : 1;
    const prevIds = heartedIds;

    // Optimistic update
    setReviews((prev) => prev.map((r) =>
      r.id === review.id ? { ...r, likes_count: Math.max(0, (r.likes_count ?? 0) + delta) } : r
    ));
    const newIds = new Set(heartedIds);
    if (wasHearted) newIds.delete(review.id); else newIds.add(review.id);
    await persistHeartedIds(newIds);

    setHeartingId(review.id);
    try {
      await likeReview(review.id, delta);
    } catch {
      // Roll back optimistic UI + persisted state on failure.
      setReviews((prev) => prev.map((r) =>
        r.id === review.id ? { ...r, likes_count: Math.max(0, (r.likes_count ?? 0) - delta) } : r
      ));
      await persistHeartedIds(prevIds);
    } finally {
      setHeartingId(null);
    }
  }

  async function logout() {
    await signOut();
    router.replace('/access' as never);
  }

  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);
    const res = await updateOwnProfile({
      userId: user.id,
      fullName: name,
      email: user.email ?? null,
      phone,
    });
    setSavingProfile(false);
    if ('error' in res) {
      setProfileMsg(res.error);
      return;
    }
    setProfileMsg('Profile saved');
    setEditingProfile(false);
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <ScreenContainer safeTop={false}>
      <ScreenHeader eyebrow="Staff" title={firstName} subtitle="Account and preferences." />

      <StaffSectionLabel>Profile</StaffSectionLabel>
      <Card style={{ marginBottom: Spacing.lg, padding: 0, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: c.accent }}>
        <View style={{ padding: Spacing.md, gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View style={{ width: 48, height: 48, borderRadius: Radius.pill, backgroundColor: c.accentTint, borderWidth: 1, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[Type.h2, { color: c.accentText, fontFamily: 'Poppins_700Bold' }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={[Type.label, { color: c.fg, fontSize: 16, fontFamily: 'Poppins_600SemiBold' }]} numberOfLines={1}>
                {fullName}
              </Text>
              <Text style={[Type.caption, { color: c.fgMuted }]} numberOfLines={1}>
                {user?.email ?? '-'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.xs }}>
                <StaffIconBadge icon="person.fill" tone="accent" size={28} />
                <Text style={[Type.caption, { color: c.fg2, flex: 1 }]} numberOfLines={1}>
                  Chair assignment: {stylistName}
                </Text>
              </View>
            </View>
            <PressableScale
              accessibilityRole="button"
              onPress={() => {
                setEditingProfile((v) => !v);
                setProfileMsg(null);
              }}
              style={{ padding: Spacing.xs }}
            >
              <IconSymbol name={editingProfile ? 'xmark' : 'slider.horizontal.3'} size={21} color={c.accentText} />
            </PressableScale>
          </View>

          {editingProfile && (
            <View style={{ borderTopWidth: 1, borderTopColor: c.hairline, paddingTop: Spacing.md, gap: Spacing.xs }}>
              <ThemedTextInput label="Display Name" value={name} onChangeText={setName} style={{ marginBottom: Spacing.xs }} />
              <ThemedTextInput label="Mobile Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ marginBottom: Spacing.xs }} />
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <ThemedButton
                  label="Save Profile"
                  icon="checkmark"
                  busy={savingProfile}
                  onPress={handleSaveProfile}
                  style={{ flex: 1, minHeight: 46 }}
                />
                <ThemedButton
                  label="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setName(metadataName || user?.email || '');
                    setPhone(metadataPhone);
                    setEditingProfile(false);
                    setProfileMsg(null);
                  }}
                  style={{ flex: 1, minHeight: 46 }}
                />
              </View>
            </View>
          )}

          {!!profileMsg && (
            <Text style={[Type.caption, { color: profileMsg === 'Profile saved' ? c.accentText : c.error, fontFamily: 'Poppins_600SemiBold' }]}>
              {profileMsg}
            </Text>
          )}
        </View>
      </Card>

      {/* ── My Reviews ───────────────────────────────────────────────── */}
      <StaffSectionLabel>My Reviews</StaffSectionLabel>

      {/* Stats row */}
      <Card style={{ marginBottom: Spacing.md, padding: 0, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', padding: Spacing.md, gap: Spacing.md }}>
          <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 22, fontFamily: 'Poppins_800ExtraBold', color: c.accentText }}>
              {avgRating ? `★ ${avgRating}` : '—'}
            </Text>
            <Text style={{ fontSize: 10, fontFamily: 'Poppins_500Medium', color: c.fgMuted }}>AVG RATING</Text>
          </View>
          <View style={{ width: 1, backgroundColor: c.hairline }} />
          <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 22, fontFamily: 'Poppins_800ExtraBold', color: c.fg }}>
              {reviews.length}
            </Text>
            <Text style={{ fontSize: 10, fontFamily: 'Poppins_500Medium', color: c.fgMuted }}>TOTAL</Text>
          </View>
          <View style={{ width: 1, backgroundColor: c.hairline }} />
          <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 22, fontFamily: 'Poppins_800ExtraBold', color: '#E07070' }}>
              {reviews.reduce((s, r) => s + (r.likes_count ?? 0), 0)}
            </Text>
            <Text style={{ fontSize: 10, fontFamily: 'Poppins_500Medium', color: c.fgMuted }}>HEARTS</Text>
          </View>
        </View>
      </Card>

      {loadingReviews ? (
        <SkeletonCard count={3} />
      ) : reviews.length === 0 ? (
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={[Type.caption, { color: c.fgMuted, textAlign: 'center', paddingVertical: Spacing.sm }]}>
            No reviews yet — they&apos;ll appear here when clients leave feedback.
          </Text>
        </Card>
      ) : (
        <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
          {reviews.map((review) => {
            const hearted = heartedIds.has(review.id);
            const likesCount = review.likes_count ?? 0;
            return (
              <Card
                key={review.id}
                style={{ padding: 0, overflow: 'hidden', borderLeftWidth: 3, borderLeftColor: c.accent }}
              >
                <View style={{ padding: Spacing.md, gap: Spacing.xs }}>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 14, color: c.fg }}>
                        {review.customer_name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                        <StarRow rating={review.rating} />
                        <Text style={{ fontSize: 10, color: c.fgMuted, fontFamily: 'Poppins_400Regular' }}>
                          {formatRelativeDate(review.created_at)}
                        </Text>
                      </View>
                    </View>

                    {/* Heart button */}
                    <PressableScale
                      onPress={() => handleHeart(review)}
                      accessibilityRole="button"
                      accessibilityLabel={hearted ? 'Remove heart' : 'Heart this review'}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: 5,
                        borderRadius: Radius.pill,
                        backgroundColor: hearted
                          ? 'rgba(224,112,112,0.12)'
                          : (scheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                        borderWidth: 1,
                        borderColor: hearted ? 'rgba(224,112,112,0.35)' : c.hairline,
                      }}
                    >
                      <Text style={{ fontSize: 14, opacity: heartingId === review.id ? 0.5 : 1 }}>
                        {hearted ? '❤️' : '🤍'}
                      </Text>
                      {likesCount > 0 && (
                        <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: hearted ? '#E07070' : c.fgMuted }}>
                          {likesCount}
                        </Text>
                      )}
                    </PressableScale>
                  </View>

                  {/* Comment */}
                  <Text style={{ fontSize: 12, color: c.fg2, lineHeight: 18, fontFamily: 'Poppins_400Regular' }}>
                    {review.comment}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* ── Preferences ──────────────────────────────────────────────── */}
      <StaffSectionLabel>Preferences</StaffSectionLabel>
      <Card style={{ marginBottom: Spacing.lg, gap: Spacing.sm }}>
        <Text style={[Type.label, { color: c.fg, fontFamily: 'Poppins_600SemiBold' }]}>Appearance</Text>
        <SegmentedControl
          options={[
            { value: 'light', label: 'Light', icon: 'sun.max.fill' },
            { value: 'system', label: 'System', icon: 'gearshape.fill' },
            { value: 'dark', label: 'Dark', icon: 'moon.fill' },
          ] as const}
          value={pref}
          onChange={setPref}
        />
        <Text style={[Type.caption, { color: c.fgMuted }]}>
          {pref === 'system'
            ? `Following your device - currently ${scheme}.`
            : `Always ${pref}.`}
        </Text>
      </Card>

      <ThemedButton
        variant="destructive"
        label="Sign out"
        icon="xmark"
        onPress={logout}
        style={{ marginBottom: Spacing.md }}
      />
    </ScreenContainer>
  );
}
