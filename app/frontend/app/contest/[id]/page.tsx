import ContestLobbyWrapper from '@/feature/ContestLobby/components/ContestLobbyWrapper'
import { Metadata } from 'next'
import React from 'react'

export const metaData: Metadata = {
  title : "Contest Lobby | Arbitron"
}

const page = () => {
  return (
    <ContestLobbyWrapper/>
  )
}

export default page