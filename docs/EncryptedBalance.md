# EncryptedBalance

A contract for managing encrypted user balances

Category: Basic

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-balance ./output/encrypted-balance

cd ./output/encrypted-balance
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-balance
```

## Walkthrough

Demonstrates encrypted balance management using FHEVM.

## Features
- Encrypted deposits
- Privacy-preserving transfers
- Access control

## Usage
```bash
npm install
npm test
```

## Events

- `BalanceUpdated`

## Tests

- should deposit encrypted balance
- should transfer encrypted balance

