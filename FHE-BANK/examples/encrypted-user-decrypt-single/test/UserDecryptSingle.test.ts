import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter user-decryption
 * @title User Decryption - Single Value
 * @description Demonstrates how users decrypt their own encrypted data using fhevm.userDecryptEuint().
 * Requires FHE.allow(user) permission to be granted by the contract.
 */
describe("UserDecryptSingle", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("UserDecryptSingle");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  /**
   * @test User decrypts their own encrypted value
   * @description Stores encrypted value 777, grants user permission, and decrypts client-side.
   */
  it("should let the user decrypt a single encrypted value", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(777)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);

    const encrypted = await contract.connect(alice).getMySecret();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encrypted, contractAddress, alice);
    expect(clear).to.equal(777);
  });
});