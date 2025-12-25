# EncryptedCollateral

Privacy-preserving collateralized lending system

Category: Defi

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-collateral ./output/encrypted-collateral

cd ./output/encrypted-collateral
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-collateral
```

## Walkthrough

Privacy-preserving collateralized lending system using FHEVM.

## Features
- Encrypted collateral deposits
- Private borrowing against collateral  
- Encrypted position management
- Health checks and repayment

## Concepts Demonstrated
- Encrypted position tracking
- Conditional borrowing (simplified: borrow < collateral)
- Access control for encrypted data
- Basic DeFi operations with FHE

## Usage
```bash
npm install
npm test
```

## Events

- `CollateralDeposited`
- `BorrowExecuted`
- `Repayment`

## Tests

- should deposit collateral and borrow
- should repay borrowed amount

