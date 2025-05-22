"use client";

import { WagmiProvider } from "wagmi";
import { config } from "@/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Initialize QueryClient inside the component to ensure it's created on the client side
// This ensures a fresh QueryClient per session
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
