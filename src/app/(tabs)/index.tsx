import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { getBrands, getOffers } from '@/api/catalog';
import { apiErrorMessage } from '@/api/client';
import type { Brand, PackageOffer } from '@/api/types';
import { BrandCard } from '@/components/brand-card';
import { OfferCard } from '@/components/offer-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [offers, setOffers] = useState<PackageOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [brandsPage, offersList] = await Promise.all([getBrands(), getOffers()]);
      setBrands(brandsPage.data);
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
    await load();
    setIsRefreshing(false);
  }, [load]);

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={brands}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              فود‌ستيشن
            </ThemedText>

            {error ? (
              <ThemedText style={styles.error}>{error}</ThemedText>
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
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </>
            ) : null}

            <ThemedText type="subtitle" style={styles.sectionTitle}>
              العلامات التجارية
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <BrandCard
            brand={item}
            onPress={() => router.push({ pathname: '/brand/[slug]', params: { slug: item.slug } })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  header: { gap: 8 },
  title: { fontSize: 28, textAlign: 'right', marginTop: 8 },
  sectionTitle: { fontSize: 20, textAlign: 'right', marginTop: 16, marginBottom: 8 },
  offersRow: { gap: 12, paddingBottom: 8 },
  error: { color: '#d32f2f', textAlign: 'center', marginVertical: 8 },
});
