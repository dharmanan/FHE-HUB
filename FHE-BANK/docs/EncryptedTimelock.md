# EncryptedTimelock

Time-locked vault with encrypted amounts

Category: Defi

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-timelock ./output/encrypted-timelock

cd ./output/encrypted-timelock
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-timelock
```

## Walkthrough

Time-locked vesting.

## Usage
```bash
npm test
```

## Tests

- should lock and unlock tokens

