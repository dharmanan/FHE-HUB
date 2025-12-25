# EncryptedArithmetic

Minimal example: add/sub on encrypted integers

Category: Basic

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-arithmetic ./output/encrypted-arithmetic

cd ./output/encrypted-arithmetic
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-arithmetic
```

## Walkthrough

Minimal example for arithmetic on encrypted integers.

- Shows: `FHE.add`, `FHE.sub`

## Usage
```bash
npm install
npm test
```

## Events

- `OperandsSet`
- `Added`
- `Subtracted`

## Tests

- should add two encrypted values
- should subtract two encrypted values

