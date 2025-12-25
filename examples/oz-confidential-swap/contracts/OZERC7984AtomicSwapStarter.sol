// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

contract OZConfidentialTokenStarter is ERC7984, ZamaEthereumConfig {
    address public immutable owner;

    constructor(string memory name_, string memory symbol_) ERC7984(name_, symbol_, "") {
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

/**
 * @title OZERC7984AtomicSwapStarter
 * @notice Minimal offer/accept swap for ERC7984 tokens.
 *
 * The swap contract relies on ERC7984 operators:
 * - maker must call tokenA.setOperator(address(this), until)
 * - taker must call tokenB.setOperator(address(this), until)
 */
contract OZERC7984AtomicSwapStarter is ZamaEthereumConfig {
    struct Offer {
        address maker;
        address tokenA;
        address tokenB;
    bytes32 amountAHandle;
        uint48 expiry;
    }

    uint256 public nextOfferId;
    mapping(uint256 => Offer) public offers;

    event OfferCreated(uint256 indexed offerId, address indexed maker, address indexed tokenA, address tokenB);
    event OfferAccepted(uint256 indexed offerId, address indexed taker);

    error OfferNotFound(uint256 offerId);
    error OfferExpired(uint256 offerId);

    function createOffer(
        address tokenA,
        address tokenB,
        externalEuint64 encryptedAmountA,
        bytes calldata inputProofA,
        uint48 expiry
    ) external returns (uint256 offerId) {
      euint64 amountA = FHE.fromExternal(encryptedAmountA, inputProofA);
      FHE.allowThis(amountA);
      FHE.allow(amountA, tokenA);

        offerId = nextOfferId++;
        offers[offerId] = Offer({
            maker: msg.sender,
            tokenA: tokenA,
            tokenB: tokenB,
        amountAHandle: euint64.unwrap(amountA),
            expiry: expiry
        });
        emit OfferCreated(offerId, msg.sender, tokenA, tokenB);
    }

    function acceptOffer(uint256 offerId, externalEuint64 encryptedAmountB, bytes calldata inputProofB) external {
        Offer memory offer = offers[offerId];
        if (offer.maker == address(0)) revert OfferNotFound(offerId);
        if (block.timestamp > offer.expiry) revert OfferExpired(offerId);
        delete offers[offerId];

      euint64 amountA = euint64.wrap(offer.amountAHandle);
      euint64 amountB = FHE.fromExternal(encryptedAmountB, inputProofB);
      FHE.allowThis(amountB);

      // Token contracts must be allowed to use the handles in FHE operations.
      FHE.allow(amountA, offer.tokenA);
      FHE.allow(amountB, offer.tokenB);

      IERC7984(offer.tokenA).confidentialTransferFrom(offer.maker, msg.sender, amountA);
      IERC7984(offer.tokenB).confidentialTransferFrom(msg.sender, offer.maker, amountB);
        emit OfferAccepted(offerId, msg.sender);
    }
}
