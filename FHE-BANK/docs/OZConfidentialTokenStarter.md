# OZConfidentialTokenStarter

Minimal starter token based on OpenZeppelin's ERC7984 reference implementation.

Category: Oz Confidential

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create oz-confidential-fungible-token ./output/oz-confidential-fungible-token

cd ./output/oz-confidential-fungible-token
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only oz-confidential-fungible-token
```

## Walkthrough

Minimal starter example using OpenZeppelin Confidential Contracts (ERC7984).

## Usage
```bash
npm install
npm test
```

## Tests

- should transfer an encrypted amount

