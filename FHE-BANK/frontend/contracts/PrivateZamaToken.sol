// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PrivateZamaToken
 * @notice FHE-native private token (ERC20-like UX, but NOT ERC20)
 * @dev
 * - Balances are encrypted (euint64). Transfer amounts are encrypted.
 * - Faucet mints up to a lifetime encrypted cap per address (default 10 * 1e18).
 * - There is intentionally no ERC20 Transfer event with plaintext amount.
 */
contract PrivateZamaToken is ZamaEthereumConfig {
    string public constant name = "Private ZAMA";
    string public constant symbol = "pZAMA";
    uint8 public constant decimals = 18;

    // 10 * 1e18 fits in uint64 (max ~1.84e19)
    uint64 public constant FAUCET_CAP = 10_000_000_000_000_000_000;

    mapping(address => euint64) private balances;
    mapping(address => euint64) private faucetClaimed;

    event BalanceUpdated(address indexed user);
    event FaucetMint(address indexed user);
    event EncryptedTransfer(address indexed from, address indexed to);

    function faucet(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 requested = FHE.fromExternal(encryptedAmount, inputProof);

        euint64 cap = FHE.asEuint64(FAUCET_CAP);
        euint64 claimedClamped = FHE.min(faucetClaimed[msg.sender], cap);
        euint64 remaining = FHE.sub(cap, claimedClamped);
        euint64 mintAmount = FHE.min(requested, remaining);

        faucetClaimed[msg.sender] = FHE.add(claimedClamped, mintAmount);
        balances[msg.sender] = FHE.add(balances[msg.sender], mintAmount);

        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);

        FHE.allowThis(faucetClaimed[msg.sender]);
        FHE.allow(faucetClaimed[msg.sender], msg.sender);

        emit FaucetMint(msg.sender);
        emit BalanceUpdated(msg.sender);
    }

    function getBalance() external view returns (euint64) {
        return balances[msg.sender];
    }

    function transfer(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        require(to != address(0), "Invalid recipient");

        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        ebool hasBalance = FHE.le(amount, balances[msg.sender]);
        euint64 actualAmount = FHE.select(hasBalance, amount, FHE.asEuint64(0));

        balances[msg.sender] = FHE.sub(balances[msg.sender], actualAmount);
        balances[to] = FHE.add(balances[to], actualAmount);

        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);

        FHE.allowThis(balances[to]);
        FHE.allow(balances[to], to);

        emit EncryptedTransfer(msg.sender, to);
        emit BalanceUpdated(msg.sender);
        emit BalanceUpdated(to);
    }
}
