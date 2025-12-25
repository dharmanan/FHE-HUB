# EncryptMultipleValues

Minimal example: multiple encrypted inputs -> stored encrypted state

Category: Encryption

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-encrypt-multiple ./output/encrypted-encrypt-multiple

cd ./output/encrypted-encrypt-multiple
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-encrypt-multiple
```

## Walkthrough

Minimal example for sending multiple encrypted inputs into a contract.

- Shows: one `inputProof` for multiple handles

## Usage
```bash
npm install
npm test
```

## Events

- `Stored`

## Tests

- should store multiple encrypted values

