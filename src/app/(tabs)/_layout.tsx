import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, type ColorValue } from 'react-native';

import { ArabicFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/utils/haptics';

const onTabPress = () => haptics.select();

function TabIcon({
  name,
  focused,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: ColorValue;
}) {
  return <Ionicons name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)} color={color} size={24} />;
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontFamily: ArabicFonts.medium, fontSize: 11 },
        tabBarItemStyle: { paddingTop: 5 },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: Platform.select({ ios: 84, default: 64 }),
          paddingTop: 4,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.backgroundSelected,
          backgroundColor: theme.background,
          elevation: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" focused={focused} color={color} />,
        }}
        listeners={{ tabPress: onTabPress }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'بحث',
          tabBarIcon: ({ color, focused }) => <TabIcon name="search" focused={focused} color={color} />,
        }}
        listeners={{ tabPress: onTabPress }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'حجوزاتي',
          tabBarIcon: ({ color, focused }) => <TabIcon name="calendar" focused={focused} color={color} />,
        }}
        listeners={{ tabPress: onTabPress }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, focused }) => <TabIcon name="person" focused={focused} color={color} />,
        }}
        listeners={{ tabPress: onTabPress }}
      />
    </Tabs>
  );
}
