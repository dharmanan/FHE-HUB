// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/config/ZamaFHEVMConfig.sol";
import "fhevm/gateway/GatewayCaller.sol";

/**
 * @title EncryptedCollateral
 * @notice A DeFi contract for managing encrypted collateral with privacy-preserving operations
 * @dev Demonstrates collateral management, health factor calculations, and liquidation checks with FHE
 * 
 */
contract EncryptedCollateral is SepoliaZamaFHEVMConfig, GatewayCaller {
    
    uint256 public constant MIN_COLLATERAL_RATIO = 15000; // 150%
    uint256 public constant LIQUIDATION_THRESHOLD = 12000; // 120%
    uint256 public constant BASIS_POINTS = 10000;
    
    struct UserPosition {
        euint64 collateralAmount;
        euint64 borrowedAmount;
        bool exists;
    }
    
    mapping(address => UserPosition) private positions;
    mapping(address => bool) public hasPosition;

    // Liquidators accumulate seized collateral here (encrypted).
    mapping(address => euint64) private liquidatorRewards;
    
    event CollateralDeposited(address indexed user, uint256 timestamp);
    event CollateralWithdrawn(address indexed user, uint256 timestamp);
    event BorrowExecuted(address indexed user, uint256 timestamp);
    event RepaymentMade(address indexed user, uint256 timestamp);
    event PositionLiquidated(address indexed user, address indexed liquidator, uint256 timestamp);
    
    constructor() {}
    
    /**
     * @notice Deposit encrypted collateral
     * @param encryptedAmount The encrypted amount to deposit as collateral
     * @param inputProof Proof for the encrypted input
     * @dev Increases user's collateral balance
     */
    function depositCollateral(einput encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = TFHE.asEuint64(encryptedAmount, inputProof);
        
        if (!hasPosition[msg.sender]) {
            positions[msg.sender] = UserPosition({
                collateralAmount: amount,
                borrowedAmount: TFHE.asEuint64(0),
                exists: true
            });
            hasPosition[msg.sender] = true;
        } else {
            positions[msg.sender].collateralAmount = TFHE.add(
                positions[msg.sender].collateralAmount,
                amount
            );
        }
        
        
        TFHE.allow(positions[msg.sender].collateralAmount, msg.sender);
        
        emit CollateralDeposited(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Borrow against collateral
     * @param encryptedAmount The encrypted amount to borrow
     * @param inputProof Proof for the encrypted input
     * @dev Checks collateral ratio before allowing borrow
     */
    function borrow(einput encryptedAmount, bytes calldata inputProof) external {
        require(hasPosition[msg.sender], "No position found");
        
        euint64 borrowAmount = TFHE.asEuint64(encryptedAmount, inputProof);
        UserPosition storage position = positions[msg.sender];
        
        euint64 newBorrowedAmount = TFHE.add(position.borrowedAmount, borrowAmount);
        
        euint64 collateralValue = TFHE.mul(position.collateralAmount, uint64(BASIS_POINTS));
        euint64 requiredCollateral = TFHE.mul(newBorrowedAmount, uint64(MIN_COLLATERAL_RATIO));
        
        ebool isSufficient = TFHE.ge(collateralValue, requiredCollateral);
        
        euint64 actualBorrowAmount = TFHE.select(isSufficient, borrowAmount, TFHE.asEuint64(0));
        position.borrowedAmount = TFHE.add(position.borrowedAmount, actualBorrowAmount);
        
        
        TFHE.allow(position.borrowedAmount, msg.sender);
        
        emit BorrowExecuted(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Repay borrowed amount
     * @param encryptedAmount The encrypted amount to repay
     * @param inputProof Proof for the encrypted input
     */
    function repay(einput encryptedAmount, bytes calldata inputProof) external {
        require(hasPosition[msg.sender], "No position found");
        
        euint64 repayAmount = TFHE.asEuint64(encryptedAmount, inputProof);
        UserPosition storage position = positions[msg.sender];
        
        ebool canRepay = TFHE.le(repayAmount, position.borrowedAmount);
        euint64 actualRepayAmount = TFHE.select(canRepay, repayAmount, position.borrowedAmount);
        
        position.borrowedAmount = TFHE.sub(position.borrowedAmount, actualRepayAmount);
        
        
        TFHE.allow(position.borrowedAmount, msg.sender);
        
        emit RepaymentMade(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Withdraw collateral
     * @param encryptedAmount The encrypted amount to withdraw
     * @param inputProof Proof for the encrypted input
     * @dev Only allows withdrawal if collateral ratio remains healthy
     */
    function withdrawCollateral(einput encryptedAmount, bytes calldata inputProof) external {
        require(hasPosition[msg.sender], "No position found");
        
        euint64 withdrawAmount = TFHE.asEuint64(encryptedAmount, inputProof);
        UserPosition storage position = positions[msg.sender];
        
        ebool hasSufficientCollateral = TFHE.le(withdrawAmount, position.collateralAmount);
        euint64 remainingCollateral = TFHE.select(
            hasSufficientCollateral,
            TFHE.sub(position.collateralAmount, withdrawAmount),
            position.collateralAmount
        );
        
        euint64 remainingValue = TFHE.mul(remainingCollateral, uint64(BASIS_POINTS));
        euint64 requiredCollateral = TFHE.mul(position.borrowedAmount, uint64(MIN_COLLATERAL_RATIO));
        
        ebool isHealthy = TFHE.ge(remainingValue, requiredCollateral);
        
        euint64 actualWithdrawAmount = TFHE.select(
            TFHE.and(hasSufficientCollateral, isHealthy),
            withdrawAmount,
            TFHE.asEuint64(0)
        );
        
        position.collateralAmount = TFHE.sub(position.collateralAmount, actualWithdrawAmount);
        
        
        TFHE.allow(position.collateralAmount, msg.sender);
        
        emit CollateralWithdrawn(msg.sender, block.timestamp);
    }
    
    /**
     * @notice Get user's encrypted collateral amount
     * @return The encrypted collateral amount
     */
    function getCollateral() external view returns (euint64) {
        require(hasPosition[msg.sender], "No position found");
        return positions[msg.sender].collateralAmount;
    }
    
    /**
     * @notice Get user's encrypted borrowed amount
     * @return The encrypted borrowed amount
     */
    function getBorrowed() external view returns (euint64) {
        require(hasPosition[msg.sender], "No position found");
        return positions[msg.sender].borrowedAmount;
    }
    
    /**
     * @notice Check if position is healthy
     * @param user Address of the user to check
     * @return Encrypted boolean indicating if position is healthy
     */
    function isPositionHealthy(address user) external returns (ebool) {
        require(hasPosition[user], "No position found");
        
        UserPosition storage position = positions[user];
        
        euint64 collateralValue = TFHE.mul(position.collateralAmount, uint64(BASIS_POINTS));
        euint64 requiredCollateral = TFHE.mul(position.borrowedAmount, uint64(MIN_COLLATERAL_RATIO));
        
        return TFHE.ge(collateralValue, requiredCollateral);
    }
    
    /**
     * @notice Check if position can be liquidated
     * @param user Address of the user to check
     * @return Encrypted boolean indicating if position can be liquidated
     */
    function canLiquidate(address user) external returns (ebool) {
        require(hasPosition[user], "No position found");
        
        UserPosition storage position = positions[user];
        
        euint64 collateralValue = TFHE.mul(position.collateralAmount, uint64(BASIS_POINTS));
        euint64 liquidationThreshold = TFHE.mul(position.borrowedAmount, uint64(LIQUIDATION_THRESHOLD));
        
        return TFHE.lt(collateralValue, liquidationThreshold);
    }

    /**
     * @notice Liquidate an undercollateralized position.
     * @dev This demo uses encrypted branching (TFHE.select) instead of revert.
     *      If the position is not liquidatable, this function becomes a no-op.
     */
    function liquidate(address user) external {
        require(hasPosition[user], "No position found");

        UserPosition storage position = positions[user];

        euint64 collateralValue = TFHE.mul(position.collateralAmount, uint64(BASIS_POINTS));
        euint64 liquidationThreshold = TFHE.mul(position.borrowedAmount, uint64(LIQUIDATION_THRESHOLD));
        ebool isLiquidatable = TFHE.lt(collateralValue, liquidationThreshold);

        // Seize the full collateral amount if liquidatable.
        euint64 seized = TFHE.select(isLiquidatable, position.collateralAmount, TFHE.asEuint64(0));

        // Reset position if liquidated (otherwise keep as-is).
        position.collateralAmount = TFHE.select(isLiquidatable, TFHE.asEuint64(0), position.collateralAmount);
        position.borrowedAmount = TFHE.select(isLiquidatable, TFHE.asEuint64(0), position.borrowedAmount);

        // Credit liquidator rewards.
        liquidatorRewards[msg.sender] = TFHE.add(liquidatorRewards[msg.sender], seized);

        TFHE.allow(liquidatorRewards[msg.sender], msg.sender);
        TFHE.allow(position.collateralAmount, user);
        TFHE.allow(position.borrowedAmount, user);

        emit PositionLiquidated(user, msg.sender, block.timestamp);
    }

    /**
     * @notice Get the caller's encrypted liquidation reward balance.
     */
    function getLiquidatorReward() external view returns (euint64) {
        return liquidatorRewards[msg.sender];
    }
    
    /**
     * @notice Transfer collateral to another protocol
     * @param to Address of the receiving protocol
     * @param encryptedAmount Amount to transfer
     * @param inputProof Proof for the encrypted input
     * @dev Demonstrates cross-protocol collateral usage
     */
    function transferCollateralToProtocol(
        address to,
        einput encryptedAmount,
        bytes calldata inputProof
    ) external {
        require(hasPosition[msg.sender], "No position found");
        
        euint64 transferAmount = TFHE.asEuint64(encryptedAmount, inputProof);
        UserPosition storage position = positions[msg.sender];
        
        ebool hasSufficient = TFHE.le(transferAmount, position.collateralAmount);
        
        euint64 remainingCollateral = TFHE.select(
            hasSufficient,
            TFHE.sub(position.collateralAmount, transferAmount),
            position.collateralAmount
        );
        
        euint64 remainingValue = TFHE.mul(remainingCollateral, uint64(BASIS_POINTS));
        euint64 requiredCollateral = TFHE.mul(position.borrowedAmount, uint64(MIN_COLLATERAL_RATIO));
        ebool isHealthy = TFHE.ge(remainingValue, requiredCollateral);
        
        ebool canTransfer = TFHE.and(hasSufficient, isHealthy);
        
        euint64 actualTransferAmount = TFHE.select(canTransfer, transferAmount, TFHE.asEuint64(0));
        
        position.collateralAmount = TFHE.sub(position.collateralAmount, actualTransferAmount);
        
        
        TFHE.allow(actualTransferAmount, to);
        TFHE.allow(position.collateralAmount, msg.sender);
    }
}