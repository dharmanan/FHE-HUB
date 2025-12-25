# PublicDecryptSingle

Minimal example: make one encrypted value publicly decryptable

Category: Public Decryption

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-public-decrypt-single ./output/encrypted-public-decrypt-single

cd ./output/encrypted-public-decrypt-single
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-public-decrypt-single
```

## Walkthrough

Minimal example for public decryption of a single encrypted value.

## Usage
```bash
npm install
npm test
```

## Events

- `Stored`

## Tests

- should publicly decrypt one value

