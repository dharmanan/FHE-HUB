# Developer Guide

This repo is designed to keep each example as a standalone Hardhat project, while still being easy to maintain as a collection.

## What is the source of truth?

- The example registry in `scripts/examples.ts` is the source of truth.
- `npm run create-example` generates a **single** standalone repo for one example.
- `npm run build-examples -- --core` regenerates the **curated core set** under `examples/` (this is what we track in git).
- `npm run build-examples` regenerates **all registry examples** under `examples/` (useful locally, but heavier to track).

## Add a new example

1. Add a new entry to `scripts/examples.ts`:
   - pick a stable `exampleKey` (kebab-case)
   - fill `name`, `description`, `category`, `tags`
   - include `contractName`, `contractCode`, `testCode`, `documentation`

2. **Add JSDoc/TSDoc annotations** to your code:

   In `contractCode` (Solidity):
   ```solidity
   /**
    * @title YourContract
    * @notice Brief description of what this contract does
    * @dev Implementation details
    * @chapter your-category
    */
   contract YourContract is ZamaEthereumConfig {
     // contract code
   }
   ```

   In `testCode` (TypeScript):
   ```typescript
   /**
    * @chapter your-category
    * @title Your Example Title
    * @description Detailed description of what this example demonstrates
    */
   describe("YourContract", function () {
     /**
      * @test Test case description
      * @description What this specific test verifies
      */
     it("should do something", async function () {
       // test code
     });
   });
   ```

3. Regenerate docs:

```bash
npm run generate-docs
```

4. Regenerate tracked repos:

```bash
npm run build-examples -- --only <example-key>
```

5. Run tests inside the generated repo:

```bash
cd examples/<example-key>
npm install
npm test
```

## Documentation Tags Reference

### Supported Tags

- **@chapter** - Categorizes the example (basic, access-control, decryption, defi, gaming, etc.)
- **@title** - Human-readable title for documentation
- **@description** / **@notice** - Detailed explanation of functionality
- **@test** - Marks individual test cases (used in test files)
- **@dev** - Implementation-specific details
- **@param** - Parameter descriptions (for functions)
- **@return** - Return value description

### Tag Usage Examples

**Contracts:**
```solidity
/**
 * @title EncryptedBalance
 * @notice Manages encrypted user balances
 * @dev Uses euint64 for balance storage
 * @chapter basic
 */
contract EncryptedBalance is ZamaEthereumConfig {
  /**
   * @notice Deposits encrypted amount to user's balance
   * @param encryptedAmount The encrypted value to deposit
   * @param inputProof Zero-knowledge proof for the encrypted input
   * @dev Grants permissions with FHE.allowThis() and FHE.allow()
   */
  function deposit(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
    // implementation
  }
}
```

**Tests:**
```typescript
/**
 * @chapter basic
 * @title Encrypted Balance Management
 * @description Demonstrates encrypted balance storage, deposits, and transfers
 */
describe("EncryptedBalance", function () {
  /**
   * @test Deposit encrypted balance
   * @description User deposits encrypted amount and verifies balance update
   */
  it("should deposit encrypted balance", async function () {
    // test implementation
  });
});
```

## Dependency updates

- The base template lives in `fhevm-hardhat-template/`.
- When bumping FHEVM / Hardhat dependencies, update the template first.
- Then regenerate repos via `npm run build-examples` and run `npm run smoke-test` for a quick end-to-end check.

## Smoke test

The smoke test generates throwaway repos under `output/.smoke/` and runs `npm install` + `npm test` for each example in the curated list.

```bash
npm run smoke-test
```

If you need to narrow it down:

```bash
npm run smoke-test -- --only encrypted-counter
```
