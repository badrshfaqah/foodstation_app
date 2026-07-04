import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, View } from 'react-native';

import { getBrands } from '@/api/catalog';
import { apiErrorMessage } from '@/api/client';
import type { Brand } from '@/api/types';
import { BrandCard } from '@/components/brand-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    const timeout = setTimeout(() => {
      getBrands({ search: trimmed })
        .then((data) => {
          setResults(data.brands.data);
          setError(null);
        })
        .catch((err) => setError(apiErrorMessage(err, 'تعذر البحث')))
        .finally(() => {
          setIsLoading(false);
          setHasSearched(true);
        });
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.searchBar, CardShadow, { backgroundColor: theme.background }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="ابحث عن خدمة أو علامة تجارية..."
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
            textAlign="right"
            autoFocus
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            hasSearched ? (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                {error ?? 'لا توجد نتائج'}
              </ThemedText>
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                ابحث عن أي علامة تجارية أو نوع خدمة
              </ThemedText>
            )
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <BrandCard
                brand={item}
                onPress={() => router.push({ pathname: '/brand/[slug]', params: { slug: item.slug } })}
              />
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16 },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 110, flexGrow: 1 },
  gridRow: { gap: 12 },
  gridItem: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 48 },
});
