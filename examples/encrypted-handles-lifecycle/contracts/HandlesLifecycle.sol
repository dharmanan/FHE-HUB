// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title HandlesLifecycle
 * @notice Minimal example: encrypted values are referenced by opaque handles (bytes32).
 */
contract HandlesLifecycle is ZamaEthereumConfig {
    mapping(address => euint32) private value;

    event Stored(address indexed user);
    event Updated(address indexed user, bytes32 oldHandle, bytes32 newHandle);

    function store(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        value[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(value[msg.sender]);
        FHE.allow(value[msg.sender], msg.sender);
        emit Stored(msg.sender);
    }

    function updatePlusOne() external {
        euint32 oldValue = value[msg.sender];
        bytes32 oldHandle = bytes32(uint256(euint32.unwrap(oldValue)));

        euint32 newValue = FHE.add(oldValue, FHE.asEuint32(1));
        FHE.allowThis(newValue);
        FHE.allow(newValue, msg.sender);
        value[msg.sender] = newValue;

        bytes32 newHandle = bytes32(uint256(euint32.unwrap(newValue)));
        emit Updated(msg.sender, oldHandle, newHandle);
    }

    function getMyHandle() external view returns (euint32) {
        return value[msg.sender];
    }
}