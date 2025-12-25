# InputProofValidation

Minimal example: inputProof must match the encrypted handles and the target contract.

Category: Input Proof

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-input-proof ./output/encrypted-input-proof

cd ./output/encrypted-input-proof
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-input-proof
```

## Walkthrough

Minimal example showing that `inputProof` must match the encrypted handle(s) and the target contract.

## Usage
```bash
npm install
npm test
```

## Events

- `Stored`

## Tests

- should accept a valid inputProof
- should reject an inputProof created for another contract

