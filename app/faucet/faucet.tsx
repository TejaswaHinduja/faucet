"use client"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { UnsafeBurnerWalletAdapter,PhantomWalletAdapter} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider,WalletDisconnectButton,WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { ShowSolBalance } from "./airdrop";

export function Faucet(){
    
    return (
        <div>
            <ConnectionProvider endpoint={"https://solana-devnet.g.alchemy.com/v2/l_w7iiEfcszPM-w65B54I"}>
                <WalletProvider wallets={[]} autoConnect>
                    <WalletModalProvider>
                       <WalletMultiButton />
                       <WalletDisconnectButton/>
                       <ShowSolBalance></ShowSolBalance>
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </div>
    )

}
