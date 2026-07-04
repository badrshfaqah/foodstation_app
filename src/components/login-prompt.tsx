import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ArabicFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function LoginPrompt({ message }: { message: string }) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ThemedText themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>
      <Pressable
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/(auth)/login')}>
        <ThemedText style={{ color: theme.background, fontFamily: ArabicFonts.bold }}>تسجيل الدخول</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  message: { textAlign: 'center' },
  button: { borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
});
