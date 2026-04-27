import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type StandingItem = {
  position: number;
  team: string;
  points: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

export default function StandingsScreen() {
  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStandings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('https://albinegros-api.onrender.com/standings/first-team');
      const data = await response.json();

      setStandings(data);
    } catch (err) {
      setError('No se pudo cargar la clasificación real.');
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
      <Text style={styles.screenTitle}>Clasificación</Text>
      <Text style={styles.sectionTitle}>Primer equipo</Text>

      {loading && <ActivityIndicator size="large" color={colors.accent} />}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && (
        <>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.rankCell]}>#</Text>
            <Text style={[styles.headerCell, styles.teamCell]}>Equipo</Text>
            <Text style={[styles.headerCell, styles.smallCell]}>PJ</Text>
            <Text style={[styles.headerCell, styles.smallCell]}>G</Text>
            <Text style={[styles.headerCell, styles.smallCell]}>E</Text>
            <Text style={[styles.headerCell, styles.smallCell]}>P</Text>
            <Text style={[styles.headerCell, styles.smallCell]}>Pts</Text>
          </View>

          {standings.map((item, index) => {
            const isCastellon = item.team.toLowerCase().includes('castell');

            return (
              <View
                key={`${item.team}-${index}`}
                style={[styles.row, isCastellon && styles.highlightRow]}
              >
                <Text style={[styles.rankText, styles.rankCell]}>{item.position}</Text>
                <Text style={[styles.teamText, styles.teamCell]} numberOfLines={1}>
                  {item.team}
                </Text>
                <Text style={[styles.statText, styles.smallCell]}>{item.playedGames}</Text>
                <Text style={[styles.statText, styles.smallCell]}>{item.won}</Text>
                <Text style={[styles.statText, styles.smallCell]}>{item.draw}</Text>
                <Text style={[styles.statText, styles.smallCell]}>{item.lost}</Text>
                <Text style={[styles.pointsText, styles.smallCell]}>{item.points}</Text>
              </View>
            );
          })}
        </>
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
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaeaea',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlightRow: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: '#fffaf0',
  },
  rankCell: {
    width: 28,
  },
  teamCell: {
    flex: 1,
    paddingRight: 8,
  },
  smallCell: {
    width: 34,
    textAlign: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
  },
  teamText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  statText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '800',
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
  },
});