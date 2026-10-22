import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Team = {
  id: number | null;
  name: string;
  shortName: string;
  logo: string;
  winner: boolean | null;
  isCastellon: boolean;
};

type MatchEvent = {
  time: { elapsed: number | null; extra: number | null };
  team: { id: number | null; name: string; logo: string };
  player: { id: number | null; name: string };
  assist: { id: number | null; name: string };
  type: string;
  detail: string;
  comments: string;
};

type LineupPlayer = {
  id: number | null;
  name: string;
  number: number | null;
  position: string;
  grid: string;
};

type Lineup = {
  team: { id: number | null; name: string; logo: string };
  coach: { id: number | null; name: string; photo: string };
  formation: string;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
};

type TeamStatistics = {
  team: { id: number | null; name: string; logo: string };
  statistics: { type: string; value: string | number | null }[];
};

type MatchDetail = {
  updatedAt: string;
  fixture: {
    id: number;
    date: string | null;
    timestamp: number | null;
    referee: string;
    timezone: string;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
      extra: number | null;
    };
    venue: { id: number | null; name: string; city: string };
  };
  league: { id: number | null; name: string; round: string; logo: string };
  home: Team;
  away: Team;
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
  events: MatchEvent[];
  lineups: Lineup[];
  statistics: TeamStatistics[];
};

type MatchComment = {
  id: number;
  fixture_id: number;
  nickname: string;
  message: string;
  created_at: string;
  is_reported: boolean;
};

type Section = 'summary' | 'stats' | 'lineups' | 'comments';

const API_BASE = 'https://api.albinegroscastellon.com/api/football';

function getTeamLogoUrl(teamName: string, originalLogo: string) {
  const normalizedName = teamName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (normalizedName.includes('andorra')) {
    return 'https://archivos.albinegroscastellon.com/images/8157.png';
  }

  if (normalizedName.includes('eldense')) {
    return 'https://archivos.albinegroscastellon.com/images/9692.png';
  }

  if (normalizedName.includes('ceuta')) {
    return 'https://archivos.albinegroscastellon.com/images/10139.png';
  }

  return originalLogo;
}

const STAT_LABELS: Record<string, string> = {
  'Ball Possession': 'Posesión',
  'Total Shots': 'Tiros',
  'Shots on Goal': 'Tiros a puerta',
  'Shots off Goal': 'Tiros fuera',
  'Blocked Shots': 'Tiros bloqueados',
  'Corner Kicks': 'Córners',
  'Offsides': 'Fueras de juego',
  'Fouls': 'Faltas',
  'Yellow Cards': 'Tarjetas amarillas',
  'Red Cards': 'Tarjetas rojas',
  'Goalkeeper Saves': 'Paradas',
  'Total passes': 'Pases',
  'Passes accurate': 'Pases acertados',
  'Passes %': 'Precisión de pase',
};

function DetailSkeleton() {
  return (
    <View>
      <View style={styles.skeletonScoreCard} />
      <View style={styles.skeletonTabs} />
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.skeletonRow} />
      ))}
    </View>
  );
}

export default function MatchDetailScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{ fixtureId?: string | string[] }>();
  const fixtureId = Array.isArray(params.fixtureId)
    ? params.fixtureId[0]
    : params.fixtureId;

  const [data, setData] = useState<MatchDetail | null>(null);
  const [section, setSection] = useState<Section>('summary');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [comments, setComments] = useState<MatchComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [deviceId, setDeviceId] = useState('');

  const loadDetails = useCallback(async (isRefresh = false) => {
    if (!fixtureId) {
      setError('No se ha recibido el identificador del partido.');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError('');

      const response = await fetch(
        `${API_BASE}/fixture/${encodeURIComponent(fixtureId)}/details`
      );

      const json = await response.json();

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${response.status}`);
      }

      setData(json);
    } catch (err) {
      console.error('Error cargando detalle:', err);
      setError('No se pudo cargar la información del partido.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fixtureId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const loadCommentIdentity = useCallback(async () => {
    try {
      const storedNickname = await AsyncStorage.getItem('match_chat_nickname');
      let storedDeviceId = await AsyncStorage.getItem('match_chat_device_id');

      if (!storedDeviceId) {
        storedDeviceId =
          `device-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

        await AsyncStorage.setItem(
          'match_chat_device_id',
          storedDeviceId
        );
      }

      setDeviceId(storedDeviceId);

      if (storedNickname) {
        setNickname(storedNickname);
        setNicknameDraft(storedNickname);
      }
    } catch (identityError) {
      console.error('Error cargando identidad del chat:', identityError);
    }
  }, []);

  const loadComments = useCallback(
    async (showLoader = false) => {
      if (!fixtureId) return;

      try {
        if (showLoader) setCommentsLoading(true);
        setCommentsError('');

        const response = await fetch(
          `${API_BASE}/fixture/${encodeURIComponent(fixtureId)}/comments`
        );

        const json = await response.json();

        if (!response.ok || !json?.ok) {
          throw new Error(json?.error || `HTTP ${response.status}`);
        }

        setComments(Array.isArray(json.comments) ? json.comments : []);
      } catch (commentsLoadError) {
        console.error('Error cargando comentarios:', commentsLoadError);

        if (showLoader) {
          setCommentsError('No se pudieron cargar los comentarios.');
        }
      } finally {
        if (showLoader) setCommentsLoading(false);
      }
    },
    [fixtureId]
  );

  useEffect(() => {
    loadCommentIdentity();
  }, [loadCommentIdentity]);

  useEffect(() => {
    if (!fixtureId) return;

    loadComments(true);

    const interval = setInterval(() => {
      loadComments(false);
    }, 2000);

    return () => clearInterval(interval);
  }, [fixtureId, loadComments]);

  const saveNickname = useCallback(async () => {
    const cleanNickname = nicknameDraft.trim();

    if (cleanNickname.length < 2 || cleanNickname.length > 30) {
      Alert.alert(
        'Nick no válido',
        'Elige un nick de entre 2 y 30 caracteres.'
      );
      return;
    }

    try {
      await AsyncStorage.setItem('match_chat_nickname', cleanNickname);
      setNickname(cleanNickname);
    } catch {
      Alert.alert(
        'Error',
        'No se pudo guardar el nick en este dispositivo.'
      );
    }
  }, [nicknameDraft]);

  const sendComment = useCallback(async () => {
    const cleanMessage = commentText.trim();

    if (!fixtureId || !nickname || !deviceId || !cleanMessage) return;

    try {
      setSendingComment(true);

      const response = await fetch(
        `${API_BASE}/fixture/${encodeURIComponent(fixtureId)}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname,
            message: cleanMessage,
            deviceId,
          }),
        }
      );

      const json = await response.json();

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${response.status}`);
      }

      setCommentText('');

      if (json.comment) {
        setComments((previous) =>
          previous.some((item) => item.id === json.comment.id)
            ? previous
            : [...previous, json.comment]
        );
      }
    } catch (sendError: any) {
      Alert.alert(
        'No se pudo enviar',
        sendError?.message || 'Inténtalo de nuevo en unos segundos.'
      );
    } finally {
      setSendingComment(false);
    }
  }, [commentText, deviceId, fixtureId, nickname]);

  const reportComment = useCallback((comment: MatchComment) => {
    Alert.alert(
      'Reportar comentario',
      `¿Quieres reportar el comentario de ${comment.nickname}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reportar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_BASE}/comments/${comment.id}/report`,
                { method: 'POST' }
              );

              const json = await response.json();

              if (!response.ok || !json?.ok) {
                throw new Error(json?.error || `HTTP ${response.status}`);
              }

              Alert.alert(
                'Gracias',
                'El comentario ha sido marcado para revisión.'
              );
            } catch {
              Alert.alert(
                'Error',
                'No se pudo reportar el comentario.'
              );
            }
          },
        },
      ]
    );
  }, []);

  const statusText = useMemo(() => {
    if (!data) return '';
    const s = data.fixture.status;

    if (s.short === 'HT') return 'DESCANSO';
    if (s.short === 'FT') return 'FINAL';
    if (s.short === 'AET') return 'FINAL · PRÓRROGA';
    if (s.short === 'PEN') return 'FINAL · PENALTIS';
    if (s.elapsed !== null) {
      return s.extra ? `${s.elapsed}+${s.extra}'` : `${s.elapsed}'`;
    }
    return s.long || s.short;
  }, [data]);

  type TimelineEventKind =
    | 'goal'
    | 'yellow'
    | 'red'
    | 'substitution'
    | 'penalty'
    | 'var'
    | 'injury'
    | 'other';

  const getEventText = (event: MatchEvent) =>
    `${event.type || ''} ${event.detail || ''} ${event.comments || ''}`
      .trim()
      .toLowerCase();

  const getEventKind = (event: MatchEvent): TimelineEventKind => {
    const text = getEventText(event);

    if (text.includes('substitution') || text.includes('subst')) return 'substitution';
    if (text.includes('yellow') || text === 'foul' || text.endsWith(' foul')) return 'yellow';
    if (text.includes('red')) return 'red';
    if (text.includes('var')) return 'var';
    if (text.includes('injur')) return 'injury';
    if (text.includes('penalty') && (text.includes('disallowed') || text.includes('missed'))) return 'penalty';
    if (text.includes('goal') || /(^|\s)\d+\s*[-:]\s*\d+($|\s)/.test(text)) return 'goal';
    if (text.includes('penalty')) return 'penalty';

    return 'other';
  };

  const eventIcon = (kind: TimelineEventKind) => {
    if (kind === 'goal') return 'football';
    if (kind === 'substitution') return 'swap-vertical';
    if (kind === 'penalty') return 'alert-circle';
    if (kind === 'var') return 'tv-outline';
    if (kind === 'injury') return 'medkit-outline';
    return 'ellipse';
  };

  const formatEventMinute = (event: MatchEvent) => {
    if (event.time.elapsed === null) return '';
    return event.time.extra
      ? `${event.time.elapsed}+${event.time.extra}'`
      : `${event.time.elapsed}'`;
  };

  const getEventLabel = (event: MatchEvent, kind: TimelineEventKind) => {
    const comments = (event.comments || '').trim();

    if (kind === 'goal') return comments && !/goal/i.test(comments) ? comments : 'Gol';
    if (kind === 'yellow') return 'Tarjeta amarilla';
    if (kind === 'red') return 'Tarjeta roja';
    if (kind === 'substitution') return 'Cambio';
    if (kind === 'var') return 'VAR';
    if (kind === 'injury') return 'Lesión';
    if (kind === 'penalty') {
      if (/disallowed/i.test(comments)) return 'Penalti anulado';
      if (/missed/i.test(comments)) return 'Penalti fallado';
      return 'Penalti';
    }

    return event.detail || event.comments || 'Incidencia';
  };

  const getStat = (teamIndex: number, type: string) => {
    const teamStats = data?.statistics?.[teamIndex]?.statistics || [];
    const found = teamStats.find((item) => item.type === type);
    return found?.value ?? '-';
  };

  const statsToShow = [
    'Ball Possession',
    'Total Shots',
    'Shots on Goal',
    'Corner Kicks',
    'Fouls',
    'Offsides',
    'Yellow Cards',
    'Red Cards',
    'Goalkeeper Saves',
    'Total passes',
    'Passes %',
  ];

  const renderSummary = () => {
    if (!data) return null;

    if (!data.events.length) {
      return (
        <View style={styles.emptySection}>
          <Ionicons name="time-outline" size={30} color="#174F3A" />
          <Text style={styles.emptyTitle}>Sin eventos todavía</Text>
          <Text style={styles.emptyText}>
            Los goles, tarjetas y sustituciones aparecerán aquí.
          </Text>
        </View>
      );
    }

    const orderedEvents = [...data.events].sort((a, b) => {
      const aMinute = (a.time.elapsed ?? 0) * 100 + (a.time.extra ?? 0);
      const bMinute = (b.time.elapsed ?? 0) * 100 + (b.time.extra ?? 0);
      return aMinute - bMinute;
    });

    const firstSecondHalfIndex = orderedEvents.findIndex(
      (event) => (event.time.elapsed ?? 0) > 45
    );

    const renderPhase = (label: string, icon: keyof typeof Ionicons.glyphMap) => (
      <View style={styles.phaseRow}>
        <View style={styles.phaseLine} />
        <View style={styles.phaseBadge}>
          <Ionicons name={icon} size={12} color="#FFFFFF" />
          <Text style={styles.phaseText}>{label}</Text>
        </View>
        <View style={styles.phaseLine} />
      </View>
    );

    return (
      <View style={styles.timelineCard}>
        <View style={styles.timelineTeams}>
          <Text numberOfLines={1} style={styles.timelineTeamName}>
            {data.home.shortName || data.home.name}
          </Text>
          <Text style={styles.timelineHeaderLabel}>CRONOLOGÍA</Text>
          <Text numberOfLines={1} style={[styles.timelineTeamName, styles.timelineTeamNameAway]}>
            {data.away.shortName || data.away.name}
          </Text>
        </View>

        {renderPhase('INICIO DEL PARTIDO', 'flag-outline')}

        {orderedEvents.map((event, index) => {
          const isHome = Number(event.team.id) === Number(data.home.id);
          const kind = getEventKind(event);
          const isSubstitution = kind === 'substitution';
          const isCard = kind === 'yellow' || kind === 'red';
          const label = getEventLabel(event, kind);

          return (
            <View key={`${event.time.elapsed}-${event.time.extra}-${event.player.id}-${index}`}>
              {index === firstSecondHalfIndex && renderPhase('DESCANSO', 'pause')}

              <View style={styles.timelineRow}>
                <View style={[styles.timelineSide, styles.timelineSideHome]}>
                  {isHome ? (
                    <View style={styles.eventContentHome}>
                      <View style={styles.eventTextHome}>
                        {kind === 'goal' ? (
                          <View style={styles.goalHeaderHome}>
                            <Text style={styles.goalTag}>GOL</Text>
                            <Text numberOfLines={2} style={[styles.timelinePlayer, styles.timelinePlayerGoal]}>
                              {event.player.name || 'Gol'}
                            </Text>
                          </View>
                        ) : (
                          <Text numberOfLines={2} style={styles.timelinePlayer}>
                            {event.player.name || label}
                          </Text>
                        )}
                        {isSubstitution && event.assist.name ? (
                          <>
                            <Text style={styles.subIn}>↑ Entra</Text>
                            <Text numberOfLines={1} style={styles.subOut}>↓ Sale {event.assist.name}</Text>
                          </>
                        ) : (
                          <Text numberOfLines={2} style={[styles.timelineDetail, kind === 'goal' && styles.goalDetail]}>
                            {kind === 'goal' && event.assist.name
                              ? `${label} · Asist. ${event.assist.name}`
                              : label}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.eventSymbol, kind === 'goal' && styles.goalSymbol]}>
                        {isCard ? (
                          <View style={[styles.cardSymbol, kind === 'red' ? styles.redCard : styles.yellowCard]} />
                        ) : (
                          <Ionicons
                            name={eventIcon(kind) as any}
                            size={kind === 'goal' ? 21 : 18}
                            color={kind === 'goal' ? '#0B0B0B' : kind === 'substitution' ? '#2F9B68' : '#FFFFFF'}
                          />
                        )}
                      </View>
                    </View>
                  ) : null}
                </View>

                <View style={styles.timelineCenter}>
                  <View style={styles.timelineStem} />
                  <View style={[styles.minuteBadge, kind === 'goal' && styles.minuteBadgeGoal]}>
                    <Text style={[styles.minuteText, kind === 'goal' && styles.minuteTextGoal]}>
                      {formatEventMinute(event)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.timelineSide, styles.timelineSideAway]}>
                  {!isHome ? (
                    <View style={styles.eventContentAway}>
                      <View style={[styles.eventSymbol, kind === 'goal' && styles.goalSymbol]}>
                        {isCard ? (
                          <View style={[styles.cardSymbol, kind === 'red' ? styles.redCard : styles.yellowCard]} />
                        ) : (
                          <Ionicons
                            name={eventIcon(kind) as any}
                            size={kind === 'goal' ? 21 : 18}
                            color={kind === 'goal' ? '#0B0B0B' : kind === 'substitution' ? '#2F9B68' : '#FFFFFF'}
                          />
                        )}
                      </View>
                      <View style={styles.eventTextAway}>
                        {kind === 'goal' ? (
                          <View style={styles.goalHeaderAway}>
                            <Text style={styles.goalTag}>GOL</Text>
                            <Text numberOfLines={2} style={[styles.timelinePlayer, styles.timelinePlayerGoal]}>
                              {event.player.name || 'Gol'}
                            </Text>
                          </View>
                        ) : (
                          <Text numberOfLines={2} style={styles.timelinePlayer}>
                            {event.player.name || label}
                          </Text>
                        )}
                        {isSubstitution && event.assist.name ? (
                          <>
                            <Text style={styles.subIn}>↑ Entra</Text>
                            <Text numberOfLines={1} style={styles.subOut}>↓ Sale {event.assist.name}</Text>
                          </>
                        ) : (
                          <Text numberOfLines={2} style={[styles.timelineDetail, kind === 'goal' && styles.goalDetail]}>
                            {kind === 'goal' && event.assist.name
                              ? `${label} · Asist. ${event.assist.name}`
                              : label}
                          </Text>
                        )}
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}

        {['FT', 'AET', 'PEN'].includes(data.fixture.status.short)
          ? renderPhase('FINAL DEL PARTIDO', 'checkmark')
          : null}
      </View>
    );
  };

  const renderStats = () => {
    if (!data) return null;

    if (data.statistics.length < 2) {
      return (
        <View style={styles.emptySection}>
          <Ionicons name="stats-chart-outline" size={30} color="#D4AF37" />
          <Text style={styles.emptyTitle}>Estadísticas no disponibles</Text>
          <Text style={styles.emptyText}>
            Se mostrarán cuando el proveedor las publique para este partido.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.sectionCard}>
        <View style={styles.statsTeamHeader}>
          <View style={styles.statsTeam}>
            <Image
  source={{ uri: getTeamLogoUrl(data.home.name, data.home.logo) }}
  style={styles.statsLogo}
  contentFit="contain"
/>
            <Text numberOfLines={1} style={styles.statsTeamName}>{data.home.shortName}</Text>
          </View>

          <View style={styles.statsTeam}>
            <Image
  source={{ uri: getTeamLogoUrl(data.away.name, data.away.logo) }}
  style={styles.statsLogo}
  contentFit="contain"
/>
            <Text numberOfLines={1} style={styles.statsTeamName}>{data.away.shortName}</Text>
          </View>
        </View>

        {statsToShow.map((type, index) => (
          <View
            key={type}
            style={[
              styles.statRow,
              index !== statsToShow.length - 1 && styles.rowDivider,
            ]}
          >
            <Text style={styles.statValue}>{String(getStat(0, type))}</Text>
            <Text style={styles.statLabel}>{STAT_LABELS[type] || type}</Text>
            <Text style={styles.statValue}>{String(getStat(1, type))}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderLineupTeam = (lineup: Lineup) => (
    <View key={String(lineup.team.id)} style={styles.lineupCard}>
      <View style={styles.lineupHeader}>
        <Image
  source={{ uri: getTeamLogoUrl(lineup.team.name, lineup.team.logo) }}
  style={styles.lineupLogo}
  contentFit="contain"
/>
        <View style={styles.lineupHeaderText}>
          <Text style={styles.lineupTeamName}>{lineup.team.name}</Text>
          <Text style={styles.formation}>
            {lineup.formation ? `Sistema ${lineup.formation}` : 'Sistema no disponible'}
          </Text>
        </View>
      </View>

      {lineup.coach.name ? (
        <View style={styles.coachRow}>
          <Ionicons name="person-outline" size={15} color="#D4AF37" />
          <Text style={styles.coachLabel}>Entrenador</Text>
          <Text style={styles.coachName}>{lineup.coach.name}</Text>
        </View>
      ) : null}

      <Text style={styles.lineupSectionTitle}>ONCE TITULAR</Text>

      {lineup.startXI.map((player, index) => (
        <View key={`${player.id}-${index}`} style={styles.playerRow}>
          <Text style={styles.playerNumber}>{player.number ?? '-'}</Text>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerPosition}>{player.position}</Text>
        </View>
      ))}

      {lineup.substitutes.length > 0 && (
        <>
          <Text style={styles.lineupSectionTitle}>SUPLENTES</Text>
          {lineup.substitutes.map((player, index) => (
            <View key={`${player.id}-${index}`} style={styles.playerRow}>
              <Text style={styles.playerNumber}>{player.number ?? '-'}</Text>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerPosition}>{player.position}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );

  const renderLineups = () => {
    if (!data) return null;

    if (!data.lineups.length) {
      return (
        <View style={styles.emptySection}>
          <Ionicons name="people-outline" size={30} color="#D4AF37" />
          <Text style={styles.emptyTitle}>Alineaciones no disponibles</Text>
          <Text style={styles.emptyText}>
            Aparecerán cuando se publiquen los onces del partido.
          </Text>
        </View>
      );
    }

    return <View>{data.lineups.map(renderLineupTeam)}</View>;
  };

  const formatCommentTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderComments = () => {
    if (!nickname) {
      return (
        <View style={styles.chatWelcomeCard}>
          <Ionicons name="chatbubbles-outline" size={34} color="#D4AF37" />
          <Text style={styles.chatWelcomeTitle}>Únete a la conversación</Text>
          <Text style={styles.chatWelcomeText}>
            Elige un nick. Se guardará en este dispositivo y no necesitas crear ninguna cuenta.
          </Text>

          <TextInput
            value={nicknameDraft}
            onChangeText={setNicknameDraft}
            placeholder="Tu nick..."
            placeholderTextColor="#666"
            maxLength={30}
            autoCorrect={false}
            style={styles.nicknameInput}
          />

          <Pressable
            onPress={saveNickname}
            style={({ pressed }) => [
              styles.nicknameButton,
              pressed && styles.chatPressed,
            ]}
          >
            <Text style={styles.nicknameButtonText}>ENTRAR AL CHAT</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View>
      

        {commentsLoading ? (
          <View style={styles.commentsLoader}>
            <ActivityIndicator color="#D4AF37" />
          </View>
        ) : commentsError ? (
          <View style={styles.chatEmptyCard}>
            <Text style={styles.chatEmptyText}>{commentsError}</Text>
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.chatEmptyCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={30} color="#D4AF37" />
            <Text style={styles.chatEmptyTitle}>Sé el primero en comentar</Text>
            <Text style={styles.chatEmptyText}>
              La conversación de este partido todavía está vacía.
            </Text>
          </View>
        ) : (
          <View style={styles.commentsList}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentTopRow}>
                  <Text style={styles.commentNickname}>{comment.nickname}</Text>
                  <Text style={styles.commentTime}>
                    {formatCommentTime(comment.created_at)}
                  </Text>
                </View>

                <Text style={styles.commentMessage}>{comment.message}</Text>

                <Pressable
                  onPress={() => reportComment(comment)}
                  hitSlop={8}
                  style={styles.reportButton}
                >
                  <Ionicons name="flag-outline" size={12} color="#696969" />
                  <Text style={styles.reportText}>Reportar</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.composerCard}>
          <View style={styles.composerTop}>
            <Text style={styles.composerNick}>@{nickname}</Text>
            <Text style={styles.characters}>{commentText.length}/300</Text>
          </View>

          <View style={styles.composerRow}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Escribe un comentario..."
              placeholderTextColor="#666"
              multiline
              maxLength={300}
              style={styles.commentInput}
            />

            <Pressable
              onPress={sendComment}
              disabled={sendingComment || !commentText.trim()}
              style={({ pressed }) => [
                styles.sendButton,
                (sendingComment || !commentText.trim()) && styles.sendButtonDisabled,
                pressed && !sendingComment && !!commentText.trim() && styles.chatPressed,
              ]}
            >
              {sendingComment ? (
                <ActivityIndicator size="small" color="#050505" />
              ) : (
                <Ionicons name="send" size={18} color="#050505" />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Partido',
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
            onRefresh={() => loadDetails(true)}
            tintColor="#D4AF37"
            colors={['#D4AF37']}
          />
        }
      >
        {loading && <DetailSkeleton />}

        {!loading && error ? (
          <View style={styles.emptySection}>
            <Ionicons name="alert-circle-outline" size={32} color="#D4AF37" />
            <Text style={styles.emptyTitle}>No se pudo cargar el partido</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : null}

        {!loading && data ? (
          <>
            <View style={styles.scoreCard}>
              <View style={styles.competitionRow}>
                <Text style={styles.competition}>{data.league.name}</Text>
                <Text style={styles.round}>{data.league.round}</Text>
              </View>

              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{statusText}</Text>
              </View>

              <View style={styles.scoreTeams}>
                <View style={styles.scoreTeam}>
                  <Pressable
  disabled={!data.home.id}
  onPress={() => {
    if (!data.home.id) return;

    router.push({
      pathname: '/team/[teamId]',
      params: { teamId: String(data.home.id) },
    });
  }}
>
  <Image
   source={{ uri: getTeamLogoUrl(data.home.name, data.home.logo) }}
    style={styles.bigLogo}
    contentFit="contain"
    cachePolicy="disk"
  />
</Pressable>
                  <Text numberOfLines={2} style={[styles.scoreTeamName, data.home.isCastellon && styles.castellon]}>
                    {data.home.shortName || data.home.name}
                  </Text>
                </View>

                <View style={styles.scoreCenter}>
                  <Text style={styles.mainScore}>
                    {data.goals.home ?? '-'} <Text style={styles.scoreDash}>—</Text> {data.goals.away ?? '-'}
                  </Text>
                  {data.score.halftime.home !== null && (
                    <Text style={styles.halftime}>
                      Descanso {data.score.halftime.home}-{data.score.halftime.away}
                    </Text>
                  )}
                </View>

                <View style={styles.scoreTeam}>
                 <Pressable
  disabled={!data.away.id}
  onPress={() => {
    if (!data.away.id) return;

    router.push({
      pathname: '/team/[teamId]',
      params: { teamId: String(data.away.id) },
    });
  }}
>
  <Image
    source={{ uri: getTeamLogoUrl(data.away.name, data.away.logo) }}
    style={styles.bigLogo}
    contentFit="contain"
    cachePolicy="disk"
  />
</Pressable>
                  <Text numberOfLines={2} style={[styles.scoreTeamName, data.away.isCastellon && styles.castellon]}>
                    {data.away.shortName || data.away.name}
                  </Text>
                </View>
              </View>

              {(data.fixture.venue.name || data.fixture.referee) && (
                <View style={styles.matchMeta}>
                  {data.fixture.venue.name ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={14} color="#D4AF37" />
                      <Text style={styles.metaText}>
                        {[data.fixture.venue.name, data.fixture.venue.city].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  ) : null}

                  {data.fixture.referee ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="shirt-outline" size={14} color="#D4AF37" />
                      <Text style={styles.metaText}>{data.fixture.referee}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            <View style={styles.tabs}>
              {[
                ['summary', 'Resumen'],
                ['stats', 'Estadísticas'],
                ['lineups', 'Alineaciones'],
                ['comments', `💬 ${comments.length}`],
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

            {section === 'summary' && renderSummary()}
            {section === 'stats' && renderStats()}
            {section === 'lineups' && renderLineups()}
            {section === 'comments' && renderComments()}
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  content: { padding: 14, paddingBottom: 80 },
  scoreCard: {
    backgroundColor: '#101010',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#292929',
    padding: 15,
    marginBottom: 12,
  },
  competitionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  competition: { color: '#D4AF37', fontSize: 11, fontWeight: '900' },
  round: { color: '#777', fontSize: 9, fontWeight: '700' },
  statusBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.30)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 14,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D4AF37', marginRight: 6 },
  statusText: { color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  scoreTeams: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  scoreTeam: { flex: 1, alignItems: 'center' },
  bigLogo: { width: 72, height: 72 },
  scoreTeamName: { color: '#EEE', fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  castellon: { color: '#D4AF37' },
  scoreCenter: { width: 112, alignItems: 'center' },
  mainScore: { color: '#FFF', fontSize: 30, fontWeight: '900' },
  scoreDash: { color: '#666', fontWeight: '500' },
  halftime: { color: '#777', fontSize: 9, marginTop: 4 },
  matchMeta: { borderTopWidth: 1, borderTopColor: '#242424', marginTop: 15, paddingTop: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  metaText: { flex: 1, color: '#8D8D8D', fontSize: 10, marginLeft: 6 },
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
  tabActive: { backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)' },
  tabText: { color: '#777', fontSize: 10, fontWeight: '800' },
  tabTextActive: { color: '#D4AF37' },
  sectionCard: {
    backgroundColor: '#101010',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242424',
    paddingHorizontal: 12,
  },
  timelineCard: {
    backgroundColor: '#0C0C0C',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242424',
    paddingHorizontal: 10,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  timelineTeams: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 8 },
  timelineTeamName: { flex: 1, color: '#F3F3F3', fontSize: 10, fontWeight: '900' },
  timelineTeamNameAway: { textAlign: 'right' },
  timelineHeaderLabel: { width: 82, color: '#5E5E5E', fontSize: 8, fontWeight: '900', textAlign: 'center', letterSpacing: 0.7 },
  phaseRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  phaseLine: { flex: 1, height: 1, backgroundColor: '#252525' },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#174F3A',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#286A50',
  },
  phaseText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900', letterSpacing: 0.4 },
  timelineRow: { flexDirection: 'row', minHeight: 72, alignItems: 'stretch' },
  timelineSide: { flex: 1, justifyContent: 'center', paddingVertical: 8 },
  timelineSideHome: { paddingRight: 7 },
  timelineSideAway: { paddingLeft: 7 },
  timelineCenter: { width: 58, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  timelineStem: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#173E31' },
  minuteBadge: {
    minWidth: 43,
    height: 29,
    borderRadius: 15,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#174F3A',
    borderWidth: 1,
    borderColor: '#286A50',
  },
  minuteBadgeGoal: { backgroundColor: '#D4AF37', borderColor: '#E6C85C', borderWidth: 1.5 },
  minuteText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  minuteTextGoal: { color: '#0B0B0B', fontWeight: '900' },
  eventContentHome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  eventContentAway: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  eventTextHome: { flex: 1, alignItems: 'flex-end', paddingRight: 7 },
  eventTextAway: { flex: 1, alignItems: 'flex-start', paddingLeft: 7 },
  eventSymbol: { width: 25, minHeight: 25, alignItems: 'center', justifyContent: 'center' },
  goalSymbol: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#D4AF37' },
  goalHeaderHome: { alignItems: 'flex-end' },
  goalHeaderAway: { alignItems: 'flex-start' },
  goalTag: { color: '#D4AF37', fontSize: 9, lineHeight: 12, fontWeight: '900', letterSpacing: 1.2, marginBottom: 2 },
  timelinePlayer: { color: '#F4F4F4', fontSize: 11, lineHeight: 15, fontWeight: '900' },
  timelinePlayerGoal: { color: '#FFFFFF', fontSize: 12, lineHeight: 16 },
  timelineDetail: { color: '#8A8A8A', fontSize: 8.5, lineHeight: 12, marginTop: 3 },
  goalDetail: { color: '#D4AF37', fontSize: 9.5, fontWeight: '900' },
  subIn: { color: '#55B986', fontSize: 8.5, fontWeight: '900', marginTop: 3 },
  subOut: { color: '#B45C5C', fontSize: 8.5, lineHeight: 12, marginTop: 1 },
  cardSymbol: { width: 11, height: 16, borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  yellowCard: { backgroundColor: '#F1D33B' },
  redCard: { backgroundColor: '#D94A4A' },
  emptySection: {
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
  statsTeamHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
  statsTeam: { width: '42%', alignItems: 'center' },
  statsLogo: { width: 38, height: 38 },
  statsTeamName: { color: '#DDD', fontSize: 10, fontWeight: '800', marginTop: 5 },
  statRow: { minHeight: 47, flexDirection: 'row', alignItems: 'center' },
  statValue: { width: 65, color: '#FFF', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  statLabel: { flex: 1, color: '#8D8D8D', fontSize: 10, textAlign: 'center' },
  lineupCard: {
    backgroundColor: '#101010',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 13,
    marginBottom: 12,
  },
  lineupHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: '#222' },
  lineupLogo: { width: 44, height: 44, marginRight: 10 },
  lineupHeaderText: { flex: 1 },
  lineupTeamName: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  formation: { color: '#D4AF37', fontSize: 10, fontWeight: '800', marginTop: 3 },
  coachRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  coachLabel: { color: '#777', fontSize: 10, marginLeft: 6 },
  coachName: { color: '#DDD', fontSize: 10, fontWeight: '800', marginLeft: 'auto' },
  lineupSectionTitle: { color: '#D4AF37', fontSize: 9, fontWeight: '900', marginTop: 10, marginBottom: 6, letterSpacing: 0.6 },
  playerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 36, borderBottomWidth: 1, borderBottomColor: '#1D1D1D' },
  playerNumber: { width: 32, color: '#D4AF37', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  playerName: { flex: 1, color: '#E6E6E6', fontSize: 11, fontWeight: '700' },
  playerPosition: { color: '#777', fontSize: 9, fontWeight: '700' },
  chatWelcomeCard: {
    backgroundColor: '#101010',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 20,
    alignItems: 'center',
  },
  chatWelcomeTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', marginTop: 10 },
  chatWelcomeText: { color: '#858585', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 7 },
  nicknameInput: {
    width: '100%',
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#303030',
    backgroundColor: '#080808',
    color: '#FFF',
    paddingHorizontal: 13,
    marginTop: 16,
    fontSize: 13,
    fontWeight: '700',
  },
  nicknameButton: {
    width: '100%',
    minHeight: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    marginTop: 9,
  },
  nicknameButtonText: { color: '#050505', fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  chatHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#101010',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242424',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chatEyebrow: { color: '#777', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  chatTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', marginTop: 3 },
  changeNick: { color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  chatRules: { color: '#686868', fontSize: 9, lineHeight: 14, paddingHorizontal: 5, marginTop: 8, marginBottom: 9 },
  commentsLoader: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  commentsList: { gap: 8 },
  commentCard: {
    backgroundColor: '#101010',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 12,
  },
  commentTopRow: { flexDirection: 'row', alignItems: 'center' },
  commentNickname: { flex: 1, color: '#D4AF37', fontSize: 10, fontWeight: '900' },
  commentTime: { color: '#666', fontSize: 8, fontWeight: '700' },
  commentMessage: { color: '#E7E7E7', fontSize: 12, lineHeight: 18, marginTop: 6 },
  reportButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 9, gap: 4 },
  reportText: { color: '#696969', fontSize: 8, fontWeight: '700' },
  chatEmptyCard: {
    minHeight: 145,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101010',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 18,
  },
  chatEmptyTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', marginTop: 8 },
  chatEmptyText: { color: '#777', fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  composerCard: {
    backgroundColor: '#101010',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 10,
    marginTop: 10,
  },
  composerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  composerNick: { flex: 1, color: '#D4AF37', fontSize: 9, fontWeight: '900' },
  characters: { color: '#5F5F5F', fontSize: 8, fontWeight: '700' },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end' },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    backgroundColor: '#080808',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    marginLeft: 8,
  },
  sendButtonDisabled: { opacity: 0.35 },
  chatPressed: { opacity: 0.72 },
  skeletonScoreCard: { height: 255, backgroundColor: '#101010', borderRadius: 22, marginBottom: 12, borderWidth: 1, borderColor: '#242424' },
  skeletonTabs: { height: 48, backgroundColor: '#101010', borderRadius: 16, marginBottom: 12 },
  skeletonRow: { height: 58, backgroundColor: '#101010', borderRadius: 14, marginBottom: 7 },
});
