"use client"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { UnsafeBurnerWalletAdapter,PhantomWalletAdapter} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider,WalletDisconnectButton,WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { Airdrop } from "./airdrop";

export function Faucet(){
    
    return (
        <div>
            <ConnectionProvider endpoint={"https://solana-devnet.g.alchemy.com/v2/l_w7iiEfcszPM-w65B54I"}>
                <WalletProvider wallets={[]} autoConnect>
                    <WalletModalProvider>
                       <WalletMultiButton className="bg-purple-50"/>
                       <WalletDisconnectButton/>
                       <Airdrop></Airdrop>
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </div>
    )

}
