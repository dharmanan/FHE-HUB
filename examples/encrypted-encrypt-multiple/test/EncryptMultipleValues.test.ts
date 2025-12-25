import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptMultipleValues", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("EncryptMultipleValues");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should store multiple encrypted values", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(11)
      .add32(22)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.handles[1], input.inputProof);

    const encryptedX = await contract.connect(alice).getX();
    const encryptedY = await contract.connect(alice).getY();

    const clearX = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedX, contractAddress, alice);
    const clearY = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedY, contractAddress, alice);

    expect(clearX).to.equal(11);
    expect(clearY).to.equal(22);
  });
});