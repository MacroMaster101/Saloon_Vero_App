/**
 * Detailed background bios and descriptions for Salon Vero stylists.
 */
const STYLIST_BIOS: Record<string, string> = {
  'ruwan': "Ruwan is a master of gents' styling with over 7 years of barbering experience. Specializing in sharp fades, classic scissor cuts, and modern beard grooming, he tailors each cut to suit your unique features and style.",
  'sanduni': "Sanduni brings over 6 years of expertise in ladies' styling. She is renowned for her precision haircuts, creative blow-dries, and advanced coloring techniques (balayage, highlight transitions, and root touch-ups) that leave hair vibrant and healthy.",
  'tharindu': "Tharindu is a highly skilled barber with a passion for creative cuts and sharp lines. He specializes in skin fades, beard sculpts, and detail-oriented hair designs, ensuring you walk out feeling fresh and sharp.",
  'nadeesha': "Nadeesha is our dedicated beauty therapist with a deep understanding of skincare. With over 8 years in the beauty industry, she excels in refreshing cleanups, glow facials, precise threading, and full bridal dressing packages.",
};

const DEFAULT_BIO = "A highly dedicated and professional stylist at Saloon Vero committed to bringing out your best look with premium hair care and styling techniques.";

/**
 * Resolves a biography string for a given stylist based on their slug.
 */
export function getStylistBio(slug: string | null | undefined): string {
  const cleanSlug = (slug ?? '').trim().toLowerCase();
  return STYLIST_BIOS[cleanSlug] ?? DEFAULT_BIO;
}
