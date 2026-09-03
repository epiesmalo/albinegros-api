import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { colors } from '../../theme/colors';

type RadioSection = 'directo' | 'podcasts' | 'otros';

const SIGNO_LOGO = require('../../assets/radio/signo-radio.png');
const ALBINEGROS_LOGO = require('../../assets/radio/albinegros-logo.png');
const LA_GRADA_LOGO = require('../../assets/radio/la-grada-albinegra.jpg');
const CONEXION_ORELLUT_LOGO = require('../../assets/radio/conexion-orellut.jpg');
const LA_TRIBUNA_LOGO = require('../../assets/radio/la-tribuna-castello.jpg');
const SIGNO_STREAM_URL = 'https://stream.zeno.fm/ckalyapuggxuv';
const SIGNO_PATREON_URL = 'https://www.patreon.com/cw/signoradiocastellon';
const SIGNO_PODCASTS_URL = 'https://www.patreon.com/cw/signoradiocastellon?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAcGRvZgJleHRuA2FlbQIxMQBzcnRjBmFwcF9pZA85MzY2MTk3NDMzOTI0NTkAAadB_hnN-Ct4RidKIAZiFKOLrvWajB6OklSGHKhUzvxBfqdozoBO7jD0vYBotQ_aem_Nr_YX0NYFph09juqTkj0Vg';
const LA_GRADA_URL = 'https://www.youtube.com/@TeveQuatre/videos';
const CONEXION_ORELLUT_URL = 'https://www.youtube.com/playlist?list=PLZkcFc2Lc6OjtYvC4ts5zsuy6jW-UoVWt';
const LA_TRIBUNA_URL = 'https://proximiatv.com/collection/YVbCiokZu69dpmjM8zng9w';

export default function RadioScreen() {
  const [activeSection, setActiveSection] = useState<RadioSection>('directo');

  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
const radioPlayer = useAudioPlayer(SIGNO_STREAM_URL);
useEffect(() => {
  setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
  }).catch((error) => {
    console.log('Error configurando audio en segundo plano:', error);
  });
}, []);



const toggleRadio = () => {
  if (isRadioPlaying) {
    radioPlayer.pause();
    radioPlayer.setActiveForLockScreen(false);
    setIsRadioPlaying(false);
    return;
  }

  radioPlayer.setActiveForLockScreen(true, {
    title: 'Signo Radio Castellón',
    artist: 'Radio oficial de Albinegros Castellón',
  });

  radioPlayer.play();
  setIsRadioPlaying(true);
};
const openUrl = async (url: string) => {
  try {
    await Linking.openURL(url);
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
              <Image
  source={SIGNO_LOGO}
  style={styles.logoHero}
  resizeMode="contain"
  fadeDuration={0}
/>
            </View>

            <Text style={styles.heroTitle}>Signo Radio Castellón</Text>
            <Text style={styles.heroDescription}>
               Narración de los partidos del C.D. Castellón, dirigido por los periodistas Víctor
  Serrano, Víctor Ulldemolins y Álvaro Font
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.listenButton,
                pressed ? styles.buttonPressed : null,
              ]}
              onPress={toggleRadio}
            >
              <Text style={styles.listenIcon}>
                {isRadioPlaying ? 'Ⅱ' : '▶'}
              </Text>
              <Text style={styles.listenButtonText}>
                {isRadioPlaying ? 'Pausar directo' : 'Escuchar en directo'}
              </Text>
            </Pressable>

            {isRadioPlaying ? (
              <Text style={styles.streamStatus}>● EMITIENDO EN LA APP</Text>
            ) : null}
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
  Castellón. Programa dirigido por los periodistas Víctor Serrano y Víctor
  Ulldemolins. Accede a los contenidos publicados por Signo Radio.
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
            <Text style={styles.collaborationLabel}>RADIO OFICIAL DE</Text>
            <Image
              source={ALBINEGROS_LOGO}
              style={styles.albinegrosLogo}
              resizeMode="contain"
            />
          </View>
        </>
      ) : null}

      {activeSection === 'otros' ? (
        <>
          <View style={styles.otherIntroCard}>
            <Text style={styles.sectionEyebrow}>MÁS CONTENIDO ALBINEGRO</Text>
            <Text style={styles.sectionTitle}>Otros programas</Text>
            <Text style={styles.sectionDescription}>
              Más espacios para seguir la actualidad del C.D. Castellón. Signo Radio
              mantiene el protagonismo como radio oficial de Albinegros Castellón.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.mediaCard,
              pressed ? styles.buttonPressed : null,
            ]}
            onPress={() => openUrl(LA_GRADA_URL)}
          >
            <Image
              source={LA_GRADA_LOGO}
              style={styles.mediaLogo}
              resizeMode="cover"
            />
            <View style={styles.mediaTextWrap}>
              <Text style={styles.mediaTitle}>LA GRADA ALBINEGRA</Text>
<Text style={styles.mediaMeta}>Dirigido por Toni Llaves</Text>
<Text style={styles.mediaMeta}>Televisión TeVe4 · Lunes a las 20:00 h</Text>
<Text style={styles.mediaDescription}>
  Programa dedicado a la actualidad del C.D. Castellón, con análisis,
  tertulia y toda la información albinegra.
</Text>
<Text style={styles.mediaAction}>VER PROGRAMAS →</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.mediaCard,
              pressed ? styles.buttonPressed : null,
            ]}
            onPress={() => openUrl(CONEXION_ORELLUT_URL)}
          >
            <Image
              source={CONEXION_ORELLUT_LOGO}
              style={styles.mediaLogo}
              resizeMode="cover"
            />
            <View style={styles.mediaTextWrap}>
              <Text style={styles.mediaTitle}>CONEXIÓN ORELLUT</Text>
              <Text style={styles.mediaMeta}>Dirigido por José Luis Gual</Text>
              <Text style={styles.mediaMeta}>
  El Periódico Mediterráneo · Martes y jueves 
              </Text>
              <Text style={styles.mediaDescription}>
                Dos programas semanales para analizar la actualidad del C.D. Castellón
  y todo lo que rodea al conjunto albinegro.
              </Text>
              <Text style={styles.mediaAction}>VER PODCASTS →</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.mediaCard,
              pressed ? styles.buttonPressed : null,
            ]}
            onPress={() => openUrl(LA_TRIBUNA_URL)}
          >
            <Image
              source={LA_TRIBUNA_LOGO}
              style={styles.mediaLogo}
              resizeMode="cover"
            />
            <View style={styles.mediaTextWrap}>
              <Text style={styles.mediaTitle}>LA TRIBUNA DE CASTELLÓ</Text>
              <Text style={styles.mediaMeta}>Dirigido por Alexis Cervera</Text>
              <Text style={styles.mediaMeta}>
  Televisión de Castellón · Lunes a las 21:00 h
</Text>
<Text style={styles.mediaDescription}>
  Programa de actualidad dedicado al C.D. Castellón, con análisis,
  opinión y seguimiento de la actualidad albinegra.
</Text>
              <Text style={styles.mediaAction}>VER PROGRAMAS →</Text>
            </View>
          </Pressable>
        </>
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
  streamStatus: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 12,
  },
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
  otherIntroCard: {
    backgroundColor: '#111111',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#282828',
    padding: 20,
    marginBottom: 14,
  },
  mediaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#282828',
    padding: 12,
    marginBottom: 12,
  },
  mediaLogo: {
    width: 92,
    height: 92,
    borderRadius: 16,
    backgroundColor: '#080808',
    marginRight: 14,
  },
  mediaTextWrap: {
    flex: 1,
  },
  mediaTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  mediaMeta: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  mediaDescription: {
    color: '#969696',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  mediaAction: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginTop: 8,
  },
  buttonPressed: { opacity: 0.76, transform: [{ scale: 0.992 }] },
});
