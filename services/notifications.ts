import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const API_BASE = 'https://api.albinegroscastellon.com';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushPreferences = {
  castellonEnabled: boolean;
  castellonBEnabled: boolean;
  matchReminderEnabled: boolean;
  matchStartEnabled: boolean;
  goalsEnabled: boolean;
  halftimeEnabled: boolean;
  fulltimeEnabled: boolean;
};

export const DEFAULT_PUSH_PREFERENCES: PushPreferences = {
  castellonEnabled: true,
  castellonBEnabled: true,
  matchReminderEnabled: true,
  matchStartEnabled: true,
  goalsEnabled: true,
  halftimeEnabled: true,
  fulltimeEnabled: true,
};

export type PushRegistrationResult =
  | { ok: true; token: string; registered: true }
  | {
      ok: false;
      reason:
        | 'not-physical-device'
        | 'permission-denied'
        | 'missing-project-id'
        | 'token-error'
        | 'registration-error';
      token?: string;
      error?: string;
    };

async function registerPushTokenInBackend(
  token: string,
  preferences: PushPreferences
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/notifications/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expoPushToken: token,
        platform: Platform.OS,
        ...preferences,
      }),
    }
  );

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const data = await response.json();

      if (
        data &&
        typeof data.error === 'string'
      ) {
        errorMessage = data.error;
      }
    } catch {
      // La respuesta no contenía JSON válido.
    }

    throw new Error(errorMessage);
  }
}

export async function registerForPushNotificationsAsync(
  preferences: PushPreferences = DEFAULT_PUSH_PREFERENCES
): Promise<PushRegistrationResult> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(
      'match-alerts',
      {
        name: 'Partidos',
        description:
          'Avisos de partidos del CD Castellón y Castellón B',
        importance:
          Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      }
    );
  }

  if (!Device.isDevice) {
    return {
      ok: false,
      reason: 'not-physical-device',
    };
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return {
      ok: false,
      reason: 'permission-denied',
    };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    return {
      ok: false,
      reason: 'missing-project-id',
    };
  }

  let token: string;

  try {
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
  } catch (error) {
    return {
      ok: false,
      reason: 'token-error',
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }

  try {
    await registerPushTokenInBackend(token, preferences);
  } catch (error) {
    return {
      ok: false,
      reason: 'registration-error',
      token,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }

  return {
    ok: true,
    token,
    registered: true,
  };
}
