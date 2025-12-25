# UserDecryptSingle

Minimal example: a user decrypts one encrypted value

Category: User Decryption

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-user-decrypt-single ./output/encrypted-user-decrypt-single

cd ./output/encrypted-user-decrypt-single
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-user-decrypt-single
```

## Walkthrough

Minimal example for user decryption of a single encrypted value.

## Usage
```bash
npm install
npm test
```

## Events

- `Stored`

## Tests

- should let the user decrypt a single encrypted value

