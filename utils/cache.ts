import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheEnvelope<T> = {
  data: T;
  savedAt: string;
  version: 1;
};

export const CACHE_KEYS = {
  LIVE: 'albinegros_cache_live',
  HOME_NEXT_MATCH: 'albinegros_cache_home_next_match',
  HOME_ADS: 'albinegros_cache_home_ads',
  STANDINGS: 'albinegros_cache_standings',
  CALENDAR: 'albinegros_cache_calendar',
  NEWS: 'albinegros_cache_news',
  GALLERY: 'albinegros_cache_gallery',
} as const;

export type CacheKey = (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS];

export type CachedResult<T> = {
  data: T;
  savedAt: string;
};

export async function saveCache<T>(
  key: CacheKey | string,
  data: T
): Promise<void> {
  const payload: CacheEnvelope<T> = {
    data,
    savedAt: new Date().toISOString(),
    version: 1,
  };

  try {
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.log(`[cache] No se pudo guardar ${key}:`, error);
  }
}

export async function getCache<T>(
  key: CacheKey | string
): Promise<CachedResult<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CacheEnvelope<T>>;

    if (
      parsed.version !== 1 ||
      typeof parsed.savedAt !== 'string' ||
      !('data' in parsed)
    ) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return {
      data: parsed.data as T,
      savedAt: parsed.savedAt,
    };
  } catch (error) {
    console.log(`[cache] No se pudo leer ${key}:`, error);
    return null;
  }
}

export async function removeCache(
  key: CacheKey | string
): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log(`[cache] No se pudo borrar ${key}:`, error);
  }
}

export async function clearAppCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
  } catch (error) {
    console.log('[cache] No se pudo limpiar la caché de la app:', error);
  }
}

export function formatCacheAge(
  savedAt?: string | null,
  now = Date.now()
): string {
  if (!savedAt) {
    return '';
  }

  const savedTime = new Date(savedAt).getTime();

  if (Number.isNaN(savedTime)) {
    return '';
  }

  const diffMs = Math.max(0, now - savedTime);
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'guardados ahora';
  if (minutes < 60) return `guardados hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `guardados hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) return 'guardados ayer';

  return `guardados hace ${days} días`;
}
