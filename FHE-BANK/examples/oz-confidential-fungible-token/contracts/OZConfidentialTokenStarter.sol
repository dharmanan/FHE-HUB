// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

/**
 * @title OZConfidentialTokenStarter
 * @notice Minimal starter token based on OpenZeppelin's ERC7984 reference implementation.
 */
contract OZConfidentialTokenStarter is ERC7984, ZamaEthereumConfig {
    address public immutable owner;

  constructor() ERC7984("OZConfidential", "OZC", "") {
        owner = msg.sender;
    }

    function mintPlain(address to, uint64 amount) external {
    require(msg.sender == owner, "only owner");
    euint64 mintAmount = FHE.asEuint64(amount);
    FHE.allowThis(mintAmount);
    FHE.allow(mintAmount, to);
    _mint(to, mintAmount);
    }
}