import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { songs } from "../../data/mediaData";
import { colors } from "../../theme/colors";

type MediaTab = "canciones" | "canticos";

type Chant = {
  id: string;
  title: string;
  subtitle: string;
  lyrics: string;
  file?: { uri: string };
  logo?: string;
};

const chants: Chant[] = [
  {
    id: "cantico-1",
    title: "HIMNO OFICIAL C.D.CASTELLÓN",
    subtitle: "CDCS",
    logo: "https://archivos.albinegroscastellon.com/cas.png",
    file: {
      uri: "https://archivos.albinegroscastellon.com/audio/canticos/himno.mp3",
    },
    lyrics: `En el escudo de tu historia
Club Deportivo Castellón;
una victoria, siempre campea,
temblando al viento de la emoción.

Y al desplegarse tus banderas
con sus colores bajo el sol;
a la memoria,
llega la gloria,
del viejo campo del Sequiol.

«Pam, Pam, Orellut!»
`,
  },
  {
    id: "cantico-2",
    title: "BAJO EL SOL",
    subtitle: "FONDO 1922",
    logo: "https://archivos.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://archivos.albinegroscastellon.com/audio/canticos/bajo-el-sol.mp3",
    },
    lyrics: `Bajo el sol se alzarán las banderas y las palmas volverán a sonar, en el Fondo solo un grito se oirá:

¡¡Adelante Força Magic Orellut!!

lololo lolololololo lololo lololo lololo lololo lololololololo

¡¡Adelante Força Magic Orellut!!

Castellón, Castellón, Castellón
`,
  },
  {
    id: "cantico-3",
    title: "NO PUEDES PERDER",
    subtitle: "FONDO 1922",
    logo: "https://archivos.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://archivos.albinegroscastellon.com/audio/canticos/Nopuedesperder.mp3",
    },
    lyrics: `ALE ALE ALE OH
ALE ALE ALE OH
NO PUEDES PERDER
VAMOS CAMPEÓN

ALE ALE ALE OH
ALE ALE ALE OH
NO PUEDES PERDER
VAMOS CAMPEÓN`,
  },
  {
    id: "cantico-4",
    title: "REMONTANDO EL VUELO",
    subtitle: "FONDO 1922",
    logo: "https://archivos.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://archivos.albinegroscastellon.com/audio/canticos/remontando.mp3",
    },
    lyrics: `Entre un te quiero y te quiero
Vamos remontando el vuelo
y no puedo arrepentirme de este amor.
Para mi ser Albinegro
es honor y privilegio y animarte los domingos mi Pasión
lololololololoo lolololololololo lololololololoo lololololololo`,
  },
  {
    id: "cantico-5",
    title: "CADA DOMINGO",
    subtitle: "FONDO 1922",
    logo: "https://archivos.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://archivos.albinegroscastellon.com/audio/canticos/cadadomingo.mp3",
    },
    lyrics: `Cada domingo vengo a ver al Campeón
porque ésta es mi locura, saco los trapos, el bombo y el corazón,
aquí no existe amargura, soy Albinegro porque tengo aguante,
no como el Colectivo que corre a todas partes.

Esto es el Frente y los 90 minutos no deja de animarte.

lo lo lo lo, lo lo lo lo, lo lo lo lo, lo lo lo lo,

lo lo lo lo, lo lo lo lo, lo lo lo lo, lo lo lo lo, lo lo lo lo…`,
  },
  {
    id: "cantico-6",
    title: "LOS AÑOS VAN PASANDO",
    subtitle: "FONDO 1922",
    logo: "https://archivos.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://archivos.albinegroscastellon.com/audio/canticos/vanpasando.mp3",
    },
    lyrics: `Los años van pasando,
y el Frente sigue igual,
honrando tus colores por toda la ciudad,
no importa lo que pase, no nos separarán,
Castellón yo te amo, contigo hasta el final.

Ale ale ale, Ale Ale Ale, Ale Ale Ale, Ale Ale Ale`,
  },
  {
    id: "cantico-7",
    title: "MOVERSE ALBINEGROS",
    subtitle: "FONDO 1922",
    logo: "https://archivos.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://archivos.albinegroscastellon.com/audio/canticos/moverse.mp3",
    },
    lyrics: `Moverse albinegros moverse,
moverse Albinegros joder,
que esta hinchada está loca,
loca por verte ascender.

Moverse albinegros moverse,
moverse Albinegros joder,
que esta hinchada está loca,
loca por verte ascender.`,
  },
  {
    id: "cantico-8",
    title: "¡¡MUCHACHOS!!",
    subtitle: "FONDO 1922",
    logo: "https://archivos.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://archivos.albinegroscastellon.com/audio/canticos/muchachos.mp3",
    },
    lyrics: `Muchachos, aquí estamos juntos otra vez,
enamorados del glorioso,
no lo puedes entender.

Muchachos, aquí estamos juntos otra vez,
enamorados del glorioso,
no lo puedes entender.`,
  },
  {
    id: "cantico-9",
    title: "MOVIENDO TUS BANDERAS",
    subtitle: "FONDO 1922",
    logo: "https://archivos.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://archivos.albinegroscastellon.com/audio/canticos/todoelestadiomoviendotusbanderas.mp3",
    },
    lyrics: `Todo el estadio,
moviendo sus banderas,

representando
a una ciudad entera.

Con este escudo,
con esta camiseta,

con este equipo,
la gloria nos espera.

Lololololo,
lololololololo...`,
  },
  {
    id: "cantico-10",
    title: "NOS VAN A VER VOLVER",
    subtitle: "FONDO 1922",
    logo: "https://archivos.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://archivos.albinegroscastellon.com/audio/canticos/nosvanavervolver.mp3",
    },
    lyrics: `Alé, alé...
Alé, alé...

Nunca te abandoné...

Nos fuimos a la B,
glorioso sigue en pie,
nos van a volver a ver.

Alé, alé...

Alé, alé...

Nunca te abandoné...

Nos fuimos a la B,
glorioso sigue en pie,
nos van a volver a ver.

Nos fuimos a la B,
glorioso sigue en pie,
nos van a volver a ver.`,
  },
];

export default function MediaScreen() {
  const soundRef = useRef<Audio.Sound | null>(null);

  const [selectedTab, setSelectedTab] = useState<MediaTab>("canciones");
  const [selectedChantId, setSelectedChantId] = useState<string | null>(null);

  const [currentSong, setCurrentSong] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const resetPlayerState = () => {
    setCurrentSong(null);
    setCurrentIndex(null);
    setIsPlaying(false);
    setPosition(0);
    setDuration(1);
  };

  const stopCurrentSound = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    resetPlayerState();
  };

  const changeTab = async (tab: MediaTab) => {
    setSelectedTab(tab);
    await stopCurrentSound();
  };

  const prepareRemoteAudioSource = (uri: string) => {
    const cleanUri = uri.trim();
    const separator = cleanUri.includes("?") ? "&" : "?";

    // Evita que Android/Expo reutilice una respuesta 404 antigua en caché.
    return { uri: `${cleanUri}${separator}v=2` };
  };

  const configureSound = (sound: Audio.Sound) => {
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.isLoaded) {
        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 1);
        setIsPlaying(status.isPlaying);
      }
    });
  };

  const loadSound = async (song: any, index: number) => {
    try {
      setLoadingAudio(true);
      setCurrentSong(song);
      setCurrentIndex(index);
      setPosition(0);
      setDuration(1);

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const source = song.file?.uri
        ? prepareRemoteAudioSource(song.file.uri)
        : song.file;

      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
      });

      configureSound(sound);
      soundRef.current = sound;
    } catch (error) {
      console.log("Error cargando audio:", error);
      resetPlayerState();
    } finally {
      setLoadingAudio(false);
    }
  };

  const loadChantSound = async (chant: Chant) => {
    if (!chant.file) return;

    try {
      setLoadingAudio(true);
      setCurrentSong({
        id: chant.id,
        title: chant.title,
      });
      setCurrentIndex(null);
      setPosition(0);
      setDuration(1);

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const source = prepareRemoteAudioSource(chant.file.uri);
      console.log("Reproduciendo cántico:", source.uri);

      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: true,
      });

      configureSound(sound);
      soundRef.current = sound;
    } catch (error) {
      console.log("Error cargando cántico:", error);
      resetPlayerState();
    } finally {
      setLoadingAudio(false);
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    const status = await soundRef.current.getStatusAsync();

    if (status.isLoaded && status.isPlaying) {
      await soundRef.current.pauseAsync();
    } else if (status.isLoaded) {
      await soundRef.current.playAsync();
    }
  };

  const handleChantPlayPress = async (chant: Chant) => {
    if (currentSong?.id === chant.id && soundRef.current) {
      await togglePlayPause();
      return;
    }

    await loadChantSound(chant);
  };

  const handleSongPress = async (song: any, index: number) => {
    if (currentSong?.id === song.id) {
      await stopCurrentSound();
      return;
    }

    await loadSound(song, index);
  };

  const onSeek = async (value: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(value);
    }
  };

  const playNext = () => {
    if (currentIndex === null) return;

    const nextIndex = currentIndex + 1;

    if (nextIndex < songs.length) {
      loadSound(songs[nextIndex], nextIndex);
    }
  };

  const playPrevious = () => {
    if (currentIndex === null) return;

    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      loadSound(songs[prevIndex], prevIndex);
    }
  };

  const toggleChant = (chantId: string) => {
    setSelectedChantId((current) => (current === chantId ? null : chantId));
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

useEffect(() => {
  Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  return () => {
    if (soundRef.current) {
      soundRef.current.unloadAsync();
    }
  };
}, []);

useFocusEffect(
  useCallback(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      resetPlayerState();
    };
  }, [])
);

return (
  <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SONIDO ALBINEGRO</Text>
        <Text style={styles.screenTitle}>Media</Text>
        <Text style={styles.headerDescription}>
          Canciones y cánticos para sentir Castalia.
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tabButton,
            selectedTab === "canciones" && styles.tabButtonActive,
          ]}
          onPress={() => changeTab("canciones")}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === "canciones" && styles.tabButtonTextActive,
            ]}
          >
            ♫ Canciones
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabButton,
            selectedTab === "canticos" && styles.tabButtonActive,
          ]}
          onPress={() => changeTab("canticos")}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === "canticos" && styles.tabButtonTextActive,
            ]}
          >
            ♬ Cánticos
          </Text>
        </Pressable>
      </View>

      {selectedTab === "canciones" && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>REPRODUCCIÓN</Text>
            <Text style={styles.sectionTitle}>Canciones del Castellón</Text>
          </View>

          {songs.map((song, index) => {
            const isCurrentSong = currentSong?.id === song.id;

            return (
              <View key={song.id} style={styles.songWrapper}>
                <Pressable
                  style={({ pressed }) => [
                    styles.songCard,
                    isCurrentSong && styles.songCardActive,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => handleSongPress(song, index)}
                >
                  <View
                    style={[
                      styles.songPlayIcon,
                      isCurrentSong && styles.songPlayIconActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.songPlayIconText,
                        isCurrentSong && styles.songPlayIconTextActive,
                      ]}
                    >
                      {isCurrentSong && isPlaying ? "Ⅱ" : "▶"}
                    </Text>
                  </View>

                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={2}>
                      {song.title}
                    </Text>
                    <Text style={styles.songSubtitle} numberOfLines={2}>
                      {song.subtitle}
                    </Text>
                  </View>

                  <Text style={styles.songChevron}>›</Text>
                </Pressable>

                {isCurrentSong && (
                  <View style={styles.integratedPlayer}>
                    <View style={styles.playerHeading}>
                      <View>
                        <Text style={styles.nowPlayingLabel}>
                          {loadingAudio ? "CARGANDO" : "SONANDO AHORA"}
                        </Text>
                        <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                          {currentSong.title}
                        </Text>
                      </View>

                      <View style={styles.playingIndicator}>
                        <View style={styles.playingBarSmall} />
                        <View style={styles.playingBarMedium} />
                        <View style={styles.playingBarLarge} />
                      </View>
                    </View>

                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={duration}
                      value={position}
                      onSlidingComplete={onSeek}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor="#D7D7D7"
                      thumbTintColor={colors.accent}
                    />

                    <View style={styles.timeRow}>
                      <Text style={styles.timeText}>{formatTime(position)}</Text>
                      <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>

                    <View style={styles.controlsRow}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.secondaryControl,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={playPrevious}
                      >
                        <Text style={styles.secondaryControlText}>⏮</Text>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.mainControl,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={togglePlayPause}
                      >
                        <Text style={styles.mainControlText}>
                          {loadingAudio ? "…" : isPlaying ? "Ⅱ" : "▶"}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [
                          styles.secondaryControl,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={playNext}
                      >
                        <Text style={styles.secondaryControlText}>⏭</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      {selectedTab === "canticos" && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>GRADA DE CASTALIA</Text>
            <Text style={styles.sectionTitle}>Cánticos de Castalia</Text>
            <Text style={styles.sectionDescription}>
              Letras para animar al CD Castellón desde la grada.
            </Text>
          </View>

          {chants.map((chant) => {
            const isOpen = selectedChantId === chant.id;
            const isCurrentChant = currentSong?.id === chant.id;

            return (
              <Pressable
                key={chant.id}
                style={({ pressed }) => [
                  styles.chantCard,
                  isOpen && styles.chantCardOpen,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => toggleChant(chant.id)}
              >
                <View style={styles.chantHeader}>
                  <View
                    style={[
                      styles.chantLogoContainer,
                      isOpen && styles.chantLogoContainerOpen,
                    ]}
                  >
                    {chant.logo ? (
                      <Image
                        source={{ uri: chant.logo }}
                        style={styles.chantLogo}
                      />
                    ) : (
                      <Text style={styles.chantFallbackIcon}>📣</Text>
                    )}
                  </View>

                  <View style={styles.chantInfo}>
                    <Text style={styles.chantTitle} numberOfLines={2}>
                      {chant.title}
                    </Text>
                    <Text style={styles.chantSubtitle}>
                      {chant.subtitle}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.chantToggle,
                      isOpen && styles.chantToggleOpen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chantToggleText,
                        isOpen && styles.chantToggleTextOpen,
                      ]}
                    >
                      {isOpen ? "⌃" : "⌄"}
                    </Text>
                  </View>
                </View>

                {isOpen && (
                  <View style={styles.chantBody}>
                    {chant.file && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.chantPlayButton,
                          isCurrentChant && styles.chantPlayButtonActive,
                          pressed && styles.buttonPressed,
                        ]}
                        onPress={(event: any) => {
                          event.stopPropagation?.();
                          handleChantPlayPress(chant);
                        }}
                      >
                        <Text
                          style={[
                            styles.chantPlayIcon,
                            isCurrentChant && styles.chantPlayTextActive,
                          ]}
                        >
                          {loadingAudio && isCurrentChant
                            ? "…"
                            : isCurrentChant && isPlaying
                              ? "Ⅱ"
                              : "▶"}
                        </Text>

                        <Text
                          style={[
                            styles.chantPlayText,
                            isCurrentChant && styles.chantPlayTextActive,
                          ]}
                        >
                          {loadingAudio && isCurrentChant
                            ? "Cargando cántico"
                            : isCurrentChant && isPlaying
                              ? "Pausar cántico"
                              : isCurrentChant
                                ? "Reanudar cántico"
                                : "Escuchar cántico"}
                        </Text>
                      </Pressable>
                    )}

                    {isCurrentChant && (
                      <View style={styles.chantProgressBox}>
                        <Slider
                          style={styles.slider}
                          minimumValue={0}
                          maximumValue={duration}
                          value={position}
                          onSlidingComplete={onSeek}
                          minimumTrackTintColor={colors.accent}
                          maximumTrackTintColor="#D7D7D7"
                          thumbTintColor={colors.accent}
                        />

                        <View style={styles.timeRow}>
                          <Text style={styles.timeText}>{formatTime(position)}</Text>
                          <Text style={styles.timeText}>{formatTime(duration)}</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.lyricsHeading}>
                      <Text style={styles.lyricsHeadingText}>LETRA</Text>
                      <View style={styles.lyricsHeadingLine} />
                    </View>

                    <View style={styles.lyricsBox}>
                      <Text style={styles.lyricsText}>{chant.lyrics}</Text>
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 36,
  },

  header: {
    marginBottom: 18,
  },

  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.35,
    marginBottom: 4,
  },

  screenTitle: {
    fontSize: 31,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  headerDescription: {
    marginTop: 5,
    color: "#9A9A9A",
    fontSize: 14,
    lineHeight: 20,
  },

  tabsContainer: {
    flexDirection: "row",
    padding: 4,
    marginBottom: 24,
    borderRadius: 18,
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#242424",
  },

  tabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  tabButtonActive: {
    backgroundColor: colors.accent,
  },

  tabButtonText: {
    color: "#9A9A9A",
    fontSize: 14,
    fontWeight: "900",
  },

  tabButtonTextActive: {
    color: "#101010",
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionLabel: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.15,
    marginBottom: 4,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 5,
    color: "#9A9A9A",
    fontSize: 14,
    lineHeight: 20,
  },

  songWrapper: {
    marginBottom: 11,
  },

  songCard: {
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#252525",
    flexDirection: "row",
    alignItems: "center",
  },

  songCardActive: {
    borderColor: colors.accent,
    backgroundColor: "#15130D",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },

  songPlayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    marginRight: 12,
  },

  songPlayIconActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  songPlayIconText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 1,
  },

  songPlayIconTextActive: {
    color: "#111111",
  },

  songInfo: {
    flex: 1,
  },

  songTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
  },

  songSubtitle: {
    marginTop: 3,
    color: "#9A9A9A",
    fontSize: 13,
    lineHeight: 17,
  },

  songChevron: {
    marginLeft: 8,
    color: colors.accent,
    fontSize: 26,
    fontWeight: "300",
  },

  integratedPlayer: {
    marginTop: -1,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 15,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: "#0D0D0D",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.accent,
  },

  playerHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  nowPlayingLabel: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.15,
    marginBottom: 3,
  },

  nowPlayingTitle: {
    maxWidth: 260,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  playingIndicator: {
    height: 22,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },

  playingBarSmall: {
    width: 3,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },

  playingBarMedium: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },

  playingBarLarge: {
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },

  slider: {
    width: "100%",
    height: 34,
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  timeText: {
    color: "#8A8A8A",
    fontSize: 11,
    fontWeight: "700",
  },

  controlsRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },

  secondaryControl: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#303030",
  },

  secondaryControlText: {
    color: "#FFFFFF",
    fontSize: 18,
  },

  mainControl: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },

  mainControlText: {
    color: "#111111",
    fontSize: 20,
    fontWeight: "900",
    marginLeft: 1,
  },

  chantCard: {
    marginBottom: 11,
    padding: 13,
    borderRadius: 18,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#252525",
  },

  chantCardOpen: {
    borderColor: colors.accent,
    backgroundColor: "#15130D",
  },

  chantHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  chantLogoContainer: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  chantLogoContainerOpen: {
    opacity: 1,
  },

  chantLogo: {
    width: 48,
    height: 48,
    resizeMode: "contain",
  },

  chantFallbackIcon: {
    fontSize: 20,
  },

  chantInfo: {
    flex: 1,
  },

  chantTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
  },

  chantSubtitle: {
    marginTop: 3,
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.45,
  },

  chantToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    marginLeft: 8,
  },

  chantToggleOpen: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  chantToggleText: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: "900",
    marginTop: -2,
  },

  chantToggleTextOpen: {
    color: "#111111",
  },

  chantBody: {
    marginTop: 13,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(215, 178, 67, 0.22)",
  },

  chantPlayButton: {
    minHeight: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A0A0A",
    borderWidth: 1,
    borderColor: colors.accent,
  },

  chantPlayButtonActive: {
    backgroundColor: colors.accent,
  },

  chantPlayIcon: {
    marginRight: 9,
    color: colors.accent,
    fontSize: 15,
    fontWeight: "900",
  },

  chantPlayText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "900",
  },

  chantPlayTextActive: {
    color: "#111111",
  },

  chantProgressBox: {
    marginTop: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#0A0A0A",
    borderWidth: 1,
    borderColor: "#262626",
  },

  lyricsHeading: {
    marginTop: 15,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  lyricsHeadingText: {
    marginRight: 9,
    color: colors.accent,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  lyricsHeadingLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(215, 178, 67, 0.22)",
  },

  lyricsBox: {
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#0A0A0A",
    borderWidth: 1,
    borderColor: "#262626",
  },

  lyricsText: {
    color: "#F2F2F2",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.994 }],
  },

  buttonPressed: {
    opacity: 0.72,
  },
});