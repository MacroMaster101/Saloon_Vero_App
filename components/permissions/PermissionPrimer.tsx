import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedButton } from '@/components/ui/button';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';

/** Content shown on the branded pre-permission rationale screen. */
export type PrimerContent = {
  icon: IconSymbolName;
  title: string;
  message: string;
  allowLabel?: string;
};

type Resolver = (allowed: boolean) => void;

// A module-level bus lets non-React code (lib/permissions/*) open the primer and
// await the user's choice without threading the controller through every call.
let openImpl: ((content: PrimerContent) => Promise<boolean>) | null = null;

/** Show the priming screen and resolve true if the user taps "Allow". */
export function showPermissionPrimer(content: PrimerContent): Promise<boolean> {
  if (!openImpl) return Promise.resolve(true); // provider not mounted (e.g. tests) — don't block
  return openImpl(content);
}

const Ctx = createContext<null>(null);

export function PermissionPrimerProvider({ children }: { children: ReactNode }) {
  const { c, Spacing, Radius, Type } = useTheme();
  const [content, setContent] = useState<PrimerContent | null>(null);
  const resolverRef = useRef<Resolver | null>(null);

  const open = useCallback((next: PrimerContent) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setContent(next);
    });
  }, []);

  const finish = useCallback((allowed: boolean) => {
    setContent(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(allowed);
  }, []);

  useEffect(() => {
    openImpl = open;
    return () => {
      openImpl = null;
    };
  }, [open]);

  return (
    <Ctx.Provider value={null}>
      {children}
      <Modal
        visible={!!content}
        transparent
        animationType="fade"
        onRequestClose={() => finish(false)}
      >
        <Pressable
          onPress={() => finish(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: c.surface,
              borderRadius: Radius.xl,
              padding: Spacing.lg,
              alignItems: 'center',
              gap: Spacing.sm,
            }}
          >
            {content && (
              <>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: c.accentTint,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: Spacing.xs,
                  }}
                >
                  <IconSymbol name={content.icon} size={30} color={c.accentText} />
                </View>
                <Text style={[Type.h2, { color: c.fg, textAlign: 'center' }]}>{content.title}</Text>
                <Text style={[Type.body, { color: c.fg2, textAlign: 'center' }]}>{content.message}</Text>
                <View style={{ width: '100%', gap: Spacing.sm, marginTop: Spacing.sm }}>
                  <ThemedButton label={content.allowLabel ?? 'Allow access'} onPress={() => finish(true)} />
                  <ThemedButton variant="secondary" label="Maybe later" onPress={() => finish(false)} />
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Ctx.Provider>
  );
}

// Exported for parity with other providers; the bus is the primary API.
export const usePermissionPrimer = () => useContext(Ctx);
