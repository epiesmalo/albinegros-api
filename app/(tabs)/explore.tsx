import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type StandingItem = {
  position: number;
  team: string;
  logo?: string;
  points: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
};

const getLogoUrl = (teamName: string, logo?: string) => {
  if (teamName.toLowerCase().includes('castell')) {
    return 'https://www.albinegroscastellon.com/cas.png?v=2';
  }

  return logo;
};

export default function StandingsScreen() {
  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStandings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('https://api.albinegroscastellon.com/standings/first-team');
      const data = await response.json();

      setStandings(data);
    } catch (err) {
      setError('No se pudo cargar la clasificación.');
      setStandings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandings();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>SEGUNDA DIVISIÓN</Text>
        <Text style={styles.subtitle}>Temporada 2026/27</Text>
      </View>

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

        <View style={styles.compactFilter}>
          <Text style={styles.compactFilterText}>Resumida</Text>
          <Text style={styles.compactChevron}>▾</Text>
        </View>
      </View>

      {loading && <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && (
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
              item.goalDifference ??
              ((item.goalsFor ?? 0) - (item.goalsAgainst ?? 0));

            return (
              <View
                key={`${item.team}-${index}`}
                style={[
                  styles.row,
                  isDirectPromotion && styles.directPromotionRow,
                  isPlayoff && styles.playoffRow,
                  isRelegation && styles.relegationRow,
                  isCastellon && styles.highlightRow,
                ]}
              >
                <Text style={[styles.rankText, styles.rankCell]}>{item.position}</Text>

                <View style={styles.teamCell}>
                  <View style={styles.teamInfo}>
                    {item.logo ? (
                      <Image source={{ uri: getLogoUrl(item.team, item.logo) }} style={styles.teamLogo} />
                    ) : (
                      <View style={styles.logoPlaceholder} />
                    )}

                    <Text
                      style={[styles.teamText, isCastellon && styles.castellonTeamText]}
                      numberOfLines={1}
                    >
                      {item.team}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.statText, styles.smallCell]}>{item.playedGames}</Text>
                <Text style={[styles.statText, styles.smallCell]}>{goalDiff}</Text>
                <Text style={[styles.pointsText, styles.pointsCell]}>{item.points}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  compactFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
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
  errorText: {
    color: '#ff5c5c',
    marginBottom: 12,
    fontWeight: '700',
  },
});