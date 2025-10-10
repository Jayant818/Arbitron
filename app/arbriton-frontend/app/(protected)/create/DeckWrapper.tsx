"use client";

import { useSolana } from "@/components/solana-provider";
import { Wallet } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel"
  

const DeckWrapper = () => {
    const { isConnected, selectedAccount } = useSolana();

    const handleCardChange = (index:number) => {
        // Logic to change the card goes here
        console.log("Card changed to:", index);
    }

    if (!isConnected || !selectedAccount) return <div className="flex flex-col items-center justify-center mt-56 gap-4">
              <Wallet className="mr-2 h-10 w-10" />

        <p className="text-2xl">Please connect your wallet to access the deck.</p>
    </div>;

    return (
        <div className="container mx-auto px-6 py-12">
            <div>
                <h1 className="text-3xl font-bold mb-6 text-center">Your Deck</h1>  
                <div className="border max-w-md flex gap-4 px-2 items-center">
                    {
                        Array.from({ length: 5 }).map((_, index) => {
                            return <span key={index} className=" cursor-pointer hover:border-black border rounded-md px-1 w-fit" onClick={() => handleCardChange(index+1)}>Card {index + 1}</span>
                        })
                    }
                </div>
                
            </div>
            <div>

            </div>
        </div>
  )
}

export default DeckWrapper