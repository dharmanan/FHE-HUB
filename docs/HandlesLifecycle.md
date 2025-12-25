# HandlesLifecycle

Minimal example: encrypted values are referenced by opaque handles (bytes32).

Category: Handles Lifecycle

## Run Locally

```bash
# Generate a standalone repo for this example
npm run create-example create encrypted-handles-lifecycle ./output/encrypted-handles-lifecycle

cd ./output/encrypted-handles-lifecycle
npm install
npm test
```

Tip: to verify everything in one go, run the hub smoke test:

```bash
npm run smoke-test -- --only encrypted-handles-lifecycle
```

## Walkthrough

Minimal example showing that encrypted values are referenced by opaque handles.

## Usage
```bash
npm install
npm test
```

## Events

- `Stored`
- `Updated`

## Tests

- should treat handles as opaque and show lifecycle across updates

