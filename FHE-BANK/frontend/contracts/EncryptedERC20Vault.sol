// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "fhevm/lib/TFHE.sol";
import "fhevm/config/ZamaFHEVMConfig.sol";
import "fhevm/config/ZamaGatewayConfig.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "fhevm/gateway/lib/Gateway.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title EncryptedERC20Vault
 * @notice ERC20 vault + encrypted internal ledger + encrypted internal transfers.
 * @dev
 * - deposit(amount): ERC20 transferFrom (public) + encrypted balance update
 * - transfer(to, encryptedAmount, proof): internal encrypted transfer (private amount)
 * - withdraw(amount): requests a Gateway decryption of an encrypted boolean check, then
 *   in callback transfers ERC20 amount out (public amount) if the check passes.
 *
 * This design avoids a manual "authorize" UX step: the contract calls ACL allowForDecryption
 * as part of Gateway.requestDecryption.
 */
contract EncryptedERC20Vault is SepoliaZamaFHEVMConfig, SepoliaZamaGatewayConfig, GatewayCaller {
    IERC20 public immutable token;

    // For demo parity with ZamaToken transfer cap.
    uint64 public constant MAX_INTERNAL_TRANSFER = 10 * 1e18;

    mapping(address => euint64) private balances;

    struct PendingWithdraw {
        address user;
        uint64 amount;
    }

    mapping(uint256 => PendingWithdraw) public pendingWithdrawals;

    event BalanceUpdated(address indexed user);
    event WithdrawRequested(uint256 indexed requestId, address indexed user, uint64 amount);
    event WithdrawCompleted(uint256 indexed requestId, address indexed user, uint64 amount, bool success);

    constructor(address tokenAddress) {
        require(tokenAddress != address(0), "Invalid token");
        token = IERC20(tokenAddress);
    }

    function getBalance() external view returns (euint64) {
        return balances[msg.sender];
    }

    function deposit(uint64 amount) external {
        require(amount > 0, "Amount=0");
        require(token.transferFrom(msg.sender, address(this), amount), "transferFrom failed");

        euint64 eamount = TFHE.asEuint64(uint256(amount));
        balances[msg.sender] = TFHE.add(balances[msg.sender], eamount);
        TFHE.allow(balances[msg.sender], msg.sender);

        emit BalanceUpdated(msg.sender);
    }

    /**
     * @notice Withdraw an ERC20 amount (public) if your encrypted vault balance is sufficient.
     * @dev This is an async flow: it requests a Gateway decryption and completes in withdrawCallback.
     */
    function withdraw(uint64 amount) external {
        require(amount > 0, "Amount=0");

        euint64 eamount = TFHE.asEuint64(uint256(amount));
        ebool canWithdraw = TFHE.le(eamount, balances[msg.sender]);

        uint256[] memory handles = new uint256[](1);
        handles[0] = Gateway.toUint256(canWithdraw);

        uint256 requestId = Gateway.requestDecryption(
            handles,
            this.withdrawCallback.selector,
            0,
            block.timestamp + 1 hours,
            false
        );

        pendingWithdrawals[requestId] = PendingWithdraw({ user: msg.sender, amount: amount });
        emit WithdrawRequested(requestId, msg.sender, amount);
    }

    function withdrawCallback(uint256 requestId, bool canWithdraw) external onlyGateway {
        PendingWithdraw memory pending = pendingWithdrawals[requestId];
        require(pending.user != address(0), "Unknown request");
        delete pendingWithdrawals[requestId];

        if (!canWithdraw) {
            emit WithdrawCompleted(requestId, pending.user, pending.amount, false);
            return;
        }

        euint64 eamount = TFHE.asEuint64(uint256(pending.amount));
        balances[pending.user] = TFHE.sub(balances[pending.user], eamount);
        TFHE.allow(balances[pending.user], pending.user);
        emit BalanceUpdated(pending.user);

        require(token.transfer(pending.user, pending.amount), "transfer failed");
        emit WithdrawCompleted(requestId, pending.user, pending.amount, true);
    }

    function transfer(address to, einput encryptedAmount, bytes calldata inputProof) external {
        require(to != address(0), "Invalid recipient");

        euint64 requested = TFHE.asEuint64(encryptedAmount, inputProof);
        euint64 capped = TFHE.min(requested, TFHE.asEuint64(uint256(MAX_INTERNAL_TRANSFER)));

        ebool hasBalance = TFHE.le(capped, balances[msg.sender]);
        euint64 actualAmount = TFHE.select(hasBalance, capped, TFHE.asEuint64(0));

        balances[msg.sender] = TFHE.sub(balances[msg.sender], actualAmount);
        balances[to] = TFHE.add(balances[to], actualAmount);

        TFHE.allow(balances[msg.sender], msg.sender);
        TFHE.allow(balances[to], to);

        emit BalanceUpdated(msg.sender);
        emit BalanceUpdated(to);
    }
}
