import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getReviewsAdmin, deleteReview, getStylistsAdmin } from '@/lib/api/admin';
import type { AdminReview } from '@/lib/api/admin';
import type { Stylist } from '@/types/database';
import { AdminSectionLabel, AdminStatCard } from '@/components/admin/admin-ui';
import { BackButton } from '@/components/ui/back-button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SkeletonCard } from '@/components/ui/skeleton';
import { StarRow } from '@/components/reviews/star-row';
import { formatRelativeDate } from '@/lib/utils/format';
import { useTheme } from '@/hooks/use-theme';

export default function AdminReviews() {
  const { c, Spacing, Type, Radius, scheme } = useTheme();

  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterStylistId, setFilterStylistId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [reviewRows, stylistRows] = await Promise.all([
      getReviewsAdmin(),
      getStylistsAdmin(),
    ]);
    setReviews(reviewRows);
    setStylists(stylistRows);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (review: AdminReview) => {
    Alert.alert(
      'Delete review?',
      `Remove review by "${review.customer_name}"? This will update ${review.stylist_name}'s average rating.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(review.id);
            const res = await deleteReview(review.id, review.stylist_id);
            setDeletingId(null);
            if ('error' in res) {
              Alert.alert('Error', res.error);
              return;
            }
            setReviews((prev) => prev.filter((r) => r.id !== review.id));
          },
        },
      ]
    );
  };

  const displayed = filterStylistId
    ? reviews.filter((r) => r.stylist_id === filterStylistId)
    : reviews;

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
    : '—';

  const stylistsWithReviews = stylists.filter((s) =>
    reviews.some((r) => r.stylist_id === s.id)
  );

  return (
    <ScreenContainer safeTop={false} scroll={false}>
      <ScreenHeader
        eyebrow="MANAGE"
        title="Customer Reviews"
        subtitle="Browse and moderate stylist feedback."
        left={<BackButton />}
      />

      {/* Summary Stats */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <AdminStatCard label="Total Reviews" value={String(totalReviews)} tone="neutral" />
        <AdminStatCard label="Avg Rating" value={totalReviews > 0 ? `★ ${avgRating}` : '—'} tone="accent" />
      </View>

      {/* Stylist Filter Chips */}
      {stylistsWithReviews.length > 0 && (
        <View style={{ marginBottom: Spacing.md }}>
          <AdminSectionLabel>Filter by Stylist</AdminSectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.xs }}>
            {/* "All" chip */}
            <PressableScale onPress={() => setFilterStylistId(null)} accessibilityRole="button">
              <View style={{
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.xs + 2,
                borderRadius: Radius.pill,
                backgroundColor: filterStylistId === null ? c.accent : c.surfaceRaised,
                borderWidth: 1,
                borderColor: filterStylistId === null ? c.accent : c.hairline,
              }}>
                <Text style={{
                  fontFamily: 'Poppins_600SemiBold',
                  fontSize: 12,
                  color: filterStylistId === null ? '#FFF' : c.fg2,
                }}>All</Text>
              </View>
            </PressableScale>

            {stylistsWithReviews.map((s) => {
              const active = filterStylistId === s.id;
              return (
                <PressableScale key={s.id} onPress={() => setFilterStylistId(active ? null : s.id)} accessibilityRole="button">
                  <View style={{
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.xs + 2,
                    borderRadius: Radius.pill,
                    backgroundColor: active ? c.accent : c.surfaceRaised,
                    borderWidth: 1,
                    borderColor: active ? c.accent : c.hairline,
                  }}>
                    <Text style={{
                      fontFamily: 'Poppins_600SemiBold',
                      fontSize: 12,
                      color: active ? '#FFF' : c.fg2,
                    }}>{s.name}</Text>
                  </View>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Review List */}
      <AdminSectionLabel>
        {filterStylistId
          ? `${displayed.length} review${displayed.length !== 1 ? 's' : ''} for ${stylists.find(s => s.id === filterStylistId)?.name ?? ''}`
          : `${totalReviews} review${totalReviews !== 1 ? 's' : ''} total`}
      </AdminSectionLabel>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100, gap: Spacing.sm }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <SkeletonCard count={4} />
        ) : displayed.length === 0 ? (
          <EmptyState
            title="No reviews yet."
            caption="When customers leave feedback it will appear here."
          />
        ) : (
          displayed.map((review) => (
            <Card
              key={review.id}
              style={{
                padding: 0,
                overflow: 'hidden',
                borderLeftWidth: 3,
                borderLeftColor: review.reports_count > 0 ? c.error : c.accent,
                opacity: deletingId === review.id ? 0.4 : 1,
              }}
            >
              <View style={{ padding: Spacing.md, gap: Spacing.xs }}>
                {/* Header row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' }}>
                      <Text style={[Type.label, { color: c.fg, fontFamily: 'Poppins_700Bold', fontSize: 14 }]}>
                        {review.customer_name}
                      </Text>
                      {/* Stylist badge */}
                      <View style={{
                        backgroundColor: scheme === 'dark' ? 'rgba(217,166,72,0.12)' : '#FEF6E4',
                        borderColor: c.accent,
                        borderWidth: 0.5,
                        borderRadius: Radius.pill,
                        paddingHorizontal: 7,
                        paddingVertical: 1,
                      }}>
                        <Text style={{ fontSize: 10, color: c.accentText, fontFamily: 'Poppins_600SemiBold' }}>
                          {review.stylist_name}
                        </Text>
                      </View>
                      {/* Report flag */}
                      {review.reports_count > 0 && (
                        <View style={{
                          backgroundColor: 'rgba(192,57,43,0.08)',
                          borderColor: c.error,
                          borderWidth: 0.5,
                          borderRadius: Radius.pill,
                          paddingHorizontal: 7,
                          paddingVertical: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        }}>
                          <IconSymbol name="exclamationmark.triangle.fill" size={9} color={c.error} />
                          <Text style={{ fontSize: 9, color: c.error, fontFamily: 'Poppins_600SemiBold' }}>
                            {review.reports_count} report{review.reports_count !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <StarRow rating={review.rating} />
                      <Text style={{ fontSize: 10, color: c.fgMuted, fontFamily: 'Poppins_400Regular' }}>
                        {formatRelativeDate(review.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Delete button */}
                  <PressableScale
                    onPress={() => handleDelete(review)}
                    accessibilityRole="button"
                    accessibilityLabel="Delete review"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: Radius.sm,
                      backgroundColor: 'rgba(192,57,43,0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(192,57,43,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: Spacing.sm,
                    }}
                  >
                    <IconSymbol name="trash.fill" size={15} color={c.error} />
                  </PressableScale>
                </View>

                {/* Comment */}
                <Text style={{ fontSize: 12, color: c.fg2, lineHeight: 18, fontFamily: 'Poppins_400Regular' }}>
                  {review.comment}
                </Text>

                {/* Footer: likes count */}
                {review.likes_count > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Text style={{ fontSize: 13 }}>❤️</Text>
                    <Text style={{ fontSize: 11, color: c.fgMuted, fontFamily: 'Poppins_400Regular' }}>
                      {review.likes_count} helpful
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
