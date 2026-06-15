import type { Stylist } from '@/types/database';

// Defaults shown for a stylist that has no real rating yet.
// Used only for *display*; never folded into rating arithmetic (see computeUpdatedRating).
export const DEFAULT_RATING = 4.9;
export const DEFAULT_RATING_COUNT = 42;

// AsyncStorage keys for per-device review engagement state.
export const REVIEW_STORAGE_KEYS = {
  clientLiked: 'client_liked_reviews',
  clientReported: 'client_reported_reviews',
  staffHearted: 'staff_hearted_reviews',
} as const;

/**
 * Recompute a stylist's running average rating after one new review is added.
 * Treats a stylist with no prior rating as a genuine 0/0 so the first review
 * lands at its true value — the 4.9/42 display defaults must NOT seed the math,
 * or the fake prior reviews drown out the first real one.
 */
export function computeUpdatedRating(
  stylist: Pick<Stylist, 'rating' | 'rating_count'>,
  newReviewRating: number
): { rating: number; rating_count: number } {
  const prevCount = stylist.rating_count ?? 0;
  const prevRating = stylist.rating ?? 0;
  const rating_count = prevCount + 1;
  const rating = Number((((prevRating * prevCount) + newReviewRating) / rating_count).toFixed(2));
  return { rating, rating_count };
}
