"use client"
import { ReactNode } from 'react'
import { SolanaProvider } from "@/components/solana-provider";
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'

const AppProvider = ({ children }: { children: ReactNode }) => {

    const queryClient = new QueryClient();

    return (
            <QueryClientProvider client={queryClient}>
        <SolanaProvider>
                {children}
        </SolanaProvider>
            </QueryClientProvider>
  )
}

export default AppProvider