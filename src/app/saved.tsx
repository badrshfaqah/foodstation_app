import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { BrandCard } from '@/components/brand-card';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSaved } from '@/context/saved-context';

export default function SavedScreen() {
  const router = useRouter();
  const { savedBrands } = useSaved();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ScreenHeader title="المحفوظة" />
      <FlatList
        data={savedBrands}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            ما حفظت أي علامة تجارية بعد — اضغط أيقونة القلب على أي علامة لحفظها هنا
          </ThemedText>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <BrandCard brand={item} onPress={() => router.push({ pathname: '/brand/[slug]', params: { slug: item.slug } })} />
          </View>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  gridRow: { gap: 12 },
  gridItem: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 48 },
});
