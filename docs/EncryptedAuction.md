# EncryptedAuction

Sealed-bid auction with encrypted bids

Category: Marketplace

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-auction ./output/encrypted-auction

cd ./output/encrypted-auction
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-auction
```

## Walkthrough

Sealed-bid auction system.

## Usage
```bash
npm test
```

## Events

- `BidPlaced`

## Tests

- should place encrypted bid

