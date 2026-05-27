import { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import ImageZoom from 'react-native-image-pan-zoom';
import { galleryCategories, galleryImages } from '../../data/galleryData';
import { colors } from '../../theme/colors';

type GalleryItem = {
  id: string;
  title: string;
  image: string;
};

const { width, height } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 16 * 2 - CARD_GAP) / 2;

export default function GalleryScreen() {
  const [selectedCategory, setSelectedCategory] = useState('tifos');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const images = useMemo(
    () => galleryImages[selectedCategory as keyof typeof galleryImages] || [],
    [selectedCategory]
  );

  const allImages = useMemo(() => {
    return Object.values(galleryImages).flat() as GalleryItem[];
  }, []);

  const photoOfTheDay = useMemo(() => {
    if (allImages.length === 0) return null;

    const todayIndex =
      Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000) % allImages.length;

    return allImages[todayIndex];
  }, [allImages]);

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
    if (selectedImageIndex > 0) setSelectedImageIndex(selectedImageIndex - 1);
  };

  const goToNext = () => {
    if (selectedImageIndex === null) return;
    if (selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const renderImage = ({ item, index }: { item: GalleryItem; index: number }) => (
    <Pressable
      style={[
        styles.imageCard,
        index % 2 === 0 ? styles.leftCard : styles.rightCard,
      ]}
      onPress={() => openImage(index)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.galleryImage}
        contentFit="cover"
        transition={250}
        cachePolicy="disk"
      />

      <Text style={styles.imageTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </Pressable>
  );

  return (
    <>
      <FlatList
        style={styles.container}
        data={images}
        keyExtractor={(item) => item.id}
        renderItem={renderImage}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.screenTitle}>Galería</Text>

            {photoOfTheDay && (
              <Pressable style={styles.photoOfDayCard}>
                <Text style={styles.photoOfDayLabel}>Foto albinegra del día</Text>

                <Image
                  source={{ uri: photoOfTheDay.image }}
                  style={styles.photoOfDayImage}
                  contentFit="cover"
                  transition={250}
                  cachePolicy="disk"
                />

                <Text style={styles.photoOfDayTitle}>{photoOfTheDay.title}</Text>
              </Pressable>
            )}

            <Text style={styles.sectionTitle}>Categorías</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.menuContainer}
            >
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
            </ScrollView>

            <View style={styles.galleryHeader}>
              <Text style={styles.sectionTitle}>Imágenes</Text>
              <Text style={styles.imageCount}>{images.length} fotos</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay imágenes en esta categoría.</Text>
          </View>
        }
      />

      <Modal
        visible={selectedImageIndex !== null}
        transparent
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
                  source={{ uri: selectedImage.image }}
                  style={styles.fullImage}
                  contentFit="contain"
                  transition={250}
                  cachePolicy="disk"
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
                    selectedImageIndex === images.length - 1 &&
                      styles.navButtonDisabled,
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
    paddingBottom: 32,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 12,
  },
  photoOfDayCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 12,
    marginBottom: 22,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  photoOfDayLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.accent,
    marginBottom: 10,
  },
  photoOfDayImage: {
    width: '100%',
    height: 245,
    borderRadius: 16,
    marginBottom: 10,
  },
  photoOfDayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  menuContainer: {
    paddingBottom: 18,
  },
  menuButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  menuButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  menuButtonText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  menuButtonTextActive: {
    color: '#fff',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imageCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  imageCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 8,
    marginBottom: CARD_GAP,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leftCard: {
    marginRight: CARD_GAP / 2,
  },
  rightCard: {
    marginLeft: CARD_GAP / 2,
  },
  galleryImage: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 8,
  },
  imageTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    minHeight: 34,
  },
  emptyBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.muted,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
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
    fontWeight: '800',
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
    fontWeight: '900',
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
    fontWeight: '800',
  },
});