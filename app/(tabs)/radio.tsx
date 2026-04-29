import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { colors } from '../../theme/colors';

export default function RadioScreen() {
  const openRadio = () => {
    Linking.openURL('https://zeno.fm/player/signo-radio-castellon');
  };

  const openPatreon = () => {
    Linking.openURL('https://www.patreon.com/cw/signoradiocastellon');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Radio en directo</Text>

      <Text style={styles.description}>
        Escucha los partidos del CD Castellón en directo con Signo Radio.
      </Text>

      <Pressable style={styles.button} onPress={openRadio}>
        <Text style={styles.buttonText}>🔊 Escuchar en directo</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={openPatreon}>
        <Text style={styles.secondaryText}>Apoyar en Patreon</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accent,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.accent,
    fontWeight: '600',
  },
});