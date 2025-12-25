# 🔐 FHE-HUB - FHEVM Example Hub

**Fully Homomorphic Encryption Virtual Machine Examples & Tools** powered by [Zama](https://www.zama.ai/)

[![TypeScript](https://img.shields.io/badge/TypeScript-76.7%25-blue)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-15.1%25-orange)](https://soliditylang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./FHE-BANK/LICENSE)

---

## 📁 Project Structure

```
FHE-HUB/
├── FHE-BANK/                          # Main FHEVM Examples Hub
│   ├── examples/                      # 18 Production-Ready Examples
│   │   ├── encrypted-counter/         # Basic encrypted counter
│   │   ├── encrypted-arithmetic/      # FHE arithmetic operations
│   │   ├── encrypted-anti-patterns/   # Common mistakes to avoid
│   │   ├── encrypted-blind-auction/   # Private bidding system
│   │   ├── encrypted-equality/        # Encrypted comparisons
│   │   └── ...more examples
│   │
│   ├── scripts/                       # CLI Tools
│   │   ├── create-fhevm-example.ts    # Generate new examples
│   │   ├── generate-docs.ts           # Build GitBook documentation
│   │   ├── examples.ts                # Example registry (32 total)
│   │   └── smoke-test.ts              # CI/CD validation
│   │
│   ├── docs/                          # Generated Documentation
│   │   ├── SUMMARY.md                 # GitBook table of contents
│   │   └── *.md                       # 32 example guides
│   │
│   ├── frontend/                      # Next.js Demo Application
│   │   ├── app/                       # Next.js 14 App Router
│   │   ├── components/                # React components
│   │   ├── contracts/                 # Smart contracts
│   │   └── lib/                       # fhevmjs integration
│   │
│   ├── fhevm-hardhat-template/        # Hardhat Starter
│   ├── test-verification/             # Testing utilities
│   │
│   ├── VIDEO_GUIDE.md                 # 🎬 Video Recording Guide
│   ├── DEVELOPER_GUIDE.md             # Development documentation
│   └── package.json                   # CLI scripts
│
└── README.md                          # This file
```

---

## 🚀 Quick Start

### 1️⃣ Clone Repository
```bash
git clone https://github.com/dharmanan/FHE-HUB.git
cd FHE-HUB/FHE-BANK
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Create Your First Example
```bash
# List all 32 available examples
npm run list-examples

# Create encrypted-arithmetic example
npm run create-example -- create encrypted-arithmetic ./my-project

# Test it
cd my-project
npm install
npm test
```

---

## 📚 Available Examples (32 Total)

### 🎓 **Basic Examples**
- `encrypted-counter` - Simple encrypted counter
- `encrypted-arithmetic` - Add, subtract, multiply encrypted numbers
- `encrypted-equality` - Compare encrypted values
- `encrypted-encrypt-single` - Single value encryption
- `encrypted-encrypt-multiple` - Batch encryption

### 🔐 **Advanced Patterns**
- `encrypted-input-proof` - Input validation with ZK proofs
- `encrypted-handles-lifecycle` - Handle management
- `encrypted-access-control-transient` - Transient storage access
- `encrypted-anti-patterns` - Common mistakes to avoid

### 🏦 **DeFi Examples**
- `encrypted-blind-auction` - Private auction system
- `oz-confidential-fungible-token` - Private ERC20 token
- `oz-confidential-erc20-wrapper` - Wrap public tokens
- `oz-confidential-swap` - Private atomic swaps
- `oz-confidential-vesting-wallet` - Private vesting

### 🔓 **Decryption Patterns**
- `encrypted-public-decrypt-single` - Public decryption (single)
- `encrypted-public-decrypt-multiple` - Public decryption (batch)
- `encrypted-user-decrypt-single` - User decryption (single)
- `encrypted-user-decrypt-multiple` - User decryption (batch)

[See complete list →](./FHE-BANK/docs/SUMMARY.md)

---

## 🛠️ CLI Commands

```bash
# List all examples
npm run list-examples

# Create new example
npm run create-example -- create <example-name> <output-path>

# Generate GitBook docs
npm run generate-docs

# Run smoke test
npm run smoke-test -- <example-name> <output-path>
```

---

## 🎥 Video Guide

See [VIDEO_GUIDE.md](./FHE-BANK/VIDEO_GUIDE.md) for step-by-step video recording instructions.

---

## 🌐 Live Demo

**Frontend Application:** [https://fhehub.vercel.app](https://fhehub.vercel.app)

The demo showcases:
- Encrypted balance management
- Private token transfers
- Encrypted collateral system
- Wallet integration (MetaMask)

---

## 📖 Documentation

- **Developer Guide:** [DEVELOPER_GUIDE.md](./FHE-BANK/DEVELOPER_GUIDE.md)
- **GitBook Docs:** [docs/](./FHE-BANK/docs/)
- **Testing Guide:** [frontend/TESTING_GUIDE.md](./FHE-BANK/frontend/TESTING_GUIDE.md)

---

## 🏗️ Technology Stack

| Component | Technology |
|-----------|-----------|
| **Smart Contracts** | Solidity + FHEVM |
| **Testing** | Hardhat + Chai |
| **Frontend** | Next.js 14 + TypeScript |
| **FHE Library** | fhevmjs v0.6.0-5 |
| **Encryption** | Zama's TFHE |
| **Deployment** | Vercel + Sepolia Testnet |

---

## 🔑 Key Features

✅ **32 Production-Ready Examples** - From basic to advanced  
✅ **One-Command Setup** - Generate projects instantly  
✅ **GitBook Documentation** - Auto-generated from JSDoc  
✅ **CI/CD Smoke Tests** - Validate examples automatically  
✅ **Live Frontend Demo** - Working dApp on Vercel  
✅ **Developer-Friendly** - Clear guides and error messages  

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-example`
3. Add your example to `scripts/examples.ts`
4. Generate docs: `npm run generate-docs`
5. Test: `npm run smoke-test -- your-example ./test-output`
6. Commit: `git commit -m "Add new example: your-example"`
7. Push & create PR

---

## 📄 License

MIT License - see [LICENSE](./FHE-BANK/LICENSE)

---

## 🔗 Resources

- **Zama Documentation:** [docs.zama.ai](https://docs.zama.ai)
- **fhevmjs GitHub:** [zama-ai/fhevmjs](https://github.com/zama-ai/fhevmjs)
- **FHEVM Hardhat:** [zama-ai/fhevm-hardhat-template](https://github.com/zama-ai/fhevm-hardhat-template)

---

## 👨‍💻 Author

**dharmanan** - [GitHub](https://github.com/dharmanan)

**Built for Zama Bounty Program** 🏆

---

<div align="center">

**⭐ Star this repo if you find it useful!**

</div>
