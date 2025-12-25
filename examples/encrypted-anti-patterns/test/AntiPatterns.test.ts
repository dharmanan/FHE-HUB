import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter anti-patterns
 * @title Common FHEVM Mistakes and Anti-Patterns
 * @description Demonstrates common mistakes when working with encrypted values:
 * - Missing FHE.allowThis() breaks contract operations
 * - Missing FHE.allow(user) prevents user decryption
 * - View functions cannot return encrypted values
 */
describe("AntiPatterns", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("AntiPatterns");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  /**
   * @test Missing allowThis() anti-pattern
   * @description Shows that forgetting FHE.allowThis() prevents contract from using encrypted values later.
   */
  it("anti-pattern: missing allowThis breaks later contract computation", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(7)
      .encrypt();

    await contract.connect(alice).storeBadNoAllowThis(input.handles[0], input.inputProof);
    await expect(contract.connect(alice).incrementMySecret()).to.be.reverted;
  });

  /**
   * @test Missing allow(user) anti-pattern
   * @description Shows that forgetting FHE.allow(user) prevents user from decrypting their own data.
   */
  it("anti-pattern: missing user allow prevents user decryption", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(99)
      .encrypt();

    await contract.connect(alice).storeBadNoUserAllow(input.handles[0], input.inputProof);
    const enc = await contract.connect(alice).getMySecret();

    await expect(
      fhevm.userDecryptEuint(FhevmType.euint32, enc, contractAddress, alice)
    ).to.be.rejected;

    await contract.connect(alice).grantMeAccess();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, enc, contractAddress, alice);
    expect(clear).to.equal(99n);
  });

  it("correct: allowThis + allow lets user decrypt and contract compute", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(1)
      .encrypt();

    await contract.connect(alice).storeGood(input.handles[0], input.inputProof);
    await contract.connect(alice).incrementMySecret();

    const enc = await contract.connect(alice).getMySecret();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, enc, contractAddress, alice);
    expect(clear).to.equal(2n);
  });
});