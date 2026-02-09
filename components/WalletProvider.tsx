"use client";

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';



export function WalletProvider({ children }: { children: React.ReactNode }) {
    // You can use 'devnet', 'testnet', or 'mainnet-beta'
    const network = process.env.NETWORK;
    console.log(network)
    // You can also provide a custom RPC endpoint
    //@ts-ignore
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);


    return (
        <ConnectionProvider endpoint={endpoint}>
            <SolanaWalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </SolanaWalletProvider>
        </ConnectionProvider>
    );
}
