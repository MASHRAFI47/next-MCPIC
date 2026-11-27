"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

export type AppTheme = "dark" | "light";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (next: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
  initialTheme?: AppTheme;
}

export default function Providers({
  children,
  session,
  initialTheme = "dark",
}: ProvidersProps) {
  const [theme, setThemeState] = useState<AppTheme>(initialTheme);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const setTheme = useCallback((next: AppTheme) => {
    setThemeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
      document.cookie = `mcpic_theme=${next}; path=/; max-age=31536000; samesite=lax`;
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <SessionProvider session={session} refetchOnWindowFocus={false}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style:
                theme === "light"
                  ? {
                      background: "#ffffff",
                      color: "#0b1f1d",
                      border: "1px solid #d3e5e2",
                      boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.1)",
                    }
                  : {
                      background: "#0b1514",
                      color: "#e8f5f3",
                      border: "1px solid #122e2a",
                    },
            }}
          />
        </QueryClientProvider>
      </SessionProvider>
    </ThemeContext.Provider>
  );
}
