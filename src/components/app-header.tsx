import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { CairoFonts } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useNotificationsBadge } from '@/context/notifications-context';
import { useTheme } from '@/hooks/use-theme';

export function AppHeader({ onMenuPress }: { onMenuPress: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotificationsBadge();

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
      <View style={styles.actionsRow}>
        {user ? (
          <Pressable style={styles.iconButton} onPress={() => router.push('/notifications')} hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
            {unreadCount > 0 ? (
              <View style={[styles.badge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
                <ThemedText style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</ThemedText>
              </View>
            ) : null}
          </Pressable>
        ) : null}
        <Pressable style={styles.iconButton} onPress={onMenuPress} hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={22} color={theme.text} />
        </Pressable>
      </View>
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
  actionsRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  iconButton: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    left: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
