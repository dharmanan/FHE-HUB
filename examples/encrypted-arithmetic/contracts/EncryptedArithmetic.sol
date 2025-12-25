// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedArithmetic
 * @notice Minimal example: add/sub on encrypted integers
 * @dev Concept-only example. Focuses on FHE.add and FHE.sub.
 * @chapter basic
 */
contract EncryptedArithmetic is ZamaEthereumConfig {
    euint32 private a;
    euint32 private b;
    euint32 private sum;
    euint32 private diff;

    event OperandsSet(address indexed caller);
    event Added(address indexed caller);
    event Subtracted(address indexed caller);

    function setOperands(externalEuint32 encryptedA, externalEuint32 encryptedB, bytes calldata inputProof) external {
        a = FHE.fromExternal(encryptedA, inputProof);
        b = FHE.fromExternal(encryptedB, inputProof);

        FHE.allowThis(a);
        FHE.allowThis(b);
        FHE.allow(a, msg.sender);
        FHE.allow(b, msg.sender);

        emit OperandsSet(msg.sender);
    }

    function add() external {
        sum = FHE.add(a, b);
        FHE.allowThis(sum);
        FHE.allow(sum, msg.sender);
        emit Added(msg.sender);
    }

    function sub() external {
        diff = FHE.sub(a, b);
        FHE.allowThis(diff);
        FHE.allow(diff, msg.sender);
        emit Subtracted(msg.sender);
    }

    function getSum() external view returns (euint32) {
        return sum;
    }

    function getDiff() external view returns (euint32) {
        return diff;
    }
}