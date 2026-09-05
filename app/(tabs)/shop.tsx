import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const SHOP_COMING_SOON = require('../../assets/images/tienda-proximamente.png');

export default function ShopScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
  <Image
  source={SHOP_COMING_SOON}
  style={styles.image}
  resizeMode="contain"
/>
<View style={styles.comingSoonContent}>
  <Text style={styles.eyebrow}>MUY PRONTO</Text>

  <Text style={styles.description}>
    Estamos preparando algo para llevar los colores albinegros más allá de Castalia.
  </Text>

  <View style={styles.categoriesRow}>
    <View style={styles.categoryCard}>
      <Text style={styles.categoryIcon}>👕</Text>
      <Text style={styles.categoryTitle}>TEXTIL</Text>
    </View>

    <View style={styles.categoryCard}>
      <Text style={styles.categoryIcon}>🏴</Text>
      <Text style={styles.categoryTitle}>ACCESORIOS</Text>
    </View>

    <View style={styles.categoryCard}>
      <Text style={styles.categoryIcon}>★</Text>
      <Text style={styles.categoryTitle}>EXCLUSIVOS</Text>
    </View>
  </View>

  <Text style={styles.products}>
    Camisetas · Sudaderas · Bufandas · Banderas · Accesorios · Ediciones especiales
  </Text>

  <View style={styles.divider} />

  <Text style={styles.orellut}>PAM PAM ORELLUT</Text>
</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 30,
  },

image: {
  width: '100%',
  height: undefined,
  aspectRatio: 1168 / 1346,
  alignSelf: 'center',
},
comingSoonContent: {
  paddingHorizontal: 18,
  paddingTop: 28,
  paddingBottom: 28,
  alignItems: 'center',
},

eyebrow: {
  color: '#D4AF37',
  fontSize: 12,
  fontWeight: '900',
  letterSpacing: 2.2,
  marginBottom: 10,
},

description: {
  maxWidth: 330,
  color: '#FFFFFF',
  fontSize: 16,
  lineHeight: 23,
  fontWeight: '700',
  textAlign: 'center',
  marginBottom: 24,
},

categoriesRow: {
  width: '100%',
  flexDirection: 'row',
  gap: 9,
  marginBottom: 22,
},

categoryCard: {
  flex: 1,
  minHeight: 82,
  backgroundColor: '#101010',
  borderRadius: 15,
  borderWidth: 1,
  borderColor: '#292929',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 5,
},

categoryIcon: {
  fontSize: 23,
  marginBottom: 7,
},

categoryTitle: {
  color: '#FFFFFF',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 0.5,
  textAlign: 'center',
},

products: {
  maxWidth: 340,
  color: '#888888',
  fontSize: 12,
  lineHeight: 19,
  fontWeight: '600',
  textAlign: 'center',
},

divider: {
  width: 42,
  height: 2,
  backgroundColor: '#D4AF37',
  marginTop: 24,
  marginBottom: 17,
},

orellut: {
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: '900',
  letterSpacing: 2,
},
});