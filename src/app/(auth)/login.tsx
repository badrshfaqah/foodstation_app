import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import {
  authenticateWithBiometrics,
  getBiometricLabel,
  hasAskedToEnableBiometric,
  isBiometricEnabled,
  isBiometricSupported,
  markAskedToEnableBiometric,
  setBiometricEnabled,
} from '@/api/biometric';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { apiErrorMessage } from '@/api/client';
import { ArabicFonts, CairoFonts } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

type Step = 'phone' | 'otp';

/** بعد أول تسجيل دخول ناجح، نعرض على المستخدم تفعيل الدخول البيومتري إن كان الجهاز يدعمه ولم يُسأل من قبل. */
async function maybeOfferBiometricEnable() {
  if (!(await isBiometricSupported()) || (await isBiometricEnabled()) || (await hasAskedToEnableBiometric())) {
    return;
  }
  await markAskedToEnableBiometric();

  const label = await getBiometricLabel();

  await new Promise<void>((resolve) => {
    Alert.alert(
      `تفعيل الدخول بـ ${label}`,
      `تقدر تفتح فودستيشن بسرعة باستخدام ${label} بدل رمز التحقق في كل مرة.`,
      [
        { text: 'ليس الآن', style: 'cancel', onPress: () => resolve() },
        {
          text: 'تفعيل',
          onPress: async () => {
            const success = await authenticateWithBiometrics(`فعّل الدخول بـ ${label}`);
            if (success) await setBiometricEnabled(true);
            resolve();
          },
        },
      ]
    );
  });
}

export default function LoginScreen() {
  const theme = useTheme();
  const { requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    if (phone.trim().length < 9) {
      setError('أدخل رقم جوال صحيح');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const { exists } = await requestOtp(phone.trim());
      setNeedsName(!exists);
      setStep('otp');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (code.trim().length < 4) {
      setError('أدخل رمز التحقق');
      return;
    }
    if (needsName && name.trim().length < 2) {
      setError('الاسم مطلوب لإنشاء حسابك');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await verifyOtp(phone.trim(), code.trim(), needsName ? name.trim() : undefined);
      await maybeOfferBiometricEnable();
      // نرجع للشاشة اللي جينا منها (لو وصلنا هنا بدفع فوق شاشة ثانية)، وإلا نروح للرئيسية.
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', default: undefined })}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={[styles.title, { color: theme.primary, fontFamily: CairoFonts.bold }]}>
          فود‌ستيشن
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {step === 'phone' ? 'سجّل دخولك برقم جوالك' : `أدخل رمز التحقق المرسل إلى ${phone}`}
        </ThemedText>

        {step === 'phone' ? (
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
            placeholder="05xxxxxxxx"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            textAlign="right"
            autoFocus
          />
        ) : (
          <>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
              placeholder="رمز التحقق"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              textAlign="right"
              autoFocus
            />
            {needsName ? (
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.primary }]}
                placeholder="الاسم الكامل"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
                textAlign="right"
              />
            ) : null}
          </>
        )}

        {error ? (
          <ThemedText themeColor="danger" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        <Pressable
          style={[styles.button, { backgroundColor: theme.primary, opacity: isSubmitting ? 0.6 : 1 }]}
          disabled={isSubmitting}
          onPress={step === 'phone' ? handleRequestOtp : handleVerifyOtp}>
          {isSubmitting ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <ThemedText style={{ color: theme.background, fontFamily: ArabicFonts.bold }}>
              {step === 'phone' ? 'إرسال الرمز' : 'تأكيد الدخول'}
            </ThemedText>
          )}
        </Pressable>

        {step === 'otp' ? (
          <Pressable onPress={() => setStep('phone')} style={styles.backLink}>
            <ThemedText themeColor="textSecondary">تغيير رقم الجوال</ThemedText>
          </Pressable>
        ) : null}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  backLink: {
    alignItems: 'center',
    marginTop: 8,
  },
});
