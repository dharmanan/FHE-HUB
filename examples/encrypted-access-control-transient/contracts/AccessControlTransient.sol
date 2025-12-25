// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface ITransientReader {
    function addOne(euint64 value) external returns (euint64);
}

/**
 * @title TransientReader
 * @notice Helper contract used to demonstrate allowTransient.
 * @chapter access-control
 */
contract TransientReader is ZamaEthereumConfig {
    function addOne(euint64 value) external returns (euint64) {
        euint64 out = FHE.add(value, FHE.asEuint64(1));
        FHE.allowThis(out);
        // msg.sender is the calling contract (AccessControlTransient)
        FHE.allow(out, msg.sender);
        return out;
    }
}

/**
 * @title AccessControlTransient
 * @notice Minimal example: permissions + transient permission for a same-tx cross-contract call.
 * @chapter access-control
 */
contract AccessControlTransient is ZamaEthereumConfig {
    mapping(address => euint64) private secrets;

    event Stored(address indexed user);
    event Shared(address indexed owner, address indexed reader);

    function store(externalEuint64 encryptedValue, bytes calldata inputProof) external {
        secrets[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(secrets[msg.sender]);
        FHE.allow(secrets[msg.sender], msg.sender);
        emit Stored(msg.sender);
    }

    function shareWith(address reader) external {
        FHE.allow(secrets[msg.sender], reader);
        emit Shared(msg.sender, reader);
    }

    function getSecretOf(address owner) external view returns (euint64) {
        return secrets[owner];
    }

    function computeViaReader(address reader) external returns (euint64) {
        euint64 v = secrets[msg.sender];

        // Give the reader permission only for this transaction.
        FHE.allowTransient(v, reader);

        euint64 out = ITransientReader(reader).addOne(v);
        FHE.allowThis(out);
        FHE.allow(out, msg.sender);
        return out;
    }

    function computeViaReaderWithoutTransient(address reader) external returns (euint64) {
        euint64 v = secrets[msg.sender];
        // Intentionally missing allowTransient.
        return ITransientReader(reader).addOne(v);
    }
}