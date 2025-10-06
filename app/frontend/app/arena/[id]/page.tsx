import TradingArenaWrapper from '@/feature/tradingArena/components/TradingArenaWrapper'
import { Metadata } from 'next'
import React from 'react'

export const metaData: Metadata = {
  title : "Trading Arena | Arbitron"
}

const page = () => {
  return (
    <TradingArenaWrapper/>
  )
}

export default page