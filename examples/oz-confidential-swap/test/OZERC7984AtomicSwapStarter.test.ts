import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("OZERC7984AtomicSwapStarter", function () {
  let tokenA: any;
  let tokenB: any;
  let swap: any;
  let tokenAAddress: string;
  let tokenBAddress: string;
  let swapAddress: string;
  let deployer: any;
  let alice: any;
  let bob: any;

  async function decryptBalance(token: any, tokenAddress: string, user: any): Promise<bigint> {
    const handle = await token.confidentialBalanceOf(user.address);
    return fhevm.userDecryptEuint(FhevmType.euint64, handle, tokenAddress, user);
  }

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];
    bob = signers[2];

    const Token = await ethers.getContractFactory("OZConfidentialTokenStarter");
    tokenA = await Token.deploy("TokenA", "TKA");
    tokenB = await Token.deploy("TokenB", "TKB");
    tokenAAddress = await tokenA.getAddress();
    tokenBAddress = await tokenB.getAddress();

    const Swap = await ethers.getContractFactory("OZERC7984AtomicSwapStarter");
    swap = await Swap.deploy();
    swapAddress = await swap.getAddress();

    await tokenA.connect(deployer).mintPlain(alice.address, 100);
    await tokenB.connect(deployer).mintPlain(bob.address, 200);

    const farFuture = 2 ** 31;
    await tokenA.connect(alice).setOperator(swapAddress, farFuture);
    await tokenB.connect(bob).setOperator(swapAddress, farFuture);
  });

  it("should swap encrypted amounts", async function () {
    expect(await decryptBalance(tokenA, tokenAAddress, alice)).to.equal(100n);
    expect(await decryptBalance(tokenB, tokenBAddress, bob)).to.equal(200n);

    const inA = await fhevm.createEncryptedInput(swapAddress, alice.address).add64(25).encrypt();
    const expiry = (await ethers.provider.getBlock("latest"))!.timestamp + 3600;

    const offerTx = await swap
      .connect(alice)
      .createOffer(tokenAAddress, tokenBAddress, inA.handles[0], inA.inputProof, expiry);
    const offerReceipt = await offerTx.wait();

    const offerId = offerReceipt.logs
      .map((l: any) => {
        try {
          return swap.interface.parseLog(l);
        } catch {
          return undefined;
        }
      })
      .find((p: any) => p && p.name === "OfferCreated")!.args.offerId as bigint;

    const inB = await fhevm.createEncryptedInput(swapAddress, bob.address).add64(50).encrypt();
    await swap.connect(bob).acceptOffer(offerId, inB.handles[0], inB.inputProof);

    expect(await decryptBalance(tokenA, tokenAAddress, alice)).to.equal(75n);
    expect(await decryptBalance(tokenA, tokenAAddress, bob)).to.equal(25n);

    expect(await decryptBalance(tokenB, tokenBAddress, bob)).to.equal(150n);
    expect(await decryptBalance(tokenB, tokenBAddress, alice)).to.equal(50n);
  });
});
