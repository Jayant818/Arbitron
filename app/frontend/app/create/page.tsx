import CreateContestWrapper from '@/feature/create/components/CreateContestWrapper'
import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
	title:"Create Contest | Arbitron"
}

const page = () => {
  return (
	<CreateContestWrapper/>
  )
}

export default page