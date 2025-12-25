# MyCounter

Basic encrypted counter with increment/decrement operations

Category: Basic

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-counter ./output/encrypted-counter

cd ./output/encrypted-counter
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-counter
```

## Walkthrough

Basic counter with encrypted values.

## Usage
```bash
npm install
npm test
```

## Events

- `Incremented`
- `Decremented`

## Tests

- should increment counter

