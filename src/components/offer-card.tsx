import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { PackageOffer } from '@/api/types';
import { CardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function OfferCard({ offer, onPress }: { offer: PackageOffer; onPress: () => void }) {
  const theme = useTheme();
  const discount = Math.round(((offer.original_price - offer.offer_price) / offer.original_price) * 100);

  return (
    <Pressable style={[styles.card, CardShadow, { backgroundColor: theme.background }]} onPress={onPress}>
      <View style={[styles.discountBadge, { backgroundColor: theme.danger }]}>
        <ThemedText type="smallBold" style={{ color: '#fff' }}>
          -{discount}%
        </ThemedText>
      </View>
      <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
        {offer.name}
      </ThemedText>
      <ThemedText themeColor="textSecondary" type="small" numberOfLines={1}>
        {offer.brand?.name}
      </ThemedText>
      <View style={styles.priceRow}>
        <ThemedText type="smallBold" themeColor="accent">
          {offer.offer_price} ر.س
        </ThemedText>
        <ThemedText
          themeColor="textSecondary"
          type="small"
          style={{ textDecorationLine: 'line-through' }}>
          {offer.original_price} ر.س
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  discountBadge: {
    alignSelf: 'flex-end',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  name: {
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 4,
  },
});
