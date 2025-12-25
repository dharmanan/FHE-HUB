// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title InputProofValidation
 * @notice Minimal example: inputProof must match the encrypted handles and the target contract.
 */
contract InputProofValidation is ZamaEthereumConfig {
    euint32 private stored;

    event Stored(address indexed user);

    function store(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        stored = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(stored);
        FHE.allow(stored, msg.sender);
        emit Stored(msg.sender);
    }

    function get() external view returns (euint32) {
        return stored;
    }
}