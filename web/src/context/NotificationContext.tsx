"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";
import { getUnreadNotificationCount } from "@/lib/notifications";

interface NotificationContextValue {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
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

    const initialRefresh = window.setTimeout(() => void refreshUnreadCount(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshUnreadCount();
    }, 30_000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [isAuthenticated, isLoading, refreshUnreadCount]);

  const visibleUnreadCount = isAuthenticated ? unreadCount : 0;
  const value = useMemo(
    () => ({ unreadCount: visibleUnreadCount, refreshUnreadCount }),
    [refreshUnreadCount, visibleUnreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
}
