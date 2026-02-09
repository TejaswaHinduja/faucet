"use client";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm, SubmitHandler } from "react-hook-form"
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_2022_PROGRAM_ID, getMintLen,createInitializeMetadataPointerInstruction,createInitializeMintInstruction,TYPE_SIZE,LENGTH_SIZE,ExtensionType
} from "@solana/spl-token"
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js"; 

type FormData = {
    tokenName: string,
    tokenSymbol: string,
    imageUrl: string,
    initialSupply: string
}

export function Token() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    const { connection } = useConnection();
    const wallet = useWallet();

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        console.log("Form data:", data);
        
        if (!wallet.publicKey) {
            alert("Please connect your wallet!");
            return;
        }

        try {
            // Generate a new keypair for the mint
            const mintKeypair = Keypair.generate();
            
            // Prepare metadata object
            const metadata = {
                mint: mintKeypair.publicKey,
                name: data.tokenName,
                symbol: data.tokenSymbol,
                uri: data.imageUrl,
                additionalMetadata: [],
            };

            // Calculate the space needed for the mint account with metadata
            const mintLen = getMintLen([ExtensionType.MetadataPointer]);
            const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

            // Calculate lamports needed for rent exemption
            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

            // Create the transaction with all necessary instructions
            const transaction = new Transaction().add(
                // 1. Create the mint account
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                // 2. Initialize the metadata pointer (points to the mint itself)
                createInitializeMetadataPointerInstruction(
                    mintKeypair.publicKey, 
                    wallet.publicKey, 
                    mintKeypair.publicKey, 
                    TOKEN_2022_PROGRAM_ID
                ),
                // 3. Initialize the mint
                createInitializeMintInstruction(
                    mintKeypair.publicKey, 
                    9, // decimals
                    wallet.publicKey, // mint authority
                    null, // freeze authority
                    TOKEN_2022_PROGRAM_ID
                ),
                // 4. Initialize the metadata
                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    mint: mintKeypair.publicKey,
                    metadata: mintKeypair.publicKey,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                    mintAuthority: wallet.publicKey,
                    updateAuthority: wallet.publicKey,
                }),
            );

            // Set transaction properties
            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            
            // Partially sign with the mint keypair
            transaction.partialSign(mintKeypair);

            // Send transaction
            const signature = await wallet.sendTransaction(transaction, connection);
            
            console.log(`✅ Token mint created at ${mintKeypair.publicKey.toBase58()}`);
            console.log(`Transaction signature: ${signature}`);
            
            alert(`Token created successfully! Mint address: ${mintKeypair.publicKey.toBase58()}`);
        } catch (error) {
            console.error("Error creating token:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error creating token: ${errorMessage}`);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Solana Token Launchpad</h1>
                    <p className="text-gray-600">Create your own SPL Token on Solana</p>
                </div>

                {/* Wallet Connection Status */}
                {!wallet.publicKey ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-yellow-800 font-medium">⚠️ Please connect your wallet to continue</p>
                    </div>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-green-800 font-medium">✅ Wallet Connected</p>
                        <p className="text-green-600 text-sm mt-1">
                            {wallet.publicKey.toBase58().slice(0, 4)}...{wallet.publicKey.toBase58().slice(-4)}
                        </p>
                    </div>
                )}
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Input 
                            placeholder="Enter Token Name (e.g., My Token)" 
                            {...register("tokenName", { required: "Token name is required" })}
                            disabled={!wallet.publicKey}
                        />
                        {errors.tokenName && <span className="text-red-500 text-sm">{errors.tokenName.message}</span>}
                    </div>
                    
                    <div>
                        <Input 
                            placeholder="Enter Token Symbol (e.g., MTK)" 
                            {...register("tokenSymbol", { 
                                required: "Token symbol is required",
                                maxLength: { value: 10, message: "Symbol too long (max 10 chars)" }
                            })}
                            disabled={!wallet.publicKey}
                        />
                        {errors.tokenSymbol && <span className="text-red-500 text-sm">{errors.tokenSymbol.message}</span>}
                    </div>
                    
                    <div>
                        <Input 
                            placeholder="Image URL (e.g., https://example.com/image.png)" 
                            {...register("imageUrl", { 
                                required: "Image URL is required",
                                pattern: { 
                                    value: /^https?:\/\/.+/,
                                    message: "Please enter a valid URL starting with http:// or https://"
                                }
                            })}
                            disabled={!wallet.publicKey}
                        />
                        {errors.imageUrl && <span className="text-red-500 text-sm">{errors.imageUrl.message}</span>}
                    </div>
                    
                    <div>
                        <Input 
                            placeholder="Initial Supply (optional - for display)" 
                            type="number"
                            {...register("initialSupply")}
                            disabled={!wallet.publicKey}
                        />
                    </div>
                    
                    <Button 
                        type="submit" 
                        className="w-full"
                        disabled={!wallet.publicKey}
                    >
                        {wallet.publicKey ? "Create Token 🚀" : "Connect Wallet First"}
                    </Button>
                </form>
                
                <div className="text-sm text-gray-500 text-center space-y-2">
                    <p>💡 Make sure you have SOL on devnet for transaction fees</p>
                    <p className="text-xs">
                        Get devnet SOL: <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">faucet.solana.com</a>
                    </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-medium mb-2">ℹ️ What happens when you create a token:</p>
                    <ul className="space-y-1 text-xs">
                        <li>• A new token mint is created on Solana</li>
                        <li>• Your metadata (name, symbol, image) is stored on-chain</li>
                        <li>• You become the mint authority</li>
                        <li>• You can mint tokens to any wallet address</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}