import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import { getCache, saveCache } from '../../utils/cache';


type CompetitionKey =
  | 'laliga'
  | 'laliga2'
  | 'primera-rfef-1'
  | 'primera-rfef-2'
  | 'segunda-rfef-3';

type CompetitionConfig = {
  key: CompetitionKey;
  shortLabel: string;
  title: string;
  leagueId: number;
  highlightTeamId?: number;
  directPromotion: (position: number) => boolean;
  playoff: (position: number) => boolean;
  relegation: (position: number, total: number) => boolean;
  directLabel: string;
  playoffLabel: string;
};

const COMPETITIONS: CompetitionConfig[] = [
  {
    key: 'laliga2',
    shortLabel: '2ª',
    title: 'SEGUNDA DIVISIÓN',
    leagueId: 567,
    highlightTeamId: 5254,
    directPromotion: (position) => position <= 2,
    playoff: (position) => position >= 3 && position <= 6,
    relegation: (position, total) => position >= total - 3,
    directLabel: 'Ascenso',
    playoffLabel: 'Playoff',
  },
  {
    key: 'laliga',
    shortLabel: '1ª',
    title: 'PRIMERA DIVISIÓN',
    leagueId: 564,
    directPromotion: (position) => position >= 2 && position <= 4,
    playoff: (position) => position === 5,
    relegation: (position, total) => position >= total - 2,
    directLabel: 'Champions',
    playoffLabel: 'Europa League',
  },
  {
    key: 'primera-rfef-1',
    shortLabel: '1ª RFEF G1',
    title: 'PRIMERA FEDERACIÓN · GRUPO 1',
    leagueId: 2333,
    directPromotion: (position) => position === 1,
    playoff: (position) => position >= 2 && position <= 5,
    relegation: (position, total) => position >= total - 4,
    directLabel: 'Ascenso',
    playoffLabel: 'Playoff',
  },
  {
    key: 'primera-rfef-2',
    shortLabel: '1ª RFEF G2',
    title: 'PRIMERA FEDERACIÓN · GRUPO 2',
    leagueId: 2334,
    directPromotion: (position) => position === 1,
    playoff: (position) => position >= 2 && position <= 5,
    relegation: (position, total) => position >= total - 4,
    directLabel: 'Ascenso',
    playoffLabel: 'Playoff',
  },
  {
    key: 'segunda-rfef-3',
    shortLabel: '2ª RFEF G3',
    title: 'SEGUNDA FEDERACIÓN · GRUPO 3',
    leagueId: 2338,
    highlightTeamId: 29495,
    directPromotion: (position) => position === 1,
    playoff: (position) => position >= 2 && position <= 5,
    relegation: (position, total) => position >= total - 4,
    directLabel: 'Ascenso',
    playoffLabel: 'Playoff',
  },
];

const isChampionPosition = (competitionKey: CompetitionKey, position: number) =>
  competitionKey === 'laliga' && position === 1;

const isConferencePosition = (competitionKey: CompetitionKey, position: number) =>
  competitionKey === 'laliga' && position === 6;

const isRelegationPlayoutPosition = (
  competitionKey: CompetitionKey,
  position: number,
  total: number
) => competitionKey === 'segunda-rfef-3' && position === total - 5;

const getStandingsCacheKey = (competitionKey: CompetitionKey) =>
  `standings_${competitionKey}`;

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
  const team = teamName
    .toLowerCase()
    .trim();

  const isCastellon =
    team === 'c.d. castellón' ||
    team === 'c.d. castellon' ||
    team === 'cd castellón' ||
    team === 'cd castellon' ||
    team === 'castellón' ||
    team === 'castellon';

  if (isCastellon) {
    return 'https://archivos.albinegroscastellon.com/cas.png?v=2';
  }

  if (team.includes('andorra')) {
    return 'https://archivos.albinegroscastellon.com/images/8157.png';
  }

  if (team.includes('eldense')) {
    return 'https://archivos.albinegroscastellon.com/images/9692.png';
  }

  if (team.includes('ceuta')) {
    return 'https://archivos.albinegroscastellon.com/images/10139.png';
  }

  return logo;
};

const isHighlightedTeam = (
  competitionKey: CompetitionKey,
  item: StandingItem
) => {
  const teamId = Number(item.teamId);
  const teamName = String(item.team || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  if (competitionKey === 'laliga2') {
    return (
      teamId === 5254 ||
      teamName === 'c.d. castellón' ||
      teamName === 'c.d. castellon' ||
      teamName === 'cd castellón' ||
      teamName === 'cd castellon' ||
      teamName === 'castellón' ||
      teamName === 'castellon'
    );
  }

  if (competitionKey === 'segunda-rfef-3') {
    return (
      teamId === 29495 ||
      teamName === 'c.d. castellón b' ||
      teamName === 'c.d. castellon b' ||
      teamName === 'cd castellón b' ||
      teamName === 'cd castellon b'
    );
  }

  return false;
};

function LiveDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.liveDot,
        {
          opacity,
        },
      ]}
    />
  );
}

export default function StandingsScreen() {
  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'full'>('summary');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [liveTeamIds, setLiveTeamIds] = useState<Set<number>>(new Set());
  const [competitionKey, setCompetitionKey] = useState<CompetitionKey>('laliga2');
  const standingsRequestIdRef = useRef(0);
  const competitionKeyRef = useRef<CompetitionKey>('laliga2');
  competitionKeyRef.current = competitionKey;

  const selectedCompetition =
    COMPETITIONS.find((competition) => competition.key === competitionKey) ??
    COMPETITIONS[0];

  const loadLiveTeams = useCallback(async () => {
    // Conservamos el sistema LIVE actual únicamente para Segunda División.
    // El endpoint /api/football/live ya estaba funcionando con esta competición.
    if (competitionKey !== 'laliga2') {
      setLiveTeamIds(new Set());
      return;
    }

    try {
      const response = await fetch(
        'https://api.albinegroscastellon.com/api/football/live'
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const activeStatuses = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE']);
      const matches = Array.isArray(data?.matches) ? data.matches : [];
      const ids = new Set<number>();

      matches.forEach((match: any) => {
        if (Number(match?.league?.id) !== selectedCompetition.leagueId) return;
        if (!activeStatuses.has(String(match?.status?.short || ''))) return;

        const homeId = Number(match?.home?.id);
        const awayId = Number(match?.away?.id);
        if (Number.isFinite(homeId)) ids.add(homeId);
        if (Number.isFinite(awayId)) ids.add(awayId);
      });

      setLiveTeamIds(ids);
    } catch (err) {
      console.log('Error cargando equipos en directo:', err);
    }
  }, [competitionKey, selectedCompetition.leagueId]);

  const loadStandings = useCallback(async (isRefresh = false) => {
    const requestedCompetitionKey = competitionKey;
    const requestId = ++standingsRequestIdRef.current;
    const cacheKey = getStandingsCacheKey(requestedCompetitionKey);
    const isCurrentRequest = () =>
      requestId === standingsRequestIdRef.current &&
      competitionKeyRef.current === requestedCompetitionKey;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        const cachedStandings = await getCache<StandingItem[]>(cacheKey as any);

        if (Array.isArray(cachedStandings?.data) && cachedStandings.data.length > 0) {
          if (!isCurrentRequest()) return;
          setStandings(cachedStandings.data);
          setLoading(false);
        } else {
          if (!isCurrentRequest()) return;
          setStandings([]);
          setLoading(true);
        }
      }

      setError('');
      let data: StandingItem[] | null = null;

      if (requestedCompetitionKey === 'laliga2') {
        // Segunda mantiene exactamente el sistema actual: sincronización,
        // clasificación LIVE temporal y fallback oficial de Supabase.
        try {
          const syncResponse = await fetch(
            'https://api.albinegroscastellon.com/api/football/sync-standings',
            { method: 'POST' }
          );

          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            if (Array.isArray(syncData?.standings)) data = syncData.standings;
          }
        } catch (syncError) {
          console.log('No se pudo sincronizar la clasificación:', syncError);
        }

        if (!data) {
          const response = await fetch(
            'https://api.albinegroscastellon.com/standings/first-team'
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const fallbackData = await response.json();
          if (!Array.isArray(fallbackData)) {
            throw new Error('La respuesta de la clasificación no es válida.');
          }
          data = fallbackData;
        }
      } else {
        // El resto de competiciones usa el endpoint genérico de SportMonks
        // que ya existe en el backend.
        const response = await fetch(
          `https://api.albinegroscastellon.com/api/sportmonks/standings/${requestedCompetitionKey}`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const responseData = await response.json();
        if (!Array.isArray(responseData?.standings)) {
          throw new Error('La respuesta de la clasificación no es válida.');
        }
        data = responseData.standings;
      }

      const resolvedData = data ?? [];
      if (!isCurrentRequest()) return;
      setStandings(resolvedData);
      setCurrentTime(Date.now());
      await saveCache(cacheKey as any, resolvedData);
    } catch (err) {
      console.log(`Error cargando clasificación ${requestedCompetitionKey}:`, err);
      const cachedStandings = await getCache<StandingItem[]>(cacheKey as any);

      if (!isCurrentRequest()) return;
      if (Array.isArray(cachedStandings?.data) && cachedStandings.data.length > 0) {
        setStandings(cachedStandings.data);
        setError('');
      } else {
        setError('No se pudo cargar la clasificación.');
        setStandings([]);
      }
    } finally {
      if (isCurrentRequest()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [competitionKey]);

  useFocusEffect(
    useCallback(() => {
      loadStandings();
      loadLiveTeams();

      const standingsInterval = setInterval(() => loadStandings(true), 60_000);
      const liveInterval = setInterval(() => loadLiveTeams(), 30_000);

      return () => {
        clearInterval(standingsInterval);
        clearInterval(liveInterval);
      };
    }, [loadStandings, loadLiveTeams])
  );

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
          <Text style={styles.kicker}>{selectedCompetition.title}</Text>
          <Text style={styles.subtitle}>Temporada 2026/27</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.competitionSelector}
        >
          {COMPETITIONS.map((competition) => {
            const active = competition.key === competitionKey;
            return (
              <Pressable
                key={competition.key}
                onPress={() => setCompetitionKey(competition.key)}
                style={[
                  styles.competitionButton,
                  active && styles.competitionButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.competitionButtonText,
                    active && styles.competitionButtonTextActive,
                  ]}
                >
                  {competition.shortLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View>
      <View style={styles.legendFiltersRow}>
        <View style={styles.legend}>
          {competitionKey === 'laliga' && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.goldDot]} />
              <Text style={styles.legendText}>Campeón</Text>
            </View>
          )}

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.greenDot]} />
            <Text style={styles.legendText}>{selectedCompetition.directLabel}</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.blueDot]} />
            <Text style={styles.legendText}>{selectedCompetition.playoffLabel}</Text>
          </View>

          {competitionKey === 'laliga' && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.purpleDot]} />
              <Text style={styles.legendText}>Conference</Text>
            </View>
          )}

          {competitionKey === 'segunda-rfef-3' && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.orangeDot]} />
              <Text style={styles.legendText}>Playout descenso</Text>
            </View>
          )}

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
                const isCastellon =
                  isHighlightedTeam(competitionKey, item);
                const isLive =
  item.teamId !== null &&
  liveTeamIds.has(Number(item.teamId));
                const isDirectPromotion = selectedCompetition.directPromotion(item.position);
                const isPlayoff = selectedCompetition.playoff(item.position);
                const isRelegation = selectedCompetition.relegation(item.position, standings.length);
                const isChampion = isChampionPosition(competitionKey, item.position);
                const isConference = isConferencePosition(competitionKey, item.position);
                const isRelegationPlayout = isRelegationPlayoutPosition(competitionKey, item.position, standings.length);
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
  isChampion ? styles.championRow : null,
  isConference ? styles.conferenceRow : null,
  isRelegationPlayout ? styles.relegationPlayoutRow : null,
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

                        <View style={styles.teamNameRow}>
  <Text
    style={[
      styles.teamText,
      isCastellon && styles.castellonTeamText,
    ]}
    numberOfLines={1}
  >
    {item.team}
  </Text>

  {isLive && (
    <View style={styles.liveIndicator}>
      <Text style={styles.liveText}>En directo</Text>
      <LiveDot />
    </View>
  )}
</View>
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
                  const isCastellon =
                  isHighlightedTeam(competitionKey, item);
                  const isLive =
  item.teamId !== null &&
  liveTeamIds.has(Number(item.teamId));
                  const isDirectPromotion = selectedCompetition.directPromotion(item.position);
                  const isPlayoff = selectedCompetition.playoff(item.position);
                  const isRelegation = selectedCompetition.relegation(item.position, standings.length);
                const isChampion = isChampionPosition(competitionKey, item.position);
                const isConference = isConferencePosition(competitionKey, item.position);
                const isRelegationPlayout = isRelegationPlayoutPosition(competitionKey, item.position, standings.length);

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
  isChampion ? styles.championRow : null,
  isConference ? styles.conferenceRow : null,
  isRelegationPlayout ? styles.relegationPlayoutRow : null,
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

                          <View style={styles.teamNameRow}>
  <Text
    style={[
      styles.teamText,
      isCastellon && styles.castellonTeamText,
    ]}
    numberOfLines={1}
  >
    {item.team}
  </Text>

  {isLive && (
    <View style={styles.liveIndicator}>
      <Text style={styles.liveText}>En directo</Text>
      <LiveDot />
    </View>
  )}
</View>
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
                    const isCastellon =
                  isHighlightedTeam(competitionKey, item);
                    const isDirectPromotion = selectedCompetition.directPromotion(item.position);
                    const isPlayoff = selectedCompetition.playoff(item.position);
                    const isRelegation = selectedCompetition.relegation(item.position, standings.length);
                const isChampion = isChampionPosition(competitionKey, item.position);
                const isConference = isConferencePosition(competitionKey, item.position);
                const isRelegationPlayout = isRelegationPlayoutPosition(competitionKey, item.position, standings.length);
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
                          isChampion && styles.championStatsRow,
                          isConference && styles.conferenceStatsRow,
                          isRelegationPlayout && styles.relegationPlayoutStatsRow,
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
  competitionSelector: {
    gap: 7,
    paddingBottom: 12,
    paddingRight: 8,
  },
  competitionButton: {
    backgroundColor: '#151515',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  competitionButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  competitionButtonText: {
    color: '#A5A5A5',
    fontSize: 10.5,
    fontWeight: '900',
  },
  competitionButtonTextActive: {
    color: '#101010',
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
  goldDot: {
    backgroundColor: '#f5c542',
  },
  greenDot: {
    backgroundColor: '#38d46b',
  },
  blueDot: {
    backgroundColor: '#4da3ff',
  },
  purpleDot: {
    backgroundColor: '#b56cff',
  },
  orangeDot: {
    backgroundColor: '#ff9f43',
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
  championRow: {
    borderLeftWidth: 4,
    borderLeftColor: '#f5c542',
  },
  conferenceRow: {
    borderLeftWidth: 4,
    borderLeftColor: '#b56cff',
  },
  relegationPlayoutRow: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9f43',
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
  teamNameRow: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
},
liveIndicator: {
  flexDirection: 'row',
  alignItems: 'center',
  marginLeft: 6,
},

liveText: {
  color: '#ff2d2d',
  fontSize: 9,
  fontWeight: '800',
  marginRight: 4,
},

liveDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#ff2d2d',
  marginLeft: 6,
  shadowColor: '#ff2d2d',
  shadowOpacity: 0.9,
  shadowRadius: 5,
  elevation: 4,
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
  championStatsRow: {
    borderLeftColor: 'transparent',
  },
  conferenceStatsRow: {
    borderLeftColor: 'transparent',
  },
  relegationPlayoutStatsRow: {
    borderLeftColor: 'transparent',
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