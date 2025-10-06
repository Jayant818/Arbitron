import JoinContestWrapper from '@/feature/Join Contest/components/JoinContestWrapper'
import { Metadata } from 'next'
import React from 'react'

export const metaData: Metadata = {
  title: "Join Contest | Arbitron"
}

const page = () => {
  return (
    <JoinContestWrapper />
  )
}

export default page