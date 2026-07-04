import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Brand } from '@/api/types';
import { useTheme } from '@/hooks/use-theme';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  food_truck: 'فود ترك',
  live_station: 'محطة حية',
  catering: 'كاترينج',
  buffet: 'بوفيه',
  coffee: 'قهوة',
};

export function BrandCard({ brand, onPress }: { brand: Brand; onPress: () => void }) {
  const theme = useTheme();
  const minPrice = brand.packages?.length ? Math.min(...brand.packages.map((p) => p.price)) : null;

  return (
    <Pressable
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}
      onPress={onPress}>
      <Image
        source={brand.logo ?? undefined}
        style={[styles.logo, { backgroundColor: theme.backgroundSelected }]}
        contentFit="cover"
      />
      <View style={styles.info}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {brand.name}
        </ThemedText>
        <ThemedText themeColor="textSecondary" type="small" numberOfLines={1}>
          {SERVICE_TYPE_LABELS[brand.service_type ?? ''] ?? brand.service_type} · {brand.city}
        </ThemedText>
        <View style={styles.row}>
          <ThemedText type="small">⭐ {brand.rating.toFixed(1)}</ThemedText>
          {minPrice !== null ? (
            <ThemedText type="small" themeColor="textSecondary">
              يبدأ من {minPrice} ر.س
            </ThemedText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  info: {
    flex: 1,
    gap: 4,
    alignItems: 'flex-end',
  },
  row: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
});
