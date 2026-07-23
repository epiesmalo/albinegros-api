import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

export default function RadioScreen() {
  const openRadio = async () => {
    await Linking.openURL('https://zeno.fm/player/signo-radio-castellon');
  };

  const openPatreon = async () => {
    await Linking.openURL('https://www.patreon.com/cw/signoradiocastellon');
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

      <View style={styles.heroCard}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>EN DIRECTO</Text>
        </View>

        <View style={styles.radioIconCircle}>
          <Text style={styles.radioIcon}>◉</Text>
          <View style={styles.waveOne} />
          <View style={styles.waveTwo} />
        </View>

        <Text style={styles.heroTitle}>Signo Radio Castellón</Text>
        <Text style={styles.heroDescription}>
          Narración de los partidos del C.D. Castellón y programación dedicada
          a la actualidad orellut.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.listenButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={openRadio}
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
            Abre la emisión en el reproductor oficial y sigue cada jornada desde
            cualquier lugar.
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.supportButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={openPatreon}
      >
        <View>
          <Text style={styles.supportLabel}>APOYA EL PROYECTO</Text>
          <Text style={styles.supportTitle}>Colabora con Signo Radio</Text>
        </View>

        <Text style={styles.supportArrow}>›</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 36,
  },

  header: {
    marginBottom: 20,
  },

  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.35,
    marginBottom: 4,
  },

  screenTitle: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
  },

  headerDescription: {
    marginTop: 5,
    color: '#9A9A9A',
    fontSize: 14,
    lineHeight: 20,
  },

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

  radioIconCircle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: colors.accent,
    marginTop: 18,
    marginBottom: 18,
  },

  radioIcon: {
    color: colors.accent,
    fontSize: 43,
    fontWeight: '900',
  },

  waveOne: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(215, 178, 67, 0.35)',
  },

  waveTwo: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(215, 178, 67, 0.18)',
  },

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

  listenButtonText: {
    color: '#101010',
    fontSize: 15,
    fontWeight: '900',
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

  infoIconText: {
    fontSize: 21,
  },

  infoText: {
    flex: 1,
  },

  infoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

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
  },

  supportLabel: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },

  supportTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  supportArrow: {
    color: colors.accent,
    fontSize: 30,
    fontWeight: '300',
  },

  buttonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.992 }],
  },
});