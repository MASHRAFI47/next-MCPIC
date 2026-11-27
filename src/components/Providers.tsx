"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ThemeProvider, useTheme, type AppTheme } from "@/components/ThemeContext";

function ThemedToaster() {
  const { theme } = useTheme();
  return (
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
  );
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

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <SessionProvider session={session} refetchOnWindowFocus={false}>
        <QueryClientProvider client={queryClient}>
          {children}
          <ThemedToaster />
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
