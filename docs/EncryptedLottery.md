# EncryptedLottery

Lottery system with encrypted ticket purchases

Category: Gaming

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-lottery ./output/encrypted-lottery

cd ./output/encrypted-lottery
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-lottery
```

## Walkthrough

Private lottery tickets.

## Usage
```bash
npm test
```

## Events

- `TicketPurchased`

## Tests

- should buy encrypted tickets

