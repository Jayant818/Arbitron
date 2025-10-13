"use client"
import { ReactNode } from 'react'
import { SolanaProvider } from "@/components/solana-provider";
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'

const AppProvider = ({ children }: { children: ReactNode }) => {

    const queryClient = new QueryClient();

    return (
        <SolanaProvider>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </SolanaProvider>
  )
}

export default AppProvider