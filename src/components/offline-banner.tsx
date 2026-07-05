import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useTheme } from '@/hooks/use-theme';

export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  const theme = useTheme();

  if (isConnected) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.danger }]}>
      <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
      <ThemedText type="small" style={styles.text}>
        لا يوجد اتصال بالإنترنت — تعرض بيانات محفوظة مسبقاً
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  text: { color: '#fff' },
});
