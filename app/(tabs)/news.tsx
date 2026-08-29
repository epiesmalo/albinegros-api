import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';

import { CACHE_KEYS, formatCacheAge, getCache, saveCache } from '../../utils/cache';

type NewsItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  date: string;
  source: string;
};

const NEWS_PER_PAGE = 5;
const FALLBACK_NEWS_IMAGE = require('../../assets/images/news_fallback.png');

function formatRelativeDate(dateValue: string) {
  if (!dateValue) return '';

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

  if (diffHours < 24) {
    return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
  }

  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
  })
    .format(parsedDate)
    .replace('.', '');
}

function normalizeSource(source: string) {
  return source?.trim() || 'Albinegros Castellón';
}

function NewsSkeleton() {
  return (
    <View>
      <View style={[styles.skeletonCard, styles.skeletonHero]}>
        <View style={styles.skeletonHeroImage} />

        <View style={styles.skeletonContent}>
          <View style={[styles.skeletonLine, { width: '36%' }]} />
          <View style={[styles.skeletonLine, { width: '92%', height: 18 }]} />
          <View style={[styles.skeletonLine, { width: '72%', height: 18 }]} />
          <View style={[styles.skeletonLine, { width: '48%' }]} />
        </View>
      </View>

      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.skeletonCompactCard}>
          <View style={styles.skeletonCompactImage} />

          <View style={styles.skeletonCompactContent}>
            <View style={[styles.skeletonLine, { width: '38%' }]} />
            <View style={[styles.skeletonLine, { width: '94%', height: 16 }]} />
            <View style={[styles.skeletonLine, { width: '68%', height: 16 }]} />
            <View style={[styles.skeletonLine, { width: '48%' }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [cacheSavedAt, setCacheSavedAt] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const loadNews = useCallback(async (isRefresh = false) => {
  try {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      const cachedNews = await getCache<NewsItem[]>(CACHE_KEYS.NEWS);

      if (
        Array.isArray(cachedNews?.data) &&
        cachedNews.data.length > 0
      ) {
        setNews(cachedNews.data);
        setCurrentPage(1);
        setFailedImages({});
        setUsingCachedData(true);
        setCacheSavedAt(cachedNews.savedAt);
        setCurrentTime(Date.now());
        setLoading(false);
      } else {
        setLoading(true);
      }
    }

    setError('');

    const response = await fetch(
      'https://api.albinegroscastellon.com/news'
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const normalizedNews: NewsItem[] = Array.isArray(data) ? data : [];

    setNews(normalizedNews);
    setCurrentPage(1);
    setFailedImages({});
    setUsingCachedData(false);
    setCacheSavedAt(null);
    setCurrentTime(Date.now());

    await saveCache(CACHE_KEYS.NEWS, normalizedNews);
  } catch (err) {
    console.error('Error cargando noticias:', err);

    const cachedNews = await getCache<NewsItem[]>(CACHE_KEYS.NEWS);

    if (
      Array.isArray(cachedNews?.data) &&
      cachedNews.data.length > 0
    ) {
      setNews(cachedNews.data);
      setCurrentPage(1);
      setFailedImages({});
      setUsingCachedData(true);
      setCacheSavedAt(cachedNews.savedAt);
      setCurrentTime(Date.now());
      setError('');
    } else {
      setError('No se pudieron cargar las noticias.');
      setNews([]);
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  const totalPages = Math.max(
    1,
    Math.ceil(news.length / NEWS_PER_PAGE)
  );

  const currentNews = useMemo(() => {
    const startIndex = (currentPage - 1) * NEWS_PER_PAGE;

    return news.slice(startIndex, startIndex + NEWS_PER_PAGE);
  }, [currentPage, news]);

  const featuredNews = currentNews[0];
  const secondaryNews = currentNews.slice(1);

  const openLink = async (url: string) => {
  if (!url) return;

  try {
    await Linking.openURL(url);
  } catch (err) {
    console.error('No se pudo abrir la noticia:', err);
  }
};

  const changePage = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === currentPage
    ) {
      return;
    }

    setCurrentPage(nextPage);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadNews(true)}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.card}
        />
      }
    >
      <View>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ACTUALIDAD ALBINEGRA</Text>
            <Text style={styles.screenTitle}>Noticias</Text>
            <Text style={styles.headerDescription}>
              Últimas noticias del C.D. Castellón.
            </Text>
          </View>

          {!loading && !error && news.length > 0 ? (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{news.length}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {usingCachedData && (
        <View>
          <View style={styles.cachedBanner}>
            <View style={styles.cachedDot} />
            <Text style={styles.cachedText}>
              Mostrando noticias guardadas
              {cacheSavedAt
                ? ` · ${formatCacheAge(cacheSavedAt, currentTime)}`
                : ''}
            </Text>
          </View>
        </View>
      )}

      {loading ? <NewsSkeleton /> : null}

      {!loading && error ? (
        <View>
          <View style={styles.messageCard}>
            <Text style={styles.errorTitle}>
              No se pudieron cargar
            </Text>

            <Text style={styles.errorText}>{error}</Text>

            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => loadNews()}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {!loading && !error && news.length === 0 ? (
        <View>
          <View style={styles.messageCard}>
            <Text style={styles.emptyTitle}>
              Todavía no hay noticias
            </Text>

            <Text style={styles.emptyText}>
              Las últimas novedades del C.D. Castellón aparecerán aquí.
            </Text>
          </View>
        </View>
      ) : null}

      {!loading && !error && featuredNews ? (
        <>
          <View style={styles.animatedFullWidth}>
          <Pressable
            style={({ pressed }) => [
              styles.featuredCard,
              pressed && styles.cardPressed,
            ]}
            onPress={() => openLink(featuredNews.link)}
          >
            {featuredNews.image && !failedImages[featuredNews.id] ? (
              <Image
                source={{ uri: featuredNews.image }}
                style={styles.featuredImage}
                resizeMode="cover"
                onError={() =>
                  setFailedImages((previous) => ({
                    ...previous,
                    [featuredNews.id]: true,
                  }))
                }
              />
            ) : (
              <View style={styles.featuredImageFallback}>
                <Image
                  source={FALLBACK_NEWS_IMAGE}
                  style={styles.featuredFallbackLogo}
                  resizeMode="contain"
                />
              </View>
            )}

            <View style={styles.featuredOverlay} />

            <View style={styles.featuredTopRow}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>
                  DESTACADA
                </Text>
              </View>

              <Text style={styles.featuredDate}>
                {formatRelativeDate(featuredNews.date)}
              </Text>
            </View>

            <View style={styles.featuredContent}>
              <Text style={styles.featuredSource}>
                {normalizeSource(featuredNews.source)}
              </Text>

              <Text style={styles.featuredTitle} numberOfLines={3}>
                {featuredNews.title}
              </Text>

              <View style={styles.readRow}>
                <Text style={styles.readText}>Leer noticia</Text>
                <Text style={styles.readArrow}>→</Text>
              </View>
            </View>
          </Pressable>
          </View>

          <View style={styles.secondaryList}>
            {secondaryNews.map((item, index) => (
              <View
  key={item.id}
  style={styles.animatedFullWidth}
>
                <Pressable
                style={({ pressed }) => [
                  styles.compactCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => openLink(item.link)}
              >
                {item.image && !failedImages[item.id] ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.compactImage}
                    resizeMode="cover"
                    onError={() =>
                      setFailedImages((previous) => ({
                        ...previous,
                        [item.id]: true,
                      }))
                    }
                  />
                ) : (
                  <View style={styles.compactImageFallback}>
                    <Image
                      source={FALLBACK_NEWS_IMAGE}
                      style={styles.compactFallbackLogo}
                      resizeMode="contain"
                    />
                  </View>
                )}

                <View style={styles.compactContent}>
                  <View style={styles.compactMetaRow}>
                    <Text
                      style={styles.compactSource}
                      numberOfLines={1}
                    >
                      {normalizeSource(item.source)}
                    </Text>

                    <Text style={styles.metaDot}>•</Text>

                    <Text style={styles.compactDate}>
                      {formatRelativeDate(item.date)}
                    </Text>
                  </View>

                  <Text style={styles.compactTitle} numberOfLines={3}>
                    {item.title}
                  </Text>

                  <Text style={styles.compactReadText}>
                    Leer noticia →
                  </Text>
                </View>
                </Pressable>
              </View>
            ))}
          </View>

          {totalPages > 1 ? (
            <View style={styles.animatedFullWidth}>
              <View style={styles.paginationCard}>
              <Pressable
                style={({ pressed }) => [
                  styles.pageButton,
                  currentPage === 1 && styles.pageButtonDisabled,
                  pressed &&
                    currentPage !== 1 &&
                    styles.buttonPressed,
                ]}
                onPress={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Text
                  style={[
                    styles.pageButtonText,
                    currentPage === 1 &&
                      styles.pageButtonTextDisabled,
                  ]}
                >
                  ‹
                </Text>
              </Pressable>

              <View style={styles.pageInfo}>
                <Text style={styles.pageInfoLabel}>PÁGINA</Text>

                <Text style={styles.pageInfoText}>
                  {currentPage} de {totalPages}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.pageButton,
                  currentPage === totalPages &&
                    styles.pageButtonDisabled,
                  pressed &&
                    currentPage !== totalPages &&
                    styles.buttonPressed,
                ]}
                onPress={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Text
                  style={[
                    styles.pageButtonText,
                    currentPage === totalPages &&
                      styles.pageButtonTextDisabled,
                  ]}
                >
                  ›
                </Text>
              </Pressable>
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  animatedFullWidth: {
    width: '100%',
  },

  cachedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  cachedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
    marginRight: 6,
  },

  cachedText: {
    color: '#C9B46A',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  container: {
    flex: 1,
    backgroundColor: '#050505',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 36,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
    paddingRight: 14,
  },

  eyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.35,
    marginBottom: 4,
  },

  screenTitle: {
    fontSize: 31,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  headerDescription: {
    marginTop: 5,
    color: '#9A9A9A',
    fontSize: 14,
    lineHeight: 20,
  },

  counterBadge: {
    minWidth: 42,
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#282828',
  },

  counterText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
  },

  featuredCard: {
    height: 420,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#111111',
    marginBottom: 14,
  },

  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  featuredImageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
  },

  featuredFallbackLogo: {
    width: '82%',
    height: '82%',
  },

  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.50)',
  },

  featuredTopRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  featuredBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },

  featuredBadgeText: {
    color: '#090909',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  featuredDate: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 4,
  },

  featuredContent: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
  },

  featuredSource: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.78)',
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 5,
  },

  readRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(215, 178, 67, 0.72)',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },

  readText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
  },

  readArrow: {
    color: colors.accent,
    fontSize: 18,
    marginLeft: 9,
    marginTop: -1,
  },

  secondaryList: {
    gap: 12,
  },

  compactCard: {
    height: 126,
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#282828',
    backgroundColor: '#111111',
  },

  compactImage: {
    width: 126,
    height: 126,
  },

  compactImageFallback: {
    width: 126,
    height: 126,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
    borderRightWidth: 1,
    borderRightColor: 'rgba(215, 178, 67, 0.28)',
  },

  compactFallbackLogo: {
    width: 94,
    height: 94,
  },

  compactContent: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },

  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  compactSource: {
    maxWidth: '52%',
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  metaDot: {
    color: '#737373',
    fontSize: 11,
    marginHorizontal: 6,
  },

  compactDate: {
    flexShrink: 1,
    color: '#9A9A9A',
    fontSize: 10,
    fontWeight: '700',
  },

  compactTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    marginVertical: 7,
  },

  compactReadText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
  },

  paginationCard: {
    marginTop: 20,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#282828',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pageButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: colors.accent,
  },

  pageButtonDisabled: {
    borderColor: '#2B2B2B',
    backgroundColor: '#171717',
    opacity: 0.55,
  },

  pageButtonText: {
    color: colors.accent,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '400',
    marginTop: -2,
  },

  pageButtonTextDisabled: {
    color: '#555555',
  },

  pageInfo: {
    alignItems: 'center',
  },

  pageInfoLabel: {
    color: '#858585',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 2,
  },

  pageInfoText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  messageCard: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#282828',
    alignItems: 'center',
  },

  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },

  errorText: {
    color: '#9A9A9A',
    textAlign: 'center',
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 16,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
    backgroundColor: colors.accent,
  },

  retryButtonText: {
    color: '#090909',
    fontWeight: '900',
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },

  emptyText: {
    color: '#9A9A9A',
    textAlign: 'center',
    lineHeight: 20,
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.992 }],
  },

  buttonPressed: {
    opacity: 0.72,
  },

  skeletonCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#282828',
    backgroundColor: '#111111',
  },

  skeletonHero: {
    height: 420,
    borderRadius: 24,
    marginBottom: 14,
  },

  skeletonHeroImage: {
    height: 250,
    backgroundColor: '#171717',
  },

  skeletonContent: {
    padding: 17,
  },

  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#242424',
    marginBottom: 11,
  },

  skeletonCompactCard: {
    minHeight: 126,
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#282828',
    backgroundColor: '#111111',
    marginBottom: 12,
  },

  skeletonCompactImage: {
    width: 126,
    minHeight: 126,
    backgroundColor: '#171717',
  },

  skeletonCompactContent: {
    flex: 1,
    padding: 13,
  },
});