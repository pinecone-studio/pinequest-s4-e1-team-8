"use client";

import {
  readLayoutPreferences,
  saveLayoutPreferences,
} from "@/lib/dashboard/layout-preferences";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const prefs = readLayoutPreferences();
    setCollapsedState(prefs.sidebarCollapsed);
    setHydrated(true);
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    saveLayoutPreferences({ sidebarCollapsed: value });
  }, []);

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      saveLayoutPreferences({ sidebarCollapsed: next });
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ collapsed: hydrated ? collapsed : false, toggle, setCollapsed }),
    [collapsed, hydrated, toggle, setCollapsed],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}
