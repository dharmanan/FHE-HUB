import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("UserDecryptMultiple", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("UserDecryptMultiple");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should let the user decrypt multiple encrypted values", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(10)
      .add32(20)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.handles[1], input.inputProof);

    const [encA, encB] = await contract.connect(alice).getMySecrets();
    const clearA = await fhevm.userDecryptEuint(FhevmType.euint32, encA, contractAddress, alice);
    const clearB = await fhevm.userDecryptEuint(FhevmType.euint32, encB, contractAddress, alice);

    expect(clearA).to.equal(10);
    expect(clearB).to.equal(20);
  });
});