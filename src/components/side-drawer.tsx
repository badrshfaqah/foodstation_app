import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ArabicFonts, CairoFonts, CardShadow } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

const DRAWER_WIDTH = Math.min(300, Dimensions.get('window').width * 0.8);

export function SideDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateX]);

  const go = (href: Parameters<typeof router.push>[0]) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.panel,
            CardShadow,
            { backgroundColor: theme.background, width: DRAWER_WIDTH, transform: [{ translateX }] },
          ]}
          onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Image source={require('@/assets/images/icon.png')} style={styles.logo} contentFit="cover" />
            <ThemedText type="smallBold" themeColor="primary" style={{ fontFamily: CairoFonts.bold }}>
              فود‌ستيشن
            </ThemedText>
          </View>

          <DrawerItem icon="home-outline" label="الرئيسية" onPress={() => go('/(tabs)')} />
          <DrawerItem icon="heart-outline" label="المحفوظة" onPress={() => go('/saved')} />

          <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

          {user ? (
            <DrawerItem
              icon="log-out-outline"
              label="تسجيل الخروج"
              danger
              onPress={() => {
                onClose();
                logout();
              }}
            />
          ) : (
            <DrawerItem icon="log-in-outline" label="تسجيل الدخول" onPress={() => go('/(auth)/login')} />
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function DrawerItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();
  const color = danger ? theme.danger : theme.text;

  return (
    <Pressable style={styles.item} onPress={onPress}>
      <ThemedText style={{ color, fontFamily: ArabicFonts.medium }}>{label}</ThemedText>
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    paddingTop: 60,
    paddingHorizontal: 8,
  },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 20 },
  logo: { width: 36, height: 36, borderRadius: 10 },
  divider: { height: 1, marginVertical: 8, marginHorizontal: 12 },
  item: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
});
