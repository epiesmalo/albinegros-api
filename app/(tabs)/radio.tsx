import { useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';

type RadioSection = 'directo' | 'podcasts' | 'otros';

const SIGNO_LOGO = require('../../assets/radio/signo-radio.png');
const ALBINEGROS_LOGO = require('../../assets/radio/albinegros-logo.png');
const SIGNO_LIVE_URL = 'https://zeno.fm/player/signo-radio-castellon';
const SIGNO_PATREON_URL = 'https://www.patreon.com/cw/signoradiocastellon';
const SIGNO_PODCASTS_URL = 'https://www.patreon.com/cw/signoradiocastellon?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAcGRvZgJleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA85MzY2MTk3NDMzOTI0NTkAAadB_hnN-Ct4RidKIAZiFKOLrvWajB6OklSGHKhUzvxBfqdozoBO7jD0vYBotQ_aem_Nr_YX0NYFph09juqTkj0Vg';

export default function RadioScreen() {
  const [activeSection, setActiveSection] = useState<RadioSection>('directo');

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.log('Error abriendo enlace de radio:', error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CASTELLÓN EN DIRECTO</Text>
        <Text style={styles.screenTitle}>Radio</Text>
        <Text style={styles.headerDescription}>
          Vive los partidos y la actualidad albinegra con Signo Radio.
        </Text>
      </View>

      <View style={styles.sectionTabs}>
        {(['directo', 'podcasts', 'otros'] as RadioSection[]).map((section) => {
          const isActive = activeSection === section;
          const label =
            section === 'directo'
              ? 'DIRECTO'
              : section === 'podcasts'
                ? 'PODCASTS'
                : 'OTROS';

          return (
            <Pressable
              key={section}
              style={[styles.sectionTab, isActive ? styles.sectionTabActive : null]}
              onPress={() => setActiveSection(section)}
            >
              <Text
                style={[
                  styles.sectionTabText,
                  isActive ? styles.sectionTabTextActive : null,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeSection === 'directo' ? (
        <>
          <View style={styles.heroCard}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>RADIO OFICIAL</Text>
            </View>

            <View style={styles.logoHeroWrap}>
              <Image source={SIGNO_LOGO} style={styles.logoHero} resizeMode="contain" />
            </View>

            <Text style={styles.heroTitle}>Signo Radio Castellón</Text>
            <Text style={styles.heroDescription}>
              Narración de los partidos del C.D. Castellón y programación dedicada
              a la actualidad orellut.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.listenButton,
                pressed ? styles.buttonPressed : null,
              ]}
              onPress={() => openUrl(SIGNO_LIVE_URL)}
            >
              <Text style={styles.listenIcon}>▶</Text>
              <Text style={styles.listenButtonText}>Escuchar en directo</Text>
            </Pressable>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>🎙</Text>
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>La voz de Castalia</Text>
              <Text style={styles.infoDescription}>
                Sigue las retransmisiones y la programación de Signo Radio desde
                cualquier lugar.
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.supportButton,
              pressed ? styles.buttonPressed : null,
            ]}
            onPress={() => openUrl(SIGNO_PATREON_URL)}
          >
            <View style={styles.supportTextWrap}>
              <Text style={styles.supportLabel}>APOYA EL PROYECTO</Text>
              <Text style={styles.supportTitle}>Colabora con Signo Radio</Text>
            </View>
            <Text style={styles.supportArrow}>›</Text>
          </Pressable>
        </>
      ) : null}

      {activeSection === 'podcasts' ? (
        <>
          <View style={styles.podcastCard}>
            <View style={styles.podcastTopRow}>
              <View style={styles.logoSmallWrap}>
                <Image source={SIGNO_LOGO} style={styles.logoSmall} resizeMode="contain" />
              </View>
              <View style={styles.podcastHeading}>
                <Text style={styles.sectionEyebrow}>RADIO OFICIAL</Text>
                <Text style={styles.sectionTitle}>Signo Albinegro</Text>
              </View>
            </View>

            <Text style={styles.sectionDescription}>
              Programas, análisis, entrevistas y retransmisiones dedicadas al C.D.
              Castellón. Accede a los contenidos publicados por Signo Radio.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.podcastButton,
                pressed ? styles.buttonPressed : null,
              ]}
              onPress={() => openUrl(SIGNO_PODCASTS_URL)}
            >
              <Text style={styles.podcastButtonIcon}>🎧</Text>
              <Text style={styles.podcastButtonText}>Escuchar podcasts</Text>
            </Pressable>
          </View>

          <View style={styles.collaborationCard}>
            <Text style={styles.collaborationLabel}>EN COLABORACIÓN CON</Text>
            <Image
              source={ALBINEGROS_LOGO}
              style={styles.albinegrosLogo}
              resizeMode="contain"
            />
          </View>
        </>
      ) : null}

      {activeSection === 'otros' ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>MÁS CONTENIDO ALBINEGRO</Text>
          <Text style={styles.sectionTitle}>Otros podcasts</Text>
          <Text style={styles.sectionDescription}>
            Aquí reuniremos otros programas y canales dedicados al C.D. Castellón.
            Añadiremos sus logos y accesos directos, manteniendo a Signo Radio como
            radio oficial de Albinegros Castellón.
          </Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>PRÓXIMAMENTE</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 36 },
  header: { marginBottom: 20 },
  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.35,
    marginBottom: 4,
  },
  screenTitle: { color: '#FFFFFF', fontSize: 31, fontWeight: '900' },
  headerDescription: {
    marginTop: 5,
    color: '#9A9A9A',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#282828',
    padding: 4,
    marginBottom: 16,
  },
  sectionTab: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  sectionTabActive: {
    backgroundColor: 'rgba(215, 178, 67, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(215, 178, 67, 0.45)',
  },
  sectionTabText: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sectionTabTextActive: { color: colors.accent },
  heroCard: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#282828',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    marginBottom: 14,
  },
  liveBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(215, 178, 67, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(215, 178, 67, 0.45)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: 7,
  },
  liveBadgeText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  logoHeroWrap: {
    width: 126,
    height: 126,
    borderRadius: 63,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    marginTop: 18,
    marginBottom: 18,
    overflow: 'hidden',
  },
  logoHero: { width: 116, height: 116 },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroDescription: {
    color: '#9A9A9A',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  listenButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenIcon: {
    color: '#101010',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 10,
  },
  listenButtonText: { color: '#101010', fontSize: 15, fontWeight: '900' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#282828',
    padding: 15,
    marginBottom: 14,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginRight: 13,
  },
  infoIconText: { fontSize: 21 },
  infoText: { flex: 1 },
  infoTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  infoDescription: {
    color: '#929292',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  supportButton: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#282828',
    paddingHorizontal: 17,
    paddingVertical: 14,
    marginBottom: 14,
  },
  supportTextWrap: { flex: 1, paddingRight: 10 },
  supportLabel: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  supportTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  supportArrow: { color: colors.accent, fontSize: 30, fontWeight: '300' },
  podcastCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#282828',
    padding: 20,
    marginBottom: 14,
  },
  podcastTopRow: { flexDirection: 'row', alignItems: 'center' },
  logoSmallWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    overflow: 'hidden',
    marginRight: 14,
  },
  logoSmall: { width: 66, height: 66 },
  podcastHeading: { flex: 1 },
  sectionCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#282828',
    padding: 20,
  },
  sectionEyebrow: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 7,
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  sectionDescription: {
    color: '#9A9A9A',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  podcastButton: {
    minHeight: 52,
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podcastButtonIcon: { fontSize: 16, marginRight: 9 },
  podcastButtonText: { color: '#101010', fontSize: 14, fontWeight: '900' },
  collaborationCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#282828',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    marginBottom: 14,
  },
  collaborationLabel: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  albinegrosLogo: {
    width: 96,
    height: 82,
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    marginTop: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(215, 178, 67, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(215, 178, 67, 0.35)',
  },
  comingSoonText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  buttonPressed: { opacity: 0.76, transform: [{ scale: 0.992 }] },
});
