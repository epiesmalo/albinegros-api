import { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import { galleryCategories, galleryImages } from '../../data/galleryData';
import { colors } from '../../theme/colors';

type GalleryItem = {
  id: string;
  title: string;
  image: any;
};

const { width, height } = Dimensions.get('window');

export default function GalleryScreen() {
  const [selectedCategory, setSelectedCategory] = useState('tifos');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const images = useMemo(
    () => galleryImages[selectedCategory as keyof typeof galleryImages] || [],
    [selectedCategory]
  );

  const selectedImage =
    selectedImageIndex !== null && images[selectedImageIndex]
      ? images[selectedImageIndex]
      : null;

  const openImage = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImage = () => {
    setSelectedImageIndex(null);
  };

  const goToPrevious = () => {
    if (selectedImageIndex === null) return;
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedImageIndex === null) return;
    if (selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Galería</Text>

        <View style={styles.menuContainer}>
          {galleryCategories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.menuButton,
                selectedCategory === category.id && styles.menuButtonActive,
              ]}
              onPress={() => {
                setSelectedCategory(category.id);
                setSelectedImageIndex(null);
              }}
            >
              <Text
                style={[
                  styles.menuButtonText,
                  selectedCategory === category.id && styles.menuButtonTextActive,
                ]}
              >
                {category.title}
              </Text>
            </Pressable>
          ))}
        </View>

        {images.map((item, index) => (
          <Pressable
            key={item.id}
            style={styles.imageCard}
            onPress={() => openImage(index)}
          >
            <Image source={item.image} style={styles.galleryImage} />
            <Text style={styles.imageTitle}>{item.title}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={selectedImageIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImage}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.closeButton} onPress={closeImage}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </Pressable>

          {selectedImage && (
            <View style={styles.modalContent}>
              <ImageZoom
                cropWidth={width}
                cropHeight={height * 0.72}
                imageWidth={width - 32}
                imageHeight={height * 0.72}
                minScale={1}
                maxScale={3}
                enableSwipeDown={false}
              >
                <Image
                  source={selectedImage.image}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </ImageZoom>

              <Text style={styles.fullImageTitle}>{selectedImage.title}</Text>

              <Text style={styles.counterText}>
                {selectedImageIndex! + 1} / {images.length}
              </Text>

              <View style={styles.navigationRow}>
                <Pressable
                  style={[
                    styles.navButton,
                    selectedImageIndex === 0 && styles.navButtonDisabled,
                  ]}
                  onPress={goToPrevious}
                  disabled={selectedImageIndex === 0}
                >
                  <Text style={styles.navButtonText}>Anterior</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.navButton,
                    selectedImageIndex === images.length - 1 && styles.navButtonDisabled,
                  ]}
                  onPress={goToNext}
                  disabled={selectedImageIndex === images.length - 1}
                >
                  <Text style={styles.navButtonText}>Siguiente</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
  },
  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  menuButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  menuButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  menuButtonText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  menuButtonTextActive: {
    color: '#fff',
  },
  imageCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  galleryImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 10,
  },
  imageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  fullImage: {
    width: width - 32,
    height: height * 0.72,
  },
  fullImageTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  counterText: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 14,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#666',
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: '#222',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});