import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/api/supabase';
import { showPermissionPrimer } from '@/components/permissions/PermissionPrimer';

/**
 * Register this device for push notifications and store the Expo token in
 * Supabase. Safe to call repeatedly (upsert). No-ops gracefully when:
 *  - running in an environment without a device (web / Expo Go on Android push),
 *  - the EAS projectId isn't configured yet (before `eas build`/`eas init`),
 *  - the user declines the OS prompt.
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    // Android 13+ needs a channel created before requesting a token.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    if (status !== 'granted' && existing.canAskAgain) {
      // Prime once with a branded rationale, then ask the OS.
      const proceed = await showPermissionPrimer({
        icon: 'bell.fill',
        title: 'Stay in the loop',
        message: 'Get notified about booking confirmations, changes, and new messages from your stylist.',
        allowLabel: 'Turn on notifications',
      });
      if (!proceed) return;
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
    if (!projectId) {
      console.warn('Push: no EAS projectId yet — run `eas init`/`eas build` to enable push tokens.');
      return;
    }

    const tokenResp = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResp.data;

    await supabase.from('push_tokens').upsert(
      { user_id: userId, token, platform: Platform.OS },
      { onConflict: 'user_id,token' },
    );
  } catch (e) {
    // Never let push registration break app startup.
    console.warn('Push registration failed:', e);
  }
}
