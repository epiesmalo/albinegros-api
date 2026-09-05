import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { colors } from '../../theme/colors';
import { CACHE_KEYS, getCache, saveCache } from '../../utils/cache';

type FixtureItem = {
  id: number;
  fixtureId: number | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  date: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeGoals: number | null;
  awayGoals: number | null;
  venue: string;
  statusShort?: string | null;
  statusLong?: string | null;
  elapsed?: number | null;
  extra?: number | null;
};

const getLogoUrl = (teamName: string, logo?: string) => {
  if (teamName.toLowerCase().includes('castell')) {
    return 'https://archivos.albinegroscastellon.com/cas.png?v=2';
  }

  return logo;
};

const extractRoundNumber = (round?: string) => {
  if (!round) return 0;
  const match = round.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

const isCastellonTeam = (team?: string) =>
  (team || '').toLowerCase().includes('castell');


function CalendarSkeleton() {
  return (
    <View>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonMatchCard}>
          <View style={styles.skeletonTeamsBlock}>
            <View style={styles.skeletonTeamLine}>
              <View style={styles.skeletonLogo} />
              <View style={[styles.skeletonLine, styles.skeletonTeamName]} />
            </View>

            <View style={styles.skeletonScore} />

            <View style={styles.skeletonTeamLine}>
              <View style={styles.skeletonLogo} />
              <View style={[styles.skeletonLine, styles.skeletonTeamName]} />
            </View>
          </View>

          <View style={styles.skeletonFooter}>
            <View style={[styles.skeletonLine, styles.skeletonDate]} />
            <View style={styles.skeletonFooterDivider} />
            <View style={[styles.skeletonLine, styles.skeletonVenue]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function CalendarScreen() {
  const [livePulse] = useState(() => new Animated.Value(1));
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
  const fixturesRef = useRef<FixtureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [filter, setFilter] = useState<'Todos' | 'Castellón'>('Todos');
  const [roundDropdownOpen, setRoundDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cacheSavedAt, setCacheSavedAt] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

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
  fixturesRef.current = fixtures;
}, [fixtures]);

  const loadCalendar = async (isRefresh = false) => {
  try {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      const cachedCalendar = await getCache<FixtureItem[]>(
        CACHE_KEYS.CALENDAR
      );

      if (
        Array.isArray(cachedCalendar?.data) &&
        cachedCalendar.data.length > 0
      ) {
        setFixtures(cachedCalendar.data);
        setUsingCachedData(true);
        setCacheSavedAt(cachedCalendar.savedAt);
        setCurrentTime(Date.now());
        setLoading(false);
      } else {
        setLoading(true);
      }
    }

    setError('');

    const response = await fetch(
      'https://api.albinegroscastellon.com/calendar/first-team'
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('La respuesta del calendario no es válida.');
    }

const updatedData = await refreshTodayFixtures(data);

const previousFixtures = fixturesRef.current;

const mergedData = updatedData.map((item) => {
 const previousItem = previousFixtures.find(
  (previous) =>
    String(previous.fixtureId) === String(item.fixtureId)
);

  if (!previousItem) {
    return item;
  }

 return {
  ...item,
  homeGoals:
    item.homeGoals ?? previousItem.homeGoals ?? null,
  awayGoals:
    item.awayGoals ?? previousItem.awayGoals ?? null,
  statusShort:
    item.statusShort ?? previousItem.statusShort ?? null,
  statusLong:
    item.statusLong ?? previousItem.statusLong ?? null,
  elapsed:
    item.elapsed ?? previousItem.elapsed ?? null,
  extra:
    item.extra ?? previousItem.extra ?? null,
};
});

fixturesRef.current = mergedData;
const liveMatchDebug = mergedData.find(
  (item) => item.statusShort === '1H' || item.statusShort === '2H'
);

if (liveMatchDebug) {
  console.log(
    '🟢 LIVE UPDATE:',
    liveMatchDebug.elapsed,
    liveMatchDebug.homeGoals,
    liveMatchDebug.awayGoals
  );
}
setFixtures(mergedData);
setUsingCachedData(false);
setCacheSavedAt(null);
setCurrentTime(Date.now());

await saveCache(CACHE_KEYS.CALENDAR, mergedData);
  } catch (err) {
  console.log('🔴 ERROR CALENDARIO - ENTRANDO EN CATCH:', err);

    const cachedCalendar = await getCache<FixtureItem[]>(
      CACHE_KEYS.CALENDAR
    );

    if (
      Array.isArray(cachedCalendar?.data) &&
      cachedCalendar.data.length > 0
    ) {
  fixturesRef.current = cachedCalendar.data;
setFixtures(cachedCalendar.data);
setUsingCachedData(true);
setUsingCachedData(true);
      setCacheSavedAt(cachedCalendar.savedAt);
      setCurrentTime(Date.now());
      setError('');
    } else {
      setError('No se pudo cargar el calendario.');
      setFixtures([]);
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
 const refreshTodayFixtures = async (calendarData: FixtureItem[]) => {
  try {
    const response = await fetch(
      'https://api.albinegroscastellon.com/api/football/live'
    );

    if (!response.ok) {
      return calendarData;
    }

    const data = await response.json();

    if (!data?.ok || !Array.isArray(data.matches)) {
      return calendarData;
    }

    return calendarData.map((item) => {
      if (!item.fixtureId) {
        return item;
      }

      const liveMatch = data.matches.find(
        (match: any) =>
          String(match.fixtureId) === String(item.fixtureId)
      );

      if (!liveMatch) {
        return item;
      }

      return {
        ...item,
        homeGoals:
          liveMatch.goals?.home ?? item.homeGoals ?? null,
        awayGoals:
          liveMatch.goals?.away ?? item.awayGoals ?? null,
        statusShort:
          liveMatch.status?.short ?? item.statusShort ?? null,
        statusLong:
          liveMatch.status?.long ?? item.statusLong ?? null,
        elapsed:
          liveMatch.status?.elapsed ?? item.elapsed ?? null,
        extra:
          liveMatch.status?.extra ?? item.extra ?? null,
      };
    });
  } catch (error) {
    console.log('Error actualizando partidos en directo:', error);
    return calendarData;
  }
};

  

useFocusEffect(
  useCallback(() => {
    loadCalendar();

    const interval = setInterval(() => {
      loadCalendar(true);
    }, 30_000);

    return () => {
      clearInterval(interval);
    };
  }, [])
);

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(Date.now());
  }, 60_000);

  return () => clearInterval(timer);
}, []);

  const rounds = useMemo(() => {
    const uniqueRounds = Array.from(
      new Set(fixtures.map((item) => extractRoundNumber(item.round)).filter(Boolean))
    );

    return uniqueRounds.sort((a, b) => a - b);
  }, [fixtures]);

  useEffect(() => {
    if (!fixtures.length || selectedRound !== null) return;

    const now = new Date();

    const nextMatch = fixtures
      .filter((item) => {
        const date = new Date(item.date);
        return !isNaN(date.getTime()) && date >= now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    const nextRound = nextMatch ? extractRoundNumber(nextMatch.round) : rounds[0];
    setSelectedRound(nextRound || 1);
  }, [fixtures, rounds, selectedRound]);

  useEffect(() => {
    const fixtureIds = fixtures
      .map((item) => item.fixtureId)
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

const interval = setInterval(loadCommentCounts, 15000);

return () => {
  cancelled = true;
  clearInterval(interval);
};
  }, [fixtures]);

  const selectedRoundMatches = useMemo(() => {
    return fixtures
      .filter((item) => extractRoundNumber(item.round) === selectedRound)
      .filter((item) => {
        if (filter === 'Todos') return true;
        return isCastellonTeam(item.homeTeam) || isCastellonTeam(item.awayTeam);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [fixtures, selectedRound, filter]);

  const goPreviousRound = () => {
    if (!selectedRound || !rounds.length) return;
    const currentIndex = rounds.indexOf(selectedRound);
    if (currentIndex > 0) setSelectedRound(rounds[currentIndex - 1]);
  };

  const goNextRound = () => {
    if (!selectedRound || !rounds.length) return;
    const currentIndex = rounds.indexOf(selectedRound);
    if (currentIndex >= 0 && currentIndex < rounds.length - 1) {
      setSelectedRound(rounds[currentIndex + 1]);
    }
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha no disponible';

    const day = date.toLocaleDateString('es-ES', { day: '2-digit' });
    const month = date
      .toLocaleDateString('es-ES', { month: 'short' })
      .replace('.', '')
      .toUpperCase();
    const time = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${day} ${month} · ${time}`;
  };

  const renderScore = (item: FixtureItem) => {
    if (item.homeGoals === null || item.awayGoals === null) {
      return <Text style={styles.pendingText}>-</Text>;
    }

    return (
      <Text style={styles.scoreText}>
        {item.homeGoals} - {item.awayGoals}
      </Text>
    );
  };
const renderLiveStatus = (item: FixtureItem) => {
  const short = item.statusShort || '';

  const liveStatuses = ['1H', '2H', 'ET', 'P', 'LIVE'];
  const pausedStatuses = ['HT', 'BT'];

  if (liveStatuses.includes(short)) {
const minute =
  item.elapsed !== null && item.elapsed !== undefined
    ? item.elapsed === 45 && item.extra
      ? `${item.elapsed}+${item.extra}'`
      : item.elapsed === 90 && item.extra
        ? `${item.elapsed}+${item.extra}'`
        : `${item.elapsed}'`
    : 'EN VIVO';

    return (
      <View style={styles.liveStatusRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveStatusText}>
          EN VIVO · {minute}
        </Text>
      </View>
    );
  }

  if (pausedStatuses.includes(short)) {
    return (
      <View style={styles.liveStatusRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveStatusText}>
          DESCANSO
        </Text>
      </View>
    );
  }

  return null;
};

  const renderMatch = (item: FixtureItem) => {
  const isCastellon =
    isCastellonTeam(item.homeTeam) ||
    isCastellonTeam(item.awayTeam);

  const short = item.statusShort || '';

  const liveStatuses = ['1H', '2H', 'ET', 'P', 'LIVE'];
  const pausedStatuses = ['HT', 'BT'];
  const finishedStatuses = ['FT', 'AET', 'PEN'];

  const isLive = liveStatuses.includes(short);
  const isPaused = pausedStatuses.includes(short);
  const isFinished = finishedStatuses.includes(short);

  const minute =
    item.elapsed !== null && item.elapsed !== undefined
      ? item.elapsed === 45 && item.extra
        ? `${item.elapsed}+${item.extra}'`
        : item.elapsed === 90 && item.extra
          ? `${item.elapsed}+${item.extra}'`
          : `${item.elapsed}'`
      : '';

  return (
    <View
      key={item.id}
      style={styles.animatedFullWidth}
    >
      <Pressable
        disabled={!item.fixtureId}
        onPress={() => {
          if (!item.fixtureId) return;

          router.push({
            pathname: '/match/[fixtureId]',
            params: { fixtureId: String(item.fixtureId) },
          });
        }}
        style={({ pressed }) => [
          styles.matchCard,
          isCastellon ? styles.castellonMatchCard : null,
          pressed && !!item.fixtureId
            ? styles.matchCardPressed
            : null,
        ]}
      >
        <View style={styles.directMatchHeader}>
          <Text style={styles.directStatusText}>
            {isLive
              ? 'EN JUEGO'
              : isPaused
                ? 'DESCANSO'
                : isFinished
                  ? 'FINAL'
                  : formatMatchDate(item.date)}
          </Text>
        </View>

        <View style={styles.directTeamRow}>
          <Pressable
            disabled={!item.homeTeamId}
            onPress={(event) => {
              event.stopPropagation();

              if (!item.homeTeamId) return;

              router.push({
                pathname: '/team/[teamId]',
                params: { teamId: String(item.homeTeamId) },
              });
            }}
          >
            <Image
              source={{
                uri: getLogoUrl(item.homeTeam, item.homeLogo),
              }}
              style={styles.directTeamLogo}
            />
          </Pressable>

          <View style={styles.directTeamNameWrap}>
            <Text
              numberOfLines={1}
              style={[
                styles.directTeamName,
                isCastellonTeam(item.homeTeam) &&
                  styles.castellonTeamName,
              ]}
            >
              {item.homeTeam}
            </Text>
          </View>

          <Text style={styles.directScore}>
            {item.homeGoals ?? '-'}
          </Text>
        </View>

        <View style={styles.directSeparator} />

        <View style={styles.directTeamRow}>
          <Pressable
            disabled={!item.awayTeamId}
            onPress={(event) => {
              event.stopPropagation();

              if (!item.awayTeamId) return;

              router.push({
                pathname: '/team/[teamId]',
                params: { teamId: String(item.awayTeamId) },
              });
            }}
          >
            <Image
              source={{
                uri: getLogoUrl(item.awayTeam, item.awayLogo),
              }}
              style={styles.directTeamLogo}
            />
          </Pressable>

          <View style={styles.directTeamNameWrap}>
            <Text
              numberOfLines={1}
              style={[
                styles.directTeamName,
                isCastellonTeam(item.awayTeam) &&
                  styles.castellonTeamName,
              ]}
            >
              {item.awayTeam}
            </Text>
          </View>

          <Text style={styles.directScore}>
            {item.awayGoals ?? '-'}
          </Text>
        </View>

        <View style={styles.directVenueRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color="#8E8E8E"
          />

          <Text
            numberOfLines={1}
            style={styles.directVenueText}
          >
            {item.venue || 'Estadio por confirmar'}
          </Text>
        </View>

        <View style={styles.directCommunityRow}>
          {isLive ? (
            <View style={styles.directLiveBadge}>
              <Animated.View style={[
    styles.directRedDot,
    { opacity: livePulse },
  ]}
/>

              <Text style={styles.directLiveText}>
                EN VIVO{minute ? ` · ${minute}` : ''}
              </Text>
            </View>
          ) : isPaused ? (
            <View style={styles.directBreakBadge}>
              <Text style={styles.directBreakText}>
                DESCANSO
              </Text>
            </View>
          ) : isFinished ? (
            <View style={styles.directFinishedBadge}>
              <Text style={styles.directFinishedText}>
                FINAL
              </Text>
            </View>
          ) : (
            <View style={styles.directScheduledBadge}>
              <Text style={styles.directScheduledText}>
                {formatMatchDate(item.date)}
              </Text>
            </View>
          )}

          {item.fixtureId ? (
            <View style={styles.directCommentBadge}>
              <Text style={styles.directCommentText}>
                💬 {commentCounts[String(item.fixtureId)] || 0}
              </Text>
            </View>
          ) : null}

          {item.fixtureId ? (
            <Text style={styles.detailChevron}>›</Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
};

  const renderRoundItem = ({ item }: { item: number }) => {
    const isActive = item === selectedRound;

    return (
      <Pressable
        style={styles.dropdownItem}
        onPress={() => {
          setSelectedRound(item);
          setRoundDropdownOpen(false);
        }}
      >
        <Text style={[styles.dropdownItemText, isActive && styles.dropdownItemTextActive]}>
          Jornada {item}
        </Text>
        {isActive && <Text style={styles.checkText}>✓</Text>}
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        scrollEnabled={!roundDropdownOpen && !filterDropdownOpen}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadCalendar(true)}
            enabled={!roundDropdownOpen && !filterDropdownOpen}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor="#101010"
          />
        }
      >
        <View>
  <View style={styles.heroCard}>
    <Text style={styles.kicker}>SEGUNDA DIVISIÓN</Text>
    <Text style={styles.subtitle}>Temporada 2026/27</Text>
  </View>
</View>

        <View>
          <View style={styles.filterRow}>
            <Text style={styles.sectionLabel}>Partidos</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.compactFilter}
              onPress={() => setFilterDropdownOpen(true)}
            >
              <Text style={styles.compactFilterText}>{filter}</Text>
              <Text style={styles.compactChevron}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <View style={styles.roundSelectorRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.arrowButton} onPress={goPreviousRound}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.roundSelector}
              onPress={() => setRoundDropdownOpen(true)}
            >
              <View>
                <Text style={styles.roundSelectorTitle}>Jornada {selectedRound || '-'}</Text>
                <Text style={styles.roundSelectorSubtitle}>
                  {selectedRoundMatches.length} partidos
                </Text>
              </View>
              <Text style={styles.roundSelectorChevron}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} style={styles.arrowButton} onPress={goNextRound}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

  
        {loading && <CalendarSkeleton />}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && !error && (
          <>
            {selectedRoundMatches.length > 0 ? (
              selectedRoundMatches.map(renderMatch)
            ) : (
              <View>
  <View style={styles.emptyCard}>
    <Text style={styles.emptyText}>
      No hay partidos para esta selección
    </Text>
  </View>
</View>
            )}
          </>
        )}
      </ScrollView>

      <Modal transparent visible={roundDropdownOpen} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setRoundDropdownOpen(false)}>
          <Pressable style={styles.roundDropdownBox}>
            <FlatList
              data={rounds}
              keyExtractor={(item) => String(item)}
              renderItem={renderRoundItem}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              initialScrollIndex={
                selectedRound && rounds.indexOf(selectedRound) > 2
                  ? rounds.indexOf(selectedRound) - 2
                  : 0
              }
              getItemLayout={(_, index) => ({
                length: 54,
                offset: 54 * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  // El fallback evita que Android falle al abrir en jornadas altas.
                }, 50);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={filterDropdownOpen} animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterDropdownOpen(false)}>
          <Pressable style={styles.filterDropdownBox}>
            {(['Todos', 'Castellón'] as const).map((item) => {
              const isActive = item === filter;

              return (
                <Pressable
                  key={item}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFilter(item);
                    setFilterDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, isActive && styles.dropdownItemTextActive]}>
                    {item}
                  </Text>
                  {isActive && <Text style={styles.checkText}>✓</Text>}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  animatedFullWidth: {
    width: '100%',
  },

  cachedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  cachedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
    marginRight: 6,
  },

  cachedText: {
    color: '#C9B46A',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  screen: {
    flex: 1,
    backgroundColor: '#080808',
  },
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  content: {
    padding: 14,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#111111',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#252525',
  },
  kicker: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: '#9f9f9f',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  compactFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  compactFilterText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  compactChevron: {
    color: colors.accent,
    marginLeft: 6,
    fontSize: 10,
    fontWeight: '900',
  },
  roundSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    marginTop: -3,
  },
  roundSelector: {
    flex: 1,
    marginHorizontal: 12,
    minHeight: 66,
    borderRadius: 18,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  roundSelectorTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  roundSelectorSubtitle: {
    color: '#9f9f9f',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 3,
  },
  roundSelectorChevron: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    marginTop: -8,
  },
  skeletonMatchCard: {
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242424',
  },

  skeletonTeamsBlock: {
    backgroundColor: '#161616',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },

  skeletonTeamLine: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },

  skeletonLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    marginRight: 10,
  },

  skeletonLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 6,
  },

  skeletonTeamName: {
    flex: 1,
    height: 13,
  },

  skeletonScore: {
    alignSelf: 'center',
    width: 46,
    height: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 8,
  },

  skeletonFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  skeletonDate: {
    width: 86,
    height: 11,
  },

  skeletonFooterDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#3a3a3a',
    marginHorizontal: 10,
  },

  skeletonVenue: {
    width: 110,
    height: 11,
  },
  matchCard: {
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242424',
  },
  castellonMatchCard: {
    backgroundColor: '#151410',
    borderColor: colors.accent,
    borderWidth: 0.5,
  },
  matchCardPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  teamsBlock: {
    backgroundColor: '#161616',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  teamLine: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },
  teamLogo: {
    width: 30,
    height: 30,
    marginRight: 10,
    resizeMode: 'contain',
  },
  teamName: {
    flex: 1,
    color: '#f1f1f1',
    fontSize: 13,
    fontWeight: '800',
  },
  castellonTeamName: {
    color: colors.accent,
    fontWeight: '900',
  },
  teamLinePressed: {
    opacity: 0.65,
  },
  scoreBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  pendingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  matchFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  footerDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#3a3a3a',
    marginHorizontal: 10,
  },
  venueText: {
    color: '#9f9f9f',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '52%',
  },
  commentCountBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.20)',
  },
  commentCountText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '900',
  },
  detailChevron: {
    color: colors.accent,
    fontSize: 19,
    fontWeight: '900',
    marginLeft: 7,
    marginTop: -1,
  },
  errorText: {
    color: '#ff5c5c',
    marginBottom: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242424',
  },
  emptyText: {
    color: '#9f9f9f',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  roundDropdownBox: {
    width: '82%',
    maxHeight: 470,
    backgroundColor: '#121212',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  filterDropdownBox: {
    width: 190,
    backgroundColor: '#121212',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  dropdownItem: {
    minHeight: 54,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },
  dropdownItemText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  dropdownItemTextActive: {
    color: colors.accent,
    fontWeight: '900',
  },
  checkText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  liveStatusRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 5,
},

liveDot: {
  width: 7,
  height: 7,
  borderRadius: 4,
  backgroundColor: '#FF3B30',
  marginRight: 6,
},

liveStatusText: {
  color: '#FF3B30',
  fontSize: 11,
  fontWeight: '900',
  letterSpacing: 0.5,
},
directMatchHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
},

directStatusText: {
  color: '#D4AF37',
  fontSize: 10,
  fontWeight: '900',
  letterSpacing: 0.4,
},

directTeamRow: {
  flexDirection: 'row',
  alignItems: 'center',
  minHeight: 47,
},

directTeamLogo: {
  width: 36,
  height: 36,
},

directTeamNameWrap: {
  flex: 1,
  marginLeft: 12,
  marginRight: 10,
},

directTeamName: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '800',
},

directScore: {
  color: '#FFFFFF',
  fontSize: 21,
  fontWeight: '900',
  minWidth: 28,
  textAlign: 'center',
},

directSeparator: {
  height: 1,
  backgroundColor: '#202020',
  marginLeft: 48,
},

directVenueRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 10,
},

directVenueText: {
  flex: 1,
  color: '#8E8E8E',
  fontSize: 10,
  fontWeight: '600',
  marginLeft: 5,
},

directCommunityRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 11,
  paddingTop: 10,
  borderTopWidth: 1,
  borderTopColor: '#202020',
},

directLiveBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
  paddingVertical: 5,
  borderRadius: 999,
  backgroundColor: 'rgba(230,45,45,0.08)',
  borderWidth: 1,
  borderColor: 'rgba(230,45,45,0.28)',
},

directRedDot: {
  width: 7,
  height: 7,
  borderRadius: 3.5,
  backgroundColor: '#E62D2D',
  marginRight: 6,
},

directLiveText: {
  color: '#F15A5A',
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 0.5,
},

directBreakBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
  paddingVertical: 5,
  borderRadius: 999,
  backgroundColor: 'rgba(212,175,55,0.08)',
  borderWidth: 1,
  borderColor: 'rgba(212,175,55,0.28)',
},

directBreakText: {
  color: '#D4AF37',
  fontSize: 9,
  fontWeight: '900',
},

directFinishedBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
  paddingVertical: 5,
  borderRadius: 999,
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: '#2F2F2F',
},

directFinishedText: {
  color: '#AAAAAA',
  fontSize: 9,
  fontWeight: '900',
},

directScheduledBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 8,
  paddingVertical: 5,
  borderRadius: 999,
  backgroundColor: 'rgba(212,175,55,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(212,175,55,0.18)',
},

directScheduledText: {
  color: '#D4AF37',
  fontSize: 9,
  fontWeight: '900',
},

directCommentBadge: {
  flex: 1,
  marginLeft: 8,
},

directCommentText: {
  color: '#D4AF37',
  fontSize: 10,
  fontWeight: '900',
},

});
