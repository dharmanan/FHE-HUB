# EncryptedVoting

Private voting system with encrypted vote counts

Category: Governance

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-voting ./output/encrypted-voting

cd ./output/encrypted-voting
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-voting
```

## Walkthrough

Private voting with encrypted tallies.

## Usage
```bash
npm test
```

## Events

- `Voted`

## Tests

- should cast encrypted vote

