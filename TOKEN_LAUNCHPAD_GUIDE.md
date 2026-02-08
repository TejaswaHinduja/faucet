# 🚀 Solana Token Launchpad Guide

## Overview
This guide explains how to create SPL tokens with metadata on Solana using Token-2022 program.

---

## 🎯 What We Built

A complete token launchpad that:
- ✅ Accepts token details via form (name, symbol, image URL)
- ✅ Creates tokens on Solana with embedded metadata
- ✅ Uses Token-2022 program with MetadataPointer extension
- ✅ Integrates Solana wallet adapter for signing transactions

---

## 📚 How Metadata Works

### **The Metadata Object**
```typescript
const metadata = {
    mint: mintKeypair.publicKey,  // Token mint address
    name: "My Token",             // Token name (from form)
    symbol: "MTK",                // Token symbol (from form)
    uri: "https://...",           // Image/metadata URL (from form)
    additionalMetadata: [],       // Extra key-value pairs (optional)
};
```

### **The 4-Step Transaction**

#### **Step 1: Create Account**
```typescript
SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    space: mintLen,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
})
```
- Creates a new account on Solana blockchain
- Allocates space for mint data + metadata
- Pays rent (lamports) to keep account alive

#### **Step 2: Initialize Metadata Pointer**
```typescript
createInitializeMetadataPointerInstruction(
    mintKeypair.publicKey,    // Mint account
    wallet.publicKey,         // Update authority
    mintKeypair.publicKey,    // Metadata location (same as mint)
    TOKEN_2022_PROGRAM_ID
)
```
- Points to where metadata is stored
- In our case, metadata is stored IN the mint account itself
- This is a Token-2022 extension feature

#### **Step 3: Initialize Mint**
```typescript
createInitializeMintInstruction(
    mintKeypair.publicKey,
    9,                       // Decimals (9 = like SOL)
    wallet.publicKey,        // Mint authority
    null,                    // No freeze authority
    TOKEN_2022_PROGRAM_ID
)
```
- Sets up the token mint parameters
- 9 decimals means 1 token = 1,000,000,000 base units
- Mint authority can create new tokens

#### **Step 4: Initialize Metadata** ⭐ **THIS IS WHERE YOUR FORM DATA GOES!**
```typescript
createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    mint: mintKeypair.publicKey,
    metadata: mintKeypair.publicKey,
    name: data.tokenName,        // 🔥 FROM YOUR FORM!
    symbol: data.tokenSymbol,    // 🔥 FROM YOUR FORM!
    uri: data.imageUrl,          // 🔥 FROM YOUR FORM!
    mintAuthority: wallet.publicKey,
    updateAuthority: wallet.publicKey,
})
```
- Writes the metadata to the blockchain
- This is where your form inputs become on-chain data!

---

## 🔑 Key Concepts

### **Token-2022 vs Legacy Token Program**
- **Legacy**: Uses Metaplex for metadata (separate account)
- **Token-2022**: Metadata stored in mint account (more efficient)

### **MetadataPointer Extension**
- Allows metadata to live in the same account as the mint
- Saves space and transaction costs
- Part of the new Token-2022 standard

### **Space Calculation**
```typescript
const mintLen = getMintLen([ExtensionType.MetadataPointer]);
const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
```
- Must calculate exact bytes needed
- `pack()` serializes metadata into bytes
- Rent is based on space used

### **Rent Exemption**
```typescript
const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
```
- Pay enough SOL upfront → account never gets deleted
- Rent = ~0.00001 SOL per byte

---

## 🛠️ Setup Instructions

### **1. Install Dependencies**
```bash
npm install @solana/web3.js
npm install @solana/spl-token
npm install @solana/spl-token-metadata
npm install @solana/wallet-adapter-react
npm install @solana/wallet-adapter-react-ui
npm install @solana/wallet-adapter-wallets
npm install react-hook-form
```

### **2. Setup Wallet Provider**
Already configured in `/components/WalletProvider.tsx` and `/app/layout.tsx`

### **3. Run the App**
```bash
npm run dev
```

### **4. Navigate to Token Page**
Open: `http://localhost:3000/token`

---

## 🎮 How to Use

1. **Connect Wallet** - Click "Select Wallet" and connect Phantom (or other wallet)
2. **Fill Form**:
   - Token Name: e.g., "My Cool Token"
   - Token Symbol: e.g., "MCT"
   - Image URL: e.g., "https://example.com/logo.png"
   - Initial Supply: (optional, for display only)
3. **Click "Create Token"**
4. **Approve Transaction** in your wallet
5. **Success!** - You'll get the mint address in an alert

---

## 🔍 Verifying Your Token

### **On Solana Explorer**
1. Copy your mint address
2. Go to: `https://explorer.solana.com/?cluster=devnet`
3. Paste the mint address
4. You'll see your token metadata!

### **Using solana-cli**
```bash
solana account <MINT_ADDRESS> --url devnet
```

---

## 🚨 Common Issues & Solutions

### **"Wallet not connected"**
- Make sure you click "Connect Wallet" first
- Ensure Phantom is installed

### **"Transaction failed"**
- Check if you have SOL on devnet
- Get devnet SOL: https://faucet.solana.com

### **"Account already in use"**
- New keypair is generated each time
- This shouldn't happen unless something is wrong

### **Image not showing**
- Make sure URI is publicly accessible
- Use direct image links (not HTML pages)
- Example: `https://raw.githubusercontent.com/user/repo/image.png`

---

## 📝 Understanding the Code

### **Form State Management**
```typescript
const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
```
- `register` - Connects input fields to form state
- `handleSubmit` - Handles form submission
- `errors` - Validation errors

### **Wallet & Connection**
```typescript
const { connection } = useConnection();
const wallet = useWallet();
```
- `connection` - Talks to Solana RPC
- `wallet` - User's connected wallet (signs transactions)

### **Keypair Generation**
```typescript
const mintKeypair = Keypair.generate();
```
- New random keypair for the token mint
- This becomes your token's address
- Private key is only used once to sign creation

---

## 🎨 Next Steps & Enhancements

### **1. Add Minting Functionality**
After creating the token, allow users to mint tokens to their wallet:
```typescript
import { createMintToInstruction } from '@solana/spl-token';
```

### **2. Create Token Metadata JSON**
Instead of just an image URL, host a full metadata JSON:
```json
{
  "name": "My Token",
  "symbol": "MTK",
  "description": "The best token ever",
  "image": "https://example.com/image.png"
}
```

### **3. Add Image Upload**
Integrate with IPFS or Arweave for decentralized image hosting

### **4. Store Created Tokens**
Save mint addresses to database/localStorage to show user's created tokens

### **5. Add Token Management**
- Update metadata (if you're the update authority)
- Mint/burn tokens
- Transfer mint authority

---

## 📖 Additional Resources

- [Solana Token-2022 Docs](https://spl.solana.com/token-2022)
- [SPL Token Metadata Extension](https://spl.solana.com/token-2022/extensions#metadata)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)

---

## 💡 Pro Tips

1. **Test on Devnet First** - Always test on devnet before mainnet
2. **Save Mint Addresses** - Store them somewhere, you'll need them!
3. **Use Custom RPC** - For production, use a paid RPC provider (Alchemy, QuickNode)
4. **Error Handling** - Always wrap blockchain calls in try-catch
5. **Transaction Confirmation** - Wait for confirmation before showing success

---

## 🎉 Congratulations!

You now understand how to create tokens with metadata on Solana! This is the foundation for:
- NFT projects
- DeFi tokens
- Gaming tokens
- Community tokens
- And more!

Happy building! 🚀
