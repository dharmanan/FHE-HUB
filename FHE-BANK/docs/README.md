# FHEVM Examples

This documentation is auto-generated from the examples registry in this repository.

Each page is a quick reference (what the example shows, key events, and the test cases covered). For a fuller walkthrough, generate the standalone repo for an example and read its README.

## Examples by Category

### Basic

- **[EncryptedBalance](EncryptedBalance.md)**: A contract for managing encrypted user balances (key: `encrypted-balance`)
- **[MyCounter](MyCounter.md)**: Basic encrypted counter with increment/decrement operations (key: `encrypted-counter`)
- **[EncryptedArithmetic](EncryptedArithmetic.md)**: Minimal example: add/sub on encrypted integers (key: `encrypted-arithmetic`)
- **[EncryptedEquality](EncryptedEquality.md)**: Minimal example: equality on encrypted integers (key: `encrypted-equality`)

### Defi

- **[EncryptedCollateral](EncryptedCollateral.md)**: Privacy-preserving collateralized lending system (key: `encrypted-collateral`)
- **[EncryptedVault](EncryptedVault.md)**: Simple savings vault with encrypted balances (key: `encrypted-vault`)
- **[EncryptedTimelock](EncryptedTimelock.md)**: Time-locked vault with encrypted amounts (key: `encrypted-timelock`)
- **[EncryptedSwap](EncryptedSwap.md)**: Simple DEX swap with encrypted amounts (key: `encrypted-swap`)

### Encryption

- **[EncryptSingleValue](EncryptSingleValue.md)**: Minimal example: one encrypted input -> stored encrypted state (key: `encrypted-encrypt-single`)
- **[EncryptMultipleValues](EncryptMultipleValues.md)**: Minimal example: multiple encrypted inputs -> stored encrypted state (key: `encrypted-encrypt-multiple`)

### User Decryption

- **[UserDecryptSingle](UserDecryptSingle.md)**: Minimal example: a user decrypts one encrypted value (key: `encrypted-user-decrypt-single`)
- **[UserDecryptMultiple](UserDecryptMultiple.md)**: Minimal example: a user decrypts multiple encrypted values (key: `encrypted-user-decrypt-multiple`)

### Public Decryption

- **[PublicDecryptSingle](PublicDecryptSingle.md)**: Minimal example: make one encrypted value publicly decryptable (key: `encrypted-public-decrypt-single`)
- **[PublicDecryptMultiple](PublicDecryptMultiple.md)**: Minimal example: make multiple encrypted values publicly decryptable (key: `encrypted-public-decrypt-multiple`)

### Access Control

- **[AccessControlTransient](AccessControlTransient.md)**: Helper contract used to demonstrate allowTransient. (key: `encrypted-access-control-transient`)

### Input Proof

- **[InputProofValidation](InputProofValidation.md)**: Minimal example: inputProof must match the encrypted handles and the target contract. (key: `encrypted-input-proof`)

### Anti Patterns

- **[AntiPatterns](AntiPatterns.md)**: Minimal examples of what *not* to do with permissions. (key: `encrypted-anti-patterns`)

### Handles Lifecycle

- **[HandlesLifecycle](HandlesLifecycle.md)**: Minimal example: encrypted values are referenced by opaque handles (bytes32). (key: `encrypted-handles-lifecycle`)

### Oz Confidential

- **[OZConfidentialTokenStarter](OZConfidentialTokenStarter.md)**: Minimal starter token based on OpenZeppelin's ERC7984 reference implementation. (key: `oz-confidential-fungible-token`)
- **[OZERC7984ERC20WrapperStarter](OZERC7984ERC20WrapperStarter.md)**: Minimal wrapper: wrap ERC20 into an ERC7984 token. (key: `oz-confidential-erc20-wrapper`)
- **[OZVestingWalletConfidentialStarter](OZVestingWalletConfidentialStarter.md)**: Minimal deployable vesting wallet using VestingWalletConfidential. (key: `oz-confidential-vesting-wallet`)
- **[OZERC7984AtomicSwapStarter](OZERC7984AtomicSwapStarter.md)**: Minimal offer/accept swap for ERC7984 tokens. (key: `oz-confidential-swap`)

### Governance

- **[EncryptedVoting](EncryptedVoting.md)**: Private voting system with encrypted vote counts (key: `encrypted-voting`)

### Marketplace

- **[EncryptedAuction](EncryptedAuction.md)**: Sealed-bid auction with encrypted bids (key: `encrypted-auction`)
- **[BlindAuctionTwoBidders](BlindAuctionTwoBidders.md)**: Minimal blind auction for two bidders. (key: `encrypted-blind-auction`)

### Token

- **[EncryptedERC20](EncryptedERC20.md)**: ERC20 token with encrypted balances (key: `encrypted-erc20`)

### Gaming

- **[EncryptedLottery](EncryptedLottery.md)**: Lottery system with encrypted ticket purchases (key: `encrypted-lottery`)
- **[EncryptedRaffle](EncryptedRaffle.md)**: Raffle system with encrypted entries (key: `encrypted-raffle`)
- **[EncryptedPrediction](EncryptedPrediction.md)**: Prediction market with encrypted bets (key: `encrypted-prediction`)

### Wallet

- **[EncryptedMultisig](EncryptedMultisig.md)**: Multi-signature wallet with encrypted values (key: `encrypted-multisig`)

### Payment

- **[EncryptedEscrow](EncryptedEscrow.md)**: Escrow service with encrypted deposits (key: `encrypted-escrow`)

### Fundraising

- **[EncryptedCrowdfund](EncryptedCrowdfund.md)**: Crowdfunding with private contributions (key: `encrypted-crowdfund`)

