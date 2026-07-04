import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { getBrand } from '@/api/catalog';
import { apiErrorMessage } from '@/api/client';
import type { Brand, Package } from '@/api/types';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow } from '@/constants/theme';
import { storageUrl } from '@/config';
import { useTheme } from '@/hooks/use-theme';

const SERVICE_LABELS: Record<string, string> = {
  food_truck: 'فود ترك',
  live_station: 'محطة حية',
  catering: 'كاترينج',
  buffet: 'بوفيه',
  coffee: 'قهوة',
};

const CITY_LABELS: Record<string, string> = {
  riyadh: 'الرياض',
  jeddah: 'جدة',
  dammam: 'الدمام',
};

export default function BrandScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [brand, setBrand] = useState<Brand | null>(null);
  const [bookingAvailable, setBookingAvailable] = useState(true);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getBrand(slug)
      .then((data) => {
        if (cancelled) return;
        setBrand(data.brand);
        setBookingAvailable(data.bookingAvailable);
        setMinPrice(data.minPrice);
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err, 'تعذر تحميل العلامة التجارية')))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <ThemedView type="backgroundElement" style={styles.container}>
        <ScreenHeader title="" />
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

  if (error || !brand) {
    return (
      <ThemedView type="backgroundElement" style={styles.container}>
        <ScreenHeader title="" />
        <View style={styles.center}>
          <ThemedText themeColor="danger">{error ?? 'العلامة التجارية غير متاحة'}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const packages = brand.active_packages ?? [];
  const gallery = brand.images ?? [];

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ScreenHeader title={brand.name} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* غلاف العلامة التجارية */}
        <View style={styles.coverWrap}>
          <Image source={storageUrl(brand.cover)} style={styles.cover} contentFit="cover" />
        </View>

        {/* بطاقة معلومات عائمة */}
        <View style={[styles.infoCard, CardShadow, { backgroundColor: theme.background }]}>
          <View style={styles.infoHeader}>
            <View style={[styles.logoBox, { backgroundColor: theme.backgroundElement }]}>
              <Image source={storageUrl(brand.logo)} style={styles.logo} contentFit="contain" />
            </View>
            <View style={styles.infoTextCol}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {brand.name}
              </ThemedText>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  {CITY_LABELS[brand.city] ?? brand.city}
                </ThemedText>
                {brand.rating > 0 ? (
                  <>
                    <ThemedText type="small" themeColor="textSecondary">
                      ·
                    </ThemedText>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                    <ThemedText type="small" themeColor="textSecondary">
                      {brand.rating.toFixed(1)} ({brand.reviews_count})
                    </ThemedText>
                  </>
                ) : null}
              </View>
            </View>
            {minPrice !== null ? (
              <View style={styles.priceCol}>
                <ThemedText type="small" themeColor="textSecondary">
                  يبدأ من
                </ThemedText>
                <ThemedText type="smallBold" themeColor="accent">
                  {minPrice} ر.س
                </ThemedText>
              </View>
            ) : null}
          </View>

          {!bookingAvailable ? (
            <View style={[styles.unavailableBanner, { backgroundColor: theme.primaryTint }]}>
              <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
              <ThemedText type="small" themeColor="danger">
                هذه العلامة غير متاحة للحجز حالياً
              </ThemedText>
            </View>
          ) : null}
        </View>

        {/* شريط إحصائيات */}
        <View style={styles.statsRow}>
          <StatCard label="باقة متاحة" value={String(packages.length)} />
          <StatCard label="يبدأ من" value={minPrice !== null ? `${minPrice} ر.س` : '—'} />
          <StatCard label={`${brand.reviews_count} تقييم`} value={brand.rating > 0 ? brand.rating.toFixed(1) : '—'} />
        </View>

        {brand.description ? (
          <ThemedText style={styles.description}>{brand.description}</ThemedText>
        ) : null}

        {/* معرض الصور */}
        {gallery.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              الصور
            </ThemedText>
            <FlatList
              horizontal
              inverted
              data={gallery}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={styles.galleryRow}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <Pressable onPress={() => setLightboxIndex(index)}>
                  <Image source={storageUrl(item)} style={styles.galleryThumb} contentFit="cover" />
                </Pressable>
              )}
            />
          </View>
        ) : null}

        {/* الباقات */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            الباقات
          </ThemedText>
          {packages.length === 0 ? (
            <ThemedText themeColor="textSecondary">لا توجد باقات متاحة حالياً</ThemedText>
          ) : (
            <View style={styles.packageGrid}>
              {packages.map((pkg: Package) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  bookingAvailable={bookingAvailable}
                  onPress={() =>
                    router.push({
                      pathname: '/booking/[brandSlug]/[packageId]',
                      params: { brandSlug: brand.slug, packageId: String(pkg.id) },
                    })
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Lightbox */}
      <Modal visible={lightboxIndex !== null} transparent animationType="fade" onRequestClose={() => setLightboxIndex(null)}>
        <Pressable style={styles.lightboxBackdrop} onPress={() => setLightboxIndex(null)}>
          {lightboxIndex !== null ? (
            <Image
              source={storageUrl(gallery[lightboxIndex])}
              style={styles.lightboxImage}
              contentFit="contain"
            />
          ) : null}
          <Pressable style={styles.lightboxClose} onPress={() => setLightboxIndex(null)}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          {lightboxIndex !== null && gallery.length > 1 ? (
            <>
              <Pressable
                style={styles.lightboxPrev}
                onPress={() => setLightboxIndex((i) => (i !== null ? (i + 1) % gallery.length : null))}>
                <Ionicons name="chevron-back" size={26} color="#fff" />
              </Pressable>
              <Pressable
                style={styles.lightboxNext}
                onPress={() => setLightboxIndex((i) => (i !== null ? (i - 1 + gallery.length) % gallery.length : null))}>
                <Ionicons name="chevron-forward" size={26} color="#fff" />
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.statCard, CardShadow, { backgroundColor: theme.background }]}>
      <ThemedText type="smallBold">{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

function PackageCard({
  pkg,
  bookingAvailable,
  onPress,
}: {
  pkg: Package;
  bookingAvailable: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      style={[styles.packageCard, CardShadow, { backgroundColor: theme.background }]}
      disabled={!bookingAvailable}
      onPress={onPress}>
      <View style={styles.packageImageWrap}>
        <Image source={storageUrl(pkg.images?.[0])} style={styles.packageImage} contentFit="cover" />
        <View style={styles.packagePriceBadge}>
          <ThemedText type="small" style={{ color: '#fff' }}>
            {pkg.price} ر.س
          </ThemedText>
        </View>
      </View>
      <View style={styles.packageBody}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {pkg.name}
        </ThemedText>
        <View style={styles.packageChips}>
          <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="people-outline" size={11} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {pkg.persons_count}
              {pkg.allow_extra_persons ? '+' : ''}
            </ThemedText>
          </View>
          <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="time-outline" size={11} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {pkg.duration_hours}
              {pkg.allow_extra_hours ? '+' : ''} ساعة
            </ThemedText>
          </View>
        </View>
        <View style={[styles.bookButton, { backgroundColor: bookingAvailable ? theme.primary : theme.backgroundSelected }]}>
          <ThemedText type="small" style={{ color: bookingAvailable ? '#fff' : theme.textSecondary }}>
            {bookingAvailable ? 'احجز الآن' : 'غير متاح'}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  scrollContent: { paddingBottom: 32 },
  coverWrap: { height: 180, backgroundColor: '#e5e5e5' },
  cover: { width: '100%', height: '100%' },
  infoCard: {
    marginHorizontal: 16,
    marginTop: -32,
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  infoHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  logo: { width: '100%', height: '100%' },
  infoTextCol: { flex: 1, gap: 3, alignItems: 'flex-end' },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  priceCol: { alignItems: 'flex-end' },
  unavailableBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    padding: 10,
  },
  statsRow: { flexDirection: 'row-reverse', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'flex-end', gap: 2 },
  description: { textAlign: 'right', marginTop: 16, marginHorizontal: 16, lineHeight: 22 },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, textAlign: 'right', marginBottom: 10 },
  galleryRow: { gap: 8 },
  galleryThumb: { width: 130, height: 90, borderRadius: 14, backgroundColor: '#e5e5e5' },
  packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  packageCard: { width: '47%', borderRadius: 18, overflow: 'hidden' },
  packageImageWrap: { height: 100, backgroundColor: '#e5e5e5' },
  packageImage: { width: '100%', height: '100%' },
  packagePriceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  packageBody: { padding: 10, gap: 6, alignItems: 'flex-end' },
  packageChips: { flexDirection: 'row-reverse', gap: 6 },
  chip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  bookButton: { width: '100%', borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginTop: 2 },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: { width: '100%', height: '80%' },
  lightboxClose: { position: 'absolute', top: 50, right: 20, padding: 8 },
  lightboxPrev: { position: 'absolute', top: '50%', left: 16, padding: 8 },
  lightboxNext: { position: 'absolute', top: '50%', right: 16, padding: 8 },
});
