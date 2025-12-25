import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter input-proof
 * @title Input Proof Validation
 * @description Tests zero-knowledge proof validation for encrypted inputs.
 * Shows what happens with valid and invalid inputProofs, and why they're necessary.
 */
describe("InputProofValidation", function () {
  let contract: any;
  let other: any;
  let contractAddress: string;
  let otherAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("InputProofValidation");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();

    other = await factory.deploy();
    otherAddress = await other.getAddress();
  });

  /**
   * @test Valid input proof acceptance
   * @description Creates correctly bound encrypted input and verifies contract accepts it.
   */
  it("should accept a valid inputProof", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(123)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);

    const enc = await contract.get();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, enc, contractAddress, alice);
    expect(clear).to.equal(123n);
  });

  /**
   * @test Invalid input proof rejection
   * @description Tests that inputProof bound to wrong contract address is rejected.
   */
  it("should reject an inputProof created for another contract", async function () {
    const wrong = await fhevm
      .createEncryptedInput(otherAddress, alice.address)
      .add32(777)
      .encrypt();

    await expect(contract.connect(alice).store(wrong.handles[0], wrong.inputProof)).to.be.reverted;
  });
});