# 🚀 Quick Start - Token Launchpad

## Get Started in 3 Steps

### 1️⃣ Install Dependencies (Already Done! ✅)
```bash
npm install
```

### 2️⃣ Run Development Server
```bash
npm run dev
```

### 3️⃣ Open Token Launchpad
Navigate to: **http://localhost:3000/token**

---

## 🎮 How to Create a Token

1. **Connect Your Wallet**
   - Click "Select Wallet" button
   - Choose Phantom (or any Solana wallet)
   - Approve the connection

2. **Get Devnet SOL** (if you don't have any)
   - Visit: https://faucet.solana.com
   - Enter your wallet address
   - Request devnet SOL (it's free!)

3. **Fill in Token Details**
   - **Token Name**: "My Awesome Token"
   - **Token Symbol**: "MAT"
   - **Image URL**: Any public image URL
     - Example: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png`
   - **Initial Supply**: Optional (just for display)

4. **Click "Create Token" 🚀**
   - Approve the transaction in your wallet
   - Wait a few seconds
   - You'll get an alert with your token mint address!

5. **Verify Your Token**
   - Copy the mint address
   - Go to: https://explorer.solana.com/?cluster=devnet
   - Paste your mint address
   - See your token on the blockchain!

---

## 📁 File Structure

```
dapp/
├── app/
│   ├── token/
│   │   ├── launch.tsx      # ⭐ Token creation component (your form + logic)
│   │   └── page.tsx        # Token page with wallet button
│   └── layout.tsx          # Root layout with WalletProvider
├── components/
│   ├── WalletProvider.tsx  # Solana wallet adapter setup
│   └── ui/                 # UI components (button, input)
└── TOKEN_LAUNCHPAD_GUIDE.md # Complete documentation
```

---

## 🔑 Key Files to Understand

### **launch.tsx** - The Core Logic
- Contains the form for token details
- Creates the transaction with 4 instructions:
  1. Create account
  2. Initialize metadata pointer
  3. Initialize mint
  4. Initialize metadata (YOUR FORM DATA GOES HERE!)

### **WalletProvider.tsx** - Wallet Connection
- Wraps your app with Solana wallet adapters
- Enables wallet connection/disconnection
- Provides `useWallet()` and `useConnection()` hooks

### **page.tsx** - The UI Page
- Combines Token component with wallet button
- Simple, clean interface

---

## 💡 Understanding Metadata

### Where Your Form Data Goes:
```typescript
const metadata = {
    mint: mintKeypair.publicKey,
    name: data.tokenName,      // ← From "Token Name" input
    symbol: data.tokenSymbol,  // ← From "Token Symbol" input
    uri: data.imageUrl,        // ← From "Image URL" input
    additionalMetadata: [],
};
```

### The Magic Instruction:
```typescript
createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    mint: mintKeypair.publicKey,
    metadata: mintKeypair.publicKey,
    name: metadata.name,        // 🔥 Your form data becomes on-chain data!
    symbol: metadata.symbol,    // 🔥
    uri: metadata.uri,          // 🔥
    mintAuthority: wallet.publicKey,
    updateAuthority: wallet.publicKey,
})
```

---

## 🐛 Troubleshooting

### "Please connect your wallet"
→ Click "Select Wallet" and connect Phantom

### "Transaction failed"
→ Make sure you have devnet SOL (get from faucet.solana.com)

### "Network error"
→ Check your internet connection / RPC might be slow

### Image not showing on explorer
→ Use a direct image URL (not a webpage)
→ Example: `https://example.com/image.png` ✅
→ Not: `https://example.com/page-with-image` ❌

---

## 🎯 What You Just Built

✅ Full token creation form with validation  
✅ On-chain metadata storage (Token-2022)  
✅ Wallet integration  
✅ Transaction handling with error management  
✅ Beautiful, responsive UI  

---

## 🚀 Next Steps

Want to extend your launchpad? Check out `TOKEN_LAUNCHPAD_GUIDE.md` for:
- How to mint tokens to wallets
- Creating proper metadata JSON files
- Adding image upload (IPFS/Arweave)
- Storing created tokens in a database
- Token management features

---

## 📚 Resources

- **Full Guide**: See `TOKEN_LAUNCHPAD_GUIDE.md` for detailed explanations
- **Solana Docs**: https://docs.solana.com
- **Token-2022**: https://spl.solana.com/token-2022
- **Wallet Adapter**: https://github.com/solana-labs/wallet-adapter

---

Happy Token Creating! 🎉
