import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { shopItems } from '../../data/shopData';
import { colors } from '../../theme/colors';

export default function ShopScreen() {
  const openProduct = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Tienda</Text>
      <Text style={styles.subtitle}>Productos albinegros</Text>

      {shopItems.map((item) => (
        <View key={item.id} style={styles.card}>
          <Image source={item.image} style={styles.image} />

          <View style={styles.info}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.price}>{item.price}</Text>

            <Pressable style={styles.button} onPress={() => openProduct(item.link)}>
              <Text style={styles.buttonText}>
  Comprar ahora
</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.subtitle,
    marginBottom: 18,
  },
  card: {
  backgroundColor: colors.card,
  borderRadius: 22,
  marginBottom: 20,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '#222',
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 6,
},
  image: {
    width: '100%',
    height: 250,
  },
  info: {
    padding: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: 10,
  },
  price: {
  fontSize: 24,
  fontWeight: '900',
  color: colors.accent,
  marginBottom: 14,
},
  button: {
  backgroundColor: colors.accent,
  paddingVertical: 14,
  borderRadius: 14,
  alignItems: 'center',
},
  buttonText: {
  color: '#fff',
  fontWeight: '900',
  fontSize: 15,
  letterSpacing: 0.3,
},
});