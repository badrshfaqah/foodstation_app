import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { apiErrorMessage } from '@/api/client';
import {
  authenticateWithBiometrics,
  getBiometricLabel,
  isBiometricEnabled,
  isBiometricSupported,
  setBiometricEnabled,
} from '@/api/biometric';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LoginPrompt } from '@/components/login-prompt';
import { CardShadow } from '@/constants/theme';
import { PRIVACY_POLICY_URL } from '@/config';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout, deleteAccount } = useAuth();
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioLabel, setBioLabel] = useState('Face ID');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    isBiometricSupported().then(setBioSupported);
    isBiometricEnabled().then(setBioEnabled);
    getBiometricLabel().then(setBioLabel);
  }, []);

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const success = await authenticateWithBiometrics(`فعّل الدخول بـ ${bioLabel}`);
      if (!success) return;
    }
    await setBiometricEnabled(value);
    setBioEnabled(value);
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب نهائياً',
      'سيتم حذف بياناتك الشخصية ولن تتمكن من الدخول بهذا الحساب مرة أخرى. حجوزاتك السابقة تبقى محفوظة لأغراض السجلات المالية فقط. هل أنت متأكد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف الحساب',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAccount();
            } catch (err) {
              Alert.alert('تعذر حذف الحساب', apiErrorMessage(err));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <ThemedView type="backgroundElement" style={{ flex: 1 }}>
        <LoginPrompt message="سجّل دخولك لعرض بيانات حسابك" />
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        حسابي
      </ThemedText>

      <View style={[styles.card, CardShadow, { backgroundColor: theme.background }]}>
        <ThemedText type="smallBold">{user.name}</ThemedText>
        <ThemedText themeColor="textSecondary" type="small">
          {user.phone}
        </ThemedText>
      </View>

      {bioSupported ? (
        <View style={[styles.card, CardShadow, styles.rowCard, { backgroundColor: theme.background }]}>
          <Switch
            value={bioEnabled}
            onValueChange={toggleBiometric}
            trackColor={{ true: theme.primary }}
          />
          <ThemedText type="smallBold">الدخول بـ {bioLabel}</ThemedText>
        </View>
      ) : null}

      <Pressable
        style={[styles.card, CardShadow, styles.rowCard, { backgroundColor: theme.background }]}
        onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}>
        <Ionicons name="chevron-back" size={18} color={theme.textSecondary} />
        <ThemedText type="smallBold">سياسة الخصوصية</ThemedText>
      </Pressable>

      <Pressable style={[styles.logoutButton, { borderColor: theme.danger }]} onPress={logout}>
        <ThemedText themeColor="danger">تسجيل الخروج</ThemedText>
      </Pressable>

      <Pressable
        style={[styles.deleteButton, { opacity: isDeleting ? 0.6 : 1 }]}
        onPress={confirmDeleteAccount}
        disabled={isDeleting}>
        {isDeleting ? (
          <ActivityIndicator color={theme.danger} size="small" />
        ) : (
          <ThemedText type="small" themeColor="danger" style={styles.deleteText}>
            حذف الحساب نهائياً
          </ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, gap: 16 },
  title: { fontSize: 28, textAlign: 'right', marginTop: 8 },
  card: { borderRadius: 16, padding: 16, gap: 4, alignItems: 'flex-end' },
  rowCard: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButton: { paddingVertical: 8, alignItems: 'center' },
  deleteText: { textDecorationLine: 'underline' },
});
