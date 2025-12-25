import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter access-control
 * @title Access Control with Transient Storage
 * @description Tests FHE.allow() for persistent permissions and FHE.allowTransient() for same-transaction access.
 * Demonstrates how to share encrypted values between users and contracts securely.
 */
describe("AccessControlTransient", function () {
  let contract: any;
  let reader: any;
  let contractAddress: string;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];
    bob = signers[2];

    const contractFactory = await ethers.getContractFactory("AccessControlTransient");
    contract = await contractFactory.deploy();
    contractAddress = await contract.getAddress();

    const readerFactory = await ethers.getContractFactory("TransientReader");
    reader = await readerFactory.deploy();
  });

  /**
   * @test Persistent access sharing with FHE.allow()
   * @description Alice stores encrypted data and grants Bob access using FHE.allow().
   */
  it("should share access with another user using allow", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(1234)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);
    await contract.connect(alice).shareWith(bob.address);

    const enc = await contract.getSecretOf(alice.address);
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, enc, contractAddress, bob);
    expect(clear).to.equal(1234n);
  });

  /**
   * @test Same-transaction access with FHE.allowTransient()
   * @description Tests cross-contract call within the same transaction using transient storage.
   */
  it("should allow a same-tx cross-contract call using allowTransient", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(41)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);

    await expect(contract.connect(alice).computeViaReaderWithoutTransient(await reader.getAddress())).to.be.reverted;

    const out = await contract.connect(alice).computeViaReader(await reader.getAddress());
    const receipt = await out.wait();
    void receipt;

    // computeViaReader returns an euint64 in the tx return data; easiest is to query via callStatic
    const encOut = await contract.connect(alice).computeViaReader.staticCall(await reader.getAddress());
    const clearOut = await fhevm.userDecryptEuint(FhevmType.euint64, encOut, contractAddress, alice);
    expect(clearOut).to.equal(42n);
  });
});