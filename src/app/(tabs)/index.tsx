import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { cachedFetch } from '@/api/cache';
import { getBrands, getOffers, type ServiceTypeOption } from '@/api/catalog';
import { apiErrorMessage } from '@/api/client';
import type { Brand, PackageOffer } from '@/api/types';
import { BrandCard } from '@/components/brand-card';
import { NoConnectionView } from '@/components/no-connection-view';
import { OfferCard } from '@/components/offer-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { storageUrl } from '@/config';
import { useTheme } from '@/hooks/use-theme';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  food_truck: 'fast-food-outline',
  live_station: 'flame-outline',
  catering: 'restaurant-outline',
  buffet: 'grid-outline',
  coffee: 'cafe-outline',
  live_cooking: 'flame-outline',
};

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  food_truck: ['#f97316', '#ef4444'],
  live_station: ['#dc2626', '#e11d48'],
  catering: ['#f59e0b', '#f97316'],
  buffet: ['#facc15', '#f59e0b'],
  coffee: ['#78716c', '#b45309'],
  live_cooking: ['#f43f5e', '#ec4899'],
};
const DEFAULT_GRADIENT: [string, string] = ['#9ca3af', '#6b7280'];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [offers, setOffers] = useState<PackageOffer[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);
  const [activeServiceType, setActiveServiceType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (serviceType?: string | null) => {
    try {
      const [brandsData, offersList] = await Promise.all([
        cachedFetch(`brands_${serviceType ?? 'all'}`, () =>
          getBrands(serviceType ? { service_type: serviceType } : {})
        ),
        cachedFetch('offers', () => getOffers()),
      ]);
      setBrands(brandsData.brands.data);
      setServiceTypes(brandsData.serviceTypes);
      setOffers(offersList);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'تعذر تحميل البيانات'));
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load(activeServiceType);
    setIsRefreshing(false);
  }, [load, activeServiceType]);

  const onSelectServiceType = useCallback(
    async (value: string | null) => {
      const next = activeServiceType === value ? null : value;
      setActiveServiceType(next);
      setIsLoading(true);
      await load(next);
      setIsLoading(false);
    },
    [activeServiceType, load]
  );

  if (isLoading) {
    return (
      <ThemedView type="backgroundElement" style={styles.center}>
        <ActivityIndicator color={theme.primary} />
      </ThemedView>
    );
  }

  if (error && brands.length === 0 && offers.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={{ flex: 1 }}>
        <NoConnectionView
          isRetrying={isRefreshing}
          onRetry={async () => {
            setIsRefreshing(true);
            await load(activeServiceType);
            setIsRefreshing(false);
          }}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <FlatList
        data={brands}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            {error ? (
              <ThemedText themeColor="danger" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}

            {offers.length > 0 ? (
              <>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  عروض حالية
                </ThemedText>
                <FlatList
                  horizontal
                  inverted
                  data={offers}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={styles.offersRow}
                  renderItem={({ item }) => (
                    <View style={styles.offerCardWrap}>
                      <OfferCard
                        offer={item}
                        onPress={() =>
                          item.brand &&
                          router.push({
                            pathname: '/brand/[slug]',
                            params: { slug: item.brand.slug },
                          })
                        }
                      />
                    </View>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </>
            ) : null}

            <ThemedText type="subtitle" style={styles.sectionTitle}>
              تصفح حسب النوع
            </ThemedText>
            <FlatList
              horizontal
              inverted
              data={serviceTypes}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.categoriesRow}
              showsHorizontalScrollIndicator={false}
              ListHeaderComponent={
                <Pressable style={styles.categoryTile} onPress={() => router.push('/offers')}>
                  <View style={styles.categoryIconWrap}>
                    <LinearGradient colors={['#E8490F', '#ec4899']} style={StyleSheet.absoluteFill} />
                    <View style={styles.offerBadge}>
                      <ThemedText type="small" style={styles.offerBadgeText}>
                        حصري
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.offerPercent}>٪</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="primary" numberOfLines={1}>
                    العروض
                  </ThemedText>
                </Pressable>
              }
              renderItem={({ item }) => {
                const active = activeServiceType === item.value;
                const gradient = CATEGORY_GRADIENTS[item.value] ?? DEFAULT_GRADIENT;
                const icon = CATEGORY_ICONS[item.value] ?? 'pricetag-outline';
                return (
                  <Pressable style={styles.categoryTile} onPress={() => onSelectServiceType(item.value)}>
                    <View
                      style={[
                        styles.categoryIconWrap,
                        active ? { borderWidth: 2, borderColor: theme.primary } : null,
                      ]}>
                      {item.image ? (
                        <Image source={storageUrl(item.image)} style={StyleSheet.absoluteFill} contentFit="cover" />
                      ) : (
                        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
                      )}
                      <Ionicons name={icon} size={26} color="#fff" />
                    </View>
                    <ThemedText
                      type="small"
                      style={active ? { color: theme.primary } : undefined}
                      numberOfLines={1}>
                      {item.label}
                    </ThemedText>
                  </Pressable>
                );
              }}
            />

            <ThemedText type="subtitle" style={styles.sectionTitle}>
              العلامات التجارية
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <BrandCard
              brand={item}
              onPress={() => router.push({ pathname: '/brand/[slug]', params: { slug: item.slug } })}
            />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  header: { gap: 10 },
  sectionTitle: { textAlign: 'right', marginTop: 10, marginBottom: 6 },
  offersRow: { gap: 12, paddingBottom: 8 },
  offerCardWrap: { width: 180 },
  categoriesRow: { gap: 14, paddingBottom: 8 },
  categoryTile: { alignItems: 'center', gap: 6, width: 68 },
  categoryIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#facc15',
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  offerBadgeText: { fontSize: 8, color: '#78350f' },
  offerPercent: { fontSize: 22, fontWeight: '900', color: '#fff' },
  error: { textAlign: 'center', marginVertical: 8 },
  gridRow: { gap: 12 },
  gridItem: { flex: 1 },
});
