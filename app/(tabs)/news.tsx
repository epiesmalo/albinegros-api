import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';

type NewsItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  date: string;
  source: string;
};

export default function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNews = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('https://api.albinegroscastellon.com/news');
      const data = await response.json();

      setNews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('No se pudieron cargar las noticias.');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const openLink = async (url: string) => {
    if (!url) return;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Noticias</Text>

      {loading && <ActivityIndicator size="large" color={colors.accent} />}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && news.length === 0 && (
        <Text style={styles.emptyText}>Todavía no hay noticias disponibles.</Text>
      )}

      {!loading &&
        !error &&
        news.map((item) => (
          <Pressable key={item.id} style={styles.newsCard} onPress={() => openLink(item.link)}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.newsImage} />
            ) : null}

            <View style={styles.newsContent}>
              <Text style={styles.newsDate}>{item.date}</Text>
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsDescription}>{item.description}</Text>

              {item.link ? <Text style={styles.newsLink}>Abrir noticia</Text> : null}
            </View>
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
  newsCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  newsImage: {
    width: '100%',
    height: 180,
  },
  newsContent: {
    padding: 14,
  },
  newsDate: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 6,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 14,
    color: colors.subtitle,
    lineHeight: 20,
    marginBottom: 10,
  },
  newsLink: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
  },
  emptyText: {
    color: colors.subtitle,
  },
});