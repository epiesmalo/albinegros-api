import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import { CACHE_KEYS, formatCacheAge, getCache, saveCache } from '../../utils/cache';

type StandingItem = {
  teamId: number | null;
  position: number;
  team: string;
  logo?: string;
  points: number;
  playedgames: number;
  won: number;
  draw: number;
  lost: number;
  goalsfor: number;
goalsagainst: number;
goaldiff: number;
};

const getLogoUrl = (teamName: string, logo?: string) => {
  if (teamName.toLowerCase().includes('castell')) {
    return 'https://archivos.albinegroscastellon.com/cas.png?v=2';
  }

  return logo;
};

export default function StandingsScreen() {
  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cacheSavedAt, setCacheSavedAt] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

const loadStandings = async (isRefresh = false) => {
  try {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      const cachedStandings = await getCache<StandingItem[]>(
        CACHE_KEYS.STANDINGS
      );

      if (
        Array.isArray(cachedStandings?.data) &&
        cachedStandings.data.length > 0
      ) {
        setStandings(cachedStandings.data);
        setUsingCachedData(true);
        setCacheSavedAt(cachedStandings.savedAt);
        setCurrentTime(Date.now());
        setLoading(false);
      } else {
        setLoading(true);
      }
    }

    setError('');

    // Sincronizamos primero con el servidor.
    try {
      await fetch(
        'https://api.albinegroscastellon.com/api/football/sync-standings',
        {
          method: 'POST',
        }
      );
    } catch (syncError) {
      console.log(
        'No se pudo sincronizar la clasificación:',
        syncError
      );
    }

    // Después obtenemos los datos actualizados.
    const response = await fetch(
      'https://api.albinegroscastellon.com/standings/first-team'
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('La respuesta de la clasificación no es válida.');
    }

    setStandings(data);
    setUsingCachedData(false);
    setCacheSavedAt(null);
    setCurrentTime(Date.now());

    await saveCache(CACHE_KEYS.STANDINGS, data);
  } catch (err) {
    console.log('Error cargando clasificación:', err);

    const cachedStandings = await getCache<StandingItem[]>(
      CACHE_KEYS.STANDINGS
    );

    if (
      Array.isArray(cachedStandings?.data) &&
      cachedStandings.data.length > 0
    ) {
      setStandings(cachedStandings.data);
      setUsingCachedData(true);
      setCacheSavedAt(cachedStandings.savedAt);
      setCurrentTime(Date.now());
      setError('');
    } else {
      setError('No se pudo cargar la clasificación.');
      setStandings([]);
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
  loadStandings();

  const interval = setInterval(() => {
    loadStandings(true);
  }, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadStandings(true)}
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
      <View style={styles.legendFiltersRow}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.greenDot]} />
            <Text style={styles.legendText}>Ascenso</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.blueDot]} />
            <Text style={styles.legendText}>Playoff</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.redDot]} />
            <Text style={styles.legendText}>Descenso</Text>
          </View>
        </View>

        <View style={styles.viewSelector}>
          <Pressable
            style={[
              styles.viewButton,
              viewMode === 'summary' && styles.viewButtonActive,
            ]}
            onPress={() => setViewMode('summary')}
          >
            <Text
              style={[
                styles.viewButtonText,
                viewMode === 'summary' && styles.viewButtonTextActive,
              ]}
            >
              Resumida
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.viewButton,
              viewMode === 'full' && styles.viewButtonActive,
            ]}
            onPress={() => setViewMode('full')}
          >
            <Text
              style={[
                styles.viewButtonText,
                viewMode === 'full' && styles.viewButtonTextActive,
              ]}
            >
              Completa
            </Text>
          </Pressable>
        </View>
      </View>
      </View>

      {usingCachedData && (
        <View>
          <View style={styles.cachedBanner}>
            <View style={styles.cachedDot} />
            <Text style={styles.cachedText}>
              Mostrando datos guardados
              {cacheSavedAt
                ? ` · ${formatCacheAge(cacheSavedAt, currentTime)}`
                : ''}
            </Text>
          </View>
        </View>
      )}

      {loading && <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />}
      {error ? (
        <View>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!loading && !error && (
        <>
          {viewMode === 'summary' ? (
           <View style={styles.animatedFullWidth}>
              <View style={styles.tableCard}>
              <View style={styles.headerRow}>
                <Text style={[styles.headerCell, styles.rankCell]}>#</Text>
                <Text style={[styles.headerCell, styles.teamCell]}>Equipo</Text>
                <Text style={[styles.headerCell, styles.smallCell]}>PJ</Text>
                <Text style={[styles.headerCell, styles.smallCell]}>DG</Text>
                <Text style={[styles.headerCell, styles.pointsCell]}>Pts</Text>
              </View>

              {standings.map((item, index) => {
                const isCastellon = item.team.toLowerCase().includes('castell');
                const isDirectPromotion = item.position <= 2;
                const isPlayoff = item.position >= 3 && item.position <= 6;
                const isRelegation = item.position >= standings.length - 3;
                const goalDiff =
                  item.goaldiff ??
                  ((item.goalsfor ?? 0) - (item.goalsagainst ?? 0));

                return (
                  <Pressable
                    key={`${item.team}-${index}`}
                    disabled={!item.teamId}
                    onPress={() => {
                      if (!item.teamId) return;

                      router.push({
                        pathname: '/team/[teamId]',
                        params: { teamId: String(item.teamId) },
                      });
                    }}
                    style={({ pressed }) => [
  styles.row,
  isDirectPromotion ? styles.directPromotionRow : null,
  isPlayoff ? styles.playoffRow : null,
  isRelegation ? styles.relegationRow : null,
  isCastellon ? styles.highlightRow : null,
  pressed && !!item.teamId
    ? styles.rowPressed
    : null,
]}
                  >
                    <Text style={[styles.rankText, styles.rankCell]}>
                      {item.position}
                    </Text>

                    <View style={styles.teamCell}>
                      <View style={styles.teamInfo}>
                        {item.logo ? (
                          <Image
                            source={{ uri: getLogoUrl(item.team, item.logo) }}
                            style={styles.teamLogo}
                          />
                        ) : (
                          <View style={styles.logoPlaceholder} />
                        )}

                        <Text
                          style={[
                            styles.teamText,
                            isCastellon && styles.castellonTeamText,
                          ]}
                          numberOfLines={1}
                        >
                          {item.team}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.statText, styles.smallCell]}>
                      {item.playedgames}
                    </Text>
                    <Text style={[styles.statText, styles.smallCell]}>
                      {goalDiff}
                    </Text>
                    <Text style={[styles.pointsText, styles.pointsCell]}>
                      {item.points}
                    </Text>
                  </Pressable>
                );
              })}
              </View>
            </View>
          ) : (
            <View style={styles.animatedFullWidth}>
              <View style={styles.frozenTableCard}>
              <View style={styles.frozenColumns}>
                <View style={[styles.headerRow, styles.frozenHeaderRow]}>
                  <Text style={[styles.headerCell, styles.rankCell]}>#</Text>
                  <Text style={[styles.headerCell, styles.frozenTeamCell]}>
                    Equipo
                  </Text>
                </View>

                {standings.map((item, index) => {
                  const isCastellon = item.team.toLowerCase().includes('castell');
                  const isDirectPromotion = item.position <= 2;
                  const isPlayoff = item.position >= 3 && item.position <= 6;
                  const isRelegation = item.position >= standings.length - 3;

                  return (
                    <Pressable
                      key={`fixed-${item.team}-${index}`}
                      disabled={!item.teamId}
                      onPress={() => {
                        if (!item.teamId) return;

                        router.push({
                          pathname: '/team/[teamId]',
                          params: { teamId: String(item.teamId) },
                        });
                      }}
                 style={({ pressed }) => [
  styles.row,
  styles.frozenRow,
  isDirectPromotion ? styles.directPromotionRow : null,
  isPlayoff ? styles.playoffRow : null,
  isRelegation ? styles.relegationRow : null,
  isCastellon ? styles.highlightRow : null,
  pressed && !!item.teamId
    ? styles.rowPressed
    : null,
]}
                    >
                      <Text style={[styles.rankText, styles.rankCell]}>
                        {item.position}
                      </Text>

                      <View style={styles.frozenTeamCell}>
                        <View style={styles.teamInfo}>
                          {item.logo ? (
                            <Image
                              source={{ uri: getLogoUrl(item.team, item.logo) }}
                              style={styles.teamLogo}
                            />
                          ) : (
                            <View style={styles.logoPlaceholder} />
                          )}

                          <Text
                            style={[
                              styles.teamText,
                              isCastellon && styles.castellonTeamText,
                            ]}
                            numberOfLines={1}
                          >
                            {item.team}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.statsScroll}
                contentContainerStyle={styles.statsScrollContent}
              >
                <View style={styles.statsTable}>
                  <View style={[styles.headerRow, styles.statsHeaderRow]}>
                    <Text style={[styles.headerCell, styles.fullStatCell]}>PJ</Text>
                    <Text style={[styles.headerCell, styles.fullStatCell]}>G</Text>
                    <Text style={[styles.headerCell, styles.fullStatCell]}>E</Text>
                    <Text style={[styles.headerCell, styles.fullStatCell]}>P</Text>
                    <Text style={[styles.headerCell, styles.fullStatCell]}>GF</Text>
                    <Text style={[styles.headerCell, styles.fullStatCell]}>GC</Text>
                    <Text style={[styles.headerCell, styles.fullStatCell]}>DG</Text>
                    <Text style={[styles.headerCell, styles.fullPointsCell]}>Pts</Text>
                  </View>

                  {standings.map((item, index) => {
                    const isCastellon = item.team.toLowerCase().includes('castell');
                    const isDirectPromotion = item.position <= 2;
                    const isPlayoff = item.position >= 3 && item.position <= 6;
                    const isRelegation = item.position >= standings.length - 3;
                    const goalsfor = item.goalsfor ?? 0;
                    const goalsagainst = item.goalsagainst ?? 0;
                    const goalDiff =
                      item.goaldiff ?? (goalsfor - goalsagainst);

                    return (
                      <View
                        key={`stats-${item.team}-${index}`}
                        style={[
                          styles.row,
                          styles.statsRow,
                          isDirectPromotion && styles.directPromotionStatsRow,
                          isPlayoff && styles.playoffStatsRow,
                          isRelegation && styles.relegationStatsRow,
                          isCastellon && styles.highlightStatsRow,
                        ]}
                      >
                        <Text style={[styles.statText, styles.fullStatCell]}>{item.playedgames}</Text>
                        <Text style={[styles.statText, styles.fullStatCell]}>{item.won}</Text>
                        <Text style={[styles.statText, styles.fullStatCell]}>{item.draw}</Text>
                        <Text style={[styles.statText, styles.fullStatCell]}>{item.lost}</Text>
                        <Text style={[styles.statText, styles.fullStatCell]}>{goalsfor}</Text>
                        <Text style={[styles.statText, styles.fullStatCell]}>{goalsagainst}</Text>
                        <Text style={[styles.statText, styles.fullStatCell]}>{goalDiff}</Text>
                        <Text style={[styles.pointsText, styles.fullPointsCell]}>{item.points}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
              </View>
            </View>
          )}
        </>
      )}

    </ScrollView>
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
    marginBottom: 12,
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
  legendFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  legend: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    flex: 1,
  },
  viewSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  viewButton: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  viewButtonActive: {
    backgroundColor: colors.accent,
  },
  viewButtonText: {
    color: '#9F9F9F',
    fontSize: 10.5,
    fontWeight: '900',
  },
  viewButtonTextActive: {
    color: '#101010',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginRight: 6,
  },
  greenDot: {
    backgroundColor: '#38d46b',
  },
  blueDot: {
    backgroundColor: '#4da3ff',
  },
  redDot: {
    backgroundColor: '#ff5c5c',
  },
  legendText: {
    color: '#bdbdbd',
    fontSize: 11,
    fontWeight: '700',
  },
  loader: {
    marginTop: 30,
  },
  tableCard: {
    backgroundColor: '#101010',
    borderRadius: 18,
    padding: 7,
    borderWidth: 1,
    borderColor: '#242424',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b1b',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '900',
    color: '#929292',
    textTransform: 'uppercase',
  },
  rowPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.995 }],
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#222222',
  },
  directPromotionRow: {
    borderLeftWidth: 4,
    borderLeftColor: '#38d46b',
  },
  playoffRow: {
    borderLeftWidth: 4,
    borderLeftColor: '#4da3ff',
  },
  relegationRow: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff5c5c',
  },
  highlightRow: {
    backgroundColor: '#191714',
    borderColor: colors.accent,
    borderWidth: 0.5,
  },
  rankCell: {
    width: 28,
  },
  teamCell: {
    flex: 1,
    paddingRight: 6,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 30,
    height: 30,
    marginRight: 8,
    resizeMode: 'contain',
  },
  logoPlaceholder: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  smallCell: {
    width: 34,
    textAlign: 'center',
  },
  pointsCell: {
    width: 42,
    textAlign: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  teamText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#f1f1f1',
  },
  castellonTeamText: {
    color: colors.accent,
    fontWeight: '900',
  },
  statText: {
    fontSize: 12,
    color: '#d0d0d0',
    fontWeight: '700',
  },
  pointsText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '900',
  },
  frozenTableCard: {
    flexDirection: 'row',
    backgroundColor: '#101010',
    borderRadius: 18,
    padding: 7,
    borderWidth: 1,
    borderColor: '#242424',
    overflow: 'hidden',
  },
  frozenColumns: {
    width: 210,
    zIndex: 2,
    backgroundColor: '#101010',
  },
  frozenHeaderRow: {
    marginRight: 0,
    marginBottom: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
    backgroundColor: '#1B1B1B',
  },
  frozenRow: {
    minHeight: 52,
    marginRight: 0,
    marginBottom: 5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  frozenTeamCell: {
    flex: 1,
    paddingRight: 6,
    justifyContent: 'center',
  },
  statsScroll: {
    flex: 1,
  },
  statsScrollContent: {
    paddingLeft: 0,
    paddingRight: 2,
  },
  statsTable: {
    width: 390,
  },
  statsHeaderRow: {
    marginBottom: 6,
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
    backgroundColor: '#1B1B1B',
  },
  statsRow: {
    minHeight: 52,
    marginBottom: 5,
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
  },
  directPromotionStatsRow: {
    borderLeftColor: 'transparent',
  },
  playoffStatsRow: {
    borderLeftColor: 'transparent',
  },
  relegationStatsRow: {
    borderLeftColor: 'transparent',
  },
  highlightStatsRow: {
    backgroundColor: '#191714',
    borderColor: colors.accent,
    borderWidth: 0.5,
    borderLeftWidth: 0,
  },
  fullStatCell: {
    width: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  fullPointsCell: {
    width: 42,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  errorText: {
    color: '#ff5c5c',
    marginBottom: 12,
    fontWeight: '700',
  },
});