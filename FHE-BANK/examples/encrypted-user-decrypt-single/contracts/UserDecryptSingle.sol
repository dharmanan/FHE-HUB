// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title UserDecryptSingle
 * @notice Minimal example: a user decrypts one encrypted value
 */
contract UserDecryptSingle is ZamaEthereumConfig {
    mapping(address => euint32) private secret;
    event Stored(address indexed user);

    function store(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        secret[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(secret[msg.sender]);
        FHE.allow(secret[msg.sender], msg.sender);
        emit Stored(msg.sender);
    }

    function getMySecret() external view returns (euint32) {
        return secret[msg.sender];
    }
}