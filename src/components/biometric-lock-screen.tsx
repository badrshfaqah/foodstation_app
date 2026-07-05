import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getBiometricLabel } from '@/api/biometric';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArabicFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function BiometricLockScreen({
  onRetry,
  onUseLoginInstead,
}: {
  onRetry: () => void;
  onUseLoginInstead: () => void;
}) {
  const theme = useTheme();
  const [label, setLabel] = useState('Face ID');

  useEffect(() => {
    getBiometricLabel().then(setLabel);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Image source={require('@/assets/images/icon.png')} style={styles.logo} contentFit="cover" />
      <View style={[styles.iconCircle, { backgroundColor: theme.primaryTint }]}>
        <Ionicons name="scan-outline" size={40} color={theme.primary} />
      </View>
      <ThemedText type="subtitle" style={styles.title}>
        التطبيق مقفل
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        افتح باستخدام {label} للمتابعة
      </ThemedText>

      <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={onRetry}>
        <ThemedText style={{ color: theme.background, fontFamily: ArabicFonts.bold }}>فتح الآن</ThemedText>
      </Pressable>

      <Pressable onPress={onUseLoginInstead} style={styles.linkButton}>
        <ThemedText themeColor="textSecondary" type="small">
          تسجيل الدخول برقم الجوال بدلاً من ذلك
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  logo: { width: 64, height: 64, borderRadius: 16, marginBottom: 8 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginBottom: 16 },
  button: { borderRadius: 12, paddingHorizontal: 40, paddingVertical: 14, minWidth: 200, alignItems: 'center' },
  linkButton: { marginTop: 20, padding: 8 },
});
