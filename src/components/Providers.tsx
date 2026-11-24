"use client";

import { useEffect, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import AOS from "aos";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    AOS.init({ once: true, duration: 700 });
  }, []);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0b1514",
              color: "#e8f5f3",
              border: "1px solid #122e2a",
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
