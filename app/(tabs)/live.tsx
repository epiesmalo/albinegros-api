import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type LiveTeam = {
  id: number | null;
  name: string;
  shortName: string;
  logo: string;
  winner: boolean | null;
  isCastellon: boolean;
};

type LiveMatch = {
  fixtureId: number | null;
  date: string | null;
  timestamp: number | null;
  status: {
    short: string;
    long: string;
    elapsed: number | null;
    extra: number | null;
  };
  league: {
    id: number | null;
    name: string;
    round: string;
    logo: string;
  };
  venue: {
    id: number | null;
    name: string;
    city: string;
  };
  referee: string;
  home: LiveTeam;
  away: LiveTeam;
  goals: {
    home: number | null;
    away: number | null;
  };
};

const API_URL = 'https://api.albinegroscastellon.com/api/football/live';

function LiveSkeleton() {
  return (
    <View>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonTop} />
          <View style={styles.skeletonTeamRow}>
            <View style={styles.skeletonLogo} />
            <View style={styles.skeletonName} />
            <View style={styles.skeletonScore} />
          </View>
          <View style={styles.skeletonTeamRow}>
            <View style={styles.skeletonLogo} />
            <View style={styles.skeletonNameShort} />
            <View style={styles.skeletonScore} />
          </View>
          <View style={styles.skeletonBottom} />
        </View>
      ))}
    </View>
  );
}

export default function LiveScreen() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [livePulse] = useState(() => new Animated.Value(1));

  const loadLive = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data?.ok || !Array.isArray(data.matches)) {
        throw new Error('Respuesta de directos no válida');
      }

      setMatches(data.matches);
      setUpdatedAt(data.updatedAt || new Date().toISOString());
    } catch (err) {
      console.error('Error cargando directos:', err);
      setError('No se pudieron actualizar los resultados en directo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
  loadLive();

  const interval = setInterval(() => {
    loadLive();
  }, 30000);

  return () => {
    clearInterval(interval);
  };
}, [loadLive]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 0.2,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [livePulse]);

  useEffect(() => {
    const fixtureIds = matches
      .map((match) => match.fixtureId)
      .filter((id): id is number => typeof id === 'number' && id > 0);

    if (fixtureIds.length === 0) {
      setCommentCounts({});
      return;
    }

    let cancelled = false;

    const loadCommentCounts = async () => {
      try {
        const response = await fetch(
          `https://api.albinegroscastellon.com/api/football/comments/counts?fixtureIds=${fixtureIds.join(',')}`
        );

        const data = await response.json();

        if (!cancelled && response.ok && data?.ok) {
          setCommentCounts(data.counts || {});
        }
      } catch (countError) {
        console.log('No se pudieron cargar los contadores de comentarios:', countError);
      }
    };

    loadCommentCounts();
    const interval = setInterval(loadCommentCounts, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [matches]);

const getStatusText = (match: LiveMatch) => {
  const short = match.status.short;
  const elapsed = match.status.elapsed;
  const extra = match.status.extra;

  if (short === 'NS') return 'POR COMENZAR';
  if (short === 'HT') return 'DESCANSO';
  if (short === 'FT') return 'FINAL';
  if (short === 'AET') return 'FINAL PRÓRROGA';
  if (short === 'PEN') return 'FINAL PENALTIS';
  if (short === 'ET') {
    return elapsed ? `PRÓRROGA · ${elapsed}'` : 'PRÓRROGA';
  }
  if (short === 'P') return 'PENALTIS';
  if (short === 'BT') return 'DESCANSO PRÓRROGA';

  if (short === 'PST') return 'APLAZADO';
  if (short === 'SUSP') return 'SUSPENDIDO';
  if (short === 'CANC') return 'CANCELADO';
  if (short === 'ABD') return 'ABANDONADO';
  if (short === 'AWD') return 'RESULTADO ADMINISTRATIVO';
  if (short === 'WO') return 'NO DISPUTADO';

  if (elapsed !== null) {
    return extra ? `${elapsed}+${extra}'` : `${elapsed}'`;
  }

  return 'ESTADO PENDIENTE';
};

  const formatUpdatedAt = () => {
    if (!updatedAt) return '';

    const date = new Date(updatedAt);

    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMatchState = (
  short?: string,
  long?: string,
  date?: string | null
) => {

    const status = short || '';

    const liveStatuses = ['1H', '2H', 'ET', 'P', 'LIVE'];
    const finishedStatuses = ['FT', 'AET', 'PEN'];
    const pausedStatuses = ['HT', 'BT'];

    if (liveStatuses.includes(status)) {
      return {
        type: 'live',
        label: 'EN VIVO',
      };
    }

    if (pausedStatuses.includes(status)) {
      return {
        type: 'break',
        label: 'DESCANSO',
      };
    }

    if (finishedStatuses.includes(status)) {
      return {
        type: 'finished',
        label: 'FINAL',
      };
    }

    if (status === 'NS') {
  const time = date
    ? new Date(date).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return {
    type: 'scheduled',
    label: time ? `PRÓXIMO · ${time}` : 'PRÓXIMO',
  };
}

    return {
      type: 'other',
      label: long || status || '',
    };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadLive(true)}
          tintColor="#D4AF37"
          colors={['#D4AF37']}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.liveTitleRow}>
          <View style={styles.liveDot} />
          <Text style={styles.title}>EN DIRECTO</Text>
        </View>

        <Text style={styles.subtitle}>
          LALIGA HYPERMOTION
        </Text>

        {updatedAt && (
          <Text style={styles.updatedText}>
            Actualizado a las {formatUpdatedAt()}
          </Text>
        )}
      </View>

      {loading && <LiveSkeleton />}

      {!loading && error ? (
        <View style={styles.stateCard}>
          <Ionicons name="cloud-offline-outline" size={34} color="#D4AF37" />
          <Text style={styles.stateTitle}>No se pudo actualizar</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Text style={styles.stateHint}>
            Desliza hacia abajo para volver a intentarlo.
          </Text>
        </View>
      ) : null}

      {!loading && !error && matches.length === 0 ? (
        <View style={styles.stateCard}>
          <View style={styles.emptyBall}>
            <Ionicons name="football-outline" size={34} color="#D4AF37" />
          </View>

          <Text style={styles.stateTitle}>
            No hay partidos en directo
          </Text>

          <Text style={styles.stateText}>
            Cuando comience un partido de LALIGA HYPERMOTION aparecerá aquí automáticamente.
          </Text>

          <Text style={styles.stateHint}>
            Desliza hacia abajo para actualizar.
          </Text>
        </View>
      ) : null}

      {!loading && !error && matches.map((match) => (
        <Pressable
          key={String(match.fixtureId)}
          disabled={!match.fixtureId}
          onPress={() => {
            if (!match.fixtureId) return;

            router.push({
              pathname: '/match/[fixtureId]',
              params: { fixtureId: String(match.fixtureId) },
            });
          }}
          style={({ pressed }) => [
  styles.matchCard,
  (match.home.isCastellon || match.away.isCastellon)
    ? styles.castellonCard
    : null,
  pressed && !!match.fixtureId
    ? styles.matchCardPressed
    : null,
]}
        >
          <View style={styles.matchHeader}>
            <View style={styles.liveBadge}>
              <View style={styles.badgeDot} />
              <Text style={styles.liveBadgeText}>
                {getStatusText(match)}
              </Text>
            </View>

            <Text style={styles.roundText}>
              {match.league.round}
            </Text>
          </View>

          <View style={styles.teamRow}>
            <Image
              source={{ uri: match.home.logo }}
              style={styles.teamLogo}
              contentFit="contain"
              cachePolicy="disk"
            />

            <View style={styles.teamNameWrap}>
              <Text
                numberOfLines={1}
                style={[
                  styles.teamName,
                  match.home.isCastellon && styles.castellonName,
                ]}
              >
                {match.home.name}
              </Text>
            </View>

            <Text style={styles.score}>
              {match.goals.home ?? '-'}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.teamRow}>
            <Image
              source={{ uri: match.away.logo }}
              style={styles.teamLogo}
              contentFit="contain"
              cachePolicy="disk"
            />

            <View style={styles.teamNameWrap}>
              <Text
                numberOfLines={1}
                style={[
                  styles.teamName,
                  match.away.isCastellon && styles.castellonName,
                ]}
              >
                {match.away.name}
              </Text>
            </View>

            <Text style={styles.score}>
              {match.goals.away ?? '-'}
            </Text>
          </View>

          {(match.venue.name || match.venue.city) && (
            <View style={styles.venueRow}>
              <Ionicons
                name="location-outline"
                size={13}
                color="#8E8E8E"
              />
              <Text numberOfLines={1} style={styles.venueText}>
                {[match.venue.name, match.venue.city]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          )}

          <View style={styles.liveCommunityRow}>
{(() => {
  const matchState = getMatchState(
    match.status?.short,
    match.status?.long,
    match.date
  );

  if (matchState.type === 'live') {
    return (
      <View style={styles.liveNowBadge}>
        <Animated.View
          style={[
            styles.redLiveDot,
            { opacity: livePulse },
          ]}
        />
        <Text style={styles.liveNowText}>
          EN VIVO
        </Text>
      </View>
    );
  }

  if (matchState.type === 'break') {
    return (
      <View style={styles.breakBadge}>
        <Text style={styles.breakText}>
          DESCANSO
        </Text>
      </View>
    );
  }

  if (matchState.type === 'finished') {
    return (
      <View style={styles.finishedBadge}>
        <Text style={styles.finishedText}>
          FINAL
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.scheduledBadge}>
      <Text style={styles.scheduledText}>
        {matchState.label}
      </Text>
    </View>
  );
})()}

            <View style={styles.liveCommentBadge}>
              <Text style={styles.liveCommentText}>
                💬 {match.fixtureId
                  ? commentCounts[String(match.fixtureId)] || 0
                  : 0} comentarios
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={16}
              color="#D4AF37"
            />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 120,
  },
  header: {
    backgroundColor: '#101010',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242424',
    paddingVertical: 17,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#D4AF37',
    marginRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
    letterSpacing: 0.7,
  },
  updatedText: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 7,
  },
  stateCard: {
    minHeight: 245,
    backgroundColor: '#101010',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 30,
  },
  emptyBall: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  stateTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 12,
    textAlign: 'center',
  },
  stateText: {
    color: '#A0A0A0',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  stateHint: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 13,
  },
  matchCard: {
    backgroundColor: '#101010',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 13,
    marginBottom: 12,
  },
  matchCardPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.995 }],
  },
  liveCommunityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#202020',
  },
  liveNowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(230,45,45,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(230,45,45,0.28)',
  },
  redLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E62D2D',
    marginRight: 6,
  },
  liveNowText: {
    color: '#F15A5A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    
  },

    breakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
  },
  breakText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '900',
  },

  finishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: '#2F2F2F',
  },
  finishedText: {
    color: '#AAAAAA',
    fontSize: 9,
    fontWeight: '900',
  },

  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
  },
  scheduledText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '900',
  },
  
  liveCommentBadge: {
    flex: 1,
    marginLeft: 8,
  },
  liveCommentText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '900',
  },
  castellonCard: {
    borderColor: 'rgba(212,175,55,0.65)',
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.32)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
    marginRight: 6,
  },
  liveBadgeText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '900',
  },
  roundText: {
    color: '#777777',
    fontSize: 9,
    fontWeight: '700',
    maxWidth: '48%',
    textAlign: 'right',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
  },
  teamLogo: {
    width: 40,
    height: 40,
    marginRight: 11,
  },
  teamNameWrap: {
    flex: 1,
  },
  teamName: {
    color: '#EAEAEA',
    fontSize: 13,
    fontWeight: '800',
  },
  castellonName: {
    color: '#D4AF37',
  },
  score: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    minWidth: 35,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#222222',
    marginLeft: 51,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#202020',
  },
  venueText: {
    flex: 1,
    color: '#858585',
    fontSize: 10,
    marginLeft: 5,
  },
  skeletonCard: {
    backgroundColor: '#101010',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 13,
    marginBottom: 12,
  },
  skeletonTop: {
    width: 95,
    height: 23,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.10)',
    marginBottom: 14,
  },
  skeletonTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
  },
  skeletonLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 11,
  },
  skeletonName: {
    flex: 1,
    maxWidth: 175,
    height: 13,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skeletonNameShort: {
    flex: 1,
    maxWidth: 135,
    height: 13,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skeletonScore: {
    width: 28,
    height: 27,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 'auto',
  },
  skeletonBottom: {
    width: '58%',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 13,
  },
});
