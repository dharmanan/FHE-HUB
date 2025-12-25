import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("BlindAuctionTwoBidders", function () {
  let auction: any;
  let addr: string;
  let seller: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    seller = signers[0];
    alice = signers[1];
    bob = signers[2];

    const factory = await ethers.getContractFactory("BlindAuctionTwoBidders");
    auction = await factory.deploy(alice.address, bob.address, 10);
    addr = await auction.getAddress();
  });

  it("should accept encrypted bids and reveal winner", async function () {
    const aliceInput = await fhevm.createEncryptedInput(addr, alice.address).add64(100).encrypt();
    const bobInput = await fhevm.createEncryptedInput(addr, bob.address).add64(80).encrypt();

    await auction.connect(alice).placeBid(aliceInput.handles[0], aliceInput.inputProof);
    await auction.connect(bob).placeBid(bobInput.handles[0], bobInput.inputProof);

    await ethers.provider.send("evm_increaseTime", [12]);
    await ethers.provider.send("evm_mine", []);

    await auction.connect(seller).close();

    const [aliceWinsHandle, winningBidHandle] = await auction.getOutcome();

    const aliceWins = await fhevm.userDecryptEbool(aliceWinsHandle, addr, seller);
    expect(aliceWins).to.equal(true);

    const winningBid = await fhevm.publicDecryptEuint(FhevmType.euint64, winningBidHandle);
    expect(winningBid).to.equal(100n);
  });
});