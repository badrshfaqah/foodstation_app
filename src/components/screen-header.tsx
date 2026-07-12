import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function ScreenHeader({ title }: { title: string }) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.backgroundSelected }]}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.45 : 1 }]}>
        <Ionicons name="chevron-forward" size={20} color={theme.primary} />
      </Pressable>
      <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    minHeight: 48,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { padding: 8, width: 36, alignItems: 'center' },
  title: { flex: 1, textAlign: 'center' },
});
