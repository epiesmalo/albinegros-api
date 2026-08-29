import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { shopItems } from '../../data/shopData';
import { colors } from '../../theme/colors';

export default function ShopScreen() {
  const openProduct = async (url: string) => {
    await Linking.openURL(url);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>PRODUCTOS ALBINEGROS</Text>

        <Text style={styles.screenTitle}>Tienda</Text>

        <Text style={styles.headerDescription}>
          Artículos seleccionados para llevar el sentimiento albinegro contigo.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Productos destacados</Text>

        <Text style={styles.productCount}>
          {shopItems.length} artículos
        </Text>
      </View>

      {shopItems.map((item) => (
        <Pressable
          key={item.id}
          style={styles.card}
          onPress={() => openProduct(item.url)}
        >
          <View style={styles.imageContainer}>
            <Image
              source={item.image}
              style={styles.image}
              resizeMode="cover"
            />

            <View style={styles.productBadge}>
              <Text style={styles.productBadgeText}>ALBINEGROS</Text>
            </View>
          </View>

          <View style={styles.info}>
            <Text style={styles.title}>{item.title}</Text>

            <Text style={styles.description}>
              {item.description}
            </Text>

            <View style={styles.bottomRow}>
              <Text style={styles.price}>{item.price}</Text>

              <View style={styles.buyButton}>
                <Text style={styles.buyButtonText}>Comprar</Text>
                <Text style={styles.buyArrow}>→</Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 36,
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
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
  },

  headerDescription: {
    marginTop: 5,
    color: '#9A9A9A',
    fontSize: 14,
    lineHeight: 20,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  productCount: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
  },

  card: {
    backgroundColor: '#111111',
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#282828',
  },

  imageContainer: {
    position: 'relative',
    backgroundColor: '#0A0A0A',
  },

  image: {
    width: '100%',
    height: 250,
  },

  productBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },

  productBadgeText: {
    color: '#101010',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  info: {
    padding: 15,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
    marginBottom: 6,
  },

  description: {
    color: '#9A9A9A',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  price: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '900',
  },

  buyButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: colors.accent,
  },

  buyButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
  },

  buyArrow: {
    color: colors.accent,
    fontSize: 18,
    marginLeft: 8,
    marginTop: -1,
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.992 }],
    borderColor: colors.accent,
  },
});