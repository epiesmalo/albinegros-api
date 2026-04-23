import { Image, Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { news } from '../../data/mockData';
import { colors } from '../../theme/colors';

export default function NewsScreen() {
  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log('No se pudo abrir este enlace:', url);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Noticias</Text>

      {news.map((item) => (
        <Pressable
          key={item.id}
          style={styles.card}
          onPress={() => openLink(item.link)}
        >
          <Image source={item.image} style={styles.newsImage} />
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.summary}</Text>
          <Text style={styles.linkText}>Abrir publicación</Text>
        </Pressable>
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
    marginBottom: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: 180,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 14,
    marginHorizontal: 14,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: colors.subtitle,
    lineHeight: 22,
    marginHorizontal: 14,
    marginBottom: 10,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    marginHorizontal: 14,
    marginBottom: 14,
  },
});