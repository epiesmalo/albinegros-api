import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import AnimatedCard from '../../components/AnimatedCard';
import { CACHE_KEYS, formatCacheAge, getCache, saveCache } from '../../utils/cache';

type FixtureItem = {
  id: number;
  date: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeGoals: number | null;
  awayGoals: number | null;
  venue: string;
};

const getLogoUrl = (teamName: string, logo?: string) => {
  if (teamName.toLowerCase().includes('castell')) {
    return 'https://www.albinegroscastellon.com/cas.png?v=2';
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

export default function CalendarScreen() {
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
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

  const loadCalendar = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
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

      setFixtures(data);
      setUsingCachedData(false);
      setCacheSavedAt(null);
      setCurrentTime(Date.now());

      await saveCache(CACHE_KEYS.CALENDAR, data);
    } catch (err) {
      console.log('Error cargando calendario:', err);

      const cachedCalendar = await getCache<FixtureItem[]>(
        CACHE_KEYS.CALENDAR
      );

      if (Array.isArray(cachedCalendar?.data) && cachedCalendar.data.length > 0) {
        setFixtures(cachedCalendar.data);
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

  useEffect(() => {
    loadCalendar();
  }, []);

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

  const renderMatch = (item: FixtureItem) => {
    const isCastellon = isCastellonTeam(item.homeTeam) || isCastellonTeam(item.awayTeam);

    return (
      <AnimatedCard
        key={item.id}
        style={styles.animatedFullWidth}
        delay={180}
        animateKey={`${selectedRound}-${item.id}`}
      >
        <View
          style={[styles.matchCard, isCastellon && styles.castellonMatchCard]}
        >
        <View style={styles.teamsBlock}>
          <View style={styles.teamLine}>
            <Image source={{ uri: getLogoUrl(item.homeTeam, item.homeLogo) }} style={styles.teamLogo} />
            <Text
              style={[
                styles.teamName,
                isCastellonTeam(item.homeTeam) && styles.castellonTeamName,
              ]}
              numberOfLines={1}
            >
              {item.homeTeam}
            </Text>
          </View>

          <View style={styles.scoreBox}>{renderScore(item)}</View>

          <View style={styles.teamLine}>
           <Image source={{ uri: getLogoUrl(item.awayTeam, item.awayLogo) }} style={styles.teamLogo} />
            <Text
              style={[
                styles.teamName,
                isCastellonTeam(item.awayTeam) && styles.castellonTeamName,
              ]}
              numberOfLines={1}
            >
              {item.awayTeam}
            </Text>
          </View>
        </View>

        <View style={styles.matchFooter}>
          <Text style={styles.dateText}>{formatMatchDate(item.date)}</Text>
          <View style={styles.footerDivider} />
          <Text style={styles.venueText} numberOfLines={1}>
            {item.venue || 'Estadio por confirmar'}
          </Text>
        </View>
        </View>
      </AnimatedCard>
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
        <AnimatedCard delay={0}>
          <View style={styles.heroCard}>
            <Text style={styles.kicker}>SEGUNDA DIVISIÓN</Text>
            <Text style={styles.subtitle}>Temporada 2026/27</Text>
          </View>
        </AnimatedCard>

        <AnimatedCard delay={70}>
          <View style={styles.filterRow}>
            <Text style={styles.sectionLabel}>Calendario</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.compactFilter}
              onPress={() => setFilterDropdownOpen(true)}
            >
              <Text style={styles.compactFilterText}>{filter}</Text>
              <Text style={styles.compactChevron}>▾</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        <AnimatedCard delay={140} animateKey={selectedRound ?? 0}>
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
              <Text style={styles.roundSelectorChevron}>▾</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} style={styles.arrowButton} onPress={goNextRound}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        {usingCachedData && (
          <AnimatedCard delay={165}>
            <View style={styles.cachedBanner}>
              <View style={styles.cachedDot} />
              <Text style={styles.cachedText}>
                Mostrando datos guardados
                {cacheSavedAt
                  ? ` · ${formatCacheAge(cacheSavedAt, currentTime)}`
                  : ''}
              </Text>
            </View>
          </AnimatedCard>
        )}

        {loading && <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && !error && (
          <>
            {selectedRoundMatches.length > 0 ? (
              selectedRoundMatches.map(renderMatch)
            ) : (
              <AnimatedCard delay={180} animateKey={`${selectedRound}-${filter}`}>
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No hay partidos para esta selección</Text>
                </View>
              </AnimatedCard>
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
  loader: {
    marginTop: 30,
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
});