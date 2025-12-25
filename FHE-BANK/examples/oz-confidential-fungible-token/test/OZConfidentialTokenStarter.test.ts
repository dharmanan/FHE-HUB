import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("OZConfidentialTokenStarter", function () {
  let token: any;
  let tokenAddress: string;
  let deployer: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];
    bob = signers[2];

    const factory = await ethers.getContractFactory("OZConfidentialTokenStarter");
    token = await factory.deploy();
    tokenAddress = await token.getAddress();

    await token.connect(deployer).mintPlain(alice.address, 100);
  });

  async function decryptEuint64(handleHex: string, user: any): Promise<bigint> {
    return fhevm.userDecryptEuint(FhevmType.euint64, handleHex, tokenAddress, user);
  }

  it("should transfer an encrypted amount", async function () {
    const aliceBalHandle = await token.confidentialBalanceOf(alice.address);
    expect(await decryptEuint64(aliceBalHandle, alice)).to.equal(100n);

    const input = await fhevm
      .createEncryptedInput(tokenAddress, alice.address)
      .add64(25)
      .encrypt();

    await token
      .connect(alice)
      ["confidentialTransfer(address,bytes32,bytes)"](bob.address, input.handles[0], input.inputProof);

    const aliceAfter = await token.confidentialBalanceOf(alice.address);
    const bobAfter = await token.confidentialBalanceOf(bob.address);

    expect(await decryptEuint64(aliceAfter, alice)).to.equal(75n);
    expect(await decryptEuint64(bobAfter, bob)).to.equal(25n);
  });
});