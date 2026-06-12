import { render } from '@testing-library/react-native';
import { GoogleLogo } from '@/components/ui/google-logo';

// react-native-svg packs hex fills into ARGB uint32 payloads in the rendered tree.
const argb = (hex: string) => ((0xff000000 + parseInt(hex.slice(1), 16)) >>> 0).toString();

test('renders the four-color Google G', () => {
  const { toJSON } = render(<GoogleLogo size={18} />);
  const tree = JSON.stringify(toJSON());
  expect((tree.match(/RNSVGPath/g) ?? []).length).toBe(4);
  for (const hex of ['#4285F4', '#34A853', '#FBBC05', '#EA4335']) {
    expect(tree).toContain(argb(hex));
  }
});
