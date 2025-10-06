import JoinContestWrapper from '@/feature/Join Contest/components/JoinContestWrapper'
import { Metadata } from 'next'
import React from 'react'

export const metaData: Metadata = {
  title: "Join Contest | Arbitron"
}

const page = ({params}: {params: {id: string}}) => {
  return (
    <JoinContestWrapper contestId={params.id} />
  )
}

export default page