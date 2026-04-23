import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

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

export default function CalendarScreen() {
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCalendar = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://192.168.1.211:3001/calendar/first-team');
      const data = await response.json();

      if (!Array.isArray(data)) {
        setError('La respuesta del calendario no es válida.');
        setFixtures([]);
        return;
      }

      setFixtures(data);
    } catch (err) {
      setError('No se pudo cargar el calendario.');
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  const now = new Date();

  // 🔵 Próximos partidos
  const upcomingMatches = fixtures
    .filter((m) => {
      const d = new Date(m.date);
      return !isNaN(d.getTime()) && d >= now;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // ⚪ Partidos jugados
  const playedMatches = fixtures
    .filter((m) => {
      const d = new Date(m.date);
      return !isNaN(d.getTime()) && d < now;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha no disponible';

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderScore = (item: FixtureItem) => {
    if (item.homeGoals === null || item.awayGoals === null) {
      return <Text style={styles.pendingText}>VS</Text>;
    }

    return (
      <Text style={styles.scoreText}>
        {item.homeGoals} - {item.awayGoals}
      </Text>
    );
  };

  const renderMatch = (item: FixtureItem) => (
    <View key={item.id} style={styles.card}>
      <Text style={styles.roundText}>{item.round}</Text>
      <Text style={styles.dateText}>{formatDate(item.date)}</Text>

      <View style={styles.matchRow}>
        <View style={styles.teamBox}>
          <Image source={{ uri: item.homeLogo }} style={styles.teamLogo} />
          <Text style={styles.teamName}>{item.homeTeam}</Text>
        </View>

        <View style={styles.centerBox}>
          {renderScore(item)}
        </View>

        <View style={styles.teamBox}>
          <Image source={{ uri: item.awayLogo }} style={styles.teamLogo} />
          <Text style={styles.teamName}>{item.awayTeam}</Text>
        </View>
      </View>

      <Text style={styles.venueText}>{item.venue}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Calendario</Text>

      {loading && <ActivityIndicator size="large" color={colors.accent} />}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && (
        <>
          <Text style={styles.sectionTitle}>Próximos partidos</Text>
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map(renderMatch)
          ) : (
            <Text style={styles.emptyText}>No hay próximos partidos</Text>
          )}

          <Text style={styles.sectionTitle}>Partidos jugados</Text>
          {playedMatches.length > 0 ? (
            playedMatches.map(renderMatch)
          ) : (
            <Text style={styles.emptyText}>No hay partidos jugados</Text>
          )}
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
    paddingBottom: 30,
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
    marginTop: 16,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roundText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: 10,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamBox: {
    flex: 1,
    alignItems: 'center',
  },
  centerBox: {
    width: 80,
    alignItems: 'center',
  },
  teamLogo: {
    width: 42,
    height: 42,
    marginBottom: 6,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  venueText: {
    fontSize: 13,
    color: colors.subtitle,
    textAlign: 'center',
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
  },
  emptyText: {
    color: colors.subtitle,
    marginBottom: 10,
  },
});