import { ContestLobbyWrapper } from "@/components/ContestLobby/ContestLobbyWrapper"
import { Metadata } from "next";

export const metadata: Metadata = {
  title:"Contest Lobby | Arbitron"
}

const Page = () => {
  return (
    <ContestLobbyWrapper/>
  )
}

export default Page;
