import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GOLD = '#D9B35E';
const WHITE = '#F7F7F7';

/** Menú de juegos independiente. No modifica el juego de Chapas. */
export default function JuegosScreen() {
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#080808" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={23} color={WHITE} />
          <Text style={styles.backText}>VOLVER</Text>
        </TouchableOpacity>

        <View style={styles.heading}>
          <Image source={require('../../assets/images/escudo1.png')} resizeMode="contain" style={styles.crest} />
          <View style={styles.titleRow}>
            <Ionicons name="game-controller" color={GOLD} size={27} />
            <Text style={styles.title}>JUEGOS</Text>
            <Ionicons name="game-controller" color={GOLD} size={27} />
          </View>
          <View style={styles.subtitleRow}>
            <View style={styles.goldLine} />
            <Text style={styles.subtitle}>ELIGE TU JUEGO</Text>
            <View style={styles.goldLine} />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.gameCard}
          onPress={() => router.push('/chapas')}
          accessibilityRole="button"
          accessibilityLabel="Abrir Albinegros Chapas"
        >
          <View style={styles.chapaArt}>
            <View style={styles.pitchLine} />
            <View style={styles.pitchCircle} />
            <View style={styles.chapaRim}>
              <View style={styles.chapaInner}>
                <View style={styles.stripeBlack} />
                <View style={styles.stripeWhite} />
                <View style={styles.stripeBlack} />
                <View style={styles.stripeWhite} />
                <View style={styles.stripeBlack} />
              </View>
            </View>
          </View>
          <View style={styles.gameTextWrap}>
            <Text style={styles.gameTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>ALBINEGROS{'\n'}CHAPAS</Text>
            <Text style={styles.available}>DISPONIBLE</Text>
          </View>
          <Ionicons name="play" size={20} color={GOLD} />
        </TouchableOpacity>

        <View style={styles.comingCard}>
          <View style={styles.comingIcon}><Ionicons name="game-controller-outline" color="#888" size={30} /></View>
          <View style={styles.gameTextWrap}>
            <Text style={styles.comingTitle}>PRÓXIMAMENTE</Text>
            <Text style={styles.comingSubtitle}>MÁS JUEGOS ARCADE</Text>
          </View>
          <Ionicons name="lock-closed" color="#888" size={21} />
        </View>

        <View style={styles.decor}>
          <Ionicons name="football-outline" color="#555" size={17} />
          <View style={styles.decorLine} />
          <Text style={styles.decorText}>ALBINEGROS ARCADE</Text>
          <View style={styles.decorLine} />
          <Ionicons name="football-outline" color="#555" size={17} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080808' },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 15 },
  backText: { color: WHITE, fontSize: 12, fontWeight: '800', marginLeft: 4, letterSpacing: 1 },
  heading: { alignItems: 'center', marginTop: 8, marginBottom: 24 },
  crest: { width: 100, height: 120, marginBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  title: { color: WHITE, fontSize: 34, fontWeight: '900', letterSpacing: 2.5 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, width: '100%' },
  goldLine: { flex: 1, height: 2, backgroundColor: GOLD },
  subtitle: { color: WHITE, fontSize: 14, fontWeight: '900', letterSpacing: 1.4 },
  gameCard: { minHeight: 108, borderWidth: 2, borderColor: GOLD, borderRadius: 12, backgroundColor: '#111111', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 11, marginBottom: 14, elevation: 5, shadowColor: GOLD, shadowOpacity: 0.3, shadowRadius: 10 },
  chapaArt: { width: 76, height: 78, backgroundColor: '#12562F', borderRadius: 6, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  pitchLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#D4E6D8' },
  pitchCircle: { position: 'absolute', width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#D4E6D8' },
  chapaRim: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#BCC7CD', borderWidth: 4, borderColor: '#F3F5F5', justifyContent: 'center', alignItems: 'center' },
  chapaInner: { width: 47, height: 47, borderRadius: 24, overflow: 'hidden', flexDirection: 'row', borderWidth: 2, borderColor: '#666' },
  stripeBlack: { flex: 1, backgroundColor: '#111' },
  stripeWhite: { flex: 1, backgroundColor: '#F7F7F7' },
  gameTextWrap: { flex: 1, minWidth: 0 },
  gameTitle: { color: WHITE, fontSize: 17, fontWeight: '900', letterSpacing: 0.4, lineHeight: 22 },
  available: { color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginTop: 9 },
  comingCard: { minHeight: 86, borderWidth: 2, borderColor: '#656565', borderRadius: 12, backgroundColor: '#101010', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 14 },
  comingIcon: { width: 48, alignItems: 'center' },
  comingTitle: { color: '#B5B5B5', fontSize: 14, fontWeight: '900', letterSpacing: 0.4 },
  comingSubtitle: { color: '#777', fontSize: 10, marginTop: 8, fontWeight: '700', letterSpacing: 0.6 },
  decor: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 34, justifyContent: 'center' },
  decorLine: { height: 1, width: 26, backgroundColor: '#555' },
  decorText: { color: '#777', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
});
