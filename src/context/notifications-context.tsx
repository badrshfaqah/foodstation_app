import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';

import { getNotifications } from '@/api/notifications';
import { useAuth } from '@/context/auth-context';

type NotificationsContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: Dispatch<SetStateAction<number>>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setUnreadCount(data.unread_count);
    } catch {
      // نتجاهل فشل تحديث عدّاد الإشعارات، سيُعاد المحاولة عند الفتح التالي.
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshUnreadCount();
    } else {
      setUnreadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnreadCount, setUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsBadge() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotificationsBadge must be used within NotificationsProvider');
  }
  return ctx;
}
