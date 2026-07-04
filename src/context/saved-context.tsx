import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Brand } from '@/api/types';

const STORAGE_KEY = 'foodstation_saved_brands';

type SavedContextValue = {
  savedBrands: Brand[];
  isLoading: boolean;
  isSaved: (brandId: number) => boolean;
  toggleSaved: (brand: Brand) => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [savedBrands, setSavedBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSavedBrands(JSON.parse(raw));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback((brands: Brand[]) => {
    setSavedBrands(brands);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
  }, []);

  const isSaved = useCallback((brandId: number) => savedBrands.some((b) => b.id === brandId), [savedBrands]);

  const toggleSaved = useCallback(
    (brand: Brand) => {
      if (isSaved(brand.id)) {
        persist(savedBrands.filter((b) => b.id !== brand.id));
      } else {
        persist([brand, ...savedBrands]);
      }
    },
    [savedBrands, isSaved, persist]
  );

  return (
    <SavedContext.Provider value={{ savedBrands, isLoading, isSaved, toggleSaved }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) {
    throw new Error('useSaved must be used within SavedProvider');
  }
  return ctx;
}
