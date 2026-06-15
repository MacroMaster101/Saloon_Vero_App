import { useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet, AlertButton } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { uploadImage } from '@/lib/api/storage';
import { useTheme } from '@/hooks/use-theme';
import { ThemedTextInput } from '@/components/ui/text-input';

export function AdminPhotoPicker({
  photoUrl,
  onChangePhotoUrl,
  placeholderUrl,
  bucketName,
  uploadPath,
}: {
  photoUrl: string | null;
  onChangePhotoUrl: (url: string | null) => void;
  placeholderUrl: string;
  bucketName: 'avatars' | 'gallery';
  uploadPath: string;
}) {
  const { c, Spacing, Type } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const displayUrl = photoUrl || placeholderUrl;

  const handlePress = () => {
    const options: AlertButton[] = [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Upload Photo from Device', onPress: pickImage },
      { text: showUrlInput ? 'Hide Web Link Input' : 'Enter Web Image Link (URL)', onPress: toggleUrlInput },
    ];

    if (photoUrl) {
      options.push({
        text: 'Remove Custom Photo',
        style: 'destructive',
        onPress: () => {
          onChangePhotoUrl(null);
          setShowUrlInput(false);
        },
      });
    }

    Alert.alert('Manage Photo', 'Choose how you want to add or update the photo:', options);
  };

  const toggleUrlInput = () => {
    setShowUrlInput(!showUrlInput);
  };

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (res.canceled) return;
      
      setUploading(true);
      const uri = res.assets[0].uri;
      const fileName = `${uploadPath}_${Date.now()}.jpg`;
      
      const up = await uploadImage(bucketName, fileName, uri);
      setUploading(false);

      if ('error' in up) {
        Alert.alert('Upload Error', up.error);
        return;
      }

      onChangePhotoUrl(up.url);
      setShowUrlInput(false);
    } catch (err: any) {
      setUploading(false);
      Alert.alert('Error', err.message || 'Could not pick or upload image.');
    }
  };

  return (
    <View style={{ alignItems: 'center', marginVertical: Spacing.sm, gap: Spacing.sm }}>
      {/* Circular Card Preview */}
      <Pressable
        onPress={handlePress}
        disabled={uploading}
        accessibilityRole="button"
        accessibilityLabel="Change photo"
        style={{
          width: 104,
          height: 104,
          borderRadius: 52,
          borderWidth: 2,
          borderColor: photoUrl ? c.accent : c.hairline,
          backgroundColor: c.bg2,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          shadowColor: '#1C1A17',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
        }}
      >
        <Image
          source={{ uri: displayUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />

        {/* Uploading indicator Overlay */}
        {uploading && (
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator color="#FFF" size="small" />
          </View>
        )}

        {/* Edit Pen Overlay Icon */}
        {!uploading && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              backgroundColor: 'rgba(28, 26, 23, 0.65)',
              paddingVertical: 3,
              alignItems: 'center',
            }}
          >
            <MaterialIcons name="photo-camera" size={14} color="#FFF" />
          </View>
        )}
      </Pressable>

      {/* Helper text explaining the two ways */}
      <View style={{ width: '100%', alignItems: 'center', paddingHorizontal: Spacing.md }}>
        <Text style={[Type.caption, { color: c.fgMuted, textAlign: 'center', fontSize: 11, fontFamily: 'Poppins_600SemiBold' }]}>
          Manage photo in two ways:
        </Text>
        <Text style={[Type.caption, { color: c.fgMuted, textAlign: 'center', fontSize: 10, marginTop: 1 }]}>
          • Pick a local image from your device storage to upload.
        </Text>
        <Text style={[Type.caption, { color: c.fgMuted, textAlign: 'center', fontSize: 10 }]}>
          • Paste any direct web image URL (e.g. Unsplash, Imgur).
        </Text>
      </View>

      {/* External Link Input (toggled on demand) */}
      {showUrlInput && (
        <View style={{ width: '100%', marginTop: Spacing.xs }}>
          <ThemedTextInput
            label="Web Image Link (URL)"
            value={photoUrl || ''}
            onChangeText={(text) => onChangePhotoUrl(text.trim() || null)}
            placeholder="e.g. https://images.unsplash.com/photo-..."
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
      )}
    </View>
  );
}
