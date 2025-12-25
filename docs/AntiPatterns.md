# AntiPatterns

Minimal examples of what *not* to do with permissions.

Category: Anti Patterns

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-anti-patterns ./output/encrypted-anti-patterns

cd ./output/encrypted-anti-patterns
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-anti-patterns
```

## Walkthrough

Minimal examples of permission mistakes and their fixes.

## Usage
```bash
npm install
npm test
```

## Events

- `StoredBadNoAllowThis`
- `StoredBadNoUserAllow`
- `StoredGood`

## Tests

- anti-pattern: missing allowThis breaks later contract computation
- anti-pattern: missing user allow prevents user decryption
- correct: allowThis + allow lets user decrypt and contract compute

