import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type DashboardPalette = "ocean" | "navy" | "violet" | "pink" | "burgundy" | "forest" | "sunset" | "custom";
export type DashboardDensity = "compact" | "comfortable" | "spacious";
export type DashboardStyle = "classic" | "soft" | "glass";
export type DashboardPreferences = {
  palette: DashboardPalette;
  customAccent: string;
  density: DashboardDensity;
  style: DashboardStyle;
  fontScale: "standard" | "large";
  showCourses: boolean;
  showProgress: boolean;
  showUpcoming: boolean;
  showActions: boolean;
};

export const paletteColors: Record<Exclude<DashboardPalette, "custom">, string> = {
  ocean: "#2563eb",
  navy: "#1e3a8a",
  violet: "#7c3aed",
  pink: "#db2777",
  burgundy: "#881337",
  forest: "#15803d",
  sunset: "#d97706",
};

export const defaultStudentDashboardPreferences: DashboardPreferences = {
  palette: "ocean",
  customAccent: "#2563eb",
  density: "comfortable",
  style: "classic",
  fontScale: "standard",
  showCourses: true,
  showProgress: true,
  showUpcoming: true,
  showActions: true,
};

type PreferencesContextValue = {
  preferences: DashboardPreferences;
  accent: string;
  updatePreferences: (changes: Partial<DashboardPreferences>) => void;
  resetPreferences: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);
const keyFor = (userId?: number) => `jualearn:student-dashboard-preferences:${userId || "guest"}`;

export const StudentDashboardPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<DashboardPreferences>(defaultStudentDashboardPreferences);

  useEffect(() => {
    if (user?.role !== "student") return;
    try {
      const saved = localStorage.getItem(keyFor(user.id));
      setPreferences(saved ? { ...defaultStudentDashboardPreferences, ...JSON.parse(saved) } : defaultStudentDashboardPreferences);
    } catch {
      setPreferences(defaultStudentDashboardPreferences);
    }
  }, [user?.id, user?.role]);

  const updatePreferences = (changes: Partial<DashboardPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...changes };
      if (user?.role === "student") localStorage.setItem(keyFor(user.id), JSON.stringify(next));
      return next;
    });
  };
  const resetPreferences = () => {
    if (user?.role === "student") localStorage.removeItem(keyFor(user.id));
    setPreferences(defaultStudentDashboardPreferences);
  };
  const accent = preferences.palette === "custom" ? preferences.customAccent : paletteColors[preferences.palette];
  const value = useMemo(() => ({ preferences, accent, updatePreferences, resetPreferences }), [preferences, accent]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const useStudentDashboardPreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("useStudentDashboardPreferences must be used inside StudentDashboardPreferencesProvider");
  return context;
};
