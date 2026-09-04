import { Ionicons } from '@expo/vector-icons';
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

type TabType = 'history' | 'collaborate' | 'socials';

type AboutData = {
  title?: string;
  text?: string;

  history?: {
    title?: string;
    text?: string;
  };

  team?: {
    founderName?: string;
    founderRole?: string;
    founderText?: string;
    partnerName?: string;
    partnerRole?: string;
    partnerText?: string;
  };

  collaborate?: {
    title?: string;
    text?: string;
    monthlyViews?: string;
    totalFollowers?: string;
    instagramFollowers?: string;
    services?: string;
    contactEmail?: string;
  };

  socials?: {
    instagram?: {
      followers?: string;
      url?: string;
    };
    facebook?: {
      followers?: string;
      url?: string;
    };
    x?: {
      followers?: string;
      url?: string;
    };
    tiktok?: {
      followers?: string;
      url?: string;
    };
  };
};

const WARRIOR_LOGO = require('../assets/images/escudo1.png');
const CORPORATE_LOGO = require('../assets/radio/albinegros-logo.png')

export default function AboutScreen() {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabType>('history');

  useEffect(() => {
    loadAbout();
  }, []);

  const loadAbout = async () => {
    try {
      const response = await fetch(
        'https://albinegros-api.onrender.com/api/admin/about'
      );

      const data = await response.json();
      setAbout(data);
    } catch (error) {
      console.log('Error cargando about:', error);
    } finally {
      setLoading(false);
    }
  };

  const openUrl = async (url?: string) => {
    if (!url) return;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log('Error abriendo enlace:', error);
    }
  };

  const openEmail = async () => {
    const email = about?.collaborate?.contactEmail;

    if (!email) return;

    try {
      await Linking.openURL(`mailto:${email}`);
    } catch (error) {
      console.log('Error abriendo email:', error);
    }
  };

  const formatMetric = (value?: string) => {
    if (!value) return '—';

    const numericValue = Number(value.replace(/\D/g, ''));

    if (!numericValue) {
      return value;
    }

    if (numericValue >= 1000000) {
      const millions = numericValue / 1000000;

      return `+${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`;
    }

    if (numericValue >= 1000) {
      const thousands = numericValue / 1000;

      return `+${
        Number.isInteger(thousands) ? thousands : thousands.toFixed(1)
      }K`;
    }

    return `+${numericValue}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ALBINEGROS CASTELLÓN</Text>
        <Text style={styles.headerTitle}>¿Quiénes somos?</Text>

        <View style={styles.tabs}>
          <Pressable
            style={[
              styles.tab,
              selectedTab === 'history' && styles.tabActive,
            ]}
            onPress={() => setSelectedTab('history')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'history' && styles.tabTextActive,
              ]}
            >
              HISTORIA
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              selectedTab === 'collaborate' && styles.tabActive,
            ]}
            onPress={() => setSelectedTab('collaborate')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'collaborate' && styles.tabTextActive,
              ]}
            >
              COLABORA
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              selectedTab === 'socials' && styles.tabActive,
            ]}
            onPress={() => setSelectedTab('socials')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'socials' && styles.tabTextActive,
              ]}
            >
              REDES
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'history' && (
          <>
            <View style={styles.historyHero}>
              <View style={styles.warriorGlow}>
                <Image
                  source={WARRIOR_LOGO}
                  style={styles.warriorLogo}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              </View>

              <Text style={styles.heroKicker}>DESDE 2018</Text>

              <Text style={styles.heroTitle}>
                {about?.history?.title ||
                  about?.title ||
                  'Nuestra historia'}
              </Text>

              <Text style={styles.heroText}>
                {about?.history?.text || about?.text || ''}
              </Text>
            </View>

            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineLine} />
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.timelineYear}>2018</Text>
                  <Text style={styles.timelineTitle}>
                    Nace Albinegros Castellón
                  </Text>
                  <Text style={styles.timelineText}>
                    Un proyecto creado para reunir a la afición albinegra y
                    mantener viva la pasión por el C.D. Castellón.
                  </Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineLine} />
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.timelineYear}>COMUNIDAD</Text>
                  <Text style={styles.timelineTitle}>
                    Miles de albinegros
                  </Text>
                  <Text style={styles.timelineText}>
                    Instagram, Facebook, X y TikTok han convertido el proyecto
                    en un punto de encuentro para aficionados del Castellón.
                  </Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDot} />
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.timelineYear}>HOY</Text>
                  <Text style={styles.timelineTitle}>
                    Una nueva etapa
                  </Text>
                  <Text style={styles.timelineText}>
                    Web, aplicación y nuevos proyectos para seguir haciendo
                    crecer la comunidad albinegra.
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionLabel}>EL EQUIPO</Text>

            {!!about?.team?.founderName && (
              <View style={styles.personCard}>
                <View style={styles.personNumber}>
                  <Text style={styles.personNumberText}>01</Text>
                </View>

                <View style={styles.personInfo}>
                  <Text style={styles.personName}>
                    {about.team.founderName}
                  </Text>

                  {!!about.team.founderRole && (
                    <Text style={styles.personRole}>
                      {about.team.founderRole}
                    </Text>
                  )}

                  {!!about.team.founderText && (
                    <Text style={styles.personText}>
                      {about.team.founderText}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {!!about?.team?.partnerName && (
              <View style={styles.personCard}>
                <View style={styles.personNumber}>
                  <Text style={styles.personNumberText}>02</Text>
                </View>

                <View style={styles.personInfo}>
                  <Text style={styles.personName}>
                    {about.team.partnerName}
                  </Text>

                  {!!about.team.partnerRole && (
                    <Text style={styles.personRole}>
                      {about.team.partnerRole}
                    </Text>
                  )}

                  {!!about.team.partnerText && (
                    <Text style={styles.personText}>
                      {about.team.partnerText}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.closingBlock}>
              <Text style={styles.closingQuote}>
                Todo esto empezó por amor al Castellón.
              </Text>

              <Text style={styles.closingText}>
                Y mientras haya albinegros al otro lado, tendremos motivos
                para seguir.
              </Text>

              <Text style={styles.pamPam}>PAM PAM ORELLUT</Text>
            </View>
          </>
        )}

        {selectedTab === 'collaborate' && (
          <>
            <View style={styles.corporateHero}>
              <Image
                source={CORPORATE_LOGO}
                style={styles.corporateLogo}
                resizeMode="contain"
                fadeDuration={0}
              />

              <Text style={styles.corporateKicker}>
                ALBINEGROS CASTELLÓN
              </Text>

              <Text style={styles.corporateTitle}>
                {about?.collaborate?.title ||
                  '¿Quieres que tu negocio llegue a miles de personas?'}
              </Text>

              {!!about?.collaborate?.text && (
                <Text style={styles.corporateText}>
                  {about.collaborate.text}
                </Text>
              )}
            </View>

            <View style={styles.metrics}>
              <View style={styles.metricPrimary}>
                <Text style={styles.metricPrimaryNumber}>
                  {formatMetric(about?.collaborate?.monthlyViews)}
                </Text>
                <Text style={styles.metricPrimaryLabel}>
                  VISUALIZACIONES AL MES
                </Text>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricNumber}>
                    {formatMetric(about?.collaborate?.totalFollowers)}
                  </Text>
                  <Text style={styles.metricLabel}>
                    COMUNIDAD TOTAL
                  </Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricNumber}>
                    {formatMetric(
                      about?.collaborate?.instagramFollowers
                    )}
                  </Text>
                  <Text style={styles.metricLabel}>
                    INSTAGRAM
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionLabel}>¿QUÉ PODEMOS OFRECERTE?</Text>

            <View style={styles.servicesGrid}>
              <View style={styles.serviceCard}>
                <Ionicons name="phone-portrait-outline" size={25} color="#FFFFFF" />
                <Text style={styles.serviceTitle}>APP</Text>
                <Text style={styles.serviceText}>
                  Presencia publicitaria dentro de nuestra aplicación.
                </Text>
              </View>

              <View style={styles.serviceCard}>
                <Ionicons name="globe-outline" size={25} color="#FFFFFF" />
                <Text style={styles.serviceTitle}>WEB</Text>
                <Text style={styles.serviceText}>
                  Visibilidad dentro de nuestro ecosistema digital.
                </Text>
              </View>

              <View style={styles.serviceCard}>
                <Ionicons name="share-social-outline" size={25} color="#FFFFFF" />
                <Text style={styles.serviceTitle}>REDES</Text>
                <Text style={styles.serviceText}>
                  Publicaciones, stories y acciones en redes sociales.
                </Text>
              </View>

              <View style={styles.serviceCard}>
                <Ionicons name="megaphone-outline" size={25} color="#FFFFFF" />
                <Text style={styles.serviceTitle}>CAMPAÑAS</Text>
                <Text style={styles.serviceText}>
                  Sorteos, promociones y acciones personalizadas.
                </Text>
              </View>
            </View>

            {!!about?.collaborate?.services && (
              <View style={styles.customServices}>
                <Text style={styles.customServicesTitle}>
                  COLABORACIONES A MEDIDA
                </Text>
                <Text style={styles.customServicesText}>
                  {about.collaborate.services}
                </Text>
              </View>
            )}

            {!!about?.collaborate?.contactEmail && (
              <Pressable style={styles.contactButton} onPress={openEmail}>
                <Ionicons name="mail-outline" size={21} color="#111111" />
                <Text style={styles.contactButtonText}>
                  QUIERO COLABORAR
                </Text>
              </Pressable>
            )}
          </>
        )}

        {selectedTab === 'socials' && (
          <>
            <View style={styles.socialHero}>
              <Image
                source={CORPORATE_LOGO}
                style={styles.socialLogo}
                resizeMode="contain"
                fadeDuration={0}
              />

              <Text style={styles.socialHeroTitle}>
                Nuestra comunidad
              </Text>

              <Text style={styles.socialHeroText}>
                Sigue toda la actualidad albinegra en nuestras redes sociales.
              </Text>
            </View>

            <Pressable
              style={styles.socialCard}
              onPress={() => openUrl(about?.socials?.instagram?.url)}
            >
              <View style={styles.socialIcon}>
                <Ionicons name="logo-instagram" size={30} color="#FFFFFF" />
              </View>

              <View style={styles.socialInfo}>
                <Text style={styles.socialName}>Instagram</Text>
                <Text style={styles.socialFollowers}>
                  {about?.socials?.instagram?.followers || '—'} seguidores
                </Text>
              </View>

              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={styles.socialCard}
              onPress={() => openUrl(about?.socials?.facebook?.url)}
            >
              <View style={styles.socialIcon}>
                <Ionicons name="logo-facebook" size={30} color="#FFFFFF" />
              </View>

              <View style={styles.socialInfo}>
                <Text style={styles.socialName}>Facebook</Text>
                <Text style={styles.socialFollowers}>
                  {about?.socials?.facebook?.followers || '—'} seguidores
                </Text>
              </View>

              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={styles.socialCard}
              onPress={() => openUrl(about?.socials?.x?.url)}
            >
              <View style={styles.socialIcon}>
                <Text style={styles.xLogo}>X</Text>
              </View>

              <View style={styles.socialInfo}>
                <Text style={styles.socialName}>X</Text>
                <Text style={styles.socialFollowers}>
                  {about?.socials?.x?.followers || '—'} seguidores
                </Text>
              </View>

              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={styles.socialCard}
              onPress={() => openUrl(about?.socials?.tiktok?.url)}
            >
              <View style={styles.socialIcon}>
                <Ionicons name="logo-tiktok" size={30} color="#FFFFFF" />
              </View>

              <View style={styles.socialInfo}>
                <Text style={styles.socialName}>TikTok</Text>
                <Text style={styles.socialFollowers}>
                  {about?.socials?.tiktok?.followers || '—'} seguidores
                </Text>
              </View>

              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </Pressable>

            <View style={styles.socialFooter}>
              <Text style={styles.socialFooterSmall}>
                UNA COMUNIDAD. UNOS COLORES.
              </Text>
              <Text style={styles.socialFooterBig}>
                C.D. CASTELLÓN
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#080808',
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    backgroundColor: '#0D0D0D',
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },

  eyebrow: {
    color: '#8D8D8D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 3,
    marginBottom: 17,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 4,
  },

  tab: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },

  tabActive: {
    backgroundColor: '#FFFFFF',
  },

  tabText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  tabTextActive: {
    color: '#080808',
  },

  scroll: {
    flex: 1,
  },

  content: {
  padding: 16,
  paddingBottom: 90,
},

  historyHero: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 24,
  },

warriorGlow: {
  width: 170,
  height: 170,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 18,
},

  warriorLogo: {
    width: 165,
    height: 165,
  },

  heroKicker: {
    color: '#929292',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 7,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 15,
  },

  heroText: {
    color: '#C7C7C7',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },

  timeline: {
    marginTop: 8,
    marginBottom: 30,
  },

  timelineItem: {
    flexDirection: 'row',
  },

  timelineRail: {
    width: 28,
    alignItems: 'center',
  },

  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginTop: 5,
  },

  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#343434',
    marginVertical: 5,
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 28,
  },

  timelineYear: {
    color: '#8D8D8D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 5,
  },

  timelineTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },

  timelineText: {
    color: '#AFAFAF',
    fontSize: 14,
    lineHeight: 21,
  },

  sectionLabel: {
    color: '#7F7F7F',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginBottom: 12,
  },

  personCard: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  personNumber: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  personNumberText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
  },

  personInfo: {
    flex: 1,
  },

  personName: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },

  personRole: {
    color: '#8D8D8D',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 2,
  },

  personText: {
    color: '#C0C0C0',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },

  closingBlock: {
    marginTop: 18,
    paddingVertical: 27,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#292929',
    alignItems: 'center',
  },

  closingQuote: {
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    textAlign: 'center',
  },

  closingText: {
    color: '#9A9A9A',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },

  pamPam: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 18,
  },

  corporateHero: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 26,
  },

  corporateLogo: {
    width: 105,
    height: 105,
    marginBottom: 16,
  },

  corporateKicker: {
    color: '#8D8D8D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginBottom: 8,
  },

  corporateTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    textAlign: 'center',
  },

  corporateText: {
    color: '#B6B6B6',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 13,
  },

  metrics: {
    marginBottom: 30,
  },

  metricPrimary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 25,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
  },

  metricPrimaryNumber: {
    color: '#080808',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: -2,
  },

  metricPrimaryLabel: {
    color: '#444444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 3,
  },

  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },

  metricCard: {
    flex: 1,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    borderRadius: 16,
    paddingVertical: 19,
    paddingHorizontal: 10,
    alignItems: 'center',
  },

  metricNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  metricLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center',
  },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },

  serviceCard: {
    width: '48.5%',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    padding: 15,
    minHeight: 145,
  },

  serviceTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 13,
    marginBottom: 6,
  },

  serviceText: {
    color: '#999999',
    fontSize: 12,
    lineHeight: 18,
  },

  customServices: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 16,
    padding: 17,
    marginTop: 4,
    marginBottom: 14,
  },

  customServicesTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  customServicesText: {
    color: '#AFAFAF',
    fontSize: 14,
    lineHeight: 21,
  },

  contactButton: {
    backgroundColor: '#FFFFFF',
    minHeight: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 4,
  },

  contactButtonText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  socialHero: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 28,
  },

 socialLogo: {
  width: 105,
  height: 105,
  marginBottom: 14,
},

  socialHeroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },

  socialHeroText: {
    color: '#999999',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 7,
  },

  socialCard: {
    minHeight: 82,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 17,
    paddingHorizontal: 15,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  xLogo: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },

  socialInfo: {
    flex: 1,
  },

  socialName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  socialFollowers: {
    color: '#8D8D8D',
    fontSize: 12,
    marginTop: 3,
  },

  socialFooter: {
    alignItems: 'center',
    marginTop: 25,
    paddingTop: 25,
    borderTopWidth: 1,
    borderTopColor: '#292929',
  },

  socialFooterSmall: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  socialFooterBig: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 5,
  },
});