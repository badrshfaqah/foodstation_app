import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LoginPrompt } from '@/components/login-prompt';
import { CardShadow } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();

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

      <Pressable style={[styles.logoutButton, { borderColor: theme.danger }]} onPress={logout}>
        <ThemedText themeColor="danger">تسجيل الخروج</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, gap: 16 },
  title: { fontSize: 28, textAlign: 'right', marginTop: 8 },
  card: { borderRadius: 16, padding: 16, gap: 4, alignItems: 'flex-end' },
  logoutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
