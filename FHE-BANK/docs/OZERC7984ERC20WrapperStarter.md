# OZERC7984ERC20WrapperStarter

Minimal wrapper: wrap ERC20 into an ERC7984 token.

Category: Oz Confidential

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create oz-confidential-erc20-wrapper ./output/oz-confidential-erc20-wrapper

cd ./output/oz-confidential-erc20-wrapper
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only oz-confidential-erc20-wrapper
```

## Walkthrough

Wrap a public ERC20 into a confidential ERC7984 token and unwrap back.

## Usage
```bash
npm install
npm test
```

## Tests

- should wrap and unwrap

