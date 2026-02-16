"use client";

import { Token } from "./mintacc";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function TokenPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            {/* Header with Wallet Button */}
            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Token Launchpad</h1>
                    <WalletMultiButton />
                </div>
            </div>

            {/* Main Token Creation Form */}
            <Token />
        </div>
    );
}
