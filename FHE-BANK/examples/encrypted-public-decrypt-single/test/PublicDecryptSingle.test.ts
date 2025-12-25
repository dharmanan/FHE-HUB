import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter public-decryption
 * @title Public Decryption - Single Value
 * @description Shows how to decrypt encrypted values to plaintext on-chain using relayer.
 * Uses FHE.publicDecrypt() to make encrypted data publicly visible.
 */
describe("PublicDecryptSingle", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("PublicDecryptSingle");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  /**
   * @test Public decryption of single value
   * @description Stores and requests public decryption, making the value visible to everyone.
   */
  it("should publicly decrypt one value", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(999)
      .encrypt();

    await contract.connect(alice).storeAndMakePublic(input.handles[0], input.inputProof);

    const encrypted = await contract.get();
    const clear = await fhevm.publicDecryptEuint(FhevmType.euint64, encrypted);
    expect(clear).to.equal(999n);
  });
});