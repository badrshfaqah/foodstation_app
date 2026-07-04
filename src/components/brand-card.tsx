import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Brand } from '@/api/types';
import { storageUrl } from '@/config';
import { useSaved } from '@/context/saved-context';
import { useTheme } from '@/hooks/use-theme';

const SERVICE_TYPE_LABELS: Record<string, string> = {
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

export function BrandCard({ brand, onPress }: { brand: Brand; onPress: () => void }) {
  const theme = useTheme();
  const { isSaved, toggleSaved } = useSaved();
  const packages = brand.packages ?? brand.active_packages ?? [];
  const minPrice = packages.length ? Math.min(...packages.map((p) => p.price)) : null;
  const available = brand.effective_available ?? brand.is_available;
  const saved = isSaved(brand.id);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={storageUrl(brand.images?.[0])} style={styles.cover} contentFit="cover" />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topRow}>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#FBBF24" />
          <ThemedText type="small" style={styles.badgeText}>
            {brand.rating > 0 ? brand.rating.toFixed(1) : '—'}
          </ThemedText>
        </View>
        <View style={styles.topLeftGroup}>
          {brand.is_featured ? (
            <View style={[styles.featuredBadge, { backgroundColor: theme.primary }]}>
              <ThemedText type="small" style={styles.badgeTextWhite}>
                مميّز
              </ThemedText>
            </View>
          ) : null}
          <Pressable style={styles.saveButton} onPress={() => toggleSaved(brand)} hitSlop={8}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={16} color={saved ? theme.primary : '#fff'} />
          </Pressable>
        </View>
      </View>

      {!available ? (
        <View style={styles.unavailableOverlay}>
          <View style={styles.unavailablePill}>
            <ThemedText type="small" style={{ color: '#FCD34D' }}>
              غير متاح حالياً
            </ThemedText>
          </View>
        </View>
      ) : null}

      <View style={styles.bottom}>
        <View style={styles.bottomHeader}>
          <View style={styles.logoBox}>
            <Image
              source={brand.logo ? storageUrl(brand.logo) : undefined}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <View style={styles.nameCol}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.whiteText}>
              {brand.name}
            </ThemedText>
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.7)" />
              <ThemedText type="small" style={styles.citySubtext}>
                {CITY_LABELS[brand.city] ?? brand.city}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <View style={styles.serviceChip}>
            <ThemedText type="small" style={styles.whiteText}>
              {SERVICE_TYPE_LABELS[brand.service_type ?? ''] ?? brand.service_type}
            </ThemedText>
          </View>
          {minPrice !== null ? (
            <ThemedText type="smallBold" style={styles.whiteText}>
              <ThemedText type="small" style={styles.priceFrom}>
                من{' '}
              </ThemedText>
              {minPrice} ر.س
            </ThemedText>
          ) : (
            <ThemedText type="small" style={styles.citySubtext}>
              تواصل للسعر
            </ThemedText>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#e5e5e5',
  },
  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featuredBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  topLeftGroup: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  saveButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff' },
  badgeTextWhite: { color: '#fff' },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailablePill: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  bottomHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  logo: { width: '100%', height: '100%' },
  nameCol: { flex: 1, gap: 2 },
  whiteText: { color: '#fff' },
  cityRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
  citySubtext: { color: 'rgba(255,255,255,0.7)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 8 },
  footerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  serviceChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceFrom: { color: 'rgba(255,255,255,0.6)' },
});
