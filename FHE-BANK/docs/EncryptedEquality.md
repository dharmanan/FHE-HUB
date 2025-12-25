# EncryptedEquality

Minimal example: equality on encrypted integers

Category: Basic

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-equality ./output/encrypted-equality

cd ./output/encrypted-equality
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-equality
```

## Walkthrough

Minimal example for encrypted equality comparison.

- Shows: `FHE.eq`

## Usage
```bash
npm install
npm test
```

## Events

- `OperandsSet`
- `Compared`

## Tests

- should return 1 when two encrypted values are equal
- should return 0 when two encrypted values are not equal

