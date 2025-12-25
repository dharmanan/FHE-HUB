# EncryptSingleValue

Minimal example: one encrypted input -> stored encrypted state

Category: Encryption

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-encrypt-single ./output/encrypted-encrypt-single

cd ./output/encrypted-encrypt-single
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-encrypt-single
```

## Walkthrough

Minimal example for sending a single encrypted input into a contract.

- Shows: client-side encryption + `FHE.fromExternal` + `inputProof`

## Usage
```bash
npm install
npm test
```

## Events

- `Stored`

## Tests

- should store a single encrypted value

