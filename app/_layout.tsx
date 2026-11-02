import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    const openNotificationRoute = (
      response: Notifications.NotificationResponse | null
    ) => {
      if (!response) return;

      const data = response.notification.request.content.data;

      const route =
        typeof data?.route === 'string'
          ? data.route
          : typeof data?.fixtureId === 'number' ||
              typeof data?.fixtureId === 'string'
            ? `/match/${data.fixtureId}`
            : null;

      if (!route) return;

      router.push(route as any);
    };

    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        openNotificationRoute
      );

    const handleInitialNotification = async () => {
      try {
        const response =
          await Notifications.getLastNotificationResponseAsync();

        openNotificationRoute(response);
      } catch (error) {
        console.warn(
          '[notifications] No se pudo procesar la notificación inicial:',
          error
        );
      }
    };

    void handleInitialNotification();

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          animation: 'fade_from_bottom',
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="match/[fixtureId]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Modal',
            animation: 'fade_from_bottom',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}