import { useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
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
    logo: "https://www.albinegroscastellon.com/castellon.png",
    file: {
      uri: "https://www.albinegroscastellon.com/audio/canticos/himno.mp3",
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
    logo: "https://www.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://www.albinegroscastellon.com/audio/canticos/bajo-el-sol.mp3",
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
    logo: "https://www.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://www.albinegroscastellon.com/audio/canticos/Nopuedesperder.mp3",
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
    logo: "https://www.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://www.albinegroscastellon.com/audio/canticos/remontando.mp3",
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
    logo: "https://www.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://www.albinegroscastellon.com/audio/canticos/cadadomingo.mp3",
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
    logo: "https://www.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://www.albinegroscastellon.com/audio/canticos/vanpasando.mp3",
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
    logo: "https://www.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://www.albinegroscastellon.com/audio/canticos/moverse.mp3",
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
    logo: "https://www.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://www.albinegroscastellon.com/audio/canticos/muchachos.mp3",
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
    logo: "https://www.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://www.albinegroscastellon.com/audio/canticos/todoelestadiomoviendotusbanderas.mp3",
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
    logo: "https://www.albinegroscastellon.com/images/Fondo1922.png",
    file: {
      uri: "https://www.albinegroscastellon.com/audio/canticos/nosvanavervolver.mp3",
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Media</Text>

      <View style={styles.tabsRow}>
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
            🎵 Canciones
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
            📣 Cánticos
          </Text>
        </Pressable>
      </View>

      {selectedTab === "canciones" && (
        <>
          <Text style={styles.sectionTitle}>Canciones del Castellón</Text>

          {songs.map((song, index) => {
            const isCurrentSong = currentSong?.id === song.id;

            return (
              <View key={song.id}>
                <Pressable
                  style={[
                    styles.songCard,
                    isCurrentSong && styles.songCardActive,
                  ]}
                  onPress={() => loadSound(song, index)}
                >
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songSubtitle}>{song.subtitle}</Text>
                </Pressable>

                {isCurrentSong && (
                  <View style={styles.player}>
                    <Text style={styles.nowPlaying}>
                      {loadingAudio
                        ? `Cargando ${currentSong.title}...`
                        : currentSong.title}
                    </Text>

                    <Slider
                      style={{ width: "100%", height: 40 }}
                      minimumValue={0}
                      maximumValue={duration}
                      value={position}
                      onSlidingComplete={onSeek}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor="#ccc"
                    />

                    <View style={styles.timeRow}>
                      <Text style={styles.timeText}>{formatTime(position)}</Text>
                      <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>

                    <View style={styles.controlsRow}>
                      <Pressable style={styles.controlButton} onPress={playPrevious}>
                        <Text style={styles.controlText}>⏮</Text>
                      </Pressable>

                      <Pressable style={styles.playButton} onPress={togglePlayPause}>
                        <Text style={styles.playButtonText}>
                          {loadingAudio ? "Cargando..." : isPlaying ? "⏸" : "▶️"}
                        </Text>
                      </Pressable>

                      <Pressable style={styles.controlButton} onPress={playNext}>
                        <Text style={styles.controlText}>⏭</Text>
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
          <Text style={styles.sectionTitle}>Cánticos de Castalia</Text>

          <Text style={styles.sectionDescription}>
            Letras para animar al CD Castellón desde la grada.
          </Text>

          {chants.map((chant) => {
            const isOpen = selectedChantId === chant.id;
            const isCurrentChant = currentSong?.id === chant.id;

            return (
              <Pressable
                key={chant.id}
                style={[styles.chantCard, isOpen && styles.chantCardActive]}
                onPress={() => toggleChant(chant.id)}
              >
                <View style={styles.chantHeader}>
                  <View style={styles.chantInfo}>
                    <View style={styles.titleRow}>
                      {chant.logo && (
                        <Image
                          source={{ uri: chant.logo }}
                          style={styles.chantLogo}
                        />
                      )}

                      <Text style={styles.chantTitle}>{chant.title}</Text>
                    </View>

                    <Text style={styles.chantSubtitle}>{chant.subtitle}</Text>
                  </View>

                  <Text style={styles.chantArrow}>
                    {isOpen ? "▲" : "▼"}
                  </Text>
                </View>

                {isOpen && (
                  <>
                    {chant.file && (
                      <Pressable
                        style={styles.playChantButton}
                        onPress={(event: any) => {
                          event.stopPropagation?.();
                          handleChantPlayPress(chant);
                        }}
                      >
                        <Text style={styles.playChantButtonText}>
                          {loadingAudio && isCurrentChant
                            ? "Cargando..."
                            : isCurrentChant && isPlaying
                              ? "⏸ Pausar cántico"
                              : isCurrentChant
                                ? "▶️ Reanudar cántico"
                                : "▶️ Escuchar cántico"}
                        </Text>
                      </Pressable>
                    )}

                    {isCurrentChant && (
                      <View style={styles.chantPlayerBox}>
                        <Slider
                          style={{ width: "100%", height: 36 }}
                          minimumValue={0}
                          maximumValue={duration}
                          value={position}
                          onSlidingComplete={onSeek}
                          minimumTrackTintColor={colors.accent}
                          maximumTrackTintColor="#ccc"
                        />

                        <View style={styles.timeRow}>
                          <Text style={styles.timeText}>{formatTime(position)}</Text>
                          <Text style={styles.timeText}>{formatTime(duration)}</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.lyricsBox}>
                      <Text style={styles.lyricsText}>{chant.lyrics}</Text>
                    </View>
                  </>
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
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 18,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  tabButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabButtonText: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 14,
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: 14,
    lineHeight: 20,
  },
  songCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  songCardActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  songSubtitle: {
    fontSize: 14,
    color: colors.subtitle,
  },
  player: {
    marginTop: -4,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  nowPlaying: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 10,
  },
  playButton: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    minWidth: 70,
  },
  playButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 20,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    color: colors.subtitle,
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  controlButton: {
    padding: 10,
  },
  controlText: {
    fontSize: 22,
    color: colors.text,
  },
  chantCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chantCardActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  chantHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  chantIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  chantIcon: {
    fontSize: 20,
  },
  chantInfo: {
    flex: 1,
  },
  chantTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },
  chantSubtitle: {
    fontSize: 13,
    color: colors.subtitle,
    marginTop: 2,
  },
  chantArrow: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "900",
  },
  playChantButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  playChantButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  chantPlayerBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lyricsBox: {
    marginTop: 10,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lyricsText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "700",
  },
titleRow: {
  flexDirection: "row",
  alignItems: "center",
},

chantLogo: {
  width: 24,
  height: 24,
  marginRight: 8,
  resizeMode: "contain",
},
});
