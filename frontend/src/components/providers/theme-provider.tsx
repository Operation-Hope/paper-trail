import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type Ctx = { theme: Theme; setTheme: (t: Theme) => void };
const ThemeCtx = createContext<Ctx | null>(null);

export function ThemeProvider({
  defaultTheme = 'dark',
  children,
}: {
  defaultTheme?: Theme;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    return saved ?? defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
