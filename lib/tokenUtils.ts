import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    getAccount,
} from "@solana/spl-token";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔹 CORE UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get Associated Token Address for a mint and owner
 */
export function getATA(mintAddress: PublicKey | string, ownerAddress: PublicKey | string): PublicKey {
    const mint = typeof mintAddress === "string" ? new PublicKey(mintAddress) : mintAddress;
    const owner = typeof ownerAddress === "string" ? new PublicKey(ownerAddress) : ownerAddress;

    return getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);
}


export async function getTokenBalance(
    connection: Connection,
    ataAddress: PublicKey | string,
    decimals: number = 9
): Promise<number> {
    const ata = typeof ataAddress === "string" ? new PublicKey(ataAddress) : ataAddress;

    try {
        const tokenAccount = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
        return Number(tokenAccount.amount) / Math.pow(10, decimals);
    } catch (error) {
        return 0;
    }
}

/**
 * Create an Associated Token Account (ATA)
 */
export async function createATA(
    connection: Connection,
    wallet: WalletContextState,
    mintAddress: PublicKey | string,
    ownerAddress?: PublicKey | string
): Promise<string> {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    const mint = typeof mintAddress === "string" ? new PublicKey(mintAddress) : mintAddress;
    const owner = ownerAddress 
        ? (typeof ownerAddress === "string" ? new PublicKey(ownerAddress) : ownerAddress)
        : wallet.publicKey;

    const ata = getATA(mint, owner);

    // Check if ATA already exists
    const accountInfo = await connection.getAccountInfo(ata);
    if (accountInfo) throw new Error("ATA already exists");

    const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            ata,
            owner,
            mint,
            TOKEN_2022_PROGRAM_ID
        )
    );

    const signature = await wallet.sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature, "confirmed");

    return signature;
}

/**
 * Mint tokens to a recipient (creates ATA automatically if needed)
 */
export async function mintTokens(
    connection: Connection,
    wallet: WalletContextState,
    mintAddress: PublicKey | string,
    recipientAddress: PublicKey | string,
    amount: number,
    decimals: number = 9
): Promise<string> {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    const mint = typeof mintAddress === "string" ? new PublicKey(mintAddress) : mintAddress;
    const recipient = typeof recipientAddress === "string" ? new PublicKey(recipientAddress) : recipientAddress;

    const recipientATA = getATA(mint, recipient);

    // Check if ATA exists
    const accountInfo = await connection.getAccountInfo(recipientATA);

    const transaction = new Transaction();

    // Create ATA if it doesn't exist
    if (!accountInfo) {
        transaction.add(
            createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                recipientATA,
                recipient,
                mint,
                TOKEN_2022_PROGRAM_ID
            )
        );
    }

    // Add mint instruction
    const amountInBaseUnits = amount * Math.pow(10, decimals);
    transaction.add(
        createMintToInstruction(
            mint,
            recipientATA,
            wallet.publicKey,
            amountInBaseUnits,
            [],
            TOKEN_2022_PROGRAM_ID
        )
    );

    const signature = await wallet.sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature, "confirmed");

    return signature;
}
