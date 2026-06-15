/**
 * High-quality salon and beauty imagery mapped to service slugs.
 * Using aesthetic, high-resolution Unsplash assets to simulate professionally generated photography.
 */
const SERVICE_IMAGES: Record<string, string> = {
  'gents-cut': 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop&q=80',
  'ladies-cut': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&auto=format&fit=crop&q=80',
  'colour-roots': 'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=500&auto=format&fit=crop&q=80',
  'colour-full': 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500&auto=format&fit=crop&q=80',
  'hair-spa': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
  'kids-cut': 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=500&auto=format&fit=crop&q=80',
  'beard': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=80',
  'facial': 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=500&auto=format&fit=crop&q=80',
  'threading': 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop&q=80',
  'waxing': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=500&auto=format&fit=crop&q=80',
  'mani-pedi': 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=500&auto=format&fit=crop&q=80',
  'bridal': 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80',
};

const CATEGORY_FALLBACKS: Record<string, string> = {
  hair: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&auto=format&fit=crop&q=80',
  beauty: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
};

/**
 * Resolves a beautiful image URL for a given service based on its slug.
 * Falls back to category-level default image if the slug is not recognized.
 */
export function getServiceImage(
  slug: string | null | undefined,
  category?: string | null,
  customUrl?: string | null,
): string {
  const cleanUrl = (customUrl ?? '').trim();
  if (cleanUrl && (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:image'))) {
    return cleanUrl;
  }

  const cleanSlug = (slug ?? '').trim().toLowerCase();
  if (cleanSlug && SERVICE_IMAGES[cleanSlug]) {
    return SERVICE_IMAGES[cleanSlug];
  }

  const cleanCategory = (category ?? '').trim().toLowerCase();
  return CATEGORY_FALLBACKS[cleanCategory] ?? CATEGORY_FALLBACKS.default;
}
