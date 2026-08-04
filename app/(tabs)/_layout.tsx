import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
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
  fontSize: 9,
  fontWeight: '700',
  marginTop: -2,
},
tabBarIconStyle: {
  marginTop: -2,
},
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="radio" options={{ title: 'Radio', tabBarIcon: ({ color }) => <Ionicons name="radio" size={22} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Clasific.', tabBarIcon: ({ color }) => <Ionicons name="trophy" size={22} color={color} /> }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calend.', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="news" options={{ title: 'Noticias', tabBarIcon: ({ color }) => <Ionicons name="newspaper" size={22} color={color} /> }} />
      <Tabs.Screen name="media" options={{ title: 'Media', tabBarIcon: ({ color }) => <Ionicons name="musical-notes" size={22} color={color} /> }} />
      <Tabs.Screen name="gallery" options={{ title: 'Galería', tabBarIcon: ({ color }) => <Ionicons name="images" size={22} color={color} /> }} />
      <Tabs.Screen name="shop" options={{ title: 'Tienda', tabBarIcon: ({ color }) => <Ionicons name="bag-handle-outline" size={22} color={color} /> }} />
    </Tabs>
  );
}