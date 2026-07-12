import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { getCustomerQuotes } from '@/api/custom-quotes';
import { apiErrorMessage } from '@/api/client';
import type { CustomerQuote } from '@/api/types';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const labels: Record<CustomerQuote['status'], string> = {
  pending_provider: 'بانتظار مقدم الخدمة', offered: 'وصل عرض', accepted: 'تم القبول', cancelled: 'ملغي',
};

export default function CustomQuotesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [quotes, setQuotes] = useState<CustomerQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setQuotes((await getCustomerQuotes()).data); setError(null); }
    catch (e) { setError(apiErrorMessage(e, 'تعذر تحميل طلبات العروض')); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load().finally(() => setLoading(false)); }, [load]));

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ScreenHeader title="طلبات العروض" />
      {loading ? <ActivityIndicator style={styles.loader} color={theme.primary} /> : (
        <FlatList data={quotes} keyExtractor={(x) => String(x.id)} contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          ListHeaderComponent={error ? <ThemedText themeColor="danger" style={styles.message}>{error}</ThemedText> : null}
          ListEmptyComponent={<ThemedText themeColor="textSecondary" style={styles.message}>لا توجد طلبات عروض حتى الآن</ThemedText>}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <Pressable style={[styles.card, CardShadow, { backgroundColor: theme.background }]}
              onPress={() => router.push(`/custom-quotes/${item.id}` as Href)}>
              <View style={styles.row}><ThemedText type="smallBold">{item.brand?.name}</ThemedText><ThemedText type="small" themeColor={item.status === 'offered' ? 'accent' : 'textSecondary'}>{labels[item.status]}</ThemedText></View>
              <ThemedText type="small" themeColor="textSecondary">{item.event_type} · {item.event_date}</ThemedText>
              <ThemedText type="small">{item.expected_guests} ضيف</ThemedText>
              {item.offer ? <ThemedText type="smallBold" themeColor="accent">{item.offer.amount} ر.س</ThemedText> : null}
            </Pressable>
          )} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, loader: { flex: 1 }, list: { padding: 16, paddingBottom: 32 },
  card: { borderRadius: 16, padding: 16, gap: 7, alignItems: 'flex-end' },
  row: { width: '100%', flexDirection: 'row-reverse', justifyContent: 'space-between' },
  message: { textAlign: 'center', marginTop: 40 },
});
