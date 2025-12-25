// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptSingleValue
 * @notice Minimal example: one encrypted input -> stored encrypted state
 * @dev The encryption happens client-side; the contract consumes it via fromExternal(inputProof).
 */
contract EncryptSingleValue is ZamaEthereumConfig {
    euint32 private value;
    event Stored(address indexed user);

    function store(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        value = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(value);
        FHE.allow(value, msg.sender);
        emit Stored(msg.sender);
    }

    function get() external view returns (euint32) {
        return value;
    }
}