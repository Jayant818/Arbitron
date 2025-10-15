import ContestArenaWrapper from '@/components/ContestArena/ContestArenaWrapper'
import { Metadata } from 'next'
import React from 'react'

export const metadata:Metadata = {
  title:"Contest Arena | Arbitron"
}

const page = () => {
  return (
    <ContestArenaWrapper/>
  )
}

export default page