// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PublicDecryptMultiple
 * @notice Minimal example: make multiple encrypted values publicly decryptable
 */
contract PublicDecryptMultiple is ZamaEthereumConfig {
    euint64 private a;
    euint64 private b;

    event Stored(address indexed user);

    function storeAndMakePublic(externalEuint64 encryptedA, externalEuint64 encryptedB, bytes calldata inputProof) external {
        euint64 va = FHE.fromExternal(encryptedA, inputProof);
        euint64 vb = FHE.fromExternal(encryptedB, inputProof);

        FHE.allowThis(va);
        FHE.allowThis(vb);

        a = FHE.makePubliclyDecryptable(va);
        b = FHE.makePubliclyDecryptable(vb);

        emit Stored(msg.sender);
    }

    function get() external view returns (euint64, euint64) {
        return (a, b);
    }
}