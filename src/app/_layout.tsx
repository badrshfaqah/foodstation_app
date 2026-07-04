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

import { AppHeader } from '@/components/app-header';
import { SideDrawer } from '@/components/side-drawer';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { SavedProvider } from '@/context/saved-context';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLoading } = useAuth();
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

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, headerTintColor: theme.primary }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="brand/[slug]" />
          <Stack.Screen name="booking/[brandSlug]/[packageId]" />
          <Stack.Screen name="booking-detail/[id]" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="offers" />
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
        <SavedProvider>
          <RootNavigator />
        </SavedProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
