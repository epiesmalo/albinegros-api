import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type AboutData = {
  title: string;
  text: string;
};

export default function AboutScreen() {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAbout();
  }, []);

  const loadAbout = async () => {
    try {
      const response = await fetch('https://albinegros-api.onrender.com/api/admin/about');
      const data = await response.json();
      setAbout(data);
    } catch (error) {
      console.log('Error cargando about:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image
        source={require('../assets/images/escudo.png')}
        style={styles.logo}
      />

      {loading && <ActivityIndicator size="large" color={colors.accent} />}

      {!loading && about && (
        <>
          <Text style={styles.title}>{about.title}</Text>

          <View style={styles.card}>
            <Text style={styles.text}>{about.text}</Text>
          </View>
        </>
      )}
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
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    marginTop: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});