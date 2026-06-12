export type SessionProfile = { role: 'user' | 'staff' | 'admin'; stylistId: string | null };
export type LandingRoute = '/(staff)/today' | '/(admin)/today' | '/(tabs)' | null;

export function routeForSession(
  user: { id: string } | null,
  profile: SessionProfile | null,
  isGuest: boolean,
): LandingRoute {
  if (user && profile?.role === 'staff' && profile.stylistId) return '/(staff)/today';
  if (user && profile?.role === 'admin') return '/(admin)/today';
  if (user || isGuest) return '/(tabs)';
  return null;
}
