import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type TeacherPalette = "indigo" | "navy" | "teal" | "burgundy" | "violet";
export type TeacherPreferences = { palette: TeacherPalette; density: "compact" | "comfortable" | "spacious"; fontScale: "standard" | "large" };

export const teacherPaletteColors: Record<TeacherPalette, string> = {
  indigo: "#3f51a1", navy: "#1f5b8f", teal: "#287765", burgundy: "#8b3157", violet: "#6d3aae",
};

const defaults: TeacherPreferences = { palette: "indigo", density: "comfortable", fontScale: "standard" };
const keyFor = (userId?: number) => `jualearn:teacher-dashboard-preferences:${userId || "guest"}`;
type Value = { preferences: TeacherPreferences; accent: string; updatePreferences: (changes: Partial<TeacherPreferences>) => void; resetPreferences: () => void };
const Context = createContext<Value | undefined>(undefined);

export const TeacherDashboardPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<TeacherPreferences>(defaults);
  useEffect(() => {
    if (user?.role !== "teacher") return;
    try { const saved = localStorage.getItem(keyFor(user.id)); setPreferences(saved ? { ...defaults, ...JSON.parse(saved) } : defaults); } catch { setPreferences(defaults); }
  }, [user?.id, user?.role]);
  const updatePreferences = (changes: Partial<TeacherPreferences>) => setPreferences((current) => {
    const next = { ...current, ...changes };
    if (user?.role === "teacher") localStorage.setItem(keyFor(user.id), JSON.stringify(next));
    return next;
  });
  const resetPreferences = () => { if (user?.role === "teacher") localStorage.removeItem(keyFor(user.id)); setPreferences(defaults); };
  const accent = teacherPaletteColors[preferences.palette];
  return <Context.Provider value={useMemo(() => ({ preferences, accent, updatePreferences, resetPreferences }), [preferences, accent])}>{children}</Context.Provider>;
};

export const useTeacherDashboardPreferences = () => {
  const context = useContext(Context);
  if (!context) throw new Error("useTeacherDashboardPreferences must be used inside TeacherDashboardPreferencesProvider");
  return context;
};
