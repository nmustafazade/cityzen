"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/AuthContext";
import { getUnreadNotificationCount } from "@/lib/notifications";

interface NotificationContextValue {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await getUnreadNotificationCount();
      setUnreadCount(response.count);
    } catch {
      // Keep the last known count; page-level requests surface actionable errors.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState !== "visible") return;
      pending = true;
      try {
        const response = await getUnreadNotificationCount();
        if (active) setUnreadCount(response.count);
      } catch {
        // Retry on the next poll or when the user returns to this tab.
      } finally {
        pending = false;
      }
    };
    const onVisible = () => void refresh();
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => {
      void refresh();
    }, 30_000);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isAuthenticated, isLoading, user?.id]);

  const visibleUnreadCount = isAuthenticated ? unreadCount : 0;
  const value = useMemo(
    () => ({ unreadCount: visibleUnreadCount, refreshUnreadCount }),
    [refreshUnreadCount, visibleUnreadCount],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return context;
}
