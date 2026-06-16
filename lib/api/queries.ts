import { supabase } from '@/lib/api/supabase';
import { computeUpdatedRating } from '@/lib/utils/reviews';
import type { Service, Stylist, GalleryItem, BusinessHour, StylistReview } from '@/types/database';

// Robust local fallback datasets for unseeded database setups
const FALLBACK_SERVICES: Service[] = [
  { id: 'd1b9134a-9e1e-4cb2-a72a-6ffebde76b4a', slug: 'gents-cut', name: 'Gents Cut & Style', description: 'Wash, cut & finish.', category: 'hair', price_lkr: 900, duration_min: 40, icon: 'scissors', bookable: true, sort_order: 1, is_active: true, is_featured: false },
  { id: 'a5c0b8de-28e4-44df-be9d-5eb270a4421b', slug: 'ladies-cut', name: 'Ladies Cut & Blow-dry', description: 'Cut, wash & styled finish.', category: 'hair', price_lkr: 1500, duration_min: 60, icon: 'scissors', bookable: true, sort_order: 2, is_active: true, is_featured: true },
  { id: '7aefbcf4-6fb0-4560-8451-f761bb8a4d2f', slug: 'colour-roots', name: 'Hair Colour (roots)', description: 'Single-shade touch-up.', category: 'hair', price_lkr: 3500, duration_min: 90, icon: 'color', bookable: true, sort_order: 3, is_active: true, is_featured: false },
  { id: '3b90f4fa-d07f-4c54-8c81-80e9a1170d10', slug: 'colour-full', name: 'Full Hair Colour', description: 'Root to tip, your shade.', category: 'hair', price_lkr: 6000, duration_min: 120, icon: 'color', bookable: true, sort_order: 4, is_active: true, is_featured: false },
  { id: 'c5a3d7d1-e6e2-45e0-8ad4-1c881c1c1f51', slug: 'hair-spa', name: 'Hair Treatment & Spa', description: 'Deep conditioning repair.', category: 'hair', price_lkr: 2500, duration_min: 45, icon: 'beauty', bookable: true, sort_order: 5, is_active: true, is_featured: false },
  { id: 'c78b88d8-7967-4fb7-85ef-9689f92945d8', slug: 'kids-cut', name: 'Kids\' Cut (under 12)', description: 'Quick, gentle & patient.', category: 'hair', price_lkr: 600, duration_min: 25, icon: 'scissors', bookable: true, sort_order: 6, is_active: true, is_featured: false },
  { id: '24a2a6b2-6014-4361-9c60-8d591b61b58a', slug: 'beard', name: 'Beard Grooming', description: 'Trim, shape & finish.', category: 'beauty', price_lkr: 500, duration_min: 25, icon: 'razor', bookable: true, sort_order: 7, is_active: true, is_featured: false },
  { id: 'ea4a07d7-27b3-4f9e-990c-03d3f9b2d8d8', slug: 'facial', name: 'Clean-up & Facial', description: 'Glow facial, him or her.', category: 'beauty', price_lkr: 2500, duration_min: 50, icon: 'beauty', bookable: true, sort_order: 8, is_active: true, is_featured: true },
  { id: '96d115e5-7977-4475-ba7e-726071d2b860', slug: 'threading', name: 'Threading (brow / face)', description: 'Quick & precise.', category: 'beauty', price_lkr: 200, duration_min: 15, icon: 'beauty', bookable: true, sort_order: 9, is_active: true, is_featured: false },
  { id: 'e685f400-0df2-4752-bf6d-8fb4fa7db38f', slug: 'waxing', name: 'Waxing (full arm)', description: 'Smooth, clean finish.', category: 'beauty', price_lkr: 900, duration_min: 30, icon: 'beauty', bookable: true, sort_order: 10, is_active: true, is_featured: false },
  { id: 'be8d2038-f1c5-43fb-9806-25f0a20a4be3', slug: 'mani-pedi', name: 'Manicure & Pedicure', description: 'Hands & feet, together.', category: 'beauty', price_lkr: 2800, duration_min: 75, icon: 'beauty', bookable: true, sort_order: 11, is_active: true, is_featured: false },
  { id: '41f71d18-8f8d-4cb0-a548-db5f86e30bde', slug: 'bridal', name: 'Bridal Package', description: 'Hair, make-up & dressing.', category: 'beauty', price_lkr: 15000, duration_min: 180, icon: 'star', bookable: true, sort_order: 12, is_active: true, is_featured: true }
];

const FALLBACK_STYLISTS: Stylist[] = [
  { id: '2bc8040d-b4b0-449e-b197-d86c757c9632', slug: 'ruwan', name: 'Ruwan', role: 'Gents Stylist', tags: ['Cuts', 'Colour'], avatar_url: '/images/stylists/ruwan.png', sort_order: 1, is_active: true, rating: null, rating_count: 0 },
  { id: '737ef753-4ff7-44c1-90a6-d24249a46452', slug: 'sanduni', name: 'Sanduni', role: 'Ladies Stylist', tags: ['Cut & style', 'Blow-dry'], avatar_url: '/images/stylists/sanduni.png', sort_order: 2, is_active: true, rating: null, rating_count: 0 },
  { id: 'e90899f5-ccfa-496a-932d-949479b4a49c', slug: 'tharindu', name: 'Tharindu', role: 'Barber', tags: ['Beard', 'Fades'], avatar_url: '/images/stylists/tharindu.png', sort_order: 3, is_active: true, rating: null, rating_count: 0 },
  { id: 'c234a749-e314-4eb7-a720-bdc71ebf1074', slug: 'nadeesha', name: 'Nadeesha', role: 'Beauty Therapist', tags: ['Facials', 'Bridal'], avatar_url: '/images/stylists/nadeesha.png', sort_order: 4, is_active: true, rating: null, rating_count: 0 }
];

const FALLBACK_REVIEWS: Record<string, StylistReview[]> = {};

const FALLBACK_GALLERY: GalleryItem[] = [
  { id: '7e8d2e8b-b8c7-43cf-bc01-e2be67d26456', title: 'Ladies Colour', tag: 'Colour', category: 'Balayage, roots & full shades', image_url: '/images/lookbook/ladies-colour.png', sort_order: 1, is_active: true },
  { id: '4cfa0d7a-7bd8-498c-8f3b-fa1516e81404', title: 'Gents Fade', tag: 'Gents', category: 'Sharp, blended & clean', image_url: '/images/lookbook/gents-fade.png', sort_order: 2, is_active: true },
  { id: '2d8f99e3-36c1-4b1f-aa35-649033333333', title: 'Bridal Look', tag: 'Bridal', category: 'Hair, make-up & dressing', image_url: '/images/lookbook/bridal-look.png', sort_order: 3, is_active: true },
  { id: '8ba9321e-c0fa-4d1a-a1db-043e7bb0e9b9', title: 'Hair Treatment', tag: 'Hair Spa', category: 'Repair, smooth & shine', image_url: '/images/lookbook/hair-spa.png', sort_order: 4, is_active: true },
  { id: 'f0cf0b61-419b-4cd3-8947-0e6fb1bf679e', title: 'Beard Grooming', tag: 'Beard', category: 'Shaped, lined & oiled', image_url: '/images/lookbook/beard-grooming.png', sort_order: 5, is_active: true },
  { id: 'f8adcf91-1fa1-41c3-bb52-f67ebf1d248b', title: 'Facial & Glow', tag: 'Beauty', category: 'Clean-ups & facials', image_url: '/images/lookbook/facial-glow.png', sort_order: 6, is_active: true }
];

const FALLBACK_HOURS: BusinessHour[] = [
  { day_of_week: 0, open_minute: 600, close_minute: 1440, is_closed: false },
  { day_of_week: 1, open_minute: 600, close_minute: 1440, is_closed: false },
  { day_of_week: 2, open_minute: 600, close_minute: 1440, is_closed: false },
  { day_of_week: 3, open_minute: 600, close_minute: 1440, is_closed: false },
  { day_of_week: 4, open_minute: 600, close_minute: 1440, is_closed: false },
  { day_of_week: 5, open_minute: 600, close_minute: 1440, is_closed: false },
  { day_of_week: 6, open_minute: 600, close_minute: 1440, is_closed: false }
];

export async function getServices() {
  const { data } = await supabase.from('services').select('*').eq('is_active', true).order('sort_order');
  return data && data.length > 0 ? data : FALLBACK_SERVICES;
}
export async function getBookableServices() {
  const { data } = await supabase.from('services').select('*').eq('is_active', true).eq('bookable', true).order('sort_order');
  return data && data.length > 0 ? data : FALLBACK_SERVICES.filter((s) => s.bookable);
}
export async function getStylists() {
  const { data } = await supabase.from('stylists').select('*').eq('is_active', true).order('sort_order');
  return data && data.length > 0 ? data : FALLBACK_STYLISTS;
}
export async function getGallery() {
  const { data } = await supabase.from('gallery').select('*').eq('is_active', true).order('sort_order');
  return data && data.length > 0 ? data : FALLBACK_GALLERY;
}
export async function getBusinessHours() {
  const { data } = await supabase.from('business_hours').select('*').order('day_of_week');
  return data && data.length > 0 ? data : FALLBACK_HOURS;
}
export async function getMyBookings(userId: string) {
  const { data } = await supabase.from('bookings')
    .select('id,reference,starts_at,status,service_id,stylist_id')
    .eq('user_id', userId).order('starts_at', { ascending: false });
  return data ?? [];
}

export async function submitStylistRating(
  stylistId: string,
  userRating: number
): Promise<{ ok: boolean; rating?: number; rating_count?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('stylists')
      .select('rating, rating_count')
      .eq('id', stylistId)
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    const { rating: newRating, rating_count: newCount } = computeUpdatedRating(
      { rating: data.rating ? Number(data.rating) : null, rating_count: data.rating_count },
      userRating
    );

    const { error: updateError } = await supabase
      .from('stylists')
      .update({
        rating: newRating,
        rating_count: newCount
      })
      .eq('id', stylistId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true, rating: newRating, rating_count: newCount };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Unknown error' };
  }
}

export async function getStylistReviews(stylistId: string, stylistSlug?: string): Promise<StylistReview[]> {
  try {
    const { data, error } = await supabase
      .from('stylist_reviews')
      .select('*')
      .eq('stylist_id', stylistId)
      .order('created_at', { ascending: false });
      
    if (error) {
      if (__DEV__) console.log('Error fetching reviews, loading fallbacks:', error.message);
      return FALLBACK_REVIEWS[stylistSlug ?? ''] ?? [];
    }
    
    if (!data || data.length === 0) {
      return FALLBACK_REVIEWS[stylistSlug ?? ''] ?? [];
    }
    
    return data;
  } catch (err) {
    if (__DEV__) console.log('Error in getStylistReviews, loading fallbacks:', err);
    return FALLBACK_REVIEWS[stylistSlug ?? ''] ?? [];
  }
}

// ── Review engagement functions ────────────────────────────────────────────

/** Toggle like on a review: delta = +1 (like) or -1 (unlike). */
export async function likeReview(
  reviewId: string,
  delta: 1 | -1
): Promise<{ ok: boolean; likes_count?: number; error?: string }> {
  try {
    const { error } = await supabase.rpc('toggle_review_like', {
      p_review_id: reviewId,
      p_delta: delta,
    });
    if (error) {
      // Fallback: direct update if RPC not yet deployed
      const { data: cur } = await supabase
        .from('stylist_reviews').select('likes_count').eq('id', reviewId).single();
      const newCount = Math.max(0, (cur?.likes_count ?? 0) + delta);
      await supabase.from('stylist_reviews').update({ likes_count: newCount }).eq('id', reviewId);
      return { ok: true, likes_count: newCount };
    }
    const { data: updated } = await supabase
      .from('stylist_reviews').select('likes_count').eq('id', reviewId).single();
    return { ok: true, likes_count: updated?.likes_count ?? 0 };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/** Increment report count on a review. */
export async function reportReview(
  reviewId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('report_review', { p_review_id: reviewId });
    if (error) {
      // Fallback
      const { data: cur } = await supabase
        .from('stylist_reviews').select('reports_count').eq('id', reviewId).single();
      await supabase.from('stylist_reviews')
        .update({ reports_count: (cur?.reports_count ?? 0) + 1 }).eq('id', reviewId);
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function createStylistReview(
  stylistId: string,
  customerName: string,
  rating: number,
  comment: string
): Promise<{ ok: boolean; review?: StylistReview; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('stylist_reviews')
      .insert({
        stylist_id: stylistId,
        customer_name: customerName,
        rating,
        comment,
      })
      .select('*')
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    const { data: stylistData, error: fetchError } = await supabase
      .from('stylists')
      .select('rating, rating_count')
      .eq('id', stylistId)
      .single();

    if (!fetchError && stylistData) {
      const { rating: newRating, rating_count: newCount } = computeUpdatedRating(
        { rating: stylistData.rating ? Number(stylistData.rating) : null, rating_count: stylistData.rating_count },
        rating
      );

      const { error: ratingError } = await supabase
        .from('stylists')
        .update({
          rating: newRating,
          rating_count: newCount
        })
        .eq('id', stylistId);
      // The review row was created; if only the denormalised rating sync failed,
      // log it but don't fail the whole call (the review still stands).
      if (ratingError) {
        console.warn('Review saved but stylist rating sync failed:', ratingError.message);
      }
    }

    return { ok: true, review: data };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Unknown error' };
  }
}
