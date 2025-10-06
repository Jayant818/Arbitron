import ContestLobbyWrapper from '@/feature/ContestLobby/components/ContestLobbyWrapper'
import { Metadata } from 'next'
import React from 'react'

export const metaData: Metadata = {
  title : "Contest Lobby | Arbitron"
}

const page = ({params}: {params: {id: string}}) => {
  return (
    <ContestLobbyWrapper contestId={params.id} />
  )
}

export default page