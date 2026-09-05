import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const translatePosition = (position?: string | null) => {
  switch (position) {
    case 'Goalkeeper':
      return 'Portero';
    case 'Defender':
      return 'Defensa';
    case 'Midfielder':
      return 'Centrocampista';
    case 'Attacker':
      return 'Delantero';
    default:
      return position || '';
  }
};

type SquadPlayer = {
  id: number | string | null;
  name: string;
  age: number | null;
  number: number | null;
  position: string;
  photo: string;
};

type Coach = {
  id: number | null;
  name: string;
  firstname: string;
  lastname: string;
  age: number | null;
  nationality: string;
  photo: string;
};

type TeamDetails = {
  ok: boolean;
  updatedAt: string;
  team: {
    id: number;
    name: string;
    shortName: string;
    code: string;
    country: string;
    founded: number | null;
    national: boolean;
    logo: string;
    isCastellon: boolean;
  };
  venue: {
    id: number | null;
    name: string;
    address: string;
    city: string;
    capacity: number | null;
    surface: string;
    image: string;
  };
  coach: Coach | null;
  squad: SquadPlayer[];
  season: {
    leagueId: number | null;
    season: string | null;
    form: string;
    fixtures: {
      played: { home: number; away: number; total: number };
      wins: { home: number; away: number; total: number };
      draws: { home: number; away: number; total: number };
      loses: { home: number; away: number; total: number };
    };
    goals: {
      for: {
        total: { home: number; away: number; total: number };
        average: { home: string | number | null; away: string | number | null; total: string | number | null };
      };
      against: {
        total: { home: number; away: number; total: number };
        average: { home: string | number | null; away: string | number | null; total: string | number | null };
      };
    };
    cleanSheet: { home: number; away: number; total: number };
    failedToScore: { home: number; away: number; total: number };
    lineups: { formation: string; played: number }[];
  };
};

type Section = 'club' | 'squad' | 'stats';

const API_BASE = 'https://api.albinegroscastellon.com/api/football';

const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: 'PORTEROS',
  Defender: 'DEFENSAS',
  Midfielder: 'CENTROCAMPISTAS',
  Attacker: 'DELANTEROS',
};

function TeamSkeleton() {
  return (
    <View>
      <View style={styles.skeletonHero} />
      <View style={styles.skeletonTabs} />
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.skeletonRow} />
      ))}
    </View>
  );
}

export default function TeamDetailScreen() {
  const params = useLocalSearchParams<{ teamId?: string | string[] }>();
  const teamId = Array.isArray(params.teamId) ? params.teamId[0] : params.teamId;

  const [data, setData] = useState<TeamDetails | null>(null);
  const [section, setSection] = useState<Section>('club');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadTeam = useCallback(async (isRefresh = false) => {
    if (!teamId) {
      setError('No se ha recibido el identificador del equipo.');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError('');

      const response = await fetch(
        `${API_BASE}/team/${encodeURIComponent(teamId)}/details`
      );

      const json = await response.json();

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${response.status}`);
      }

      setData(json);
    } catch (err) {
      console.error('Error cargando equipo:', err);
      setError('No se pudo cargar la ficha del equipo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const groupedSquad = useMemo(() => {
    if (!data) return [];

    const groups = POSITION_ORDER.map((position) => ({
      position,
      players: data.squad
        .filter((player) => player.position === position)
        .sort((a, b) => {
          const numberA = a.number ?? 999;
          const numberB = b.number ?? 999;
          return numberA - numberB || a.name.localeCompare(b.name);
        }),
    })).filter((group) => group.players.length > 0);

    const known = new Set(POSITION_ORDER);
    const others = data.squad.filter((player) => !known.has(player.position));

    if (others.length) {
      groups.push({
        position: 'Other',
        players: others.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }

    return groups;
  }, [data]);

  const renderClub = () => {
    if (!data) return null;

    return (
      <>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>INFORMACIÓN DEL CLUB</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>País</Text>
            <Text style={styles.infoValue}>{data.team.country || '-'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fundación</Text>
            <Text style={styles.infoValue}>{data.team.founded ?? '-'}</Text>
          </View>

          {data.team.code ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Código</Text>
              <Text style={styles.infoValue}>{data.team.code}</Text>
            </View>
          ) : null}
        </View>

        {data.coach ? (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>ENTRENADOR</Text>

            <View style={styles.coachBlock}>
              {data.coach.photo ? (
                <Image
                  source={{ uri: data.coach.photo }}
                  style={styles.coachPhoto}
                  contentFit="cover"
                  cachePolicy="disk"
                />
              ) : (
                <View style={styles.coachFallback}>
                  <Ionicons name="person-outline" size={28} color="#D4AF37" />
                </View>
              )}

              <View style={styles.coachText}>
                <Text style={styles.coachName}>{data.coach.name}</Text>
                <Text style={styles.coachMeta}>
                  {[data.coach.nationality, data.coach.age ? `${data.coach.age} años` : '']
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>ESTADIO</Text>

          {data.venue.image ? (
            <Image
              source={{ uri: data.venue.image }}
              style={styles.venueImage}
              contentFit="cover"
              cachePolicy="disk"
            />
          ) : null}

          <Text style={styles.venueName}>{data.venue.name || 'Estadio no disponible'}</Text>

          <Text style={styles.venueMeta}>
            {[data.venue.city, data.venue.address].filter(Boolean).join(' · ')}
          </Text>

          <View style={styles.venueStats}>
            <View style={styles.venueStat}>
              <Text style={styles.venueStatValue}>
                {data.venue.capacity ? data.venue.capacity.toLocaleString('es-ES') : '-'}
              </Text>
              <Text style={styles.venueStatLabel}>Capacidad</Text>
            </View>

            <View style={styles.venueDivider} />

            <View style={styles.venueStat}>
              <Text style={styles.venueStatValue}>{data.venue.surface || '-'}</Text>
              <Text style={styles.venueStatLabel}>Superficie</Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  const renderSquad = () => {
    if (!data) return null;

    if (!data.squad.length) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={30} color="#D4AF37" />
          <Text style={styles.emptyTitle}>Plantilla no disponible</Text>
          <Text style={styles.emptyText}>
            Aparecerá aquí cuando el proveedor publique la plantilla.
          </Text>
        </View>
      );
    }

    return (
      <View>
        {groupedSquad.map((group) => (
          <View key={group.position} style={styles.squadGroup}>
            <Text style={styles.groupTitle}>
              {POSITION_LABELS[group.position] || 'OTROS'}
            </Text>

            {group.players.map((player) => (
              <Pressable
                key={String(player.id)}
                disabled={!player.id}
                onPress={() => {
                  if (!player.id || !data.team.id) return;

                  router.push({
                    pathname: '/player/[playerId]',
                    params: {
                      playerId: String(player.id),
                      teamId: String(data.team.id),
                    },
                  });
                }}
                style={({ pressed }) => [
                  styles.playerCard,
                  pressed && player.id && styles.playerCardPressed,
                ]}
              >
                {player.photo ? (
                  <Image
                    source={{ uri: player.photo }}
                    style={styles.playerPhoto}
                    contentFit="cover"
                    cachePolicy="disk"
                  />
                ) : (
                  <View style={styles.playerPhotoFallback}>
                    <Ionicons name="person" size={21} color="#777" />
                  </View>
                )}

                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerMeta}>
                    {[translatePosition(player.position), player.age ? `${player.age} años` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>

                <View style={styles.numberBox}>
                  <Text style={styles.playerNumber}>{player.number ?? '-'}</Text>
                </View>

                {player.id ? (
                  <Ionicons
                    name="chevron-forward"
                    size={15}
                    color="#D4AF37"
                    style={styles.playerChevron}
                  />
                ) : null}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderStats = () => {
    if (!data) return null;

    const stats = data.season;

    return (
      <>
        <View style={styles.statsGrid}>
          {[
            ['PJ', stats.fixtures.played.total],
            ['G', stats.fixtures.wins.total],
            ['E', stats.fixtures.draws.total],
            ['P', stats.fixtures.loses.total],
          ].map(([label, value]) => (
            <View key={String(label)} style={styles.statBox}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>GOLES</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>A favor</Text>
            <Text style={styles.infoValue}>{stats.goals.for.total.total}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>En contra</Text>
            <Text style={styles.infoValue}>{stats.goals.against.total.total}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Porterías a cero</Text>
            <Text style={styles.infoValue}>{stats.cleanSheet.total}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Partidos sin marcar</Text>
            <Text style={styles.infoValue}>{stats.failedToScore.total}</Text>
          </View>
        </View>

     {stats.form ? (
  <>
    <Text style={styles.cardTitle}>FORMA RECIENTE</Text>

    <View style={styles.formRow}>
      {stats.form.slice(-5).split('').map((result, index) => {
        const translated =
          result === 'W'
            ? 'V'
            : result === 'D'
              ? 'E'
              : result === 'L'
                ? 'D'
                : result;

        const resultStyle =
          result === 'W'
            ? styles.formWin
            : result === 'D'
              ? styles.formDraw
              : styles.formLoss;

        return (
          <View
            key={`${result}-${index}`}
            style={[styles.formBadge, resultStyle]}
          >
            <Text style={styles.formBadgeText}>{translated}</Text>
          </View>
        );
      })}
    </View>
  </>
) : null}
        {stats.lineups.length > 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>FORMACIONES UTILIZADAS</Text>

            {stats.lineups
              .sort((a, b) => b.played - a.played)
              .map((lineup, index) => (
                <View key={`${lineup.formation}-${index}`} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{lineup.formation || '-'}</Text>
                  <Text style={styles.infoValue}>{lineup.played} partidos</Text>
                </View>
              ))}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: data?.team.shortName || 'Equipo',
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
            onRefresh={() => loadTeam(true)}
            tintColor="#D4AF37"
            colors={['#D4AF37']}
          />
        }
      >
        {loading && <TeamSkeleton />}

        {!loading && error ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={32} color="#D4AF37" />
            <Text style={styles.emptyTitle}>No se pudo cargar el equipo</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : null}

        {!loading && data ? (
          <>
            <View style={[
              styles.heroCard,
              data.team.isCastellon && styles.castellonHero,
            ]}>
              <Image
                source={{ uri: data.team.logo }}
                style={styles.teamLogo}
                contentFit="contain"
                cachePolicy="disk"
              />

              <Text style={[
                styles.teamName,
                data.team.isCastellon && styles.castellonText,
              ]}>
                {data.team.name}
              </Text>

              <Text style={styles.teamCountry}>
                {[data.team.country, data.team.founded ? `Fundado en ${data.team.founded}` : '']
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>

            <View style={styles.tabs}>
              {[
                ['club', 'Equipo'],
                ['squad', 'Plantilla'],
                ['stats', 'Estadísticas'],
              ].map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => setSection(key as Section)}
                  style={[
                    styles.tab,
                    section === key && styles.tabActive,
                  ]}
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

            {section === 'club' && renderClub()}
            {section === 'squad' && renderSquad()}
            {section === 'stats' && renderStats()}
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    padding: 14,
    paddingBottom: 80,
  },
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
  castellonHero: {
    borderColor: 'rgba(212,175,55,0.55)',
    backgroundColor: '#15130E',
  },
  teamLogo: {
    width: 105,
    height: 105,
  },
  teamName: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
  },
  castellonText: {
    color: '#D4AF37',
  },
  teamCountry: {
    color: '#8A8A8A',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#101010',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#242424',
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
  },
  tabText: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#D4AF37',
  },
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
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  infoLabel: {
    flex: 1,
    color: '#888888',
    fontSize: 11,
    fontWeight: '700',
  },
  infoValue: {
    color: '#EEEEEE',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  coachBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachPhoto: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginRight: 12,
  },
  coachFallback: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coachText: {
    flex: 1,
  },
  coachName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  coachMeta: {
    color: '#888888',
    fontSize: 10,
    marginTop: 4,
  },
  venueImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: '#171717',
    marginBottom: 12,
  },
  venueName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  venueMeta: {
    color: '#888888',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  venueStats: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  venueStat: {
    flex: 1,
    alignItems: 'center',
  },
  venueStatValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  venueStatLabel: {
    color: '#777777',
    fontSize: 9,
    marginTop: 3,
  },
  venueDivider: {
    width: 1,
    backgroundColor: '#292929',
  },
  squadGroup: {
    marginBottom: 16,
  },
  groupTitle: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 7,
    marginLeft: 3,
  },
  playerCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101010',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#242424',
    paddingHorizontal: 9,
    marginBottom: 7,
  },
  playerCardPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  playerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#191919',
    marginRight: 10,
  },
  playerPhotoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#EEEEEE',
    fontSize: 12,
    fontWeight: '800',
  },
  playerMeta: {
    color: '#777777',
    fontSize: 9,
    marginTop: 3,
  },
  numberBox: {
    minWidth: 33,
    height: 33,
    borderRadius: 10,
    backgroundColor: 'rgba(212,175,55,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNumber: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '900',
  },
  playerChevron: {
    marginLeft: 7,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 12,
  },
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
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 3,
  },
  formText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 4,
  },
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
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyText: {
    color: '#888888',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
    textAlign: 'center',
  },
  skeletonHero: {
    height: 210,
    backgroundColor: '#101010',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#242424',
    marginBottom: 12,
  },
  skeletonTabs: {
    height: 48,
    backgroundColor: '#101010',
    borderRadius: 16,
    marginBottom: 12,
  },
  skeletonRow: {
    height: 74,
    backgroundColor: '#101010',
    borderRadius: 15,
    marginBottom: 8,
  },

formRow: {
  flexDirection: 'row',
  gap: 8,
  marginTop: 10,
  marginBottom: 18,
},

formBadge: {
  width: 34,
  height: 34,
  borderRadius: 6,
  alignItems: 'center',
  justifyContent: 'center',
},

formWin: {
  backgroundColor: '#22C55E',
},

formDraw: {
  backgroundColor: '#EAB308',
},

formLoss: {
  backgroundColor: '#EF4444',
},

formBadgeText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '900',
},
});
