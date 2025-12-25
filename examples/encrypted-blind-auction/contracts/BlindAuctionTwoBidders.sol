// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title BlindAuctionTwoBidders
 * @notice Minimal blind auction for two bidders.
 *
 * - Bids are submitted encrypted.
 * - On close, the contract compares bids using FHE and stores an encrypted boolean.
 * - The winning bid is made publicly decryptable.
 */
contract BlindAuctionTwoBidders is ZamaEthereumConfig {
    address public immutable seller;
    address public immutable alice;
    address public immutable bob;
    uint48 public immutable endTime;

    euint64 private aliceBid;
    euint64 private bobBid;
    bool public closed;

    ebool private aliceWins;
    euint64 private winningBid;

    event BidPlaced(address indexed bidder);
    event Closed();

    error NotBidder(address bidder);
    error AuctionEnded();
    error AuctionNotEnded();
    error AlreadyClosed();
    error MissingBid();

    constructor(address alice_, address bob_, uint48 durationSeconds) {
        seller = msg.sender;
        alice = alice_;
        bob = bob_;
        endTime = uint48(block.timestamp) + durationSeconds;
    }

    function placeBid(externalEuint64 amount, bytes calldata proof) external {
        if (closed) revert AlreadyClosed();
        if (block.timestamp >= endTime) revert AuctionEnded();
        if (msg.sender != alice && msg.sender != bob) revert NotBidder(msg.sender);

        euint64 bid = FHE.fromExternal(amount, proof);
        FHE.allowThis(bid);
        FHE.allow(bid, msg.sender);

        if (msg.sender == alice) {
            aliceBid = bid;
        } else {
            bobBid = bid;
        }

        emit BidPlaced(msg.sender);
    }

    function close() external {
        if (closed) revert AlreadyClosed();
        if (block.timestamp < endTime) revert AuctionNotEnded();
        if (!FHE.isInitialized(aliceBid) || !FHE.isInitialized(bobBid)) revert MissingBid();

        ebool aWins = FHE.gt(aliceBid, bobBid);
        FHE.allowThis(aWins);
        FHE.allow(aWins, seller);
        aliceWins = aWins;

        euint64 winBid = FHE.select(aWins, aliceBid, bobBid);
        FHE.allowThis(winBid);
        winningBid = FHE.makePubliclyDecryptable(winBid);

        closed = true;
        emit Closed();
    }

    function getAliceBid() external view returns (euint64) {
        require(msg.sender == alice, "only alice");
        return aliceBid;
    }

    function getBobBid() external view returns (euint64) {
        require(msg.sender == bob, "only bob");
        return bobBid;
    }

    function getOutcome() external view returns (ebool, euint64) {
        require(closed, "not closed");
        return (aliceWins, winningBid);
    }
}
