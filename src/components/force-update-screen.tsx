import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CairoFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ForceUpdateScreen({ storeUrl }: { storeUrl: string | null }) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={require('@/assets/images/icon.png')} style={styles.logo} contentFit="cover" />
      <View style={[styles.iconWrap, { backgroundColor: theme.primaryTint }]}>
        <Ionicons name="cloud-upload-outline" size={36} color={theme.primary} />
      </View>
      <ThemedText type="title" style={[styles.title, { fontFamily: CairoFonts.bold }]}>
        يتوفر تحديث جديد
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        نزلنا نسخة جديدة من فودستيشن فيها تحسينات مهمة. يرجى تحديث التطبيق للمتابعة.
      </ThemedText>
      <Pressable
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={() => storeUrl && Linking.openURL(storeUrl)}>
        <ThemedText type="smallBold" style={styles.buttonText}>
          تحديث الآن
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: 12 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 22, textAlign: 'center' },
  message: { textAlign: 'center', marginBottom: 8, lineHeight: 20 },
  button: { borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  buttonText: { color: '#fff' },
});
