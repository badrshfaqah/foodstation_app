import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import { acceptCustomerQuote, getCustomerQuote } from '@/api/custom-quotes';
import type { CustomerQuote } from '@/api/types';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CITY_LABELS: Record<string, string> = { riyadh: 'الرياض', jeddah: 'جدة', dammam: 'الدمام' };

export default function CustomQuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [quote, setQuote] = useState<CustomerQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  useEffect(() => { getCustomerQuote(Number(id)).then(setQuote).catch((e) => Alert.alert('تعذر التحميل', apiErrorMessage(e))).finally(() => setLoading(false)); }, [id]);
  const accept = (method: 'electronic' | 'bank_transfer') => {
    Alert.alert('تأكيد قبول العرض', `سيتم إنشاء الحجز بمبلغ ${quote?.offer?.amount} ر.س`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تأكيد', onPress: async () => {
        try { setAccepting(true); const booking = await acceptCustomerQuote(Number(id), method); router.replace({ pathname: '/booking-detail/[id]', params: { id: String(booking.id) } }); }
        catch (e) { Alert.alert('تعذر قبول العرض', apiErrorMessage(e)); setAccepting(false); }
      } },
    ]);
  };
  if (loading || !quote) return <ThemedView type="backgroundElement" style={styles.center}><ActivityIndicator color={theme.primary} /></ThemedView>;
  const offer = quote.offer;
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ScreenHeader title="تفاصيل العرض" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, CardShadow, { backgroundColor: theme.background }]}>
          <ThemedText type="subtitle">{quote.brand?.name}</ThemedText>
          <ThemedText themeColor="textSecondary">{quote.request_number}</ThemedText>
          <ThemedText>{quote.event_type} · {quote.event_date} · {quote.event_time}</ThemedText>
          <ThemedText>{quote.expected_guests} ضيف · {CITY_LABELS[quote.city] ?? quote.city}</ThemedText>
          <ThemedText>{quote.location_address}</ThemedText>
        </View>
        {offer ? <View style={[styles.card, CardShadow, { backgroundColor: theme.background }]}>
          <ThemedText type="subtitle">العرض المقدم</ThemedText>
          <ThemedText type="title" themeColor="accent">{offer.amount} ر.س</ThemedText>
          <ThemedText>{offer.package?.name} · {offer.persons_count} شخص · {offer.duration_hours} ساعات</ThemedText>
          {offer.includes?.map((x) => <ThemedText key={x}>• {x}</ThemedText>)}
          {offer.terms ? <ThemedText themeColor="textSecondary">الشروط: {offer.terms}</ThemedText> : null}
          <ThemedText type="small" themeColor="textSecondary">صالح حتى {offer.expires_at}</ThemedText>
          {offer.status === 'pending_customer' ? <>
            <Pressable disabled={accepting} style={[styles.primary, { backgroundColor: theme.primary }]} onPress={() => accept('electronic')}><ThemedText style={styles.buttonText}>{accepting ? 'جاري إنشاء الحجز...' : 'قبول والدفع الإلكتروني'}</ThemedText></Pressable>
            <Pressable disabled={accepting} style={[styles.secondary, { borderColor: theme.primary }]} onPress={() => accept('bank_transfer')}><ThemedText themeColor="accent">قبول والتحويل البنكي</ThemedText></Pressable>
          </> : offer.booking_id ? <Pressable style={[styles.primary, { backgroundColor: theme.primary }]} onPress={() => router.push({ pathname: '/booking-detail/[id]', params: { id: String(offer.booking_id) } })}><ThemedText style={styles.buttonText}>عرض الحجز</ThemedText></Pressable> : null}
        </View> : <ThemedText style={styles.empty} themeColor="textSecondary">لم يصل عرض مقدم الخدمة بعد</ThemedText>}
      </ScrollView>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 16, gap: 16, paddingBottom: 36 },
  card: { borderRadius: 18, padding: 18, gap: 10, alignItems: 'flex-end' }, primary: { width: '100%', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  secondary: { width: '100%', padding: 13, borderRadius: 12, borderWidth: 1, alignItems: 'center' }, buttonText: { color: '#fff' }, empty: { textAlign: 'center', marginTop: 40 },
});
