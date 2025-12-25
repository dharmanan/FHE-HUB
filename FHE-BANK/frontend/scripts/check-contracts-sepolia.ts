// eslint-disable-next-line @typescript-eslint/no-var-requires
const hre = require("hardhat");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const deployments = require("../lib/deployments.json");

async function main() {
  if (hre.fhevm && typeof hre.fhevm.initializeCLIApi === "function") {
    await hre.fhevm.initializeCLIApi();
  }

  const { ethers } = hre;
  const [signer] = await ethers.getSigners();

  // Prefer committed, non-secret deployment addresses.
  // Env vars are fallback only (useful for ad-hoc testing).
  const balanceAddress = deployments.balanceAddress || process.env.NEXT_PUBLIC_BALANCE_CONTRACT_ADDRESS;
  const privateTokenAddress =
    deployments.privateZamaTokenAddress || process.env.NEXT_PUBLIC_PRIVATE_ZAMA_TOKEN_ADDRESS;
  const tokenAddress = deployments.zamaTokenAddress || process.env.NEXT_PUBLIC_ZAMA_TOKEN_ADDRESS;
  const vaultAddress = deployments.zamaVaultAddress || process.env.NEXT_PUBLIC_ZAMA_VAULT_ADDRESS;
  const collateralAddress = deployments.collateralAddress || process.env.NEXT_PUBLIC_COLLATERAL_CONTRACT_ADDRESS;

  console.log("Signer:", signer.address);
  console.log("Balance:", balanceAddress);
  console.log("PrivateToken:", privateTokenAddress);
  console.log("Token:", tokenAddress);
  console.log("Vault:", vaultAddress);
  console.log("Collateral:", collateralAddress);

  if (balanceAddress) {
    const Balance = await ethers.getContractFactory("EncryptedBalance");
    const balance = Balance.attach(balanceAddress);
    try {
      await balance.getBalance.staticCall();
      console.log("✅ EncryptedBalance.getBalance() staticCall OK");
    } catch (e) {
      console.log("❌ EncryptedBalance.getBalance() staticCall FAILED", e);
    }
  }

  if (privateTokenAddress) {
    const PrivateToken = await ethers.getContractFactory("PrivateZamaToken");
    const token = PrivateToken.attach(privateTokenAddress);
    try {
      const n = await token.name.staticCall();
      await token.getBalance.staticCall();
      console.log("✅ PrivateZamaToken OK:", n);
    } catch (e) {
      console.log("❌ PrivateZamaToken FAILED", e);
    }
  }

  if (tokenAddress) {
    const Token = await ethers.getContractFactory("ZamaToken");
    const token = Token.attach(tokenAddress);
    try {
      const bal = await token.balanceOf.staticCall(signer.address);
      console.log("✅ ZamaToken.balanceOf OK:", bal.toString());
    } catch (e) {
      console.log("❌ ZamaToken.balanceOf FAILED", e);
    }
  }

  if (vaultAddress) {
    const Vault = await ethers.getContractFactory("EncryptedERC20Vault");
    const vault = Vault.attach(vaultAddress);
    try {
      await vault.getBalance.staticCall();
      console.log("✅ EncryptedERC20Vault.getBalance() staticCall OK");
    } catch (e) {
      console.log("❌ EncryptedERC20Vault.getBalance() staticCall FAILED", e);
    }
  }

  if (collateralAddress) {
    const Collateral = await ethers.getContractFactory("EncryptedCollateral");
    const collateral = Collateral.attach(collateralAddress);
    try {
      const input = await hre.fhevm.createEncryptedInput(collateralAddress, signer.address);
      input.add64(1);
      const encrypted = await input.encrypt();
      await collateral.depositCollateral.staticCall(encrypted.handles[0], encrypted.inputProof);
      console.log("✅ EncryptedCollateral.depositCollateral() staticCall OK");
    } catch (e) {
      console.log("❌ EncryptedCollateral.depositCollateral() staticCall FAILED", e);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
