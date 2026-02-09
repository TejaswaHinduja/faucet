"use client"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { UnsafeBurnerWalletAdapter,PhantomWalletAdapter} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider,WalletDisconnectButton,WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { ShowSolBalance } from "./airdrop";
import { Token } from "../token/launch";

export function Faucet(){
    
    return (
        <div>
            <ConnectionProvider endpoint={""}>
                <WalletProvider wallets={[]} autoConnect>
                    <WalletModalProvider>
                       <div className="flex justify-center p-20">
                        <WalletMultiButton />
                        <WalletDisconnectButton />
                        </div>
                       <ShowSolBalance></ShowSolBalance>
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </div>
    )

}
