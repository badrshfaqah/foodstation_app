import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function NoConnectionView({
  onRetry,
  isRetrying,
  message = 'تأكد من اتصالك بالإنترنت وحاول مرة أخرى',
}: {
  onRetry: () => void;
  isRetrying?: boolean;
  message?: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.backgroundSelected }]}>
        <Ionicons name="cloud-offline-outline" size={40} color={theme.textSecondary} />
      </View>
      <ThemedText type="smallBold" style={styles.title}>
        لا يوجد اتصال بالإنترنت
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>
      <Pressable
        style={[styles.button, { backgroundColor: theme.primary, opacity: isRetrying ? 0.6 : 1 }]}
        onPress={onRetry}
        disabled={isRetrying}>
        <Ionicons name="refresh" size={16} color="#fff" />
        <ThemedText type="smallBold" style={styles.buttonText}>
          {isRetrying ? 'جارِ إعادة المحاولة...' : 'إعادة المحاولة'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 17 },
  message: { textAlign: 'center', marginBottom: 12 },
  button: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: { color: '#fff' },
});
