# Frontend Demo

This page documents what the Next.js frontend does, which helper functions it uses for encryption/decryption, and which deployed contract addresses it expects.

## What the frontend shows (live)

The frontend currently focuses on two live flows:

- **Encrypted collateral / DeFi position UI** (deposit, withdraw, borrow, repay, liquidation, rewards)
- **Private token demo** (faucet mint + encrypted transfer + user-only decryption of balances)

The main UI is implemented in [frontend/app/page.tsx](../frontend/app/page.tsx).

## Contracts used by the frontend

The frontend references these contracts and ABIs:

- **EncryptedCollateral**
  - Solidity source: [frontend/contracts/defi/EncryptedCollateral.sol](../frontend/contracts/defi/EncryptedCollateral.sol)
  - ABI: [frontend/lib/abi/EncryptedCollateral.json](../frontend/lib/abi/EncryptedCollateral.json)
  - Address: `COLLATERAL_CONTRACT_ADDRESS`

- **PrivateZamaToken** (demo private token contract)
  - Solidity source: [frontend/contracts/PrivateZamaToken.sol](../frontend/contracts/PrivateZamaToken.sol)
  - ABI: [frontend/lib/abi/PrivateZamaToken.json](../frontend/lib/abi/PrivateZamaToken.json)
  - Address: `PRIVATE_ZAMA_TOKEN_ADDRESS`

Additionally, the frontend config supports these (not currently used by the main page UI):

- **EncryptedBalance**
  - Solidity source: [frontend/contracts/EncryptedBalance.sol](../frontend/contracts/EncryptedBalance.sol)
  - ABI: [frontend/lib/abi/EncryptedBalance.json](../frontend/lib/abi/EncryptedBalance.json)
  - Address: `BALANCE_CONTRACT_ADDRESS`

- **ZamaToken**
  - Solidity source: [frontend/contracts/ZamaToken.sol](../frontend/contracts/ZamaToken.sol)
  - ABI: [frontend/lib/abi/ZamaToken.json](../frontend/lib/abi/ZamaToken.json)
  - Address: `ZAMA_TOKEN_ADDRESS`

- **EncryptedERC20Vault**
  - Solidity source: [frontend/contracts/EncryptedERC20Vault.sol](../frontend/contracts/EncryptedERC20Vault.sol)
  - ABI: [frontend/lib/abi/EncryptedERC20Vault.json](../frontend/lib/abi/EncryptedERC20Vault.json)
  - Address: `ZAMA_VAULT_ADDRESS`

## Deployed addresses (from deployments.json)

Default addresses are stored in [frontend/lib/deployments.json](../frontend/lib/deployments.json) and used by [frontend/lib/config.ts](../frontend/lib/config.ts).

Network: `fhevmSepolia` (chainId `11155111`)

| Contract | Address |
|---|---|
| EncryptedBalance | `0x8b81c9037e51fdA575FEeE97A5517472c55fb552` |
| PrivateZamaToken | `0x6Ba9E31291a08840C9c072C5627249188fAa606a` |
| ZamaToken | `0x837CeB5a451F9F6dc659ae3498882fBF0d0CD349` |
| EncryptedERC20Vault | `0x148CB74de46217F525e465B2e4dAC2cc1ecCe3Af` |
| EncryptedCollateral | `0x9577b3722D2983EbCd8E247a65B71AF0711dE9b8` |

### Address override rules

The frontend loads addresses with an **env-first** strategy (see [frontend/lib/config.ts](../frontend/lib/config.ts)).

Common overrides:

- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_COLLATERAL_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_PRIVATE_ZAMA_TOKEN_ADDRESS`
- `NEXT_PUBLIC_BALANCE_CONTRACT_ADDRESS` (or `NEXT_PUBLIC_CONTRACT_ADDRESS`)
- `NEXT_PUBLIC_ZAMA_TOKEN_ADDRESS`
- `NEXT_PUBLIC_ZAMA_VAULT_ADDRESS`

## Helper functions used (encryption / decryption)

The frontend uses Zama’s Relayer SDK through a thin wrapper in [frontend/lib/fhevm.ts](../frontend/lib/fhevm.ts).

Functions that are used directly by the UI:

- `getContract(signer, address, abi)`
  - Creates an ethers v6 `Contract` instance.
  - Used during wallet connect / init to bind ABIs to deployed addresses.

- `encryptValue(value, userAddress, contractAddress)`
  - Creates an encrypted input bound to `[contractAddress, userAddress]`.
  - Returns `{ handle, inputProof }` as hex strings.
  - Used before calling FHE-enabled contract methods.

- `decryptHandle(handle, signer, userAddress, contractAddress)`
  - Convenience helper to decrypt a single encrypted handle.

- `decryptHandles(handles[], signer, userAddress, contractAddress)`
  - Batch decrypts multiple handles in one signature flow to reduce prompts.
  - Internally:
    - loads or generates a per-user keypair in `localStorage`
    - builds EIP-712 typed data via `createEIP712(...)`
    - signs typed data with `signer.signTypedData(...)`
    - calls `instance.userDecrypt(...)`

Initialization details:

- `getFhevmInstance()` dynamically imports `@zama-fhe/relayer-sdk/web` (browser-only) and runs `initSDK(...)`.
- WASM assets are expected under `frontend/public/` (e.g. `/tfhe_bg.wasm`, `/kms_lib_bg.wasm`).

## Vercel deployment

Vercel demo URL: https://fhehub.vercel.app
