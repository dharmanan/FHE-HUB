// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptMultipleValues
 * @notice Minimal example: multiple encrypted inputs -> stored encrypted state
 * @dev The inputs share the same inputProof (created by the client).
 */
contract EncryptMultipleValues is ZamaEthereumConfig {
    euint32 private x;
    euint32 private y;
    event Stored(address indexed user);

    function store(externalEuint32 encryptedX, externalEuint32 encryptedY, bytes calldata inputProof) external {
        x = FHE.fromExternal(encryptedX, inputProof);
        y = FHE.fromExternal(encryptedY, inputProof);

        FHE.allowThis(x);
        FHE.allowThis(y);
        FHE.allow(x, msg.sender);
        FHE.allow(y, msg.sender);
        emit Stored(msg.sender);
    }

    function getX() external view returns (euint32) {
        return x;
    }

    function getY() external view returns (euint32) {
        return y;
    }
}