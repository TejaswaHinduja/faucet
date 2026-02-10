"use client";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm, SubmitHandler } from "react-hook-form"
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_2022_PROGRAM_ID, getMintLen,createInitializeMetadataPointerInstruction,createInitializeMintInstruction,TYPE_SIZE,LENGTH_SIZE,ExtensionType, getMint
} from "@solana/spl-token"
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { Keypair, SystemProgram, Transaction, PublicKey } from "@solana/web3.js"; 
import { ShowSolBalance } from "../faucet/airdrop";
import { useState } from "react";

type FormData = {
    tokenName: string,
    tokenSymbol: string,
    imageUrl: string,
    initialSupply: string
}

type VerifyFormData = {
    mintAddress: string
}

export function Token() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    const { register: registerVerify, handleSubmit: handleVerifySubmit } = useForm<VerifyFormData>();
    const { connection } = useConnection();
    const wallet = useWallet();
    const [createdToken, setCreatedToken] = useState<{
        mintAddress: string;
        signature: string;
        name: string;
        symbol: string;
    } | null>(null);
    const [verifyResult, setVerifyResult] = useState<string | null>(null);

    const onVerify: SubmitHandler<VerifyFormData> = async (data) => {
        setVerifyResult("Checking...");
        try {
            const mintPubkey = new PublicKey(data.mintAddress);
            
            // Try to fetch the mint account
            const mintInfo = await getMint(
                connection,
                mintPubkey,
                'confirmed',
                TOKEN_2022_PROGRAM_ID
            );
            
            setVerifyResult(`✅ Token exists!\n\nDecimals: ${mintInfo.decimals}\nSupply: ${mintInfo.supply.toString()}\nMint Authority: ${mintInfo.mintAuthority?.toBase58() || 'None (renounced)'}`);
        } catch (error) {
            console.error("Verification error:", error);
            setVerifyResult(`❌ Token not found or invalid address.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        console.log("Form data:", data);
        
        if (!wallet.publicKey) {
            alert("Please connect your wallet!");
            return;
        }

        try {
            const mintKeypair = Keypair.generate();
            const metadata = {
                mint: mintKeypair.publicKey,
                name: data.tokenName,
                symbol: data.tokenSymbol,
                uri: data.imageUrl,
                additionalMetadata: [],
            };

            const mintLen = getMintLen([ExtensionType.MetadataPointer]);
            const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

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
                    9, 
                    wallet.publicKey, 
                    null, 
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

            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            
            // Partially sign with the mint keypair
            transaction.partialSign(mintKeypair);

            const signature = await wallet.sendTransaction(transaction, connection);
            
            await connection.confirmTransaction(signature, 'confirmed');
            
            const mintInfo = await getMint(
                connection,
                mintKeypair.publicKey,
                'confirmed',
                TOKEN_2022_PROGRAM_ID
            );
            
            console.log(`✅ Token mint created at ${mintKeypair.publicKey.toBase58()}`);
            console.log(`Transaction signature: ${signature}`);
            console.log('Mint Info:', mintInfo);
            
            setCreatedToken({
                mintAddress: mintKeypair.publicKey.toBase58(),
                signature: signature,
                name: data.tokenName,
                symbol: data.tokenSymbol,
            });
            
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
                <ShowSolBalance></ShowSolBalance>
                
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

                {/* Token Verification Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 text-center">
                        🔍 Verify Existing Token
                    </h3>
                    <p className="text-sm text-gray-600 text-center">
                        Enter a mint address to check if a token exists
                    </p>
                    
                    <form onSubmit={handleVerifySubmit(onVerify)} className="space-y-3">
                        <Input 
                            placeholder="Enter Mint Address to Verify"
                            {...registerVerify("mintAddress", { required: true })}
                        />
                        <Button type="submit" variant="outline" className="w-full">
                            Verify Token
                        </Button>
                    </form>

                    {verifyResult && (
                        <div className={`p-4 rounded ${verifyResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <pre className="text-xs whitespace-pre-wrap font-mono">
                                {verifyResult}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Success Display */}
                {createdToken && (
                    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 space-y-4">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-green-800 mb-2">
                                🎉 Token Created Successfully!
                            </h3>
                            <p className="text-green-700 font-medium">
                                {createdToken.name} ({createdToken.symbol})
                            </p>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="bg-white rounded p-3">
                                <p className="text-gray-600 font-medium mb-1">Mint Address:</p>
                                <p className="font-mono text-xs break-all text-green-700">
                                    {createdToken.mintAddress}
                                </p>
                                <button
                                    onClick={() => navigator.clipboard.writeText(createdToken.mintAddress)}
                                    className="mt-2 text-blue-600 hover:text-blue-800 text-xs"
                                >
                                    📋 Copy Address
                                </button>
                            </div>

                            <div className="bg-white rounded p-3">
                                <p className="text-gray-600 font-medium mb-1">Transaction Signature:</p>
                                <p className="font-mono text-xs break-all text-green-700">
                                    {createdToken.signature}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <a
                                    href={`https://explorer.solana.com/address/${createdToken.mintAddress}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-center"
                                >
                                    View Token on Solana Explorer 🔍
                                </a>
                                <a
                                    href={`https://explorer.solana.com/tx/${createdToken.signature}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded text-center"
                                >
                                    View Transaction 📝
                                </a>
                                <a
                                    href={`https://solscan.io/token/${createdToken.mintAddress}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded text-center"
                                >
                                    View on Solscan 🔎
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}