# OZERC7984AtomicSwapStarter

Minimal offer/accept swap for ERC7984 tokens.

Category: Oz Confidential

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create oz-confidential-swap ./output/oz-confidential-swap

cd ./output/oz-confidential-swap
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only oz-confidential-swap
```

## Walkthrough

Minimal offer/accept swap between two ERC7984 tokens.

## Usage
```bash
npm install
npm test
```

## Events

- `OfferCreated`
- `OfferAccepted`

## Tests

- should swap encrypted amounts

