// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title AntiPatterns
 * @notice Minimal examples of what *not* to do with permissions.
 */
contract AntiPatterns is ZamaEthereumConfig {
    mapping(address => euint32) private secret;

    event StoredBadNoAllowThis(address indexed user);
    event StoredBadNoUserAllow(address indexed user);
    event StoredGood(address indexed user);

    // Anti-pattern #1: forget allowThis. Contract won't be able to use the value later.
    function storeBadNoAllowThis(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        secret[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        // Intentionally missing: FHE.allowThis(secret[msg.sender])
        FHE.allow(secret[msg.sender], msg.sender);
        emit StoredBadNoAllowThis(msg.sender);
    }

    // Anti-pattern #2: forget to allow the user. They won't be able to decrypt.
    function storeBadNoUserAllow(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        secret[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(secret[msg.sender]);
        // Intentionally missing: FHE.allow(secret[msg.sender], msg.sender)
        emit StoredBadNoUserAllow(msg.sender);
    }

    // Correct pattern: allow contract + allow user.
    function storeGood(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        secret[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(secret[msg.sender]);
        FHE.allow(secret[msg.sender], msg.sender);
        emit StoredGood(msg.sender);
    }

    function grantMeAccess() external {
        FHE.allow(secret[msg.sender], msg.sender);
    }

    function incrementMySecret() external {
        secret[msg.sender] = FHE.add(secret[msg.sender], FHE.asEuint32(1));
        FHE.allowThis(secret[msg.sender]);
        FHE.allow(secret[msg.sender], msg.sender);
    }

    function getMySecret() external view returns (euint32) {
        return secret[msg.sender];
    }
}