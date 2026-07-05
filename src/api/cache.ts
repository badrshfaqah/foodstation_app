import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'foodstation_cache_';

/**
 * يجرّب يجيب البيانات من الشبكة أولاً ويخزّنها محلياً؛ لو فشل الاتصال يرجّع آخر نسخة محفوظة إن وجدت.
 */
export async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const data = await fetcher();
    AsyncStorage.setItem(PREFIX + key, JSON.stringify(data)).catch(() => {});
    return data;
  } catch (err) {
    const cached = await AsyncStorage.getItem(PREFIX + key);
    if (cached) return JSON.parse(cached) as T;
    throw err;
  }
}
