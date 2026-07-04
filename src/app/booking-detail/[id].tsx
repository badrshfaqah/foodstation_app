import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { cancelBooking, getBooking } from '@/api/bookings';
import { apiErrorMessage } from '@/api/client';
import type { Booking, BookingStatus } from '@/api/types';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending_payment: 'بانتظار الدفع',
  pending_brand: 'بانتظار موافقة العلامة',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
  completed: 'مكتمل',
};

const CANCELLABLE: BookingStatus[] = ['pending_payment', 'pending_brand'];

const STATUS_COLOR: Partial<Record<BookingStatus, 'success' | 'danger'>> = {
  accepted: 'success',
  completed: 'success',
  rejected: 'danger',
  cancelled: 'danger',
};

export default function BookingDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const load = () => {
    setIsLoading(true);
    getBooking(Number(id))
      .then(setBooking)
      .catch((err) => setError(apiErrorMessage(err, 'تعذر تحميل الحجز')))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [id]);

  const handleCancel = () => {
    Alert.alert('إلغاء الحجز', 'هل أنت متأكد من إلغاء هذا الحجز؟', [
      { text: 'تراجع', style: 'cancel' },
      {
        text: 'إلغاء الحجز',
        style: 'destructive',
        onPress: async () => {
          setIsCancelling(true);
          try {
            await cancelBooking(Number(id));
            load();
          } catch (err) {
            Alert.alert('خطأ', apiErrorMessage(err, 'تعذر إلغاء الحجز'));
          } finally {
            setIsCancelling(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ThemedView type="backgroundElement" style={{ flex: 1 }}>
        <ScreenHeader title="تفاصيل الحجز" />
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

  if (error || !booking) {
    return (
      <ThemedView type="backgroundElement" style={{ flex: 1 }}>
        <ScreenHeader title="تفاصيل الحجز" />
        <View style={styles.center}>
          <ThemedText themeColor="danger">{error ?? 'الحجز غير موجود'}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={{ flex: 1 }}>
      <ScreenHeader title="تفاصيل الحجز" />
      <ScrollView
        contentContainerStyle={styles.container}
        style={{ backgroundColor: theme.backgroundElement }}>
        <ThemedView style={[styles.card, CardShadow]}>
          <ThemedText type="subtitle" style={styles.row}>
            {booking.brand?.name}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.row}>
            رقم الحجز: {booking.booking_number}
          </ThemedText>
          <ThemedText themeColor={STATUS_COLOR[booking.status]} style={styles.row}>
            {STATUS_LABELS[booking.status]}
          </ThemedText>
          <ThemedText style={styles.row}>الباقة: {booking.package?.name}</ThemedText>
          <ThemedText style={styles.row}>
            التاريخ: {booking.event_date.slice(0, 10)} · {booking.event_time}
          </ThemedText>
          <ThemedText style={styles.row}>عدد الأشخاص: {booking.persons_count}</ThemedText>
          <ThemedText style={styles.row}>العنوان: {booking.location_address}</ThemedText>
          <ThemedText type="smallBold" themeColor="accent" style={styles.row}>
            الإجمالي: {booking.total_amount} ر.س
          </ThemedText>

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.homeButton, { borderColor: theme.backgroundSelected }]}
              onPress={() => router.replace('/(tabs)')}>
              <ThemedText type="small">الرئيسية</ThemedText>
            </Pressable>

            {CANCELLABLE.includes(booking.status) ? (
              <Pressable
                style={[styles.cancelButton, { borderColor: theme.danger, opacity: isCancelling ? 0.6 : 1 }]}
                disabled={isCancelling}
                onPress={handleCancel}>
                {isCancelling ? (
                  <ActivityIndicator color={theme.danger} size="small" />
                ) : (
                  <ThemedText type="small" themeColor="danger">
                    إلغاء الحجز
                  </ThemedText>
                )}
              </Pressable>
            ) : null}
          </View>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { gap: 10, padding: 16, borderRadius: 16 },
  row: { textAlign: 'right' },
  actionsRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 16 },
  homeButton: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  cancelButton: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
});
