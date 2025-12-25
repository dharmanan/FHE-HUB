import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter basic
 * @title Encrypted Arithmetic Operations
 * @description Tests FHE arithmetic operations (add, sub, mul) on encrypted values.
 * Shows how to perform mathematical operations while maintaining data privacy.
 */
describe("EncryptedArithmetic", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("EncryptedArithmetic");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  /**
   * @test Addition of encrypted values
   * @description Tests FHE.add operation with euint32 values (7 + 3 = 10).
   */
  it("should add two encrypted values", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(7)
      .add32(3)
      .encrypt();

    await contract.connect(alice).setOperands(input.handles[0], input.handles[1], input.inputProof);
    await contract.connect(alice).add();

    const encryptedSum = await contract.connect(alice).getSum();
    const clearSum = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedSum, contractAddress, alice);
    expect(clearSum).to.equal(10);
  });

  /**
   * @test Subtraction of encrypted values
   * @description Tests FHE.sub operation with euint32 values (9 - 4 = 5).
   */
  it("should subtract two encrypted values", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(9)
      .add32(4)
      .encrypt();

    await contract.connect(alice).setOperands(input.handles[0], input.handles[1], input.inputProof);
    await contract.connect(alice).sub();

    const encryptedDiff = await contract.connect(alice).getDiff();
    const clearDiff = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedDiff, contractAddress, alice);
    expect(clearDiff).to.equal(5);
  });
});