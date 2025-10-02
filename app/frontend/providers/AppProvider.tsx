"use client";
import { ChainContextProvider } from '@/context/ChainContextProvider'
import { RpcContextProvider } from '@/context/RpcContextProvider';
import { SelectedWalletAccountContextProvider } from '@/context/SelectedWalletAccountContextProvider'
import { Theme } from '@radix-ui/themes'
import React from 'react'

const AppProvider = ({
    children
}:{children:React.ReactNode}) => {
  return (
    <Theme>
    <ChainContextProvider>
      <SelectedWalletAccountContextProvider>
        <RpcContextProvider>
              {children}
        </RpcContextProvider>
      </SelectedWalletAccountContextProvider>
    </ChainContextProvider>
  </Theme>
  )
}

export default AppProvider