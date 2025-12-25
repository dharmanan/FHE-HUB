import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptSingleValue", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("EncryptSingleValue");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should store a single encrypted value", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(123)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);

    const encrypted = await contract.connect(alice).get();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encrypted, contractAddress, alice);
    expect(clear).to.equal(123);
  });
});