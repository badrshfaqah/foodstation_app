import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const PREFERENCE_KEY = 'foodstation_biometric_enabled';
const ASKED_KEY = 'foodstation_biometric_asked';

export async function isBiometricSupported(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  return LocalAuthentication.isEnrolledAsync();
}

/** الاسم المناسب لطريقة الدخول البيومترية المتوفرة فعلياً على الجهاز (Face ID / بصمة / ...). */
export async function getBiometricLabel(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'بصمة الإصبع';
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'مسح القزحية';
  return 'الدخول البيومتري';
}

export async function isBiometricEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(PREFERENCE_KEY);
  return value === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PREFERENCE_KEY, enabled ? 'true' : 'false');
}

/** هل سبق أن عرضنا على المستخدم تفعيل الدخول البيومتري (لتفادي إزعاجه بالسؤال كل مرة). */
export async function hasAskedToEnableBiometric(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ASKED_KEY);
  return value === 'true';
}

export async function markAskedToEnableBiometric(): Promise<void> {
  await AsyncStorage.setItem(ASKED_KEY, 'true');
}

export async function authenticateWithBiometrics(promptMessage: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'إلغاء',
    disableDeviceFallback: false,
  });
  return result.success;
}
