import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

type HubItem = {
  number: string;
  title: string;
  caption: string;
  route: string;
};

const ITEMS: HubItem[] = [
  { number: '01', title: 'Services', caption: 'Prices, durations & availability', route: '/(admin)/manage/services' },
  { number: '02', title: 'Stylists', caption: 'Team members & roles on the floor', route: '/(admin)/manage/stylists' },
  { number: '03', title: 'Blocked slots', caption: 'Close days or block chairs', route: '/(admin)/manage/blocked-slots' },
  { number: '04', title: 'Gallery', caption: 'Lookbook photos', route: '/(admin)/manage/gallery' },
  { number: '05', title: 'People', caption: 'Accounts & app roles', route: '/(admin)/manage/people' },
];

export default function ManageIndex() {
  const { c, Spacing, Type } = useTheme();

  return (
    <ScreenContainer>
      <ScreenHeader eyebrow="MANAGE" title="Salon settings" />

      <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
        {ITEMS.map((item) => (
          <Pressable
            key={item.number}
            accessibilityRole="button"
            onPress={() => router.push(item.route as never)}
          >
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <Text
                  style={[
                    Type.h2,
                    { color: c.accentDark, fontFamily: 'Poppins_700Bold', minWidth: 36 },
                  ]}
                >
                  {item.number}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[Type.label, { color: c.fg, fontSize: 16 }]}>{item.title}</Text>
                  <Text style={[Type.caption, { color: c.fgMuted, marginTop: 2 }]}>{item.caption}</Text>
                </View>
                <Text style={[Type.h2, { color: c.fgMuted }]}>›</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}
