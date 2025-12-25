// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract MyCounter is ZamaEthereumConfig {
    euint32 private count;
    
    event Incremented(address indexed user);
    event Decremented(address indexed user);
    
    function increment(externalEuint32 value, bytes calldata proof) external {
        euint32 val = FHE.fromExternal(value, proof);
        count = FHE.add(count, val);
        FHE.allowThis(count);
        FHE.allow(count, msg.sender);
        emit Incremented(msg.sender);
    }
    
    function decrement(externalEuint32 value, bytes calldata proof) external {
        euint32 val = FHE.fromExternal(value, proof);
        count = FHE.sub(count, val);
        FHE.allowThis(count);
        FHE.allow(count, msg.sender);
        emit Decremented(msg.sender);
    }
    
    function getCount() external view returns (euint32) {
        return count;
    }
}