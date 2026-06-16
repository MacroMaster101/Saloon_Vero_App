import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showPermissionPrimer } from '@/components/permissions/PermissionPrimer';

const PRIMED_PHOTOS = 'perm_primed_photos';
const PRIMED_CAMERA = 'perm_primed_camera';

/** True the first time a given permission is asked, so the rationale shows once. */
async function isFirstAsk(key: string): Promise<boolean> {
  const seen = await AsyncStorage.getItem(key);
  return seen === null;
}
async function markPrimed(key: string): Promise<void> {
  await AsyncStorage.setItem(key, '1');
}

function deniedAlert(what: string) {
  Alert.alert(
    `${what} access is off`,
    `Enable ${what.toLowerCase()} access in Settings to continue.`,
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );
}

/**
 * Ensure photo-library access. On the first undetermined ask, show the branded
 * rationale before the OS prompt; if permanently denied, offer Open Settings.
 * Returns true only when access is granted.
 */
export async function ensurePhotoLibraryPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;

  if (current.canAskAgain) {
    if (await isFirstAsk(PRIMED_PHOTOS)) {
      const proceed = await showPermissionPrimer({
        icon: 'photo.fill',
        title: 'Access your photos',
        message: 'Saloon Vero needs your photo library so you can set a profile picture and share images in chat.',
        allowLabel: 'Choose a photo',
      });
      await markPrimed(PRIMED_PHOTOS);
      if (!proceed) return false;
    }
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (res.granted) return true;
  }

  deniedAlert('Photo library');
  return false;
}

/**
 * Ensure camera access (for "Take photo"). Same priming + settings-fallback flow.
 */
export async function ensureCameraPermission(): Promise<boolean> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;

  if (current.canAskAgain) {
    if (await isFirstAsk(PRIMED_CAMERA)) {
      const proceed = await showPermissionPrimer({
        icon: 'camera.fill',
        title: 'Use your camera',
        message: 'Saloon Vero needs your camera to take a new profile picture or capture a photo to share in chat.',
        allowLabel: 'Open camera',
      });
      await markPrimed(PRIMED_CAMERA);
      if (!proceed) return false;
    }
    const res = await ImagePicker.requestCameraPermissionsAsync();
    if (res.granted) return true;
  }

  deniedAlert('Camera');
  return false;
}
