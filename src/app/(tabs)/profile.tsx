import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        حسابي
      </ThemedText>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold">{user?.name}</ThemedText>
        <ThemedText themeColor="textSecondary" type="small">
          {user?.phone}
        </ThemedText>
      </View>

      <Pressable style={[styles.logoutButton, { borderColor: theme.backgroundSelected }]} onPress={logout}>
        <ThemedText style={{ color: '#d32f2f' }}>تسجيل الخروج</ThemedText>
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
