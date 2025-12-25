// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedBalance
 * @notice Seçenek B: Tamamen encrypted ledger demo (gerçek ETH kasası yok)
 * @dev
 * - Deposit: ciphertext olarak miktar ekler (tx.value = 0)
 * - Transfer: ciphertext olarak miktar transfer eder
 * - View: userDecrypt ile client-side okunur
 */
contract EncryptedBalance is ZamaEthereumConfig {
    mapping(address => euint64) private balances;

    event BalanceUpdated(address indexed user);

    constructor() {}

    function deposit(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        balances[msg.sender] = FHE.add(balances[msg.sender], amount);
        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);
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

        emit BalanceUpdated(msg.sender);
        emit BalanceUpdated(to);
    }
}
