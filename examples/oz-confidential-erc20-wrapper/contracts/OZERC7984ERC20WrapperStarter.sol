// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title OZERC7984ERC20WrapperStarter
 * @notice Minimal wrapper: wrap ERC20 into an ERC7984 token.
 */
contract OZERC7984ERC20WrapperStarter is ERC7984ERC20Wrapper, ZamaEthereumConfig {
    constructor(IERC20 underlying_)
        ERC7984("Wrapped Mock", "wMOCK", "")
        ERC7984ERC20Wrapper(underlying_)
    {}

  function wrap(address to, uint256 amount) public override {
    SafeERC20.safeTransferFrom(underlying(), msg.sender, address(this), amount - (amount % rate()));

    euint64 mintAmount = FHE.asEuint64(SafeCast.toUint64(amount / rate()));
    FHE.allowThis(mintAmount);
    FHE.allow(mintAmount, to);
    _mint(to, mintAmount);
  }
}
