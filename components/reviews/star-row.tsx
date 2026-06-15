import { Text } from 'react-native';

// Filled/empty 5-star row used across review lists (admin, staff, home).
export function StarRow({ rating }: { rating: number }) {
  return (
    <Text style={{ color: '#D9A648', fontSize: 12, fontFamily: 'Poppins_700Bold', letterSpacing: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆')).join('')}
    </Text>
  );
}
