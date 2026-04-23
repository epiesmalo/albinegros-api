import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { songs } from '../../data/mediaData';
import { colors } from '../../theme/colors';

export default function MediaScreen() {
  const soundRef = useRef<Audio.Sound | null>(null);

  const [currentSong, setCurrentSong] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);

  const loadSound = async (song: any, index: number) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(song.file, {
        shouldPlay: true,
      });

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 1);
          setIsPlaying(status.isPlaying);
        }
      });

      soundRef.current = sound;
      setCurrentSong(song);
      setCurrentIndex(index);
    } catch (error) {
      console.log('Error cargando audio:', error);
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    const status = await soundRef.current.getStatusAsync();

    if (status.isLoaded && status.isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
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

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Media</Text>

      <Text style={styles.sectionTitle}>Canciones del Castellón</Text>

      {songs.map((song, index) => (
        <Pressable
          key={song.id}
          style={styles.songCard}
          onPress={() => loadSound(song, index)}
        >
          <Text style={styles.songTitle}>{song.title}</Text>
          <Text style={styles.songSubtitle}>{song.subtitle}</Text>
        </Pressable>
      ))}

      {currentSong && (
        <View style={styles.player}>
          <Text style={styles.nowPlaying}>{currentSong.title}</Text>

          <Slider
            style={{ width: '100%', height: 40 }}
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
                {isPlaying ? '⏸' : '▶️'}
              </Text>
            </Pressable>

            <Pressable style={styles.controlButton} onPress={playNext}>
              <Text style={styles.controlText}>⏭</Text>
            </Pressable>
          </View>
        </View>
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
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  songCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  songSubtitle: {
    fontSize: 14,
    color: colors.subtitle,
  },
  player: {
    marginTop: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  nowPlaying: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  playButton: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    minWidth: 70,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: colors.subtitle,
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  controlButton: {
    padding: 10,
  },
  controlText: {
    fontSize: 22,
    color: colors.text,
  },
});