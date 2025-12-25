# BlindAuctionTwoBidders

Minimal blind auction for two bidders.

Category: Marketplace

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-blind-auction ./output/encrypted-blind-auction

cd ./output/encrypted-blind-auction
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-blind-auction
```

## Walkthrough

Minimal blind auction example with two encrypted bids.

## Usage


```bash
npm test
```

## Events

- `BidPlaced`
- `Closed`

## Tests

- should accept encrypted bids and reveal winner

