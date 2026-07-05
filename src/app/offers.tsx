import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { getOffers } from '@/api/catalog';
import { apiErrorMessage } from '@/api/client';
import type { PackageOffer } from '@/api/types';
import { NoConnectionView } from '@/components/no-connection-view';
import { OfferCard } from '@/components/offer-card';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function OffersScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [offers, setOffers] = useState<PackageOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    getOffers()
      .then((data) => {
        setOffers(data);
        setError(null);
      })
      .catch((err) => setError(apiErrorMessage(err, 'تعذر تحميل العروض')));

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <ThemedView type="backgroundElement" style={styles.container}>
        <ScreenHeader title="العروض الخاصة" />
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

  if (error && offers.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={styles.container}>
        <ScreenHeader title="العروض الخاصة" />
        <NoConnectionView
          isRetrying={isRetrying}
          onRetry={async () => {
            setIsRetrying(true);
            await load();
            setIsRetrying(false);
          }}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ScreenHeader title="العروض الخاصة" />
      <FlatList
        data={offers}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          error ? (
            <ThemedText themeColor="danger" style={styles.error}>
              {error}
            </ThemedText>
          ) : null
        }
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            لا توجد عروض حالياً
          </ThemedText>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <OfferCard
              offer={item}
              onPress={() =>
                item.brand &&
                router.push({ pathname: '/brand/[slug]', params: { slug: item.brand.slug } })
              }
            />
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  gridRow: { gap: 12 },
  gridItem: { flex: 1 },
  error: { textAlign: 'center', marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 48 },
});
