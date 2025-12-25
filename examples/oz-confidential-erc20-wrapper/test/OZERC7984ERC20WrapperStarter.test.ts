import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("OZERC7984ERC20WrapperStarter", function () {
  let underlying: any;
  let wrapper: any;
  let wrapperAddress: string;
  let deployer: any;
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
    deployer = signers[0];
    alice = signers[1];

    const Underlying = await ethers.getContractFactory("MockERC20");
    underlying = await Underlying.deploy();

    const Wrapper = await ethers.getContractFactory("OZERC7984ERC20WrapperStarter");
    wrapper = await Wrapper.deploy(await underlying.getAddress());
    wrapperAddress = await wrapper.getAddress();

    const rate: bigint = await wrapper.rate();
    await underlying.mint(alice.address, 1000n * rate);
  });

  it("should wrap and unwrap", async function () {
    const rate: bigint = await wrapper.rate();
    const wrapUnderlyingAmount = 600n * rate;

    await underlying.connect(alice).approve(wrapperAddress, wrapUnderlyingAmount);
    await wrapper.connect(alice).wrap(alice.address, wrapUnderlyingAmount);

    const balHandle = await wrapper.confidentialBalanceOf(alice.address);
    const bal = await fhevm.userDecryptEuint(FhevmType.euint64, balHandle, wrapperAddress, alice);
    expect(bal).to.equal(600n);

    expect(await underlying.balanceOf(alice.address)).to.equal(400n * rate);

    const input = await fhevm
      .createEncryptedInput(wrapperAddress, alice.address)
      .add64(200)
      .encrypt();

    const tx = await wrapper
      .connect(alice)
      ["unwrap(address,address,bytes32,bytes)"](alice.address, alice.address, input.handles[0], input.inputProof);
    const receipt = await tx.wait();

    let burntAmount: string | undefined;
    for (const log of receipt.logs) {
      try {
        const parsed = wrapper.interface.parseLog(log);
        if (parsed?.name === "UnwrapRequested") {
          burntAmount = parsed.args.amount as string;
          break;
        }
      } catch {
        // ignore
      }
    }

    expect(burntAmount).to.not.equal(undefined);

    const results: any = await fhevm.publicDecrypt([burntAmount as string]);
    const clear = getClearValue(results, burntAmount as string);
    expect(clear).to.equal(200n);

    await wrapper.finalizeUnwrap(burntAmount as string, clear, results.decryptionProof);

    const balAfterHandle = await wrapper.confidentialBalanceOf(alice.address);
    const balAfter = await fhevm.userDecryptEuint(FhevmType.euint64, balAfterHandle, wrapperAddress, alice);
    expect(balAfter).to.equal(400n);

    expect(await underlying.balanceOf(alice.address)).to.equal(600n * rate);
  });
});
