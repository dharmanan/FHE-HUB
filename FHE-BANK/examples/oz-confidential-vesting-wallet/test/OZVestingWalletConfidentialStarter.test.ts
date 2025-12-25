import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("OZVestingWalletConfidentialStarter", function () {
  let token: any;
  let vesting: any;
  let tokenAddress: string;
  let vestingAddress: string;
  let deployer: any;
  let alice: any;
  let start: number;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];

    const Token = await ethers.getContractFactory("OZConfidentialTokenStarter");
    token = await Token.deploy();
    tokenAddress = await token.getAddress();

    const Vesting = await ethers.getContractFactory("OZVestingWalletConfidentialStarter");
    vesting = await Vesting.deploy();
    vestingAddress = await vesting.getAddress();

    const latest = await ethers.provider.getBlock("latest");
    start = Number(latest!.timestamp) + 10;

    await vesting.initialize(alice.address, start, 100);
    await token.connect(deployer).mintPlain(vestingAddress, 100);
  });

  async function decryptBalance(user: any): Promise<bigint> {
    const handle = await token.confidentialBalanceOf(user.address);
    return fhevm.userDecryptEuint(FhevmType.euint64, handle, tokenAddress, user);
  }

  it("should release over time", async function () {
    await ethers.provider.send("evm_setNextBlockTimestamp", [start + 50]);
    await vesting.connect(deployer).release(tokenAddress);
    expect(await decryptBalance(alice)).to.equal(50n);

    await ethers.provider.send("evm_setNextBlockTimestamp", [start + 100]);
    await vesting.connect(deployer).release(tokenAddress);
    expect(await decryptBalance(alice)).to.equal(100n);
  });
});
