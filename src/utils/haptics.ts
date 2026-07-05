import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptics = {
  tap: () => isSupported && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  select: () => isSupported && Haptics.selectionAsync(),
  success: () => isSupported && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => isSupported && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
