import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';


type NextMatch = {
  teamName: string;
  opponent: string;
  date: string;
  time: string;
  stadium: string;
  competition: string;
  teamLogo: string;
  opponentLogo: string;
};

type AdItem = {
  id: string;
  title: string;
  text: string;
  link: string;
  image: string;
};

export default function HomeScreen() {
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log('No se pudo abrir este enlace:', url);
    }
  };

  const quickLinks = [
    { id: '1', title: 'Clasificación', route: '/(tabs)/explore', icon: 'trophy' },
    { id: '2', title: 'Calendario', route: '/(tabs)/calendar', icon: 'calendar' },
    { id: '3', title: 'Media', route: '/(tabs)/media', icon: 'musical-notes' },
    { id: '4', title: 'Galería', route: '/(tabs)/gallery', icon: 'images' },
    { id: '5', title: '¿Quiénes somos?', route: '/about', icon: 'information-circle' },
  ] as const;

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [matchRes, adsRes] = await Promise.all([
        fetch('https://albinegros-api.onrender.com/api/admin/next-match'),
        fetch('https://albinegros-api.onrender.com/api/admin/ads'),
      ]);

      const matchData = await matchRes.json();
      const adsData = await adsRes.json();

      setNextMatch(matchData);
      setAds(Array.isArray(adsData) ? adsData : []);
    } catch (error) {
      console.log('Error cargando datos del inicio:', error);
    } finally {
      setLoading(false);
    }
  };

  return (


    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image
        source={require('../../assets/images/escudo.png')}
        style={styles.logo}
      />
<View style={styles.socialContainer}>
  <Pressable
    style={styles.socialButton}
    onPress={() => Linking.openURL('https://www.albinegroscastellon.com')}
  >
    <Text style={styles.socialText}>🌐 Web</Text>
  </Pressable>

  <Pressable
    style={styles.socialButton}
    onPress={() => Linking.openURL('https://www.instagram.com/albinegroscastellon')}
  >
    <Text style={styles.socialText}>📸 Instagram</Text>
  </Pressable>
</View>
      <Text style={styles.title}>Albinegros Castellón</Text>
      <Text style={styles.subtitle}>Toda la información del club en una sola app</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>PRÓXIMO PARTIDO</Text>
        <Text style={styles.cardTitle}>Primer equipo</Text>

        {loading && <ActivityIndicator size="large" color={colors.accent} />}

        {!loading && nextMatch && (
          <>
            <View style={styles.matchRow}>
              <View style={styles.teamBox}>
                <Image source={{ uri: nextMatch.teamLogo }} style={styles.teamLogo} />
                <Text style={styles.teamName}>{nextMatch.teamName}</Text>
              </View>

              <Text style={styles.vsText}>VS</Text>

              <View style={styles.teamBox}>
                <Image source={{ uri: nextMatch.opponentLogo }} style={styles.teamLogo} />
                <Text style={styles.teamName}>{nextMatch.opponent}</Text>
              </View>
            </View>

            <Text style={styles.infoText}>
              {nextMatch.date} - {nextMatch.time}
            </Text>
            <Text style={styles.infoText}>{nextMatch.stadium}</Text>
            <Text style={styles.competition}>{nextMatch.competition}</Text>
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>Accesos rápidos</Text>

      <View style={styles.quickLinksGrid}>
        {quickLinks.map((item) => (
          <Pressable
            key={item.id}
            style={styles.quickLinkCard}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.quickIconWrapper}>
              <Ionicons name={item.icon} size={30} color={colors.accent} />
            </View>
            <Text style={styles.quickLinkTitle}>{item.title}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Patrocinadores</Text>

      {ads.map((ad) => (
  <Pressable
    key={ad.id}
    style={styles.adCard}
    onPress={() => openLink(ad.link)}
  >
    <Image source={{ uri: ad.image }} style={styles.adImage} />
    <Text style={styles.cardLabel}>PUBLICIDAD</Text>
    <Text style={styles.adTitle}>{ad.title}</Text>
    <Text style={styles.adText}>{ad.text}</Text>
    <Text style={styles.adLink}>Abrir anuncio</Text>
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
  logo: {
    width: 90,
    height: 90,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.subtitle,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  teamBox: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogo: {
    width: 54,
    height: 54,
    marginBottom: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accent,
    marginHorizontal: 10,
  },
  infoText: {
    fontSize: 15,
    color: colors.subtitle,
    marginBottom: 4,
    textAlign: 'center',
  },
  competition: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    marginTop: 8,
    textAlign: 'center',
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickLinkCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickIconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickLinkTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  adCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  adTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  adText: {
    fontSize: 15,
    color: '#eaeaea',
    marginBottom: 10,
  },
  adLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  adImage: {
  width: '100%',
  height: 160,
  borderRadius: 12,
  marginBottom: 12,
},
socialContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 20,
},

socialButton: {
  flex: 1,
  backgroundColor: colors.card,
  padding: 12,
  borderRadius: 12,
  alignItems: 'center',
  marginHorizontal: 4,
  borderWidth: 1,
  borderColor: colors.border,
},

socialText: {
  fontWeight: '700',
  color: colors.text,
},
});