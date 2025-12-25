# AccessControlTransient

Helper contract used to demonstrate allowTransient.

Category: Access Control

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-access-control-transient ./output/encrypted-access-control-transient

cd ./output/encrypted-access-control-transient
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-access-control-transient
```

## Walkthrough

Minimal example for permissions and transient permissions.

## Usage
```bash
npm install
npm test
```

## Events

- `Stored`
- `Shared`

## Tests

- should share access with another user using allow
- should allow a same-tx cross-contract call using allowTransient

