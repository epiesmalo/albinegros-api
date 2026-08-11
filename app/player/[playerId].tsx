import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';

type PlayerStat = {
  team: {
    id: number | null;
    name: string;
    shortName: string;
    logo: string;
    isCastellon: boolean;
  };
  league: {
    id: number | null;
    name: string;
    country: string;
    logo: string;
    season: string | number | null;
  };
  games: {
    appearances: number;
    lineups: number;
    minutes: number;
    number: number | null;
    position: string;
    rating: string | number | null;
    captain: boolean;
  };
  substitutes: { in: number; out: number; bench: number };
  shots: { total: number; on: number };
  goals: { total: number; conceded: number; assists: number; saves: number };
  passes: { total: number; key: number; accuracy: string | number | null };
  tackles: { total: number; blocks: number; interceptions: number };
  duels: { total: number; won: number };
  dribbles: { attempts: number; success: number; past: number };
  fouls: { drawn: number; committed: number };
  cards: { yellow: number; yellowRed: number; red: number };
  penalty: { won: number; committed: number; scored: number; missed: number; saved: number };
};

type PlayerDetails = {
  ok: boolean;
  profileSource: 'season' | 'squad';
  statisticsAvailable: boolean;
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number | null;
    birth: { date: string | null; place: string; country: string };
    nationality: string;
    height: string;
    weight: string;
    injured: boolean;
    photo: string;
    number: number | null;
    position: string;
  };
  team: {
    id: number | null;
    name: string;
    shortName: string;
    logo: string;
    isCastellon: boolean;
  } | null;
  season: string | null;
  preferredStatistics: PlayerStat | null;
  statistics: PlayerStat[];
};

type Section = 'profile' | 'stats';

const API_BASE = 'https://api.albinegroscastellon.com/api/football';

function PlayerSkeleton() {
  return (
    <View>
      <View style={styles.skeletonHero} />
      <View style={styles.skeletonTabs} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
    </View>
  );
}

export default function PlayerDetailScreen() {
  const params = useLocalSearchParams<{
    playerId?: string | string[];
    teamId?: string | string[];
  }>();

  const playerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;
  const teamId = Array.isArray(params.teamId) ? params.teamId[0] : params.teamId;

  const [data, setData] = useState<PlayerDetails | null>(null);
  const [section, setSection] = useState<Section>('profile');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPlayer = useCallback(async (isRefresh = false) => {
    if (!playerId) {
      setError('No se ha recibido el identificador del jugador.');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError('');

      const teamQuery = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
      const response = await fetch(
        `${API_BASE}/player/${encodeURIComponent(playerId)}/details${teamQuery}`
      );
      const json = await response.json();

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${response.status}`);
      }

      setData(json);
    } catch (err) {
      console.error('Error cargando jugador:', err);
      setError('No se pudo cargar la ficha del jugador.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [playerId, teamId]);

  useEffect(() => {
    loadPlayer();
  }, [loadPlayer]);

  const stats = data?.preferredStatistics || null;

  const birthText = useMemo(() => {
    if (!data?.player.birth.date) return '';
    const date = new Date(`${data.player.birth.date}T12:00:00`);
    if (Number.isNaN(date.getTime())) return data.player.birth.date;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [data]);

  const renderProfile = () => {
    if (!data) return null;

    return (
      <>
        {data.team ? (
          <Pressable
            disabled={!data.team.id}
            onPress={() => {
              if (!data.team?.id) return;
              router.push({
                pathname: '/team/[teamId]',
                params: { teamId: String(data.team.id) },
              });
            }}
            style={({ pressed }) => [
              styles.teamCard,
              pressed && data.team?.id && styles.pressed,
            ]}
          >
            <Image
              source={{ uri: data.team.logo }}
              style={styles.teamLogo}
              contentFit="contain"
              cachePolicy="disk"
            />
            <View style={styles.teamText}>
              <Text style={styles.miniLabel}>EQUIPO</Text>
              <Text style={[
                styles.teamName,
                data.team.isCastellon && styles.castellonText,
              ]}>
                {data.team.name}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D4AF37" />
          </Pressable>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>DATOS PERSONALES</Text>

          {[
            ['Nombre completo', [data.player.firstname, data.player.lastname].filter(Boolean).join(' ') || data.player.name],
            ['Edad', data.player.age ? `${data.player.age} años` : '-'],
            ['Nacimiento', birthText || '-'],
            ['Lugar', [data.player.birth.place, data.player.birth.country].filter(Boolean).join(', ') || '-'],
            ['Nacionalidad', data.player.nationality || '-'],
            ['Altura', data.player.height || '-'],
            ['Peso', data.player.weight || '-'],
          ].map(([label, value]) => (
            <View key={String(label)} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{String(value)}</Text>
            </View>
          ))}
        </View>

        {!data.statisticsAvailable ? (
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle-outline" size={25} color="#D4AF37" />
            <View style={styles.noticeText}>
              <Text style={styles.noticeTitle}>Estadísticas todavía no disponibles</Text>
              <Text style={styles.noticeBody}>
                La ficha del jugador ya está disponible. Los datos de la temporada aparecerán automáticamente cuando el proveedor los publique.
              </Text>
            </View>
          </View>
        ) : null}
      </>
    );
  };

  const renderStats = () => {
    if (!data) return null;

    if (!stats) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons name="stats-chart-outline" size={32} color="#D4AF37" />
          <Text style={styles.emptyTitle}>Sin estadísticas todavía</Text>
          <Text style={styles.emptyText}>
            Estamos al inicio de la temporada. Este apartado se completará automáticamente cuando haya datos.
          </Text>
        </View>
      );
    }

    const main = [
      ['PJ', stats.games.appearances],
      ['Tit.', stats.games.lineups],
      ['Min.', stats.games.minutes],
      ['Goles', stats.goals.total],
    ];

    return (
      <>
        <View style={styles.statsGrid}>
          {main.map(([label, value]) => (
            <View key={String(label)} style={styles.statBox}>
              <Text style={styles.statValue}>{String(value)}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>ATAQUE</Text>
          <StatRow label="Asistencias" value={stats.goals.assists} />
          <StatRow label="Tiros" value={stats.shots.total} />
          <StatRow label="Tiros a puerta" value={stats.shots.on} />
          <StatRow label="Pases" value={stats.passes.total} />
          <StatRow label="Pases clave" value={stats.passes.key} />
          <StatRow label="Precisión de pase" value={stats.passes.accuracy ?? '-'} />
          <StatRow label="Regates completados" value={stats.dribbles.success} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>TRABAJO DEFENSIVO</Text>
          <StatRow label="Entradas" value={stats.tackles.total} />
          <StatRow label="Intercepciones" value={stats.tackles.interceptions} />
          <StatRow label="Bloqueos" value={stats.tackles.blocks} />
          <StatRow label="Duelos ganados" value={`${stats.duels.won}/${stats.duels.total}`} />
          <StatRow label="Faltas cometidas" value={stats.fouls.committed} />
          <StatRow label="Faltas recibidas" value={stats.fouls.drawn} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>DISCIPLINA</Text>
          <StatRow label="Amarillas" value={stats.cards.yellow} />
          <StatRow label="Doble amarilla" value={stats.cards.yellowRed} />
          <StatRow label="Rojas" value={stats.cards.red} />
        </View>
      </>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: data?.player.name || 'Jugador',
          headerStyle: { backgroundColor: '#101010' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800' },
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPlayer(true)}
            tintColor="#D4AF37"
            colors={['#D4AF37']}
          />
        }
      >
        {loading && <PlayerSkeleton />}

        {!loading && error ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={32} color="#D4AF37" />
            <Text style={styles.emptyTitle}>No se pudo cargar el jugador</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : null}

        {!loading && data ? (
          <>
            <View style={styles.heroCard}>
              {data.player.photo ? (
                <Image
                  source={{ uri: data.player.photo }}
                  style={styles.playerPhoto}
                  contentFit="cover"
                  cachePolicy="disk"
                />
              ) : (
                <View style={styles.photoFallback}>
                  <Ionicons name="person" size={58} color="#777" />
                </View>
              )}

              <Text style={styles.playerName}>{data.player.name}</Text>

              <View style={styles.badges}>
                {data.player.number !== null ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>#{data.player.number}</Text>
                  </View>
                ) : null}

                {data.player.position ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{data.player.position}</Text>
                  </View>
                ) : null}
              </View>

              {data.player.injured ? (
                <View style={styles.injuryBadge}>
                  <Ionicons name="medical-outline" size={13} color="#E66A6A" />
                  <Text style={styles.injuryText}>Lesionado</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.tabs}>
              {[
                ['profile', 'Jugador'],
                ['stats', 'Estadísticas'],
              ].map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => setSection(key as Section)}
                  style={[styles.tab, section === key && styles.tabActive]}
                >
                  <Text style={[
                    styles.tabText,
                    section === key && styles.tabTextActive,
                  ]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {section === 'profile' && renderProfile()}
            {section === 'stats' && renderStats()}
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  content: { padding: 14, paddingBottom: 80 },
  heroCard: {
    alignItems: 'center',
    backgroundColor: '#101010',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#292929',
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  playerPhoto: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#191919',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.38)',
  },
  photoFallback: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 13,
  },
  badges: { flexDirection: 'row', gap: 7, marginTop: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
  },
  badgeText: { color: '#D4AF37', fontSize: 9, fontWeight: '900' },
  injuryBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  injuryText: { color: '#E66A6A', fontSize: 10, fontWeight: '800', marginLeft: 4 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#101010',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#242424',
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
  },
  tabText: { color: '#777', fontSize: 10, fontWeight: '800' },
  tabTextActive: { color: '#D4AF37' },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101010',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 12,
    marginBottom: 12,
  },
  teamLogo: { width: 48, height: 48, marginRight: 11 },
  teamText: { flex: 1 },
  miniLabel: { color: '#777', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  teamName: { color: '#EEE', fontSize: 13, fontWeight: '900', marginTop: 3 },
  castellonText: { color: '#D4AF37' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  infoCard: {
    backgroundColor: '#101010',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 9,
  },
  infoRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  infoLabel: { flex: 1, color: '#888', fontSize: 11, fontWeight: '700' },
  infoValue: { maxWidth: '55%', color: '#EEE', fontSize: 11, fontWeight: '800', textAlign: 'right' },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#10100E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
    padding: 14,
  },
  noticeText: { flex: 1, marginLeft: 10 },
  noticeTitle: { color: '#D4AF37', fontSize: 12, fontWeight: '900' },
  noticeBody: { color: '#888', fontSize: 10, lineHeight: 16, marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: 7, marginBottom: 12 },
  statBox: {
    flex: 1,
    minHeight: 74,
    backgroundColor: '#101010',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  statLabel: { color: '#D4AF37', fontSize: 8, fontWeight: '900', marginTop: 3 },
  emptyCard: {
    minHeight: 190,
    backgroundColor: '#101010',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: { color: '#FFF', fontSize: 15, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  emptyText: { color: '#888', fontSize: 11, lineHeight: 17, marginTop: 7, textAlign: 'center' },
  skeletonHero: { height: 230, backgroundColor: '#101010', borderRadius: 22, marginBottom: 12 },
  skeletonTabs: { height: 48, backgroundColor: '#101010', borderRadius: 16, marginBottom: 12 },
  skeletonCard: { height: 150, backgroundColor: '#101010', borderRadius: 18, marginBottom: 12 },
});
