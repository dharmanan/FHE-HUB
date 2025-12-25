const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying contracts (localhost)...");

  const EncryptedBalance = await hre.ethers.getContractFactory("EncryptedBalance");
  const balance = await EncryptedBalance.deploy();
  await balance.waitForDeployment();
  const balanceAddress = await balance.getAddress();
  console.log("EncryptedBalance deployed to:", balanceAddress);

  const EncryptedCollateral = await hre.ethers.getContractFactory("EncryptedCollateral");
  const collateral = await EncryptedCollateral.deploy();
  await collateral.waitForDeployment();
  const collateralAddress = await collateral.getAddress();
  console.log("EncryptedCollateral deployed to:", collateralAddress);

  // Save addresses (optional convenience)
  const deploymentInfo = {
    network: hre.network.name,
    balanceAddress,
    collateralAddress,
    timestamp: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "../lib/deployments.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n=== Frontend env vars ===");
  console.log(`NEXT_PUBLIC_BALANCE_CONTRACT_ADDRESS=${balanceAddress}`);
  console.log(`NEXT_PUBLIC_COLLATERAL_CONTRACT_ADDRESS=${collateralAddress}`);
  console.log("=========================\n");

  console.log("Saved deployment addresses to lib/deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
