import { Image } from 'expo-image';
import { Modal, Pressable } from 'react-native';

export function ImageViewerModal({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.92)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!!url && (
          <Image
            source={{ uri: url }}
            style={{ width: '92%', height: '80%' }}
            contentFit="contain"
          />
        )}
      </Pressable>
    </Modal>
  );
}
