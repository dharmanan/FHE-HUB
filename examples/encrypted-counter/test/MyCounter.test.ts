import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter basic
 * @title Simple FHE Counter
 * @description Tests encrypted counter increment operations using euint32.
 * Demonstrates basic FHE operations, encrypted input creation, and user decryption.
 */
describe("MyCounter", function () {
  let contract: any, contractAddress: string, alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];
    const factory = await ethers.getContractFactory("MyCounter");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  /**
   * @test Increment encrypted counter
   * @description Creates an encrypted input of value 5, increments the counter, and verifies the result.
   */
  it("should increment counter", async function () {
    const input = await fhevm.createEncryptedInput(contractAddress, alice.address).add32(5).encrypt();
    await contract.connect(alice).increment(input.handles[0], input.inputProof);
    const count = await contract.getCount();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint32, count, contractAddress, alice);
    expect(decrypted).to.equal(5);
  });
});