import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("HandlesLifecycle", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("HandlesLifecycle");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should treat handles as opaque and show lifecycle across updates", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(10)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);

    const h1 = await contract.connect(alice).getMyHandle();
    expect(h1).to.match(/^0x[0-9a-fA-F]{64}$/);

    const v1 = await fhevm.userDecryptEuint(FhevmType.euint32, h1, contractAddress, alice);
    expect(v1).to.equal(10n);

    await contract.connect(alice).updatePlusOne();

    const h2 = await contract.connect(alice).getMyHandle();
    expect(h2).to.match(/^0x[0-9a-fA-F]{64}$/);

    const v2 = await fhevm.userDecryptEuint(FhevmType.euint32, h2, contractAddress, alice);
    expect(v2).to.equal(11n);

    // Old handle is still decryptable (it references prior ciphertext).
    const v1Again = await fhevm.userDecryptEuint(FhevmType.euint32, h1, contractAddress, alice);
    expect(v1Again).to.equal(10n);
  });
});