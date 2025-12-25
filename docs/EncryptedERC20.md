# EncryptedERC20

ERC20 token with encrypted balances

Category: Token

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-erc20 ./output/encrypted-erc20

cd ./output/encrypted-erc20
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-erc20
```

## Walkthrough

Privacy-preserving token.

## Usage
```bash
npm test
```

## Events

- `Transfer`

## Tests

- should mint and transfer tokens

