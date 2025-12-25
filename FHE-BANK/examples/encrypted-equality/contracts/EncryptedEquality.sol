// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedEquality
 * @notice Minimal example: equality on encrypted integers
 * @dev Uses FHE.eq, and stores the result as encrypted 0/1.
 */
contract EncryptedEquality is ZamaEthereumConfig {
    euint32 private left;
    euint32 private right;
    euint32 private isEqual01;

    event OperandsSet(address indexed caller);
    event Compared(address indexed caller);

    function setOperands(externalEuint32 encryptedLeft, externalEuint32 encryptedRight, bytes calldata inputProof) external {
        left = FHE.fromExternal(encryptedLeft, inputProof);
        right = FHE.fromExternal(encryptedRight, inputProof);

        FHE.allowThis(left);
        FHE.allowThis(right);
        FHE.allow(left, msg.sender);
        FHE.allow(right, msg.sender);

        emit OperandsSet(msg.sender);
    }

    function compare() external {
        ebool eq = FHE.eq(left, right);
        isEqual01 = FHE.select(eq, FHE.asEuint32(1), FHE.asEuint32(0));
        FHE.allowThis(isEqual01);
        FHE.allow(isEqual01, msg.sender);
        emit Compared(msg.sender);
    }

    function getIsEqual01() external view returns (euint32) {
        return isEqual01;
    }
}