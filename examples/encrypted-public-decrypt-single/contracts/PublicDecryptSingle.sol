// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PublicDecryptSingle
 * @notice Minimal example: make one encrypted value publicly decryptable
 */
contract PublicDecryptSingle is ZamaEthereumConfig {
    euint64 private value;

    event Stored(address indexed user);

    function storeAndMakePublic(externalEuint64 encryptedValue, bytes calldata inputProof) external {
        euint64 v = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(v);
        value = FHE.makePubliclyDecryptable(v);
        emit Stored(msg.sender);
    }

    function get() external view returns (euint64) {
        return value;
    }
}