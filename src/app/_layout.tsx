import { Cairo_700Bold, Cairo_900Black } from '@expo-google-fonts/cairo';
import {
  NotoSansArabic_400Regular,
  NotoSansArabic_500Medium,
  NotoSansArabic_600SemiBold,
  NotoSansArabic_700Bold,
  useFonts,
} from '@expo-google-fonts/noto-sans-arabic';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { authenticateWithBiometrics, isBiometricEnabled, isBiometricSupported } from '@/api/biometric';
import { AppHeader } from '@/components/app-header';
import { BiometricLockScreen } from '@/components/biometric-lock-screen';
import { ForceUpdateScreen } from '@/components/force-update-screen';
import { OfflineBanner } from '@/components/offline-banner';
import { SideDrawer } from '@/components/side-drawer';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { NotificationsProvider } from '@/context/notifications-context';
import { SavedProvider } from '@/context/saved-context';
import { useForceUpdate } from '@/hooks/use-force-update';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLoading, user, logout } = useAuth();
  const [fontsLoaded] = useFonts({
    NotoSansArabic_400Regular,
    NotoSansArabic_500Medium,
    NotoSansArabic_600SemiBold,
    NotoSansArabic_700Bold,
    Cairo_700Bold,
    Cairo_900Black,
  });
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bioLocked, setBioLocked] = useState(false);
  const [bioChecked, setBioChecked] = useState(false);
  const forceUpdate = useForceUpdate();

  usePushNotifications();

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, fontsLoaded]);

  const tryUnlock = async () => {
    const success = await authenticateWithBiometrics('افتح فودستيشن');
    if (success) {
      haptics.success();
    } else {
      haptics.error();
    }
    setBioLocked(!success);
  };

  useEffect(() => {
    if (isLoading || bioChecked) return;
    (async () => {
      if (user && (await isBiometricEnabled()) && (await isBiometricSupported())) {
        setBioLocked(true);
        setBioChecked(true);
        await tryUnlock();
      } else {
        setBioChecked(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, bioChecked]);

  if (isLoading || !fontsLoaded || !bioChecked) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (forceUpdate.required) {
    return <ForceUpdateScreen storeUrl={forceUpdate.storeUrl} />;
  }

  if (bioLocked) {
    return (
      <BiometricLockScreen
        onRetry={tryUnlock}
        onUseLoginInstead={() => {
          setBioLocked(false);
          logout();
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <OfflineBanner />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, headerTintColor: theme.primary }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="brand/[slug]" />
          <Stack.Screen name="booking/[brandSlug]/[packageId]" />
          <Stack.Screen name="booking-detail/[id]" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="offers" />
          <Stack.Screen name="notifications" />
        </Stack>
      </View>
      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <NotificationsProvider>
          <SavedProvider>
            <RootNavigator />
          </SavedProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
