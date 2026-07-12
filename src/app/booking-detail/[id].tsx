import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { cancelBooking, getBooking, submitBookingReview, uploadBookingReceipt } from '@/api/bookings';
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
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState({ service_quality: 5, food_quality: 5, punctuality: 5, hospitality: 5 });
  const [comment, setComment] = useState('');

  const load = () => {
    setIsLoading(true);
    getBooking(Number(id))
      .then(setBooking)
      .catch((err) => setError(apiErrorMessage(err, 'تعذر تحميل الحجز')))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [id]);

  const handleCancel = async () => {
    if (cancelReason.trim().length < 3) {
      Alert.alert('سبب الإلغاء مطلوب', 'اكتب سببًا مختصرًا من ثلاثة أحرف على الأقل.');
      return;
    }

    setIsCancelling(true);
    try {
      await cancelBooking(Number(id), cancelReason.trim());
      setShowCancelForm(false);
      load();
    } catch (err) {
      Alert.alert('خطأ', apiErrorMessage(err, 'تعذر إلغاء الحجز'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUploadReceipt = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('صلاحية الصور مطلوبة', 'اسمح للتطبيق بالوصول للصور لاختيار إيصال التحويل.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset) return;

    setIsUploading(true);
    try {
      await uploadBookingReceipt(Number(id), asset);
      Alert.alert('تم رفع الإيصال', 'سنراجع التحويل ونحدّث حالة الحجز بعد التأكيد.');
      load();
    } catch (err) {
      Alert.alert('تعذر رفع الإيصال', apiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleReview = async () => {
    setIsReviewing(true);
    try {
      await submitBookingReview(Number(id), { ...review, comment: comment.trim() || undefined });
      Alert.alert('شكرًا لتقييمك', 'تم حفظ تقييم تجربتك بنجاح.');
      load();
    } catch (err) {
      Alert.alert('تعذر إرسال التقييم', apiErrorMessage(err));
    } finally {
      setIsReviewing(false);
    }
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
        <BookingTimeline status={booking.status} />

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
          {booking.rejection_reason ? (
            <View style={[styles.messageBox, { backgroundColor: theme.primaryTint }]}>
              <ThemedText type="smallBold" themeColor="danger" style={styles.row}>سبب الرفض</ThemedText>
              <ThemedText type="small" style={styles.row}>{booking.rejection_reason}</ThemedText>
            </View>
          ) : null}
          {booking.cancellation_reason ? (
            <View style={[styles.messageBox, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold" style={styles.row}>سبب الإلغاء</ThemedText>
              <ThemedText type="small" style={styles.row}>{booking.cancellation_reason}</ThemedText>
            </View>
          ) : null}
          <ThemedText style={styles.row}>الباقة: {booking.package?.name}</ThemedText>
          <ThemedText style={styles.row}>
            التاريخ: {booking.event_date.slice(0, 10)} · {booking.event_time}
          </ThemedText>
          <ThemedText style={styles.row}>عدد الأشخاص: {booking.persons_count}</ThemedText>
          <ThemedText style={styles.row}>العنوان: {booking.location_address}</ThemedText>
          <ThemedText type="smallBold" themeColor="accent" style={styles.row}>
            الإجمالي: {booking.total_amount} ر.س
          </ThemedText>

          {booking.selection_choices ? Object.entries(booking.selection_choices).map(([label, choices]) => (
            <ThemedText key={label} type="small" themeColor="textSecondary" style={styles.row}>
              {label}: {choices.join('، ')}
            </ThemedText>
          )) : null}
          {booking.selected_addons?.length ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.row}>
              الإضافات: {booking.selected_addons.map((addon) => addon.name).join('، ')}
            </ThemedText>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.homeButton, { borderColor: theme.backgroundSelected }]}
              onPress={() => router.replace('/(tabs)')}>
              <ThemedText type="small">الرئيسية</ThemedText>
            </Pressable>

            {booking.can_cancel ? (
              <Pressable
                style={[styles.cancelButton, { borderColor: theme.danger, opacity: isCancelling ? 0.6 : 1 }]}
                disabled={isCancelling}
                onPress={() => setShowCancelForm((visible) => !visible)}>
                <ThemedText type="small" themeColor="danger">إلغاء الحجز</ThemedText>
              </Pressable>
            ) : null}
          </View>
          {booking.can_cancel && showCancelForm ? (
            <View style={[styles.cancelForm, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold" style={styles.row}>ما سبب الإلغاء؟</ThemedText>
              <TextInput
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="مثال: تغير موعد المناسبة"
                placeholderTextColor={theme.textSecondary}
                multiline
                maxLength={500}
                textAlign="right"
                style={[styles.commentInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
              <View style={styles.actionsRow}>
                <Pressable style={[styles.homeButton, { borderColor: theme.backgroundSelected }]} onPress={() => setShowCancelForm(false)}>
                  <ThemedText type="small">تراجع</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, styles.cancelConfirmButton, { backgroundColor: theme.danger, opacity: isCancelling ? 0.6 : 1 }]}
                  disabled={isCancelling}
                  onPress={handleCancel}>
                  {isCancelling ? <ActivityIndicator color="#fff" /> : <ThemedText type="smallBold" style={styles.primaryButtonText}>تأكيد الإلغاء</ThemedText>}
                </Pressable>
              </View>
            </View>
          ) : null}
        </ThemedView>

        {booking.status === 'pending_payment' ? (
          <ThemedView style={[styles.card, CardShadow]}>
            <ThemedText type="smallBold" style={styles.row}>التحويل البنكي</ThemedText>
            {booking.payment_deadline ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.row}>
                آخر موعد لرفع الإيصال: {new Date(booking.payment_deadline).toLocaleString('ar-SA')}
              </ThemedText>
            ) : null}
            {booking.payment?.rejection_reason ? (
              <View style={[styles.messageBox, { backgroundColor: theme.primaryTint }]}>
                <ThemedText type="smallBold" themeColor="danger" style={styles.row}>لم يُقبل الإيصال السابق</ThemedText>
                <ThemedText type="small" style={styles.row}>{booking.payment.rejection_reason}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.row}>يمكنك اختيار إيصال جديد ورفعه أدناه.</ThemedText>
              </View>
            ) : null}
            {booking.payment?.receipt_uploaded ? (
              <View style={[styles.successBox, { backgroundColor: theme.primaryTint }]}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <ThemedText type="smallBold" themeColor="success">تم رفع الإيصال وبانتظار المراجعة</ThemedText>
              </View>
            ) : booking.can_upload_receipt ? (
              <Pressable
                style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: isUploading ? 0.6 : 1 }]}
                disabled={isUploading}
                onPress={handleUploadReceipt}>
                {isUploading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                    <ThemedText type="smallBold" style={styles.primaryButtonText}>اختيار ورفع الإيصال</ThemedText>
                  </>
                )}
              </Pressable>
            ) : null}
          </ThemedView>
        ) : null}

        {booking.can_review ? (
          <ThemedView style={[styles.card, CardShadow]}>
            <ThemedText type="subtitle" style={styles.row}>قيّم تجربتك</ThemedText>
            <RatingRow label="جودة الخدمة" value={review.service_quality} onChange={(value) => setReview({ ...review, service_quality: value })} />
            <RatingRow label="جودة الطعام" value={review.food_quality} onChange={(value) => setReview({ ...review, food_quality: value })} />
            <RatingRow label="الالتزام بالوقت" value={review.punctuality} onChange={(value) => setReview({ ...review, punctuality: value })} />
            <RatingRow label="حسن الضيافة" value={review.hospitality} onChange={(value) => setReview({ ...review, hospitality: value })} />
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="اكتب ملاحظتك (اختياري)"
              placeholderTextColor={theme.textSecondary}
              multiline
              textAlign="right"
              style={[styles.commentInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
            />
            <Pressable
              style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: isReviewing ? 0.6 : 1 }]}
              disabled={isReviewing}
              onPress={handleReview}>
              {isReviewing ? <ActivityIndicator color="#fff" /> : (
                <ThemedText type="smallBold" style={styles.primaryButtonText}>إرسال التقييم</ThemedText>
              )}
            </Pressable>
          </ThemedView>
        ) : booking.review ? (
          <ThemedView style={[styles.card, CardShadow]}>
            <ThemedText type="smallBold" style={styles.row}>تقييمك</ThemedText>
            <ThemedText style={styles.ratingSummary}>★ {booking.review.overall_rating.toFixed(1)}</ThemedText>
            {booking.review.comment ? <ThemedText type="small" style={styles.row}>{booking.review.comment}</ThemedText> : null}
          </ThemedView>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function BookingTimeline({ status }: { status: BookingStatus }) {
  const theme = useTheme();
  const terminal = status === 'rejected' ? 'مرفوض' : status === 'cancelled' ? 'ملغي' : null;
  const steps = status === 'pending_payment'
    ? ['تم إنشاء الطلب', 'بانتظار الدفع', 'موافقة مقدم الخدمة', 'مؤكد']
    : ['تم إنشاء الطلب', 'موافقة مقدم الخدمة', 'مؤكد', 'مكتمل'];
  const activeIndex = ({ pending_payment: 1, pending_brand: 1, accepted: 2, completed: 3, rejected: 1, cancelled: 1 } satisfies Record<BookingStatus, number>)[status];

  return (
    <ThemedView style={[styles.card, CardShadow]}>
      <ThemedText type="smallBold" style={styles.row}>حالة الحجز</ThemedText>
      <View style={styles.timeline}>
        {steps.map((label, index) => {
          const complete = index <= activeIndex;
          const isTerminal = terminal !== null && index === 1;
          return (
            <View key={label} style={styles.timelineStep}>
              <View style={[styles.timelineDot, { backgroundColor: isTerminal ? theme.danger : complete ? theme.primary : theme.backgroundSelected }]}>
                {complete ? <Ionicons name={isTerminal ? 'close' : 'checkmark'} size={13} color="#fff" /> : null}
              </View>
              <ThemedText type="small" themeColor={complete ? 'text' : 'textSecondary'} style={styles.timelineLabel}>
                {isTerminal ? terminal : label}
              </ThemedText>
              {index < steps.length - 1 ? (
                <View style={[styles.timelineLine, { backgroundColor: index < activeIndex ? theme.primary : theme.backgroundSelected }]} />
              ) : null}
            </View>
          );
        })}
      </View>
    </ThemedView>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.ratingRow}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => onChange(star)} hitSlop={4}>
            <Ionicons name={star <= value ? 'star' : 'star-outline'} size={25} color="#F59E0B" />
          </Pressable>
        ))}
      </View>
      <ThemedText type="smallBold">{label}</ThemedText>
    </View>
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
  messageBox: { borderRadius: 12, padding: 12, gap: 4 },
  successBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  primaryButton: { minHeight: 48, borderRadius: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  primaryButtonText: { color: '#fff' },
  timeline: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 4 },
  timelineStep: { flex: 1, alignItems: 'center', position: 'relative', gap: 5 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  timelineLine: { position: 'absolute', top: 11, left: '-50%', width: '100%', height: 2, zIndex: 1 },
  timelineLabel: { fontSize: 11, textAlign: 'center' },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  starsRow: { flexDirection: 'row', gap: 2 },
  commentInput: { minHeight: 90, borderWidth: 1, borderRadius: 12, padding: 12, textAlignVertical: 'top' },
  ratingSummary: { color: '#F59E0B', textAlign: 'right', fontSize: 22 },
  cancelForm: { borderTopWidth: 1, paddingTop: 14, gap: 8 },
  cancelConfirmButton: { flex: 1 },
});
