import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImageZoom from 'react-native-image-pan-zoom';

import { colors } from '../../theme/colors';

type GalleryItem = {
  id: string;
  title: string;
  image: string;
  category: string;
  type?: string;
  created_at?: string;
};

const galleryCategories = [
  { id: 'tifos', title: 'Tifos' },
  { id: 'castalia', title: 'Castalia' },
  { id: 'jugadores', title: 'Jugadores' },
  { id: 'vintage', title: 'Vintage' },
  { id: 'aficion', title: 'Afición' },
  { id: 'fondos', title: 'Fondos' },
  { id: 'favoritos', title: 'Favoritos' },
];

const { width, height } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 16 * 2 - CARD_GAP) / 2;
const FAVORITES_STORAGE_KEY = 'albinegros_gallery_favorites';


export default function GalleryScreen() {
  const insets = useSafeAreaInsets();

  const [selectedCategory, setSelectedCategory] = useState('tifos');

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    loadGallery();
    loadFavorites();
  }, []);

  const loadGallery = async () => {
    try {
      const response = await fetch(
        'https://api.albinegroscastellon.com/api/admin/gallery'
      );

      const data = await response.json();

      const sortedData = data.sort(
        (a: GalleryItem, b: GalleryItem) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );

      setGalleryItems(sortedData);
    } catch (error) {
      console.log('Error cargando galería:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);

      if (savedFavorites) {
        setFavoriteIds(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.log('Error cargando favoritos:', error);
    }
  };

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'favoritos') {
      return galleryItems.filter((item) => favoriteIds.includes(item.id)).length;
    }

    return galleryItems.filter((item) => item.category === categoryId).length;
  };

  const images = useMemo(() => {
    if (selectedCategory === 'favoritos') {
      return galleryItems.filter((item) => favoriteIds.includes(item.id));
    }

    return galleryItems.filter((item) => item.category === selectedCategory);
  }, [galleryItems, selectedCategory, favoriteIds]);

  const allImages = useMemo(() => {
  return galleryItems;
}, [galleryItems]);

  const photoOfTheDay = useMemo(() => {
    if (allImages.length === 0) return null;

    const todayIndex =
      Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000) %
      allImages.length;

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

  const isFavorite = (imageId: string) => {
    return favoriteIds.includes(imageId);
  };

  const toggleFavorite = async (imageId: string) => {
    try {
      const updatedFavorites = favoriteIds.includes(imageId)
        ? favoriteIds.filter((id) => id !== imageId)
        : [...favoriteIds, imageId];

      setFavoriteIds(updatedFavorites);

      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(updatedFavorites)
      );

      if (selectedCategory === 'favoritos' && updatedFavorites.length === 0) {
        setSelectedImageIndex(null);
      }
    } catch (error) {
      console.log('Error guardando favorito:', error);
    }
  };

  const downloadImage = async () => {
    if (!selectedImage) return;

    try {
      const mediaLibraryAvailable = await MediaLibrary.isAvailableAsync();

      if (!mediaLibraryAvailable) {
        Alert.alert(
          'No disponible',
          'La galería del dispositivo no está disponible.'
        );
        return;
      }

      const permission = await MediaLibrary.requestPermissionsAsync(
        false,
        ['photo']
      );

      if (!permission.granted) {
        Alert.alert(
          'Permiso necesario',
          'Necesitamos permiso para guardar la imagen en tu galería.'
        );
        return;
      }

      const imageUrl = selectedImage.image;
      const cleanUrl = imageUrl.split('?')[0];
      const detectedExtension = cleanUrl.match(/\.(png|jpe?g|webp)$/i)?.[1];
      const extension = detectedExtension
        ? detectedExtension.toLowerCase().replace('jpeg', 'jpg')
        : 'jpg';

      const safeId = selectedImage.id.replace(/[^a-zA-Z0-9-_]/g, '-');
      const fileName = `${safeId}-${Date.now()}.${extension}`;
      const destination = new File(Paths.cache, fileName);

      const downloadedFile = await File.downloadFileAsync(
        imageUrl,
        destination,
        { idempotent: true }
      );

      if (!downloadedFile.exists) {
        throw new Error('El archivo descargado no existe.');
      }

      const albumName = 'Albinegros Castellón';
      const existingAlbum = await MediaLibrary.getAlbumAsync(albumName);

      if (existingAlbum) {
        await MediaLibrary.createAssetAsync(
          downloadedFile.uri,
          existingAlbum
        );
      } else {
        const asset = await MediaLibrary.createAssetAsync(
          downloadedFile.uri
        );

        await MediaLibrary.createAlbumAsync(
          albumName,
          asset,
          false
        );
      }

      Alert.alert(
        'Guardado',
        'La imagen se ha guardado en tu galería.'
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.log('ERROR DESCARGANDO IMAGEN:', error);

      Alert.alert(
        'No se pudo guardar',
        `Ha ocurrido un error al descargar o guardar la imagen.\n\n${errorMessage}`
      );
    }
  };

  const shareImage = async () => {
    if (!selectedImage) return;

    try {
      await Share.share({
        message: `${selectedImage.title}\n${selectedImage.image}`,
        url: selectedImage.image,
        title: selectedImage.title,
      });
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo compartir la imagen.'
      );
    }
  };

  const renderImage = ({
    item,
    index,
  }: {
    item: GalleryItem;
    index: number;
  }) => (
    <Pressable
  style={({ pressed }) => [
    selectedCategory === 'fondos'
      ? styles.wallpaperCard
      : styles.imageCard,

    index % 2 === 0
      ? styles.leftCard
      : styles.rightCard,

    pressed && styles.cardPressed,
  ]}
  onPress={() => openImage(index)}
>
      <Image
  source={{ uri: item.image }}
  style={
    selectedCategory === 'fondos'
      ? styles.wallpaperImage
      : styles.galleryImage
  }
  contentFit="cover"
  transition={250}
  cachePolicy="disk"
/>

      <Pressable
        style={styles.favoriteButton}
        onPress={(event) => {
          event.stopPropagation();
          toggleFavorite(item.id);
        }}
      >
        <Text style={styles.favoriteButtonText}>
          {isFavorite(item.id) ? '❤️' : '🤍'}
        </Text>
      </Pressable>

      <Text
        style={styles.imageTitle}
        numberOfLines={2}
      >
        {item.title}
      </Text>

      {selectedCategory === 'fondos' && item.type && (
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {item.type}
          </Text>
        </View>
      )}
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
            <View style={styles.header}>
              <Text style={styles.eyebrow}>MOMENTOS ALBINEGROS</Text>
              <Text style={styles.screenTitle}>Galería</Text>
              <Text style={styles.headerDescription}>
                Imágenes, recuerdos y fondos del C.D. Castellón.
              </Text>
            </View>

            {photoOfTheDay && (
              <Pressable
                  style={({ pressed }) => [
                    styles.photoOfDayCard,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => {
                    const imageIndex = images.findIndex(
                      (item) => item.id === photoOfTheDay.id
                    );

                    if (imageIndex >= 0) {
                      openImage(imageIndex);
                    } else {
                      setSelectedCategory(photoOfTheDay.category);
                      const categoryImages = galleryItems.filter(
                        (item) => item.category === photoOfTheDay.category
                      );
                      const categoryIndex = categoryImages.findIndex(
                        (item) => item.id === photoOfTheDay.id
                      );
                      setSelectedImageIndex(categoryIndex >= 0 ? categoryIndex : null);
                    }
                  }}
                >
                <Text style={styles.photoOfDayLabel}>
                  Foto albinegra del día
                </Text>

                <Image
                  source={{ uri: photoOfTheDay.image }}
                  style={styles.photoOfDayImage}
                  contentFit="contain"
                  transition={250}
                  cachePolicy="disk"
                />

                <Text style={styles.photoOfDayTitle}>
                  {photoOfTheDay.title}
                </Text>
              </Pressable>
            )}

            <Text style={styles.sectionTitle}>
              Categorías
            </Text>

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
                    selectedCategory === category.id &&
                      styles.menuButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setSelectedImageIndex(null);
                  }}
                >
                  <Text
                    style={[
                      styles.menuButtonText,
                      selectedCategory === category.id &&
                        styles.menuButtonTextActive,
                    ]}
                  >
                    {category.title} ({getCategoryCount(category.id)})
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.galleryHeader}>
              <Text style={styles.sectionTitle}>
                Imágenes
              </Text>

              <Text style={styles.imageCount}>
                {images.length} fotos
              </Text>
            </View>
          </>
        }
      />

      <Modal
        visible={selectedImageIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={closeImage}
      >
        <View
          style={[
            styles.modalOverlay,
            {
              paddingBottom: Math.max(insets.bottom, 18) + 18,
            },
          ]}
        >
          <Pressable
            style={styles.closeButton}
            onPress={closeImage}
          >
            <Text style={styles.closeButtonText}>
              Cerrar
            </Text>
          </Pressable>

          {selectedImage && (
            <View style={styles.modalContent}>
              <ImageZoom
                cropWidth={width}
                cropHeight={height * 0.56}
                imageWidth={width - 32}
                imageHeight={height * 0.56}
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

              <Text style={styles.fullImageTitle}>
                {selectedImage.title}
              </Text>

              <Text style={styles.counterText}>
                {selectedImageIndex! + 1} / {images.length}
              </Text>

              <View style={styles.navigationRow}>
                <Pressable
                  style={[
                    styles.navButton,
                    selectedImageIndex === 0 &&
                      styles.navButtonDisabled,
                  ]}
                  onPress={goToPrevious}
                  disabled={selectedImageIndex === 0}
                >
                  <Text style={styles.navButtonText}>
                    Anterior
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.navButton,
                    selectedImageIndex ===
                      images.length - 1 &&
                      styles.navButtonDisabled,
                  ]}
                  onPress={goToNext}
                  disabled={
                    selectedImageIndex ===
                    images.length - 1
                  }
                >
                  <Text style={styles.navButtonText}>
                    Siguiente
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={[
                  styles.modalFavoriteButton,
                  selectedImage &&
                    isFavorite(selectedImage.id) &&
                    styles.modalFavoriteButtonActive,
                ]}
                onPress={() => {
                  if (selectedImage) {
                    toggleFavorite(selectedImage.id);
                  }
                }}
              >
                <Text style={styles.modalFavoriteButtonText}>
                  {selectedImage && isFavorite(selectedImage.id)
                    ? '❤️ Quitar de favoritos'
                    : '🤍 Añadir a favoritos'}
                </Text>
              </Pressable>

              {selectedCategory === 'fondos' && (
                <View style={styles.wallpaperActions}>
                  <Pressable
                    style={styles.downloadButton}
                    onPress={downloadImage}
                  >
                    <Text style={styles.downloadButtonText}>
                      Descargar
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.shareButton}
                    onPress={shareImage}
                  >
                    <Text style={styles.shareButtonText}>
                      Compartir
                    </Text>
                  </Pressable>
                </View>
              )}
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
    backgroundColor: '#050505',
  },

  content: {
    padding: 16,
    paddingBottom: 34,
  },

  header: {
    marginBottom: 20,
  },

  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.35,
    marginBottom: 4,
  },

  screenTitle: {
    fontSize: 31,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  headerDescription: {
    marginTop: 5,
    color: '#9A9A9A',
    fontSize: 14,
    lineHeight: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  photoOfDayCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    padding: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(215, 178, 67, 0.7)',
    overflow: 'hidden',
  },

  photoOfDayLabel: {
    alignSelf: 'flex-start',
    color: '#111111',
    backgroundColor: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 10,
  },

  photoOfDayImage: {
    width: '100%',
    height: 360,
    borderRadius: 16,
    marginBottom: 11,
    backgroundColor: '#0A0A0A',
  },

  photoOfDayTitle: {
    paddingHorizontal: 4,
    paddingBottom: 4,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  menuContainer: {
    paddingBottom: 20,
  },

  menuButton: {
    minHeight: 42,
    justifyContent: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#282828',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 9,
  },

  menuButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  menuButtonText: {
    color: '#A0A0A0',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
  },

  menuButtonTextActive: {
    color: '#101010',
  },

  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  imageCount: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
  },

  imageCard: {
    width: CARD_WIDTH,
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 7,
    marginBottom: CARD_GAP,
    borderWidth: 1,
    borderColor: '#282828',
    overflow: 'hidden',
  },

  wallpaperCard: {
    width: CARD_WIDTH,
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 7,
    marginBottom: CARD_GAP,
    borderWidth: 1,
    borderColor: 'rgba(215, 178, 67, 0.72)',
    overflow: 'hidden',
  },

  leftCard: {
    marginRight: CARD_GAP / 2,
  },

  rightCard: {
    marginLeft: CARD_GAP / 2,
  },

  galleryImage: {
    width: '100%',
    height: 164,
    borderRadius: 13,
    marginBottom: 9,
    backgroundColor: '#0A0A0A',
  },

  wallpaperImage: {
    width: '100%',
    height: 320,
    borderRadius: 15,
    marginBottom: 10,
    backgroundColor: '#0A0A0A',
  },

  imageTitle: {
    paddingHorizontal: 3,
    paddingBottom: 3,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    minHeight: 37,
  },

  typeBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: colors.accent,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  typeBadgeText: {
    color: '#101010',
    fontWeight: '900',
    fontSize: 10,
    textTransform: 'uppercase',
  },

  favoriteButton: {
    position: 'absolute',
    top: 13,
    left: 13,
    backgroundColor: 'rgba(5,5,5,0.82)',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  favoriteButtonText: {
    fontSize: 17,
  },

  modalFavoriteButton: {
    minHeight: 38,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#303030',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
    justifyContent: 'center',
  },

  modalFavoriteButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  modalFavoriteButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  modalContent: {
    width: '100%',
    alignItems: 'center',
  },

  fullImage: {
    width: width - 32,
    height: height * 0.56,
  },

  fullImageTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },

  counterText: {
    color: '#929292',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 10,
  },

  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    marginBottom: 10,
  },

  navButton: {
    flex: 1,
    minHeight: 40,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navButtonDisabled: {
    borderColor: '#2B2B2B',
    backgroundColor: '#171717',
    opacity: 0.5,
  },

  navButtonText: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 12,
  },

  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#303030',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },

  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  wallpaperActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 0,
  },

  downloadButton: {
    backgroundColor: colors.accent,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 12,
  },

  downloadButtonText: {
    color: '#101010',
    fontWeight: '900',
    fontSize: 12,
  },

  shareButton: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#303030',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 12,
  },

  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.992 }],
  },
});