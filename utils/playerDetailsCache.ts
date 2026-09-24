const API_BASE = 'https://api.albinegroscastellon.com/api/football';

export const PLAYER_DETAILS_CACHE_MS = 5 * 60 * 1000;

type CacheEntry<T = unknown> = {
  data: T;
  savedAt: number;
};

const playerDetailsCache = new Map<string, CacheEntry>();
const playerDetailsRequests = new Map<string, Promise<unknown>>();

export const getPlayerCacheKey = (
  playerId?: string | number | null,
  teamId?: string | number | null
) => `${playerId ?? ''}:${teamId ?? ''}`;

export const getCachedPlayerDetails = <T>(
  playerId?: string | number | null,
  teamId?: string | number | null
): { data: T; fresh: boolean } | null => {
  const cached = playerDetailsCache.get(getPlayerCacheKey(playerId, teamId));
  if (!cached) return null;

  return {
    data: cached.data as T,
    fresh: Date.now() - cached.savedAt < PLAYER_DETAILS_CACHE_MS,
  };
};

export const fetchPlayerDetails = async <T>(
  playerId: string | number,
  teamId?: string | number | null,
  force = false
): Promise<T> => {
  const cacheKey = getPlayerCacheKey(playerId, teamId);
  const cached = getCachedPlayerDetails<T>(playerId, teamId);

  if (!force && cached?.fresh) {
    return cached.data;
  }

  if (!force) {
    const pending = playerDetailsRequests.get(cacheKey);
    if (pending) return pending as Promise<T>;
  }

  const request = (async () => {
    const teamQuery =
      teamId !== undefined && teamId !== null && String(teamId)
        ? `?teamId=${encodeURIComponent(String(teamId))}`
        : '';

    const response = await fetch(
      `${API_BASE}/player/${encodeURIComponent(String(playerId))}/details${teamQuery}`
    );
    const json = await response.json();

    if (!response.ok || !json?.ok) {
      throw new Error(json?.error || `HTTP ${response.status}`);
    }

    playerDetailsCache.set(cacheKey, {
      data: json,
      savedAt: Date.now(),
    });

    return json as T;
  })();

  if (!force) {
    playerDetailsRequests.set(cacheKey, request);
  }

  try {
    return await request;
  } finally {
    if (!force && playerDetailsRequests.get(cacheKey) === request) {
      playerDetailsRequests.delete(cacheKey);
    }
  }
};

export const prefetchPlayerDetails = async (
  playerId: string | number,
  teamId?: string | number | null
) => {
  try {
    await fetchPlayerDetails(playerId, teamId);
  } catch {
    // El prefetch es oportunista: la ficha hará su carga normal si falla.
  }
};

export const prefetchPlayerDetailsQueue = async (
  players: Array<string | number>,
  teamId?: string | number | null,
  concurrency = 2
) => {
  const pendingPlayers = players.filter(
    (playerId) => !getCachedPlayerDetails(playerId, teamId)?.fresh
  );

  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < pendingPlayers.length) {
      const currentIndex = nextIndex++;
      const playerId = pendingPlayers[currentIndex];
      await prefetchPlayerDetails(playerId, teamId);
    }
  };

  const workers = Array.from(
    { length: Math.min(Math.max(concurrency, 1), pendingPlayers.length) },
    () => worker()
  );

  await Promise.all(workers);
};
