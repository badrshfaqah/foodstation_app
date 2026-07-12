import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { LoginPrompt } from '@/components/login-prompt';
import { ArabicFonts, CardShadow } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

const TOTAL_STEPS = 7;
const STEP_LABELS = ['عدد الأشخاص', 'التاريخ', 'الوقت', 'تخصيص الباقة', 'الموقع', 'المراجعة', 'الدفع'];

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const ARABIC_SHORT_DAYS = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];
const ARABIC_DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function addHoursToTime(t: string, hours: number): string {
  return minutesToTime(timeToMinutes(t) + hours * 60);
}
function formatDs(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function BookingWizardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { brandSlug, packageId } = useLocalSearchParams<{ brandSlug: string; packageId: string }>();

  const [wizard, setWizard] = useState<BookingWizardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [personsCount, setPersonsCount] = useState(0);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [extraHours, setExtraHours] = useState(0);
  const [selectionChoices, setSelectionChoices] = useState<Record<string, string[]>>({});
  const [selectedAddons, setSelectedAddons] = useState<NonNullable<BookingWizardData['package']['optional_addons']>>([]);
  const [staffGenderPreference, setStaffGenderPreference] = useState<'mixed' | 'male' | 'female'>('mixed');
  const [monthOffset, setMonthOffset] = useState(0);
  const [locationAddress, setLocationAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    getBookingWizard(brandSlug, Number(packageId))
      .then((data) => {
        if (cancelled) return;
        setWizard(data);
        setPersonsCount(data.package.persons_count);
        setPaymentMethod(data.paymentMethods[0]?.value ?? null);
      })
      .catch((err) => !cancelled && setLoadError(apiErrorMessage(err, 'تعذر تحميل بيانات الحجز')))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [brandSlug, packageId, user]);

  const pkg = wizard?.package;
  const minPersons = pkg?.min_persons ?? 1;
  const maxPersons = pkg?.allow_extra_persons ? (pkg?.max_persons ?? 99) : (pkg?.persons_count ?? 1);
  const extraPersons = pkg ? Math.max(0, personsCount - pkg.persons_count) : 0;
  const extraPersonCost = extraPersons * (pkg?.extra_person_price ?? 0);
  const extraHourCost = extraHours * (pkg?.extra_hour_price ?? 0);
  const addonCost = selectedAddons.reduce(
    (sum, addon) => sum + (addon.pricing === 'per_person' ? addon.price * personsCount : addon.price),
    0
  );
  const totalAmount = (wizard?.pricing.effective_base_price ?? pkg?.price ?? 0) + extraPersonCost + extraHourCost + addonCost;

  const blockedSet = useMemo(
    () => new Set((wizard?.blockedDates ?? []).map((d) => d.date.slice(0, 10))),
    [wizard]
  );

  const slots = useMemo(() => {
    if (!wizard || !pkg) return [];
    const start = timeToMinutes(wizard.workingHoursStart);
    const end = timeToMinutes(wizard.workingHoursEnd);
    const latestStart = end - pkg.duration_hours * 60;
    const result: string[] = [];
    for (let m = start; m <= latestStart; m += 30) result.push(minutesToTime(m));
    return result;
  }, [wizard, pkg]);

  const maxExtraHours = useMemo(() => {
    if (!wizard || !pkg || !eventTime) return pkg?.max_extra_hours ?? 0;
    const end = timeToMinutes(wizard.workingHoursEnd);
    const fromWork = Math.floor((end - timeToMinutes(eventTime) - pkg.duration_hours * 60) / 60);
    return Math.min(pkg.max_extra_hours ?? 10, fromWork);
  }, [wizard, pkg, eventTime]);

  const canProceed = () => {
    if (step === 1) return personsCount >= minPersons && personsCount <= maxPersons;
    if (step === 2) return !!eventDate;
    if (step === 3) return !!eventTime;
    if (step === 4) {
      return (pkg?.selection_groups ?? []).every((group) => (selectionChoices[group.label]?.length ?? 0) >= group.min);
    }
    if (step === 5) return !!locationAddress.trim() && !!contactPhone.trim();
    if (step === 6) return true;
    return !!paymentMethod;
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    if (!paymentMethod) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await createBooking({
        package_id: Number(packageId),
        persons_count: personsCount,
        event_date: eventDate,
        event_time: eventTime,
        extra_hours: extraHours,
        location_address: locationAddress,
        contact_phone: contactPhone,
        notes: notes || undefined,
        payment_method: paymentMethod,
        selection_choices: Object.keys(selectionChoices).length ? selectionChoices : undefined,
        selected_addons: selectedAddons.length ? selectedAddons : undefined,
        staff_gender_preference: (pkg?.staff_total ?? 0) > 0 ? staffGenderPreference : undefined,
      });
      haptics.success();
      router.replace('/(tabs)/bookings');
    } catch (err) {
      haptics.error();
      setSubmitError(apiErrorMessage(err, 'تعذر إنشاء الحجز'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <ThemedView type="backgroundElement" style={{ flex: 1 }}>
        <LoginPrompt message="سجّل دخولك لإكمال الحجز" />
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView type="backgroundElement" style={styles.center}>
        <ActivityIndicator color={theme.primary} />
      </ThemedView>
    );
  }

  if (loadError || !wizard || !pkg) {
    return (
      <ThemedView type="backgroundElement" style={styles.center}>
        <ThemedText themeColor="danger">{loadError ?? 'تعذر تحميل بيانات الحجز'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {/* هيدر ثابت: رجوع + شريط تقدم */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.backgroundSelected }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </Pressable>
          <View style={styles.headerTitleCol}>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {wizard.brand.name}
            </ThemedText>
            <ThemedText type="smallBold" numberOfLines={1}>
              {pkg.name}
            </ThemedText>
          </View>
          <View style={styles.headerStepCol}>
            <ThemedText type="small" themeColor="textSecondary">
              {step}/{TOTAL_STEPS}
            </ThemedText>
            <ThemedText type="small" themeColor="primary">
              {STEP_LABELS[step - 1]}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
          <View
            style={[styles.progressFill, { backgroundColor: theme.primary, width: `${(step / TOTAL_STEPS) * 100}%` }]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 ? (
          <StepPersons
            pkg={pkg}
            personsCount={personsCount}
            setPersonsCount={setPersonsCount}
            minPersons={minPersons}
            maxPersons={maxPersons}
            extraPersons={extraPersons}
            extraPersonCost={extraPersonCost}
          />
        ) : null}

        {step === 2 ? (
          <StepDate
            eventDate={eventDate}
            setEventDate={setEventDate}
            blockedSet={blockedSet}
            closedPeriods={wizard.closedPeriods}
            weeklyOffDays={wizard.weeklyOffDays}
            minBookingHours={pkg.min_booking_hours}
            monthOffset={monthOffset}
            setMonthOffset={setMonthOffset}
          />
        ) : null}

        {step === 3 ? (
          <StepTime
            eventTime={eventTime}
            setEventTime={setEventTime}
            extraHours={extraHours}
            setExtraHours={setExtraHours}
            slots={slots}
            pkg={pkg}
            extraHourCost={extraHourCost}
            maxExtraHours={maxExtraHours}
            workingHoursStart={wizard.workingHoursStart}
            workingHoursEnd={wizard.workingHoursEnd}
          />
        ) : null}

        {step === 4 ? (
          <StepCustomize
            pkg={pkg}
            personsCount={personsCount}
            selectionChoices={selectionChoices}
            setSelectionChoices={setSelectionChoices}
            selectedAddons={selectedAddons}
            setSelectedAddons={setSelectedAddons}
            staffGenderPreference={staffGenderPreference}
            setStaffGenderPreference={setStaffGenderPreference}
          />
        ) : null}

        {step === 5 ? (
          <StepLocation
            locationAddress={locationAddress}
            setLocationAddress={setLocationAddress}
            contactPhone={contactPhone}
            setContactPhone={setContactPhone}
          />
        ) : null}

        {step === 6 ? (
          <StepReview
            wizard={wizard}
            personsCount={personsCount}
            eventDate={eventDate}
            eventTime={eventTime}
            extraHours={extraHours}
            locationAddress={locationAddress}
            contactPhone={contactPhone}
            extraPersonCost={extraPersonCost}
            extraHourCost={extraHourCost}
            addonCost={addonCost}
            totalAmount={totalAmount}
            selectionChoices={selectionChoices}
            selectedAddons={selectedAddons}
            staffGenderPreference={staffGenderPreference}
            notes={notes}
            setNotes={setNotes}
          />
        ) : null}

        {step === 7 ? (
          <StepPayment
            paymentMethods={wizard.paymentMethods}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            bankInfo={wizard.bankInfo}
            totalAmount={totalAmount}
          />
        ) : null}

        {submitError ? (
          <ThemedText themeColor="danger" style={styles.error}>
            {submitError}
          </ThemedText>
        ) : null}
      </ScrollView>

      {/* فوتر ثابت: الإجمالي + التالي/تأكيد */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.backgroundSelected }]}>
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            الإجمالي
          </ThemedText>
          <ThemedText type="subtitle" themeColor="accent" style={styles.footerTotal}>
            {totalAmount} ر.س
          </ThemedText>
        </View>
        <Pressable
          style={[
            styles.nextButton,
            { backgroundColor: canProceed() && !isSubmitting ? theme.primary : theme.backgroundSelected },
          ]}
          disabled={!canProceed() || isSubmitting}
          onPress={handleNext}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText
              style={{
                color: canProceed() ? '#fff' : theme.textSecondary,
                fontFamily: ArabicFonts.bold,
              }}>
              {step === TOTAL_STEPS ? 'تأكيد الحجز' : 'التالي'}
            </ThemedText>
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

/* ─────────────── الخطوة 1: عدد الأشخاص ─────────────── */
function StepPersons({
  pkg, personsCount, setPersonsCount, minPersons, maxPersons, extraPersons, extraPersonCost,
}: {
  pkg: NonNullable<BookingWizardData['package']>;
  personsCount: number;
  setPersonsCount: (n: number) => void;
  minPersons: number;
  maxPersons: number;
  extraPersons: number;
  extraPersonCost: number;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stepCenter}>
      <ThemedText type="subtitle" style={styles.stepTitle}>
        عدد الأشخاص
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.stepSubtitle}>
        السعة الأساسية للباقة: {pkg.persons_count} شخص
      </ThemedText>

      <View style={styles.stepperRow}>
        <Pressable
          style={[styles.stepperButton, { borderColor: theme.backgroundSelected }]}
          disabled={personsCount <= minPersons}
          onPress={() => setPersonsCount(Math.max(minPersons, personsCount - 1))}>
          <Ionicons name="remove" size={22} color={personsCount <= minPersons ? theme.backgroundSelected : theme.text} />
        </Pressable>
        <View style={styles.stepperValueCol}>
          <ThemedText style={styles.stepperValue}>{personsCount}</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            شخص
          </ThemedText>
        </View>
        <Pressable
          style={[styles.stepperButton, { borderColor: theme.backgroundSelected }]}
          disabled={personsCount >= maxPersons}
          onPress={() => setPersonsCount(Math.min(maxPersons, personsCount + 1))}>
          <Ionicons name="add" size={22} color={personsCount >= maxPersons ? theme.backgroundSelected : theme.text} />
        </Pressable>
      </View>

      {extraPersons > 0 && pkg.allow_extra_persons ? (
        <View style={[styles.noteBox, { backgroundColor: theme.primaryTint }]}>
          <ThemedText type="smallBold" themeColor="accent">
            +{extraPersons} {extraPersons === 1 ? 'شخص إضافي' : 'أشخاص إضافيون'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            +{extraPersonCost} ر.س
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

/* ─────────────── الخطوة 2: التاريخ ─────────────── */
function StepDate({
  eventDate, setEventDate, blockedSet, closedPeriods, weeklyOffDays, minBookingHours, monthOffset, setMonthOffset,
}: {
  eventDate: string;
  setEventDate: (d: string) => void;
  blockedSet: Set<string>;
  closedPeriods: BookingWizardData['closedPeriods'];
  weeklyOffDays: number[];
  minBookingHours: number;
  monthOffset: number;
  setMonthOffset: (fn: (o: number) => number) => void;
}) {
  const theme = useTheme();
  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const minDate = new Date(today.getTime() + minBookingHours * 60 * 60 * 1000);

  function isDisabled(day: number): boolean {
    const d = new Date(year, month, day);
    const ds = formatDs(year, month, day);
    if (d < minDate) return true;
    if (weeklyOffDays.includes(d.getDay())) return true;
    if (blockedSet.has(ds)) return true;
    return closedPeriods.some((p) => ds >= p.starts_at.slice(0, 10) && ds <= p.ends_at.slice(0, 10));
  }

  const offDayNames = weeklyOffDays.map((d) => ARABIC_DAY_NAMES[d]).join(' — ');

  return (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>
        اختر التاريخ
      </ThemedText>

      {eventDate ? (
        <View style={[styles.selectedDateBanner, { backgroundColor: theme.primary }]}>
          <ThemedText style={{ color: '#fff', fontFamily: ArabicFonts.bold }}>{eventDate}</ThemedText>
        </View>
      ) : null}

      {minBookingHours > 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          يجب الحجز قبل {minBookingHours} ساعة على الأقل من موعد الفعالية
        </ThemedText>
      ) : null}
      {offDayNames ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          أيام مغلقة: {offDayNames}
        </ThemedText>
      ) : null}

      <View style={[styles.calendarCard, CardShadow, { backgroundColor: theme.background }]}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => setMonthOffset((o) => o - 1)} style={styles.calendarNavButton}>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
          <ThemedText type="smallBold">
            {ARABIC_MONTHS[month]} {year}
          </ThemedText>
          <Pressable
            onPress={() => setMonthOffset((o) => Math.min(5, o + 1))}
            style={styles.calendarNavButton}>
            <Ionicons name="chevron-back" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.calendarWeekRow}>
          {ARABIC_SHORT_DAYS.map((d, i) => (
            <ThemedText
              key={d}
              type="small"
              themeColor={weeklyOffDays.includes(i) ? 'danger' : 'textSecondary'}
              style={styles.calendarWeekCell}>
              {d}
            </ThemedText>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.calendarCell} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const ds = formatDs(year, month, day);
            const selected = ds === eventDate;
            const disabled = isDisabled(day);
            return (
              <Pressable
                key={day}
                disabled={disabled}
                onPress={() => setEventDate(ds)}
                style={[
                  styles.calendarCell,
                  styles.calendarDay,
                  selected ? { backgroundColor: theme.primary } : null,
                ]}>
                <ThemedText
                  type="small"
                  style={{
                    color: selected ? '#fff' : disabled ? theme.backgroundSelected : theme.text,
                    fontFamily: selected ? ArabicFonts.bold : undefined,
                  }}>
                  {day}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/* ─────────────── الخطوة 3: الوقت ─────────────── */
function StepTime({
  eventTime, setEventTime, extraHours, setExtraHours, slots, pkg, extraHourCost, maxExtraHours,
  workingHoursStart, workingHoursEnd,
}: {
  eventTime: string;
  setEventTime: (t: string) => void;
  extraHours: number;
  setExtraHours: (h: number) => void;
  slots: string[];
  pkg: NonNullable<BookingWizardData['package']>;
  extraHourCost: number;
  maxExtraHours: number;
  workingHoursStart: string;
  workingHoursEnd: string;
}) {
  const theme = useTheme();
  const endTime = eventTime ? addHoursToTime(eventTime, pkg.duration_hours + extraHours) : '';

  const handleSelect = (t: string) => {
    setEventTime(t);
    setExtraHours(0);
  };

  return (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>
        وقت البدء
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.stepSubtitle}>
        ساعات العمل: {workingHoursStart} — {workingHoursEnd}
      </ThemedText>

      {eventTime ? (
        <View style={[styles.selectedTimeBanner, { backgroundColor: theme.primary }]}>
          <ThemedText style={{ color: '#fff', fontSize: 32, fontFamily: ArabicFonts.bold }}>{eventTime}</ThemedText>
          <ThemedText style={{ color: 'rgba(255,255,255,0.85)' }} type="small">
            ينتهي الساعة {endTime} (مدة {pkg.duration_hours + extraHours} ساعة)
          </ThemedText>
        </View>
      ) : null}

      {slots.length === 0 ? (
        <ThemedText themeColor="danger" style={styles.hint}>
          مدة الباقة تتجاوز ساعات العمل المتاحة
        </ThemedText>
      ) : (
        <View style={styles.slotsGrid}>
          {slots.map((t) => {
            const selected = t === eventTime;
            return (
              <Pressable
                key={t}
                style={[
                  styles.slotButton,
                  {
                    backgroundColor: selected ? theme.primary : theme.background,
                    borderColor: selected ? theme.primary : theme.backgroundSelected,
                  },
                ]}
                onPress={() => handleSelect(t)}>
                <ThemedText type="small" style={{ color: selected ? '#fff' : theme.text }}>
                  {t}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      )}

      {eventTime && pkg.allow_extra_hours && pkg.extra_hour_price && maxExtraHours > 0 ? (
        <View style={[styles.extraHoursCard, CardShadow, { backgroundColor: theme.background }]}>
          <ThemedText type="smallBold" style={styles.rightText}>
            ساعات إضافية
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.rightText}>
            حتى {maxExtraHours} ساعة إضافية ({pkg.extra_hour_price} ر.س/ساعة)
          </ThemedText>
          <View style={styles.stepperRowSmall}>
            <Pressable
              style={[styles.stepperButtonSmall, { borderColor: theme.backgroundSelected }]}
              disabled={extraHours === 0}
              onPress={() => setExtraHours(Math.max(0, extraHours - 1))}>
              <Ionicons name="remove" size={16} color={theme.text} />
            </Pressable>
            <ThemedText type="smallBold" style={styles.extraHoursValue}>
              {extraHours}
            </ThemedText>
            <Pressable
              style={[styles.stepperButtonSmall, { borderColor: theme.backgroundSelected }]}
              disabled={extraHours >= maxExtraHours}
              onPress={() => setExtraHours(Math.min(maxExtraHours, extraHours + 1))}>
              <Ionicons name="add" size={16} color={theme.text} />
            </Pressable>
            {extraHours > 0 ? (
              <ThemedText type="smallBold" themeColor="accent" style={styles.extraHoursCost}>
                +{extraHourCost} ر.س
              </ThemedText>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

/* ─────────────── الخطوة 4: تخصيص الباقة ─────────────── */
function StepCustomize({
  pkg,
  personsCount,
  selectionChoices,
  setSelectionChoices,
  selectedAddons,
  setSelectedAddons,
  staffGenderPreference,
  setStaffGenderPreference,
}: {
  pkg: NonNullable<BookingWizardData['package']>;
  personsCount: number;
  selectionChoices: Record<string, string[]>;
  setSelectionChoices: (choices: Record<string, string[]>) => void;
  selectedAddons: NonNullable<BookingWizardData['package']['optional_addons']>;
  setSelectedAddons: (addons: NonNullable<BookingWizardData['package']['optional_addons']>) => void;
  staffGenderPreference: 'mixed' | 'male' | 'female';
  setStaffGenderPreference: (value: 'mixed' | 'male' | 'female') => void;
}) {
  const theme = useTheme();

  const toggleChoice = (label: string, option: string, max: number) => {
    const current = selectionChoices[label] ?? [];
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : current.length < max
        ? [...current, option]
        : current;
    setSelectionChoices({ ...selectionChoices, [label]: next });
  };

  const toggleAddon = (addon: NonNullable<BookingWizardData['package']['optional_addons']>[number]) => {
    const selected = selectedAddons.some((item) => item.name === addon.name);
    setSelectedAddons(selected ? selectedAddons.filter((item) => item.name !== addon.name) : [...selectedAddons, addon]);
  };

  return (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>تخصيص الباقة</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.stepSubtitle}>
        اختر الأصناف والإضافات المناسبة لفعاليتك
      </ThemedText>

      {(pkg.selection_groups ?? []).map((group) => {
        const selected = selectionChoices[group.label] ?? [];
        return (
          <View key={group.label} style={[styles.customizationCard, { backgroundColor: theme.background }]}>
            <ThemedText type="smallBold" style={styles.rightText}>{group.label}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.rightText}>
              اختر من {group.min} إلى {group.max} · تم اختيار {selected.length}
            </ThemedText>
            <View style={styles.choiceGrid}>
              {group.options.map((option) => {
                const active = selected.includes(option);
                const disabled = !active && selected.length >= group.max;
                return (
                  <Pressable
                    key={option}
                    disabled={disabled}
                    onPress={() => toggleChoice(group.label, option, group.max)}
                    style={[
                      styles.choiceChip,
                      {
                        backgroundColor: active ? theme.primaryTint : theme.backgroundElement,
                        borderColor: active ? theme.primary : 'transparent',
                        opacity: disabled ? 0.45 : 1,
                      },
                    ]}>
                    <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={17} color={active ? theme.primary : theme.textSecondary} />
                    <ThemedText type="small" style={{ color: active ? theme.primary : theme.text }}>{option}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      {(pkg.optional_addons ?? []).length > 0 ? (
        <View style={[styles.customizationCard, { backgroundColor: theme.background }]}>
          <ThemedText type="smallBold" style={styles.rightText}>إضافات اختيارية</ThemedText>
          {(pkg.optional_addons ?? []).map((addon) => {
            const active = selectedAddons.some((item) => item.name === addon.name);
            const price = addon.pricing === 'per_person' ? addon.price * personsCount : addon.price;
            return (
              <Pressable key={addon.name} style={styles.addonRow} onPress={() => toggleAddon(addon)}>
                <Ionicons name={active ? 'checkbox' : 'square-outline'} size={22} color={active ? theme.primary : theme.textSecondary} />
                <View style={styles.addonText}>
                  <ThemedText type="smallBold">{addon.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    +{price} ر.س {addon.pricing === 'per_person' ? `(${addon.price} ر.س/شخص)` : ''}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {pkg.staff_total > 0 ? (
        <View style={[styles.customizationCard, { backgroundColor: theme.background }]}>
          <ThemedText type="smallBold" style={styles.rightText}>تفضيل طاقم الخدمة</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.rightText}>
            يتضمن العرض {pkg.staff_total} من طاقم الخدمة
          </ThemedText>
          <View style={styles.staffOptions}>
            {([
              ['mixed', 'مختلط'],
              ['male', 'رجال'],
              ['female', 'نساء'],
            ] as const).filter(([value]) =>
              value === 'mixed' || (value === 'male' ? pkg.staff_male > 0 : pkg.staff_female > 0)
            ).map(([value, label]) => {
              const active = staffGenderPreference === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setStaffGenderPreference(value)}
                  style={[styles.staffOption, { borderColor: active ? theme.primary : theme.backgroundSelected }]}>
                  <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={18} color={active ? theme.primary : theme.textSecondary} />
                  <ThemedText type="small">{label}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {(pkg.selection_groups ?? []).length === 0 && (pkg.optional_addons ?? []).length === 0 && pkg.staff_total === 0 ? (
        <View style={[styles.emptyCustomization, { backgroundColor: theme.background }]}>
          <Ionicons name="checkmark-circle-outline" size={34} color={theme.success} />
          <ThemedText type="smallBold">الباقة جاهزة بدون خيارات إضافية</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

/* ─────────────── الخطوة 5: الموقع ─────────────── */
function StepLocation({
  locationAddress, setLocationAddress, contactPhone, setContactPhone,
}: {
  locationAddress: string;
  setLocationAddress: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
}) {
  const theme = useTheme();
  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.backgroundSelected }];

  return (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>
        موقع الفعالية
      </ThemedText>

      <ThemedText type="smallBold" style={styles.label}>
        عنوان الفعالية
      </ThemedText>
      <TextInput
        style={inputStyle}
        value={locationAddress}
        onChangeText={setLocationAddress}
        textAlign="right"
        multiline
        placeholder="الحي، الشارع، تفاصيل إضافية"
        placeholderTextColor={theme.textSecondary}
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
    </View>
  );
}

/* ─────────────── الخطوة 6: المراجعة ─────────────── */
function StepReview({
  wizard, personsCount, eventDate, eventTime, extraHours, locationAddress, contactPhone,
  extraPersonCost, extraHourCost, addonCost, totalAmount, selectionChoices, selectedAddons,
  staffGenderPreference, notes, setNotes,
}: {
  wizard: BookingWizardData;
  personsCount: number;
  eventDate: string;
  eventTime: string;
  extraHours: number;
  locationAddress: string;
  contactPhone: string;
  extraPersonCost: number;
  extraHourCost: number;
  addonCost: number;
  totalAmount: number;
  selectionChoices: Record<string, string[]>;
  selectedAddons: NonNullable<BookingWizardData['package']['optional_addons']>;
  staffGenderPreference: 'mixed' | 'male' | 'female';
  notes: string;
  setNotes: (v: string) => void;
}) {
  const theme = useTheme();

  return (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>
        مراجعة الحجز
      </ThemedText>

      <View style={[styles.reviewCard, CardShadow, { backgroundColor: theme.background }]}>
        <ReviewRow label="الباقة" value={wizard.package.name} />
        <ReviewRow label="العلامة التجارية" value={wizard.brand.name} />
        <ReviewRow label="عدد الأشخاص" value={String(personsCount)} />
        <ReviewRow label="التاريخ" value={eventDate} />
        <ReviewRow label="الوقت" value={`${eventTime} (${wizard.package.duration_hours + extraHours} ساعة)`} />
        <ReviewRow label="العنوان" value={locationAddress} />
        <ReviewRow label="رقم التواصل" value={contactPhone} />
        {Object.entries(selectionChoices).map(([label, choices]) => (
          <ReviewRow key={label} label={label} value={choices.join('، ')} />
        ))}
        {selectedAddons.length > 0 ? <ReviewRow label="الإضافات" value={selectedAddons.map((item) => item.name).join('، ')} /> : null}
        {wizard.package.staff_total > 0 ? (
          <ReviewRow
            label="تفضيل الطاقم"
            value={{ mixed: 'مختلط', male: 'رجال', female: 'نساء' }[staffGenderPreference]}
          />
        ) : null}

        <View style={[styles.reviewDivider, { backgroundColor: theme.backgroundSelected }]} />

        <ReviewRow label="سعر الباقة" value={`${wizard.pricing.effective_base_price} ر.س`} />
        {wizard.pricing.discount_amount > 0 ? (
          <ReviewRow label={wizard.pricing.offer_name ?? 'خصم العرض'} value={`-${wizard.pricing.discount_amount} ر.س`} />
        ) : null}
        {extraPersonCost > 0 ? <ReviewRow label="أشخاص إضافيون" value={`+${extraPersonCost} ر.س`} /> : null}
        {extraHourCost > 0 ? <ReviewRow label="ساعات إضافية" value={`+${extraHourCost} ر.س`} /> : null}
        {addonCost > 0 ? <ReviewRow label="إضافات الباقة" value={`+${addonCost} ر.س`} /> : null}
        <ReviewRow label="الإجمالي" value={`${totalAmount} ر.س`} bold />
      </View>

      <ThemedText type="smallBold" style={styles.label}>
        ملاحظات (اختياري)
      </ThemedText>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        value={notes}
        onChangeText={setNotes}
        textAlign="right"
        multiline
      />
    </View>
  );
}

function ReviewRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.reviewRow}>
      <ThemedText type={bold ? 'smallBold' : 'small'} themeColor={bold ? 'accent' : undefined}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

/* ─────────────── الخطوة 7: الدفع ─────────────── */
function StepPayment({
  paymentMethods, paymentMethod, setPaymentMethod, bankInfo, totalAmount,
}: {
  paymentMethods: BookingWizardData['paymentMethods'];
  paymentMethod: string | null;
  setPaymentMethod: (v: string) => void;
  bankInfo: BookingWizardData['bankInfo'];
  totalAmount: number;
}) {
  const theme = useTheme();
  const isBankTransfer = paymentMethod === 'bank_transfer';

  return (
    <View>
      <ThemedText type="subtitle" style={styles.stepTitle}>
        طريقة الدفع
      </ThemedText>

      <View style={styles.paymentOptions}>
        {paymentMethods.map((method) => {
          const active = paymentMethod === method.value;
          return (
            <Pressable
              key={method.value}
              style={[
                styles.paymentOption,
                CardShadow,
                {
                  backgroundColor: theme.background,
                  borderColor: active ? theme.primary : 'transparent',
                },
              ]}
              onPress={() => setPaymentMethod(method.value)}>
              <Ionicons
                name={active ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={active ? theme.primary : theme.textSecondary}
              />
              <ThemedText type="smallBold" style={{ color: active ? theme.primary : theme.text }}>
                {method.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {isBankTransfer ? (
        <View style={[styles.bankCard, CardShadow, { backgroundColor: theme.background }]}>
          <ThemedText type="smallBold" style={styles.rightText}>
            بيانات التحويل البنكي
          </ThemedText>
          <ReviewRow label="البنك" value={bankInfo.bank_name} />
          <ReviewRow label="اسم الحساب" value={bankInfo.account_name} />
          <ReviewRow label="رقم الحساب" value={bankInfo.account_number} />
          <ReviewRow label="IBAN" value={bankInfo.iban} />
          <ReviewRow label="المبلغ المطلوب" value={`${totalAmount} ر.س`} bold />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  header: { paddingTop: 8, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 10 },
  backButton: { padding: 6 },
  headerTitleCol: { flex: 1, alignItems: 'flex-end' },
  headerStepCol: { alignItems: 'flex-end' },
  progressTrack: { height: 3, width: '100%' },
  progressFill: { height: 3 },
  content: { padding: 16, paddingBottom: 32 },
  error: { textAlign: 'center', marginTop: 16 },
  footer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerTotal: { fontSize: 20 },
  nextButton: { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },

  stepCenter: { alignItems: 'center' },
  stepTitle: { textAlign: 'center', fontSize: 22, marginBottom: 6 },
  stepSubtitle: { textAlign: 'center', marginBottom: 16 },
  hint: { textAlign: 'center', marginBottom: 8 },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 28, marginTop: 12 },
  stepperButton: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  stepperValueCol: { alignItems: 'center', minWidth: 80 },
  stepperValue: { fontSize: 56, fontFamily: ArabicFonts.bold, lineHeight: 60 },
  noteBox: { marginTop: 20, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 },

  selectedDateBanner: { borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginBottom: 12 },
  selectedTimeBanner: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', gap: 4, marginBottom: 16 },
  calendarCard: { borderRadius: 18, padding: 14 },
  calendarHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calendarNavButton: { padding: 6 },
  calendarWeekRow: { flexDirection: 'row-reverse', marginBottom: 6 },
  calendarWeekCell: { flex: 1, textAlign: 'center' },
  calendarGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
  calendarCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calendarDay: { borderRadius: 10 },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotButton: { width: '22%', borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  extraHoursCard: { marginTop: 16, borderRadius: 16, padding: 14, gap: 4 },
  rightText: { textAlign: 'right' },
  stepperRowSmall: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginTop: 8 },
  stepperButtonSmall: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  extraHoursValue: { minWidth: 24, textAlign: 'center' },
  extraHoursCost: { marginRight: 'auto' },

  customizationCard: { borderRadius: 16, padding: 14, gap: 8, marginBottom: 12 },
  choiceGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  choiceChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  addonRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingVertical: 8 },
  addonText: { flex: 1, alignItems: 'flex-end' },
  staffOptions: { flexDirection: 'row-reverse', gap: 8, marginTop: 4 },
  staffOption: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderRadius: 12, paddingVertical: 10 },
  emptyCustomization: { borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },

  label: { textAlign: 'right', marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },

  reviewCard: { borderRadius: 18, padding: 16, gap: 10 },
  reviewRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  reviewDivider: { height: 1, marginVertical: 4 },

  paymentOptions: { gap: 10 },
  paymentOption: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderWidth: 2, borderRadius: 14, padding: 16 },
  bankCard: { marginTop: 16, borderRadius: 16, padding: 16, gap: 10 },
});
