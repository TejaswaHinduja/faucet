import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    getMint,
    getAccount,
} from "@solana/spl-token";


export interface TokenInfo {
    supply: number;
    decimals: number;
    mintAuthority: string | null;
}

export interface TokenAccountInfo {
    balance: number;
    owner: string;
}

export interface TokenFullInfo extends TokenInfo {
    userBalance: number;
}


/**
 * Get Associated Token Address for a mint and owner
 * @param mintAddress - The mint public key or address string
 * @param ownerAddress - The owner's public key or address string
 * @returns The ATA PublicKey
 */
export function getATA(mintAddress: PublicKey | string, ownerAddress: PublicKey | string): PublicKey{
    const mint = typeof mintAddress === "string" ? new PublicKey(mintAddress) : mintAddress;
    const owner = typeof ownerAddress === "string" ? new PublicKey(ownerAddress) : ownerAddress;

    return getAssociatedTokenAddressSync(
        mint,
        owner,
        false,
        TOKEN_2022_PROGRAM_ID
    );
}

/**
 * Get mint information for a token
 * @param connection - Solana connection
 * @param mintAddress - The mint public key or address string
 * @returns Token mint information
 */
export async function getMintInfo(
    connection: Connection,
    mintAddress: PublicKey | string
): Promise<TokenInfo> {
    const mint = typeof mintAddress === "string" 
        ? new PublicKey(mintAddress) 
        : mintAddress;

    const mintInfo = await getMint(
        connection,
        mint,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
    );

    return {
        supply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
        decimals: mintInfo.decimals,
        mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
    };
}

/**
 * Get token account balance for a specific ATA
 * @param connection - Solana connection
 * @param ataAddress - The ATA public key or address string
 * @param decimals - Token decimals (default: 9)
 * @returns Token account information
 */
export async function getTokenAccountBalance(
    connection: Connection,
    ataAddress: PublicKey | string,
    decimals: number = 9
): Promise<TokenAccountInfo | null> {
    const ata = typeof ataAddress === "string" 
        ? new PublicKey(ataAddress) 
        : ataAddress;

    try {
        const tokenAccount = await getAccount(
            connection,
            ata,
            "confirmed",
            TOKEN_2022_PROGRAM_ID
        );

        return {
            balance: Number(tokenAccount.amount) / Math.pow(10, decimals),
            owner: tokenAccount.owner.toBase58(),
        };
    } catch (error) {
        // ATA doesn't exist
        return null;
    }
}

/**
 * Get complete token information including user balance
 * @param connection - Solana connection
 * @param mintAddress - The mint public key or address string
 * @param ownerAddress - The owner's public key or address string
 * @returns Complete token information
 */
export async function getTokenFullInfo(
    connection: Connection,
    mintAddress: PublicKey | string,
    ownerAddress: PublicKey | string
): Promise<TokenFullInfo> {
    // Get mint info
    const mintInfo = await getMintInfo(connection, mintAddress);

    // Get user's ATA
    const userATA = getATA(mintAddress, ownerAddress);

    // Get user's balance
    const accountInfo = await getTokenAccountBalance(
        connection,
        userATA,
        mintInfo.decimals
    );

    return {
        ...mintInfo,
        userBalance: accountInfo?.balance || 0,
    };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔨 TRANSACTION FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Create an Associated Token Account
 * @param connection - Solana connection
 * @param wallet - Wallet adapter state
 * @param mintAddress - The mint public key or address string
 * @param ownerAddress - The owner's public key (defaults to wallet.publicKey)
 * @returns Transaction signature
 */
export async function createATA(
    connection: Connection,
    wallet: WalletContextState,
    mintAddress: PublicKey | string,
    ownerAddress?: PublicKey | string
): Promise<string> {
    if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
    }

    const mint = typeof mintAddress === "string" 
        ? new PublicKey(mintAddress) 
        : mintAddress;
    const owner = ownerAddress 
        ? (typeof ownerAddress === "string" ? new PublicKey(ownerAddress) : ownerAddress)
        : wallet.publicKey;

    const ata = getATA(mint, owner);

    // Check if ATA already exists
    const accountInfo = await connection.getAccountInfo(ata);
    if (accountInfo) {
        throw new Error("ATA already exists");
    }

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
 * Mint tokens to a recipient
 * @param connection - Solana connection
 * @param wallet - Wallet adapter state (must be mint authority)
 * @param mintAddress - The mint public key or address string
 * @param recipientAddress - Recipient's public key or address string
 * @param amount - Amount to mint (in token units, not base units)
 * @param decimals - Token decimals (default: 9)
 * @param createATAIfNeeded - Whether to create ATA if it doesn't exist (default: true)
 * @returns Transaction signature
 */
export async function mintTokens(
    connection: Connection,
    wallet: WalletContextState,
    mintAddress: PublicKey | string,
    recipientAddress: PublicKey | string,
    amount: number,
    decimals: number = 9,
    createATAIfNeeded: boolean = true
): Promise<string> {
    if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
    }

    const mint = typeof mintAddress === "string" 
        ? new PublicKey(mintAddress) 
        : mintAddress;
    const recipient = typeof recipientAddress === "string" 
        ? new PublicKey(recipientAddress) 
        : recipientAddress;

    // Get recipient's ATA
    const recipientATA = getATA(mint, recipient);

    // Check if ATA exists
    const accountInfo = await connection.getAccountInfo(recipientATA);

    const transaction = new Transaction();

    // Create ATA if it doesn't exist and createATAIfNeeded is true
    if (!accountInfo && createATAIfNeeded) {
        transaction.add(
            createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                recipientATA,
                recipient,
                mint,
                TOKEN_2022_PROGRAM_ID
            )
        );
    } else if (!accountInfo && !createATAIfNeeded) {
        throw new Error("Recipient ATA does not exist. Create it first or set createATAIfNeeded to true.");
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

/**
 * Check if ATA exists for a mint and owner
 * @param connection - Solana connection
 * @param mintAddress - The mint public key or address string
 * @param ownerAddress - The owner's public key or address string
 * @returns true if ATA exists, false otherwise
 */
export async function ataExists(
    connection: Connection,
    mintAddress: PublicKey | string,
    ownerAddress: PublicKey | string
): Promise<boolean> {
    const ata = getATA(mintAddress, ownerAddress);
    const accountInfo = await connection.getAccountInfo(ata);
    return accountInfo !== null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Convert token amount to base units
 * @param amount - Amount in token units
 * @param decimals - Token decimals
 * @returns Amount in base units
 */
export function toBaseUnits(amount: number, decimals: number = 9): number {
    return amount * Math.pow(10, decimals);
}

/**
 * Convert base units to token amount
 * @param baseUnits - Amount in base units
 * @param decimals - Token decimals
 * @returns Amount in token units
 */
export function fromBaseUnits(baseUnits: number, decimals: number = 9): number {
    return baseUnits / Math.pow(10, decimals);
}

/**
 * Validate if a string is a valid Solana address
 * @param address - Address string to validate
 * @returns true if valid, false otherwise
 */
export function isValidSolanaAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}
