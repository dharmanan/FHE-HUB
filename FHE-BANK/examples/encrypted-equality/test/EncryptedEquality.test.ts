import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedEquality", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("EncryptedEquality");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should return 1 when two encrypted values are equal", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(42)
      .add32(42)
      .encrypt();

    await contract.connect(alice).setOperands(input.handles[0], input.handles[1], input.inputProof);
    await contract.connect(alice).compare();

    const encrypted = await contract.connect(alice).getIsEqual01();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encrypted, contractAddress, alice);
    expect(clear).to.equal(1);
  });

  it("should return 0 when two encrypted values are not equal", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(1)
      .add32(2)
      .encrypt();

    await contract.connect(alice).setOperands(input.handles[0], input.handles[1], input.inputProof);
    await contract.connect(alice).compare();

    const encrypted = await contract.connect(alice).getIsEqual01();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encrypted, contractAddress, alice);
    expect(clear).to.equal(0);
  });
});