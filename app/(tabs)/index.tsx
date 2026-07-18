import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const NEXT_MATCH_BG = require('../../assets/images/next-match-bg.png');
const CASTELLON_LOGO_URL = 'https://www.albinegroscastellon.com/cdcastellon-logo-app.png';

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

const formatMatchDate = (date?: string, time?: string) => {
  if (!date) return time || '';

  const normalizedDate = date.includes('T') ? date : `${date}T12:00:00`;
  const parsedDate = new Date(normalizedDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return time ? `${date} · ${time}` : date;
  }

  const day = parsedDate.getDate();
  const month = parsedDate
    .toLocaleDateString('es-ES', { month: 'short' })
    .replace('.', '')
    .toUpperCase();

  return time ? `${day} ${month} · ${time}` : `${day} ${month}`;
};

const formatMainDate = (date?: string) => {
  if (!date) return '';

  const normalizedDate = date.includes('T') ? date : `${date}T12:00:00`;
  const parsedDate = new Date(normalizedDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  const day = parsedDate.getDate();
  const month = parsedDate
    .toLocaleDateString('es-ES', { month: 'short' })
    .replace('.', '')
    .toUpperCase();

  return `${day} ${month}`;
};

const getLogoUrl = (teamName?: string, logo?: string) => {
  if (teamName?.toLowerCase().includes('castell')) {
    return CASTELLON_LOGO_URL;
  }

  return logo || '';
};

const getDisplayTeamName = (name?: string) => {
  if (!name) return '';

  if (name.toLowerCase().includes('real sociedad')) {
    return 'REAL SOCIEDAD B';
  }

  if (name.toLowerCase().includes('castell')) {
    return 'CASTELLÓN';
  }

  return name.toUpperCase();
};

export default function HomeScreen() {
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  const quickLinks = [
    { id: '1', title: 'Clasificación', route: '/(tabs)/explore', icon: 'trophy' },
    { id: '2', title: 'Calendario', route: '/(tabs)/calendar', icon: 'calendar' },
    { id: '3', title: 'Media', route: '/(tabs)/media', icon: 'musical-notes' },
    { id: '4', title: 'Galería', route: '/(tabs)/gallery', icon: 'images' },
    { id: '5', title: 'Nosotros', route: '/about', icon: 'information-circle' },
    { id: '6', title: 'Tienda', route: '/(tabs)/shop', icon: 'bag-handle' },
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
      <View style={styles.headerCard}>
        <Image source={require('../../assets/images/escudo1.png')} style={styles.logo} />

        <View style={styles.headerTextBox}>
          <Text style={styles.title}>Albinegros Castellón</Text>
          <Text style={styles.subtitle}>Toda la información del club en una sola app</Text>
        </View>
      </View>

      <View style={styles.socialContainer}>
        <Pressable
          style={styles.socialButton}
          onPress={() => Linking.openURL('https://www.albinegroscastellon.com')}
        >
          <Ionicons name="globe-outline" size={20} color={colors.accent} />
          <Text style={styles.socialText}>Web</Text>
        </Pressable>

        <Pressable
          style={styles.socialButton}
          onPress={() => Linking.openURL('https://www.instagram.com/albinegroscastellon')}
        >
          <Ionicons name="logo-instagram" size={20} color={colors.accent} />
          <Text style={styles.socialText}>Instagram</Text>
        </Pressable>
      </View>

      <ImageBackground source={NEXT_MATCH_BG} imageStyle={styles.matchBackgroundImage} style={styles.matchCard}>
        <View style={styles.matchOverlay} />

        <View style={styles.matchContent}>
          <View style={styles.matchHeader}>
            <Text style={styles.cardLabel}>PRÓXIMO PARTIDO</Text>
            {nextMatch?.competition ? (
              <Text style={styles.competitionPill} numberOfLines={1}>{nextMatch.competition}</Text>
            ) : null}
          </View>

          {loading && <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />}

          {!loading && nextMatch && (
            <>
              <View style={styles.matchRow}>
                <View style={styles.teamBox}>
                  <Image
                    source={{ uri: getLogoUrl(nextMatch.teamName, nextMatch.teamLogo) }}
                    style={styles.teamLogo}
                  />
                  <Text style={styles.teamName} numberOfLines={1}>
                    {getDisplayTeamName(nextMatch.teamName)}
                  </Text>
                </View>

                <View style={styles.vsBox}>
                  <Text style={styles.vsText}>VS</Text>
                </View>

                <View style={styles.teamBox}>
                  <Image
                    source={{ uri: getLogoUrl(nextMatch.opponent, nextMatch.opponentLogo) }}
                    style={styles.teamLogo}
                  />
                  <Text style={styles.teamName} numberOfLines={1}>
                    {getDisplayTeamName(nextMatch.opponent)}
                  </Text>
                </View>
              </View>

              <View style={styles.bottomPanel}>
                <View style={styles.matchInfoPanel}>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar" size={23} color={colors.accent} />
                    <View style={styles.infoTextBox}>
                      <Text style={styles.infoMain}>{formatMainDate(nextMatch.date)}</Text>
                      <Text style={styles.infoTime}>{nextMatch.time}</Text>
                    </View>
                  </View>

                  <View style={styles.infoDivider} />

                  <View style={styles.infoItem}>
                    <Ionicons name="football" size={23} color={colors.accent} />
                    <View style={styles.infoTextBox}>
                      <Text style={styles.infoMain} numberOfLines={1}>{nextMatch.stadium}</Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  style={styles.calendarButton}
                  onPress={() => router.push('/(tabs)/calendar' as any)}
                >
                  <Text style={styles.calendarButtonText}>Ver calendario</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.accent} />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ImageBackground>

      <Text style={styles.sectionTitle}>Accesos rápidos</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickLinksContent}
      >
        {quickLinks.map((item) => (
          <Pressable
            key={item.id}
            style={styles.quickLinkCard}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.quickIconWrapper}>
              <Ionicons name={item.icon} size={25} color={colors.accent} />
            </View>
            <Text style={styles.quickLinkTitle} numberOfLines={2}>{item.title}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Patrocinadores oficiales</Text>

      <View style={styles.sponsorsStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sponsorsContent}
        >
          {ads.map((ad) => (
            <Pressable key={ad.id} style={styles.sponsorCard} onPress={() => openLink(ad.link)}>
              <Image source={{ uri: ad.image }} style={styles.sponsorImage} />
              <Text style={styles.sponsorTitle} numberOfLines={2}>{ad.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#000000',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b0b0b',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#262626',
    marginTop: 6,
    marginBottom: 10,
  },
  logo: {
    width: 52,
    height: 52,
    marginRight: 12,
  },
  headerTextBox: {
    flex: 1,
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#a8a8a8',
    marginTop: 3,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#101010',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    flexDirection: 'row',
  },
  socialText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    marginLeft: 8,
  },
  matchCard: {
    height: 410,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  matchBackgroundImage: {
    borderRadius: 24,
    resizeMode: 'cover',
  },
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  matchContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.8,
  },
  competitionPill: {
    maxWidth: '48%',
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    overflow: 'hidden',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.65)',
  },
  loader: {
    marginVertical: 110,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 120,
    marginBottom: 2,
  },
  teamBox: {
    width: 118,
    alignItems: 'center',
  },
  teamLogo: {
    width: 92,
    height: 92,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 7,
  },
  vsBox: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 28,
  },
  vsText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 7,
  },
  bottomPanel: {
    marginTop: 2,
  },
  matchInfoPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    borderRadius: 15,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBox: {
    marginLeft: 8,
    flexShrink: 1,
  },
  infoMain: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  infoTime: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900',
    color: colors.accent,
    marginTop: 1,
  },
  infoSub: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    marginTop: 2,
  },
  infoDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(212, 175, 55, 0.45)',
    marginHorizontal: 8,
  },
  calendarButton: {
    alignSelf: 'center',
    minWidth: 122,
    height: 28,
    borderRadius: 14,
    marginTop: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  calendarButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.accent,
    marginRight: 7,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 10,
    marginTop: 2,
  },
  quickLinksContent: {
    paddingRight: 8,
    paddingBottom: 22,
  },
  quickLinkCard: {
    width: 88,
    minHeight: 90,
    backgroundColor: '#101010',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLinkTitle: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  sponsorsStrip: {
    backgroundColor: '#050505',
    borderRadius: 20,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  sponsorsContent: {
    paddingHorizontal: 12,
  },
  sponsorCard: {
    width: 142,
    height: 80,
    borderRadius: 14,
    backgroundColor: '#0d0d0d',
    marginRight: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sponsorImage: {
    width: '100%',
    height: 42,
    borderRadius: 8,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  sponsorTitle: {
    fontSize: 11,
    lineHeight: 12,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
});
