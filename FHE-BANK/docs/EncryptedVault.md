# EncryptedVault

Simple savings vault with encrypted balances

Category: Defi

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-vault ./output/encrypted-vault

cd ./output/encrypted-vault
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-vault
```

## Walkthrough

Simple savings vault with encrypted balances using FHEVM.

## Features
- Encrypted deposits
- Encrypted withdrawals
- Balance privacy
- Deposit time tracking

## Use Cases
- Private savings accounts
- Confidential treasury management
- Anonymous funds pooling

## Usage
```bash
npm install
npm test
```

## Events

- `Deposited`
- `Withdrawn`

## Tests

- should deposit and check balance
- should withdraw partial amount
- should record deposit time

