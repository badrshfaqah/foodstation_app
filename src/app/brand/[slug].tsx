import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { getBrand } from '@/api/catalog';
import { apiErrorMessage } from '@/api/client';
import type { Brand, Package } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function BrandScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [bookingAvailable, setBookingAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getBrand(slug)
      .then((data) => {
        if (cancelled) return;
        setBrand(data.brand);
        setBookingAvailable(data.bookingAvailable);
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err, 'تعذر تحميل العلامة التجارية')))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  if (error || !brand) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={{ color: '#d32f2f' }}>{error ?? 'العلامة التجارية غير متاحة'}</ThemedText>
      </ThemedView>
    );
  }

  const packages = brand.activePackages ?? [];

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={packages}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Image
              source={brand.logo ?? undefined}
              style={[styles.logo, { backgroundColor: theme.backgroundSelected }]}
              contentFit="cover"
            />
            <ThemedText type="title" style={styles.name}>
              {brand.name}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              ⭐ {brand.rating.toFixed(1)} ({brand.reviews_count} تقييم) · {brand.city}
            </ThemedText>
            {brand.description ? (
              <ThemedText style={styles.description}>{brand.description}</ThemedText>
            ) : null}
            {!bookingAvailable ? (
              <ThemedText style={styles.unavailable}>غير متاح للحجز حالياً</ThemedText>
            ) : null}
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              الباقات
            </ThemedText>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }: { item: Package }) => (
          <Pressable
            style={[styles.packageCard, { backgroundColor: theme.backgroundElement }]}
            disabled={!bookingAvailable}
            onPress={() =>
              router.push({
                pathname: '/booking/[brandSlug]/[packageId]',
                params: { brandSlug: brand.slug, packageId: String(item.id) },
              })
            }>
            <ThemedText type="smallBold">{item.name}</ThemedText>
            {item.description ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                {item.description}
              </ThemedText>
            ) : null}
            <View style={styles.packageFooter}>
              <ThemedText type="smallBold">{item.price} ر.س</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.persons_count} شخص · {item.duration_hours} ساعة
              </ThemedText>
            </View>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  listContent: { padding: 16, paddingBottom: 32 },
  header: { alignItems: 'flex-end', gap: 4, marginBottom: 8 },
  logo: { width: 88, height: 88, borderRadius: 16, marginBottom: 8, alignSelf: 'center' },
  name: { fontSize: 24, textAlign: 'right' },
  description: { textAlign: 'right', marginTop: 8 },
  unavailable: { color: '#d32f2f', textAlign: 'right', marginTop: 8 },
  sectionTitle: { fontSize: 20, textAlign: 'right', marginTop: 16 },
  packageCard: { borderRadius: 16, padding: 16, gap: 6, alignItems: 'flex-end' },
  packageFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
});
