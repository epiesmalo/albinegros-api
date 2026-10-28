import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  DEFAULT_PUSH_PREFERENCES,
  PushPreferences,
  registerForPushNotificationsAsync,
} from '@/services/notifications';

const PUSH_PREFERENCES_STORAGE_KEY = '@albinegros/push-preferences';

type PreferenceKey = keyof PushPreferences;

type PreferenceRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

function PreferenceRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}: PreferenceRowProps) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceIcon}>
        <Ionicons name={icon} size={20} color="#D4AF37" />
      </View>

      <View style={styles.preferenceText}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceDescription}>{description}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#343434', true: '#315C3A' }}
        thumbColor={value ? '#D4AF37' : '#B8B8B8'}
        ios_backgroundColor="#343434"
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const [preferences, setPreferences] = useState<PushPreferences>({
    ...DEFAULT_PUSH_PREFERENCES,
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'success' | 'permission-denied' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(PUSH_PREFERENCES_STORAGE_KEY);

        if (stored && mounted) {
          const parsed = JSON.parse(stored) as Partial<PushPreferences>;
          setPreferences({
            ...DEFAULT_PUSH_PREFERENCES,
            ...parsed,
          });
        }
      } catch (error) {
        console.warn('No se pudieron cargar las preferencias push:', error);
      } finally {
        if (mounted) setPreferencesLoaded(true);
      }
    };

    loadPreferences();

    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = (key: PreferenceKey, value: boolean) => {
    setStatus('idle');
    setErrorMessage('');
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const result = await registerForPushNotificationsAsync(preferences);

      if (result.ok) {
        await AsyncStorage.setItem(
          PUSH_PREFERENCES_STORAGE_KEY,
          JSON.stringify(preferences)
        );
        setStatus('success');
        return;
      }

      if (result.reason === 'permission-denied') {
        setStatus('permission-denied');
        return;
      }

      setStatus('error');

      if (result.reason === 'not-physical-device') {
        setErrorMessage(
          'Las notificaciones push necesitan un dispositivo físico.'
        );
      } else if (result.reason === 'missing-project-id') {
        setErrorMessage(
          'No se ha podido identificar esta instalación de la app.'
        );
      } else if (result.reason === 'registration-error') {
        setErrorMessage(
          'No se han podido guardar tus preferencias. Inténtalo de nuevo.'
        );
      } else {
        setErrorMessage(
          'No se han podido activar las notificaciones. Inténtalo de nuevo.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notificaciones',
          headerStyle: { backgroundColor: '#101010' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800' },
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="notifications" size={32} color="#D4AF37" />
          </View>

          <View style={styles.heroText}>
            <Text style={styles.title}>Avisos de partido</Text>
            <Text style={styles.description}>
              Elige qué notificaciones quieres recibir del CD Castellón y del
              Castellón B.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>EQUIPOS</Text>
        <View style={styles.card}>
          <PreferenceRow
            icon="shield-outline"
            title="CD Castellón"
            description="Recibir avisos del primer equipo."
            value={preferences.castellonEnabled}
            disabled={!preferencesLoaded || saving}
            onValueChange={(value) =>
              setPreference('castellonEnabled', value)
            }
          />

          <View style={styles.divider} />

          <PreferenceRow
            icon="people-outline"
            title="Castellón B"
            description="Recibir avisos del filial."
            value={preferences.castellonBEnabled}
            disabled={!preferencesLoaded || saving}
            onValueChange={(value) =>
              setPreference('castellonBEnabled', value)
            }
          />
        </View>

        <Text style={styles.sectionLabel}>TIPOS DE AVISO</Text>
        <View style={styles.card}>
          <PreferenceRow
            icon="alarm-outline"
            title="Recordatorio de partido"
            description="Aviso antes de que comience el encuentro."
            value={preferences.matchReminderEnabled}
            disabled={!preferencesLoaded || saving}
            onValueChange={(value) =>
              setPreference('matchReminderEnabled', value)
            }
          />

          <View style={styles.divider} />

          <PreferenceRow
            icon="play-circle-outline"
            title="Inicio del partido"
            description="Aviso cuando empiece el encuentro."
            value={preferences.matchStartEnabled}
            disabled={!preferencesLoaded || saving}
            onValueChange={(value) =>
              setPreference('matchStartEnabled', value)
            }
          />

          <View style={styles.divider} />

          <PreferenceRow
            icon="football-outline"
            title="Goles"
            description="Avisos de goles del Castellón y del rival."
            value={preferences.goalsEnabled}
            disabled={!preferencesLoaded || saving}
            onValueChange={(value) =>
              setPreference('goalsEnabled', value)
            }
          />

          <View style={styles.divider} />

          <PreferenceRow
            icon="pause-circle-outline"
            title="Descanso"
            description="Resultado al finalizar la primera parte."
            value={preferences.halftimeEnabled}
            disabled={!preferencesLoaded || saving}
            onValueChange={(value) =>
              setPreference('halftimeEnabled', value)
            }
          />

          <View style={styles.divider} />

          <PreferenceRow
            icon="checkmark-circle-outline"
            title="Final del partido"
            description="Resultado definitivo al terminar el encuentro."
            value={preferences.fulltimeEnabled}
            disabled={!preferencesLoaded || saving}
            onValueChange={(value) =>
              setPreference('fulltimeEnabled', value)
            }
          />
        </View>

        {status === 'success' ? (
          <View style={[styles.messageCard, styles.successCard]}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#D4AF37"
            />
            <Text style={styles.messageText}>
              Notificaciones activadas y preferencias guardadas.
            </Text>
          </View>
        ) : null}

        {status === 'permission-denied' ? (
          <View style={styles.messageCard}>
            <Ionicons
              name="notifications-off-outline"
              size={20}
              color="#D4AF37"
            />
            <Text style={styles.messageText}>
              El permiso de notificaciones está desactivado en este
              dispositivo. Actívalo en los ajustes del sistema para recibir
              avisos.
            </Text>
          </View>
        ) : null}

        {status === 'error' ? (
          <View style={styles.messageCard}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#D4AF37"
            />
            <Text style={styles.messageText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || !preferencesLoaded}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#000000"
              />
              <Text style={styles.saveButtonText}>
                GUARDAR Y ACTIVAR
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Puedes cambiar estas preferencias cuando quieras.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 18,
    paddingBottom: 78,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#262626',
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#315C3A',
  },
  heroText: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
  },
  description: {
    color: '#AFAFAF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  sectionLabel: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginLeft: 4,
    marginBottom: 9,
  },
  card: {
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#262626',
  },
  preferenceRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#252525',
  },
  preferenceText: {
    flex: 1,
    paddingRight: 12,
  },
  preferenceTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  preferenceDescription: {
    color: '#999999',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  divider: {
    height: 1,
    marginLeft: 52,
    backgroundColor: '#242424',
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#5B4A1D',
  },
  successCard: {
    borderColor: '#315C3A',
  },
  messageText: {
    flex: 1,
    color: '#D7D7D7',
    fontSize: 12,
    lineHeight: 18,
  },
  saveButton: {
    minHeight: 56,
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.35,
  },
  footerText: {
    color: '#777777',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 13,
  },
});
