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
const CASTELLON_LOGO_URL = 'https://www.albinegroscastellon.com/cas.png';

type NextMatch = {
  teamName: string;
  teamShortName?: string;
  opponent: string;
  opponentShortName?: string;
  isHome?: boolean;
  date: string;
  time: string;
  stadium: string;
  competition: string;
  teamLogo: string;
  opponentLogo: string;
  updatedAt?: string | null;
};

type AdItem = {
  id: string;
  title: string;
  text: string;
  link: string;
  image: string;
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
  const normalizedName = String(teamName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalizedName.includes('castellon')) {
    return CASTELLON_LOGO_URL;
  }

  return String(logo || '').trim();
};

const getDisplayTeamName = (shortName?: string, fullName?: string) => {
  const selectedName = String(shortName || fullName || '').trim();

  if (!selectedName) return '';

  const normalizedName = selectedName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalizedName.includes('castellon')) {
    return 'C.D. CASTELLÓN';
  }

  if (normalizedName.includes('real sociedad')) {
    return 'REAL SOCIEDAD B';
  }

  return selectedName.toUpperCase();
};

const formatUpdatedAgo = (date?: string | null, now = Date.now()) => {
  if (!date) return '';

  const updatedTime = new Date(date).getTime();

  if (Number.isNaN(updatedTime)) return '';

  const diffMs = Math.max(0, now - updatedTime);
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'Datos actualizados ahora';
  if (minutes < 60) return `Datos actualizados hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Datos actualizados hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) return 'Datos actualizados ayer';

  return `Datos actualizados hace ${days} días`;
};

export default function HomeScreen() {
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(null);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60_000);

    return () => clearInterval(timer);
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
      setUpdatedAt(
        typeof matchData?.updatedAt === 'string'
          ? matchData.updatedAt
          : new Date().toISOString()
      );
      setCurrentTime(Date.now());
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
        <Image
          source={require('../../assets/images/escudo1.png')}
          style={styles.logo}
        />

        <View style={styles.headerTextBox}>
          <Text style={styles.title}>Albinegros Castellón</Text>
          <Text style={styles.subtitle}>
            Toda la información del club en una sola app
          </Text>
        </View>
      </View>

      <View style={styles.socialContainer}>
        <Pressable
          style={styles.socialButton}
          onPress={() =>
            Linking.openURL('https://www.albinegroscastellon.com')
          }
        >
          <Ionicons name="globe-outline" size={20} color={colors.accent} />
          <Text style={styles.socialText}>Web</Text>
        </Pressable>

        <Pressable
          style={styles.socialButton}
          onPress={() =>
            Linking.openURL(
              'https://www.instagram.com/albinegroscastellon'
            )
          }
        >
          <Ionicons name="logo-instagram" size={20} color={colors.accent} />
          <Text style={styles.socialText}>Instagram</Text>
        </Pressable>
      </View>

      <ImageBackground
        source={NEXT_MATCH_BG}
        imageStyle={styles.matchBackgroundImage}
        style={styles.matchCard}
      >
        <View style={styles.matchOverlay} />

        <View style={styles.matchContent}>
          <Text style={styles.cardLabel}>PRÓXIMO PARTIDO</Text>

          {loading && (
            <ActivityIndicator
              size="large"
              color={colors.accent}
              style={styles.loader}
            />
          )}

          {!loading && nextMatch && (
            <>
              <View style={styles.matchRow}>
                <View style={styles.teamBox}>
                  <Image
  source={{
    uri:
      nextMatch.teamName?.toLowerCase().includes('real sociedad')
        ? 'https://media.api-sports.io/football/teams/9585.png'
        : getLogoUrl(nextMatch.teamName, nextMatch.teamLogo),
  }}
  style={styles.teamLogo}
  resizeMode="contain"
/>

  <Text style={styles.teamName} numberOfLines={1}>
  {getDisplayTeamName(
    nextMatch.teamShortName,
    nextMatch.teamName
  )}
</Text>
                </View>

                <View style={styles.vsBox}>
                  <Text style={styles.vsText}>VS</Text>
                </View>

                <View style={styles.teamBox}>
                  <Image
                    source={{
                      uri: getLogoUrl(
                        nextMatch.opponent,
                        nextMatch.opponentLogo
                      ),
                    }}
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />

                  <Text style={styles.teamName} numberOfLines={1}>
  {getDisplayTeamName(
    nextMatch.opponentShortName,
    nextMatch.opponent
  )}
</Text>
                </View>
              </View>

              <View style={styles.bottomPanel}>
                <View style={styles.matchInfoPanel}>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={21}
                      color={colors.accent}
                    />
                    <Text style={styles.infoMain}>
                      {formatMainDate(nextMatch.date)}
                    </Text>
                    <Text style={styles.infoTime}>{nextMatch.time}</Text>
                    <Text style={styles.infoSub}>Fecha y hora</Text>
                  </View>

                  <View style={styles.infoDivider} />

                  <View style={styles.infoItem}>
                    <Ionicons
                      name="location-outline"
                      size={21}
                      color={colors.accent}
                    />
                    <Text
                      style={styles.infoMain}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {nextMatch.stadium}
                    </Text>
                    <Text style={styles.infoSub}>Estadio</Text>
                  </View>

                  <View style={styles.infoDivider} />

                  <View style={styles.infoItem}>
                    <Ionicons
                      name="trophy-outline"
                      size={21}
                      color={colors.accent}
                    />
                    <Text
                      style={styles.infoMain}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {nextMatch.competition}
                    </Text>
                    <Text style={styles.infoSub}>Competición</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.calendarButton}
                  onPress={() => router.push('/(tabs)/calendar' as any)}
                >
                  <View style={styles.calendarButtonMain}>
                    <Text style={styles.calendarButtonText}>Ver calendario</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={colors.accent}
                    />
                  </View>

                  {!!updatedAt && (
                    <View style={styles.updatedRow}>
                      <View style={styles.updatedDot} />
                      <Text style={styles.updatedText}>
                        {formatUpdatedAgo(updatedAt, currentTime)}
                      </Text>
                    </View>
                  )}
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
              <Ionicons
                name={item.icon}
                size={25}
                color={colors.accent}
              />
            </View>

            <Text style={styles.quickLinkTitle} numberOfLines={2}>
              {item.title}
            </Text>
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
            <Pressable
              key={ad.id}
              style={styles.sponsorCard}
              onPress={() => openLink(ad.link)}
            >
              <Image source={{ uri: ad.image }} style={styles.sponsorImage} />

              <Text style={styles.sponsorTitle} numberOfLines={2}>
                {ad.title}
              </Text>
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
    padding: 14,
    borderWidth: 1,
    borderColor: '#262626',
    marginTop: 6,
    marginBottom: 10,
  },
  logo: {
    width: 58,
    height: 58,
    marginRight: 12,
  },
  headerTextBox: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#a8a8a8',
    marginTop: 4,
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
    height: 444,
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
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  matchContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.8,
  },
  loader: {
    marginVertical: 150,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 112,
    marginBottom: 10,
  },
  teamBox: {
    width: '39%',
    alignItems: 'center',
  },
  teamLogo: {
    width: 94,
    height: 94,
    resizeMode: 'contain',
    marginBottom: 9,
  },
  teamName: {
    width: '100%',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    paddingHorizontal: 0,
  },
  vsBox: {
    width: '14%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 23,
  },
  vsText: {
    fontSize: 32,
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
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.38)',
  },
  infoItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  infoMain: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  infoTime: {
    marginTop: 1,
    fontSize: 17,
    lineHeight: 19,
    fontWeight: '900',
    color: colors.accent,
    textAlign: 'center',
  },
  infoSub: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
    color: colors.accent,
    textAlign: 'center',
  },
  infoDivider: {
    width: 1,
    marginVertical: 9,
    backgroundColor: 'rgba(212, 175, 55, 0.42)',
  },
  calendarButton: {
    alignSelf: 'center',
    minWidth: 196,
    minHeight: 52,
    borderRadius: 18,
    marginTop: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
  },

  calendarButtonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.accent,
    marginRight: 7,
  },

  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  updatedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#46D17A',
    marginRight: 5,
  },

  updatedText: {
    color: '#A8A8A8',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    textAlign: 'center',
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