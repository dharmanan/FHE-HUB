# FHEVM Example Hub

[![Zama Bounty](https://img.shields.io/badge/Zama-Bounty%20December%202025-blue)](https://zama.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Core%20Examples%20(tracked)](https://img.shields.io/badge/Core%20Examples%20(tracked)-18-green)](examples/)
[![Registry](https://img.shields.io/badge/Registry-32-blue)](scripts/examples.ts)

A repository that generates and maintains standalone Hardhat-based FHEVM example projects, plus GitBook-compatible documentation.

**🏆 Zama Bounty December 2025 Submission**

## 🎯 Project Overview

This project provides automation tools and a set of working examples for building privacy-preserving smart contracts using Zama's FHEVM.

- Automation tools (TypeScript CLI) to scaffold a standalone repo per example
- Example contracts + tests covering required topics (access control, input proofs, anti-patterns, handles lifecycle, decryption patterns, etc.)
- GitBook-style docs generated from code annotations
- A pinned base template based on Zama's Hardhat template

Note: The [frontend/](frontend/) folder is an optional demo app.

This repo tracks a curated **core set** of standalone Hardhat repos under [examples/](examples/) (18 examples). The full catalog lives in the registry ([scripts/examples.ts](scripts/examples.ts), 32 examples) and can be generated locally.

## 🚀 Quick Start

### Setup

First, clone and install dependencies:

```bash
git clone https://github.com/dharmanan/FHE-HUB.git
cd FHE-HUB
npm install
```

### List Available Examples

```bash
npm run create-example -- list
```

### Generate a Single Standalone Example

```bash
# Using npm scripts
npm run create-example -- create encrypted-balance ./my-project

# Navigate and run
cd my-project
npm install
npm test
```

### Build / Refresh the Tracked Core Set

This regenerates the curated core set into [examples/](examples/).

```bash
npm run build-examples -- --core
```

If you want to generate **all registry examples** (32) into [examples/](examples/), use:

```bash
npm run build-examples
```

### Other Registry Examples (Not Tracked)

To keep this repo lightweight and reviewable, only the curated core set (18) is committed under [examples/](examples/).

The other **14 examples** live in the registry ([scripts/examples.ts](scripts/examples.ts)) and can be discovered/generated locally:

```bash
# List all available example keys (full registry)
npm run create-example -- list

# Generate one example repo
npm run create-example -- create encrypted-voting ./my-project
```

Tracked core example keys (18):
- `encrypted-counter`
- `encrypted-arithmetic`
- `encrypted-equality`
- `encrypted-encrypt-single`
- `encrypted-encrypt-multiple`
- `encrypted-user-decrypt-single`
- `encrypted-user-decrypt-multiple`
- `encrypted-public-decrypt-single`
- `encrypted-public-decrypt-multiple`
- `encrypted-access-control-transient`
- `encrypted-input-proof`
- `encrypted-anti-patterns`
- `encrypted-handles-lifecycle`
- `oz-confidential-fungible-token`
- `oz-confidential-erc20-wrapper`
- `oz-confidential-vesting-wallet`
- `oz-confidential-swap`
- `encrypted-blind-auction`

Registry-only example keys (14):
- `encrypted-auction`
- `encrypted-balance`
- `encrypted-collateral`
- `encrypted-crowdfund`
- `encrypted-erc20`
- `encrypted-escrow`
- `encrypted-lottery`
- `encrypted-multisig`
- `encrypted-prediction`
- `encrypted-raffle`
- `encrypted-swap`
- `encrypted-timelock`
- `encrypted-vault`
- `encrypted-voting`

### Run Frontend Demo (optional)

The frontend currently demonstrates these flows live:

- `encrypted-collateral` (encrypted collateralized borrowing / liquidation UI)
- Private token faucet + encrypted transfer demo (see [frontend/contracts/PrivateZamaToken.sol](frontend/contracts/PrivateZamaToken.sol))

Frontend details (helpers + addresses): [docs/FrontendDemo.md](docs/FrontendDemo.md)

Vercel demo URL: https://fhehub.vercel.app

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Smoke Test (Bulk Verification)

The smoke test generates standalone repos into `output/.smoke/` and runs `npm install` + `npm test` for each.

CI note: GitHub Actions runs the smoke test on a curated core set (currently 18 examples) for reliability and runtime.

```bash
# Run the full suite
npm run smoke-test

# Run only a single example (useful when the last one fails)
npm run smoke-test -- --only encrypted-blind-auction

# Resume from a specific example key (runs that key and the rest)
npm run smoke-test -- --from oz-confidential-fungible-token
```

Notes:
- Disk usage can grow quickly because each generated repo installs its own dependencies.
- The script cleans `node_modules` after successful runs to avoid filling your Codespace.
- If you want to keep `node_modules` for debugging, set: `SMOKE_KEEP_NODE_MODULES=true`.
- If you need to free space manually, it is safe to delete: `rm -rf output/.smoke`.

## 📚 Docs

The docs in this repo are GitBook-style markdown generated from the registry.

- Docs index: [docs/README.md](docs/README.md)
- GitBook sidebar ("Summary"): [docs/SUMMARY.md](docs/SUMMARY.md)

### Documentation Strategy

This project uses **JSDoc/TSDoc-style annotations** for automated documentation generation:

#### In Test Files (TypeScript)
```typescript
/**
 * @chapter basic
 * @title Simple FHE Counter
 * @description Tests encrypted counter increment operations using euint32.
 */
describe("MyCounter", function () {
  /**
   * @test Increment encrypted counter
   * @description Creates an encrypted input of value 5, increments the counter.
   */
  it("should increment counter", async function () {
    // test code
  });
});
```

#### In Contract Files (Solidity)
```solidity
/**
 * @title MyCounter
 * @notice Simple encrypted counter demonstrating basic FHE operations
 * @dev Showcases euint32 operations, encrypted input handling
 * @chapter basic
 */
contract MyCounter is ZamaEthereumConfig {
  // contract code
}
```

#### Supported Tags
- `@chapter` - Categorizes examples (basic, access-control, decryption, etc.)
- `@title` - Human-readable title for documentation
- `@description` / `@notice` - Detailed explanation
- `@test` - Marks individual test cases
- `@dev` - Implementation details

The documentation generator (`scripts/generate-docs.ts`) parses these tags and generates GitBook-compatible markdown files automatically.

## 📁 Project Structure

```
FHE-HUB/
├── fhevm-hardhat-template/       # Base Hardhat template (copied into each example)
├── scripts/                      # Automation tools + registry source-of-truth
├── examples/                     # Tracked standalone repos (core 18)
├── docs/                         # Generated GitBook documentation
├── output/                       # Throwaway smoke-test output (gitignored)
├── frontend/                     # Optional demo app
└── README.md
```

## 🛠️ Automation Tools

### create-fhevm-example.ts

Generates complete, standalone FHEVM example repositories from the base template.

**Features:**
- Clones `fhevm-hardhat-template/` base template
- Uses the registry entry in [scripts/examples.ts](scripts/examples.ts) as source-of-truth (contract/test/doc strings)
- Updates deployment scripts with correct contract name
- Generates example-specific README.md
- Creates a ready-to-use, standalone repository

**Usage:**
```bash
ts-node scripts/create-fhevm-example.ts list
ts-node scripts/create-fhevm-example.ts create <example-key> <output-dir>
```

### create-fhevm-category.ts

Generates a project containing all examples from a specific category.

**Features:**
- Groups registry examples by category
- Generates a standalone project that contains all examples for that category
- Generates unified deployment script
- Creates comprehensive README
- Perfect for learning multiple related concepts

**Usage:**
```bash
ts-node scripts/create-fhevm-category.ts <category> [output-dir]
```

### generate-docs.ts

Creates GitBook-formatted documentation from contract and test files.

**Features:**
- Generates markdown from the registry entries
- Generates formatted markdown
- Updates SUMMARY.md index
- Organizes by category

**Usage:**
```bash
npm run generate-docs
```

## 🔧 Development Workflow

### Creating a New Example

1. **Add an entry** in [scripts/examples.ts](scripts/examples.ts)
   - Pick a stable example key (kebab-case)
   - Provide `contractCode`, `testCode`, and `documentation`

2. **Regenerate docs**
   - `npm run generate-docs`

3. **Regenerate the standalone repo**
   - `npm run build-examples -- --only <example-key>`

4. **Generate Documentation**
   ```bash
   npm run generate-docs
   ```

5. **Test Standalone Repository**
   ```bash
   npm run create-example -- create <example-key> ./test-output
   cd test-output
   npm install && npm run compile && npm run test
   ```

## 📖 Core FHEVM Concepts

### FHEVM Encryption Model

FHEVM uses encryption binding where values are bound to `[contract, user]` pairs:

1. **Encryption Binding**: Values encrypted locally, bound to specific contract/user
2. **Input Proofs**: Zero-knowledge proofs attest correct binding
3. **Permission System**: Both contract and user need FHE permissions

### Critical Patterns

**✅ Correct Usage:**
```solidity
// Granting permissions (pattern varies by example)
FHE.allowThis(encryptedValue);
FHE.allow(encryptedValue, msg.sender);

// Encrypted operations
euint64 result = FHE.add(a, b);
```

## 🔑 Key Dependencies

- `@fhevm/solidity` - Core FHEVM Solidity library
- `hardhat` - Development environment
- `@nomicfoundation/hardhat-toolbox` - Testing tools
- `typescript` - Type-safe automation scripts

## 📚 Resources

- **FHEVM Docs**: https://docs.zama.ai/fhevm
- **Protocol Examples**: https://docs.zama.org/protocol/examples
- **Base Template**: https://github.com/zama-ai/fhevm-hardhat-template
- **OpenZeppelin Confidential**: https://github.com/OpenZeppelin/openzeppelin-confidential-contracts

## 🏆 Zama Bounty Submission

Built for **Zama Bounty December 2025: Build The FHEVM Example Hub**

### Project Highlights

This project demonstrates:
- ✅ **Automated scaffolding tools** - TypeScript CLI for generating example repositories
- ✅ **JSDoc/TSDoc documentation** - Code annotations with @chapter tags for automated docs
- ✅ **Category-based organization** - Examples grouped by functionality (basic, access-control, decryption, etc.)
- ✅ **Complete example coverage** - 32 examples in registry, 18 core examples tracked
- ✅ **TypeScript-based automation** - create-fhevm-example, create-fhevm-category, generate-docs
- ✅ **GitBook-compatible documentation** - Auto-generated from code annotations
- ✅ **OpenZeppelin integration** - Latest @openzeppelin/confidential-contracts v0.3.0
- ✅ **Comprehensive testing** - Smoke tests, edge cases, error handling examples
- ✅ **Maintenance tools** - Dependency management, bulk updates, test automation

### Bounty Requirements Checklist

**✅ Project Structure & Simplicity**
- Hardhat-only setup
- One repo per example
- Minimal structure
- Shared base template

**✅ Scaffolding / Automation**
- `create-fhevm-example.ts` CLI tool
- `create-fhevm-category.ts` for grouped examples
- Automated template cloning and customization
- Auto-generated documentation from annotations

**✅ Required Examples**
- Basic: Counter, Arithmetic, Equality ✓
- Encryption: Single & Multiple values ✓
- User Decryption: Single & Multiple ✓
- Public Decryption: Single & Multiple ✓
- Access Control: allow() & allowTransient() ✓
- Input Proofs: Validation & explanation ✓
- Anti-patterns: Common mistakes & fixes ✓
- Handles Lifecycle: Handle generation & usage ✓
- OpenZeppelin: ERC7984, Wrapper, Swap, Vesting Wallet ✓
- Advanced: Blind Auction ✓

**✅ Documentation Strategy**
- JSDoc/TSDoc-style comments in tests ✓
- NatSpec @chapter tags in contracts ✓
- Auto-generated GitBook-compatible docs ✓
- Tag-based organization (@chapter, @test, @title) ✓

**🎥 Video Demonstration**
- � **Watch the full demo**: [YouTube Video](https://www.youtube.com/watch?v=rsNJX-QOMFA)
- Includes: Setup, CLI demos, example generation, test execution, and automation showcase

### Repository Statistics
- **Total Examples**: 32 (registry)
- **Core Tracked**: 18 examples
- **Test Coverage**: Comprehensive with edge cases
- **Documentation**: Fully automated from code annotations
- **CI/CD**: GitHub Actions smoke test integration

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

## 🤝 Contributing

This is a bounty submission. Feedback and suggestions are welcome!

## 📧 Contact

- GitHub: [@dharmanan](https://github.com/dharmanan)
- Repository: [FHE-HUB](https://github.com/dharmanan/FHE-HUB)

---

**Built with ❤️ using [FHEVM](https://github.com/zama-ai/fhevm) by Zama**
