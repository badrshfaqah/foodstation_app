import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { getBrand } from '@/api/catalog';
import { apiErrorMessage } from '@/api/client';
import { createCustomerQuote } from '@/api/custom-quotes';
import type { Brand } from '@/api/types';
import { LoginPrompt } from '@/components/login-prompt';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const EVENT_TYPES = ['حفل زفاف', 'مناسبة عائلية', 'فعالية شركة', 'تخرج', 'مناسبة أخرى'];
const SERVICE_LABELS: Record<string, string> = { catering: 'كاترينج', buffet: 'بوفيه', food_truck: 'عربة طعام', live_station: 'محطة حية', coffee: 'ضيافة وقهوة' };
const CITY_LABELS: Record<string, string> = { riyadh: 'الرياض', jeddah: 'جدة', dammam: 'الدمام' };

export default function CreateCustomQuoteScreen() {
  const { brandSlug } = useLocalSearchParams<{ brandSlug: string }>();
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('18:00');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [guests, setGuests] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [details, setDetails] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    getBrand(brandSlug).then(({ brand: value }) => {
      setBrand(value); setCity(value.city);
      setServices([...new Set((value.active_packages ?? []).map((x) => x.service_type).filter((x): x is string => Boolean(x)))]);
    }).catch((e) => Alert.alert('تعذر التحميل', apiErrorMessage(e))).finally(() => setLoading(false));
  }, [brandSlug]);
  const availableServices = useMemo(() => [...new Set((brand?.active_packages ?? []).map((x) => x.service_type).filter((x): x is string => Boolean(x)))], [brand]);
  const cities = useMemo(() => [...new Set([brand?.city, ...(brand?.cities ?? [])].filter((x): x is string => Boolean(x)))], [brand]);
  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.backgroundSelected }];

  async function submit() {
    if (!brand || !eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || !address.trim() || Number(guests) < 1 || !phone.trim() || services.length === 0) {
      Alert.alert('بيانات ناقصة', 'أكمل التاريخ بصيغة YYYY-MM-DD والموقع وعدد الضيوف والجوال والخدمات.'); return;
    }
    if (budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax)) {
      Alert.alert('راجع الميزانية', 'الحد الأدنى للميزانية يجب ألا يتجاوز الحد الأعلى.'); return;
    }
    try {
      setSubmitting(true);
      const quote = await createCustomerQuote({ brand_id: brand.id, event_type: eventType, event_date: eventDate, event_time: eventTime, city, location_address: address.trim(), expected_guests: Number(guests), budget_min: budgetMin ? Number(budgetMin) : undefined, budget_max: budgetMax ? Number(budgetMax) : undefined, service_types: services, details: details.trim() || undefined, contact_phone: phone.trim() });
      router.replace(`/custom-quotes/${quote.id}` as Href);
    } catch (e) { Alert.alert('تعذر إرسال الطلب', apiErrorMessage(e)); setSubmitting(false); }
  }

  if (!user) return <ThemedView type="backgroundElement" style={styles.container}><ScreenHeader title="طلب عرض مخصص" /><LoginPrompt message="سجّل دخولك لإرسال طلب عرض" /></ThemedView>;
  if (loading || !brand) return <ThemedView type="backgroundElement" style={styles.center}><ActivityIndicator color={theme.primary} /></ThemedView>;
  return <ThemedView type="backgroundElement" style={styles.container}>
    <ScreenHeader title="طلب عرض مخصص" />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <ThemedText type="subtitle">{brand.name}</ThemedText>
      <ThemedText themeColor="textSecondary">صف لنا مناسبتك وسيجهز مقدم الخدمة عرضًا مناسبًا بدل الحجز المباشر.</ThemedText>
      <Label text="نوع المناسبة" /><View style={styles.chips}>{EVENT_TYPES.map((x) => <Chip key={x} label={x} active={eventType === x} onPress={() => setEventType(x)} />)}</View>
      <Label text="التاريخ والوقت" /><View style={styles.inline}><TextInput value={eventDate} onChangeText={setEventDate} placeholder="2026-12-31" placeholderTextColor={theme.textSecondary} style={[...inputStyle, styles.flex]} textAlign="right" /><TextInput value={eventTime} onChangeText={setEventTime} placeholder="18:00" placeholderTextColor={theme.textSecondary} style={[...inputStyle, styles.time]} textAlign="center" /></View>
      <Label text="المدينة" /><View style={styles.chips}>{cities.map((x) => <Chip key={x} label={CITY_LABELS[x] ?? x} active={city === x} onPress={() => setCity(x)} />)}</View>
      <Label text="موقع المناسبة" /><TextInput value={address} onChangeText={setAddress} placeholder="الحي، الشارع، القاعة أو الاستراحة" placeholderTextColor={theme.textSecondary} style={inputStyle} textAlign="right" />
      <Label text="عدد الضيوف" /><TextInput value={guests} onChangeText={setGuests} keyboardType="number-pad" placeholder="مثال: 150" placeholderTextColor={theme.textSecondary} style={inputStyle} textAlign="right" />
      <Label text="الخدمات المطلوبة" /><View style={styles.chips}>{availableServices.map((x) => <Chip key={x} label={SERVICE_LABELS[x] ?? x} active={services.includes(x)} onPress={() => setServices((old) => old.includes(x) ? old.filter((v) => v !== x) : [...old, x])} />)}</View>
      <Label text="الميزانية التقريبية (اختياري)" /><View style={styles.inline}><TextInput value={budgetMin} onChangeText={setBudgetMin} keyboardType="number-pad" placeholder="من" placeholderTextColor={theme.textSecondary} style={[...inputStyle, styles.flex]} textAlign="right" /><TextInput value={budgetMax} onChangeText={setBudgetMax} keyboardType="number-pad" placeholder="إلى" placeholderTextColor={theme.textSecondary} style={[...inputStyle, styles.flex]} textAlign="right" /></View>
      <Label text="رقم التواصل" /><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="05xxxxxxxx" placeholderTextColor={theme.textSecondary} style={inputStyle} textAlign="right" />
      <Label text="تفاصيل إضافية (اختياري)" /><TextInput value={details} onChangeText={setDetails} multiline placeholder="نوع التقديم، احتياجات الطاقم، التجهيزات..." placeholderTextColor={theme.textSecondary} style={[...inputStyle, styles.multiline]} textAlign="right" textAlignVertical="top" />
      <Pressable disabled={submitting} style={[styles.submit, { backgroundColor: theme.primary, opacity: submitting ? 0.6 : 1 }]} onPress={submit}><ThemedText type="smallBold" style={{ color: '#fff' }}>{submitting ? 'جاري الإرسال...' : 'إرسال طلب العرض'}</ThemedText></Pressable>
    </ScrollView>
  </ThemedView>;
}

function Label({ text }: { text: string }) { return <ThemedText type="smallBold" style={styles.label}>{text}</ThemedText>; }
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { const theme = useTheme(); return <Pressable onPress={onPress} style={[styles.chip, { borderColor: active ? theme.primary : theme.backgroundSelected, backgroundColor: active ? theme.primaryTint : theme.background }]}><ThemedText type="small" themeColor={active ? 'accent' : 'textSecondary'}>{label}</ThemedText></Pressable>; }
const styles = StyleSheet.create({ container: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 16, gap: 10, paddingBottom: 40, alignItems: 'stretch' }, label: { textAlign: 'right', marginTop: 8 }, input: { borderWidth: 1, borderRadius: 12, minHeight: 48, paddingHorizontal: 13 }, multiline: { minHeight: 110, paddingTop: 12 }, chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }, chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }, inline: { flexDirection: 'row-reverse', gap: 8 }, flex: { flex: 1 }, time: { width: 92 }, submit: { marginTop: 14, minHeight: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center' } });
