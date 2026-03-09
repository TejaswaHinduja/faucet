"use client"

import Link from "next/link";
import { Token } from "./token/mintacc";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Home() {
  return (
        <div className="min-h-screen bg-linear-to-br from-purple-50 to-blue-50">
             
            
               
       
            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-between items-center">
                    
                    <h1 className="text-2xl font-bold text-gray-800">Token Launchpad</h1>
                    <Link  className="text-2xl font-bold"href="https://x.com/Tej_Codes">Twitter</Link>
                    <WalletMultiButton />
                </div>
            </div>
            <Token />
           
        </div>
    );
}
