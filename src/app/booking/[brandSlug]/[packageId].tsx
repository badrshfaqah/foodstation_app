import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { createBooking, getBookingWizard, type BookingWizardData } from '@/api/bookings';
import { apiErrorMessage } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function BookingWizardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { brandSlug, packageId } = useLocalSearchParams<{ brandSlug: string; packageId: string }>();

  const [wizard, setWizard] = useState<BookingWizardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [personsCount, setPersonsCount] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBookingWizard(brandSlug, Number(packageId))
      .then((data) => {
        if (cancelled) return;
        setWizard(data);
        setPersonsCount(String(data.package.persons_count));
        setPaymentMethod(data.paymentMethods[0]?.value ?? null);
      })
      .catch((err) => !cancelled && setLoadError(apiErrorMessage(err, 'تعذر تحميل بيانات الحجز')))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [brandSlug, packageId]);

  const handleSubmit = async () => {
    if (!eventDate || !eventTime || !locationAddress || !contactPhone || !paymentMethod) {
      setSubmitError('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        package_id: Number(packageId),
        persons_count: Number(personsCount) || 1,
        event_date: eventDate,
        event_time: eventTime,
        location_address: locationAddress,
        contact_phone: contactPhone,
        notes: notes || undefined,
        payment_method: paymentMethod,
      });
      router.replace({ pathname: '/booking-detail/[id]', params: { id: String(booking.id) } });
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'تعذر إنشاء الحجز'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  if (loadError || !wizard) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={{ color: '#d32f2f' }}>{loadError ?? 'تعذر تحميل بيانات الحجز'}</ThemedText>
      </ThemedView>
    );
  }

  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.backgroundSelected }];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.form}>
        <ThemedText type="subtitle" style={styles.title}>
          {wizard.package.name}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {wizard.brand.name} · {wizard.package.price} ر.س
        </ThemedText>

        <ThemedText type="smallBold" style={styles.label}>
          عدد الأشخاص
        </ThemedText>
        <TextInput
          style={inputStyle}
          keyboardType="number-pad"
          value={personsCount}
          onChangeText={setPersonsCount}
          textAlign="right"
        />

        <ThemedText type="smallBold" style={styles.label}>
          تاريخ الفعالية (YYYY-MM-DD)
        </ThemedText>
        <TextInput
          style={inputStyle}
          placeholder="2026-08-01"
          placeholderTextColor={theme.textSecondary}
          value={eventDate}
          onChangeText={setEventDate}
          textAlign="right"
        />

        <ThemedText type="smallBold" style={styles.label}>
          وقت الفعالية (HH:mm)
        </ThemedText>
        <TextInput
          style={inputStyle}
          placeholder="18:00"
          placeholderTextColor={theme.textSecondary}
          value={eventTime}
          onChangeText={setEventTime}
          textAlign="right"
        />

        <ThemedText type="smallBold" style={styles.label}>
          عنوان الفعالية
        </ThemedText>
        <TextInput
          style={inputStyle}
          value={locationAddress}
          onChangeText={setLocationAddress}
          textAlign="right"
          multiline
        />

        <ThemedText type="smallBold" style={styles.label}>
          رقم التواصل
        </ThemedText>
        <TextInput
          style={inputStyle}
          keyboardType="phone-pad"
          value={contactPhone}
          onChangeText={setContactPhone}
          textAlign="right"
        />

        <ThemedText type="smallBold" style={styles.label}>
          ملاحظات (اختياري)
        </ThemedText>
        <TextInput
          style={inputStyle}
          value={notes}
          onChangeText={setNotes}
          textAlign="right"
          multiline
        />

        <ThemedText type="smallBold" style={styles.label}>
          طريقة الدفع
        </ThemedText>
        <View style={styles.paymentRow}>
          {wizard.paymentMethods.map((method) => (
            <Pressable
              key={method.value}
              style={[
                styles.paymentOption,
                {
                  borderColor: theme.backgroundSelected,
                  backgroundColor: paymentMethod === method.value ? theme.backgroundSelected : 'transparent',
                },
              ]}
              onPress={() => setPaymentMethod(method.value)}>
              <ThemedText type="small">{method.label}</ThemedText>
            </Pressable>
          ))}
        </View>

        {submitError ? <ThemedText style={styles.error}>{submitError}</ThemedText> : null}

        <Pressable
          style={[styles.submitButton, { backgroundColor: theme.text, opacity: isSubmitting ? 0.6 : 1 }]}
          disabled={isSubmitting}
          onPress={handleSubmit}>
          {isSubmitting ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <ThemedText style={{ color: theme.background, fontWeight: '700' }}>تأكيد الحجز</ThemedText>
          )}
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  form: { gap: 4 },
  title: { textAlign: 'right', fontSize: 20 },
  subtitle: { textAlign: 'right', marginBottom: 12 },
  label: { textAlign: 'right', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  paymentRow: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap' },
  paymentOption: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  error: { color: '#d32f2f', textAlign: 'center', marginTop: 16 },
  submitButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
});
