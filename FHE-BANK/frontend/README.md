# FHEVM Frontend Demo

Privacy-preserving smart contract UI built with Next.js and Zama's official SDK.

## Features

- 🔐 Encrypted balance management
- 💰 Private deposits
- 📤 Confidential transfers
- 🎨 Beautiful Tailwind UI
- 🌙 Dark mode support
- ✅ Latest security patches

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 15** - React framework (latest)
- **React 19** - UI library (latest)
- **@zama-fhe/relayer-sdk** - Official Zama FHE encryption SDK
- **ethers.js v6** - Ethereum interactions
- **TailwindCSS** - Styling
- **TypeScript 5.8** - Type safety
- **ESLint 9** - Code quality

## Security

- ✅ All high severity vulnerabilities patched
- ✅ Uses official Zama SDK (not deprecated fhevmjs)
- ✅ Latest stable dependencies
- ✅ No breaking security issues

## Usage

1. Connect MetaMask wallet
2. Deposit encrypted tokens
3. Transfer tokens privately
4. Only you can decrypt your balance!

### Environment Variables

After deploying to Sepolia:

- Keep **PRIVATE_KEY** (and any private RPC URLs) in `frontend/.env.local` (gitignored)
- Store deployed contract addresses in `frontend/lib/deployments.json` (committed) **or** set them via `NEXT_PUBLIC_*` env vars

If you prefer env vars, set these in `frontend/.env.local`:

```bash
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_BALANCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_COLLATERAL_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://...
NEXT_PUBLIC_RELAYER_URL=https://...
```

## Learn More

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Relayer SDK](https://github.com/zama-ai/fhevm-relayer-sdk)
- [Protocol Examples](https://docs.zama.org/protocol/examples)
