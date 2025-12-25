import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("PublicDecryptMultiple", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  function getClearValue(results: any, handle: string): bigint {
    const handleLower = handle.toLowerCase();
    const key = Object.keys(results.clearValues).find((k) => k.toLowerCase() === handleLower);
    expect(key).to.not.equal(undefined);
    return results.clearValues[key as any] as bigint;
  }

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("PublicDecryptMultiple");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should publicly decrypt multiple values", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(12)
      .add64(34)
      .encrypt();

    await contract.connect(alice).storeAndMakePublic(input.handles[0], input.handles[1], input.inputProof);

    const [encA, encB] = await contract.get();
    const results: any = await fhevm.publicDecrypt([encA, encB]);

    expect(getClearValue(results, encA)).to.equal(12n);
    expect(getClearValue(results, encB)).to.equal(34n);
  });
});