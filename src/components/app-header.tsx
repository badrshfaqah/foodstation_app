import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { CairoFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AppHeader({ onMenuPress }: { onMenuPress: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 10, backgroundColor: theme.background, borderBottomColor: theme.backgroundSelected },
      ]}>
      <View style={styles.brandRow}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} contentFit="cover" />
        <ThemedText style={[styles.title, { color: theme.primary, fontFamily: CairoFonts.bold }]}>
          فود‌ستيشن
        </ThemedText>
      </View>
      <Pressable style={styles.menuButton} onPress={onMenuPress} hitSlop={8}>
        <Ionicons name="ellipsis-vertical" size={22} color={theme.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  brandRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  logo: { width: 30, height: 30, borderRadius: 8 },
  title: { fontSize: 20 },
  menuButton: { padding: 4 },
});
