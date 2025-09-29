"use client";
import { Nav } from '@/components/Nav'
import { ChainContextProvider } from '@/context/ChainContextProvider'
import { ConnectionContextProvider } from '@/context/ConnectionContextProvider'
import { SelectedWalletAccountContextProvider } from '@/context/SelectedWalletAccountContextProvider'
import { Flex, Section, Theme } from '@radix-ui/themes'
import React from 'react'

const AppProvider = ({
    children
}:{children:React.ReactNode}) => {
  return (
    <Theme>
    <ChainContextProvider>
      <SelectedWalletAccountContextProvider>
        <ConnectionContextProvider>
          <Flex direction="column">
            <Nav />
            <Section>
              {children}
            </Section>
          </Flex>
        </ConnectionContextProvider>
      </SelectedWalletAccountContextProvider>
    </ChainContextProvider>
  </Theme>
  )
}

export default AppProvider