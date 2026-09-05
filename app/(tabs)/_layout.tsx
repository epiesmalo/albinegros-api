import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';

export default function TabLayout() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline =
        state.isConnected === false ||
        state.isInternetReachable === false;

      setIsOffline(offline);
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.root}>
      {isOffline && (
        <Animated.View
          entering={FadeInDown.duration(180)}
          exiting={FadeOutUp.duration(160)}
          style={styles.offlineBanner}
        >
          <View style={styles.offlineDot} />
          <Text style={styles.offlineText}>
            Sin conexión · usando datos guardados
          </Text>
        </Animated.View>
      )}

      <View style={styles.tabsContainer}>
        <Tabs
          screenOptions={{
            animation: 'none',
            headerTitleAlign: 'center',
            headerStyle: {
              backgroundColor: '#101010',
              height: 58,
            },
            headerTitleStyle: {
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '800',
            },

            tabBarActiveTintColor: '#d4af37',
            tabBarInactiveTintColor: '#777',

            tabBarStyle: {
              backgroundColor: '#050505',
              borderTopColor: '#1f1f1f',
              height: 92,
              paddingTop: 4,
              paddingBottom: 34,
            },
            tabBarItemStyle: {
              paddingBottom: 2,
            },
            tabBarLabelStyle: {
              fontSize: 8,
              fontWeight: '700',
              marginTop: -2,
            },
            tabBarIconStyle: {
              marginTop: -2,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Inicio',
              tabBarIcon: ({ color }) => (
                <Ionicons name="home" size={21} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="radio"
            options={{
              title: 'Radio',
              tabBarIcon: ({ color }) => (
                <Ionicons name="radio" size={21} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Clasific.',
              tabBarIcon: ({ color }) => (
                <Ionicons name="trophy" size={21} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: 'Partidos',
              tabBarIcon: ({ color }) => (
                <Ionicons name="calendar" size={21} color={color} />
              ),
            }}
          />
        <Tabs.Screen
  name="live"
  options={{
    href: null,
  }}
/>
          <Tabs.Screen
            name="news"
            options={{
              title: 'Noticias',
              tabBarIcon: ({ color }) => (
                <Ionicons name="newspaper" size={21} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="media"
            options={{
              title: 'Media',
              tabBarIcon: ({ color }) => (
                <Ionicons name="musical-notes" size={21} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="gallery"
            options={{
              title: 'Galería',
              tabBarIcon: ({ color }) => (
                <Ionicons name="images" size={21} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="shop"
            options={{
              title: 'Tienda',
              tabBarIcon: ({ color }) => (
                <Ionicons
                  name="bag-handle-outline"
                  size={21}
                  color={color}
                />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050505',
  },

  tabsContainer: {
    flex: 1,
  },

  offlineBanner: {
    minHeight: 34,
    backgroundColor: '#17130A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  offlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#D4AF37',
    marginRight: 7,
  },

  offlineText: {
    color: '#D8C67A',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});
