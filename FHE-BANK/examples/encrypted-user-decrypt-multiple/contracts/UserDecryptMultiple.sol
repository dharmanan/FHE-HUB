// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title UserDecryptMultiple
 * @notice Minimal example: a user decrypts multiple encrypted values
 */
contract UserDecryptMultiple is ZamaEthereumConfig {
    mapping(address => euint32) private a;
    mapping(address => euint32) private b;

    event Stored(address indexed user);

    function store(externalEuint32 encryptedA, externalEuint32 encryptedB, bytes calldata inputProof) external {
        a[msg.sender] = FHE.fromExternal(encryptedA, inputProof);
        b[msg.sender] = FHE.fromExternal(encryptedB, inputProof);

        FHE.allowThis(a[msg.sender]);
        FHE.allowThis(b[msg.sender]);
        FHE.allow(a[msg.sender], msg.sender);
        FHE.allow(b[msg.sender], msg.sender);

        emit Stored(msg.sender);
    }

    function getMySecrets() external view returns (euint32, euint32) {
        return (a[msg.sender], b[msg.sender]);
    }
}