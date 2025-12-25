// Hardhat runtime is CommonJS; keep this script CJS-compatible.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const hre = require("hardhat");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

const { ethers } = hre;

function readExistingDeployments(): Record<string, unknown> {
  try {
    const deploymentsPath = path.join(__dirname, "../lib/deployments.json");
    if (!fs.existsSync(deploymentsPath)) return {};
    const raw = fs.readFileSync(deploymentsPath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getDeploymentsAddress(existing: Record<string, unknown>, key: string): string | undefined {
  const v = existing[key];
  if (!v || typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  if (!ethers.isAddress(trimmed)) return undefined;
  return trimmed;
}

function explorerLink(chainId: string, address: string): string {
  // Only used for display in a Markdown file.
  if (chainId === "11155111") {
    return `https://sepolia.etherscan.io/address/${address}`;
  }
  return `https://etherscan.io/address/${address}`;
}

function renderDeploymentsMarkdown(info: {
  network: string;
  chainId: string;
  timestamp: string;
  deployer: string;
  balanceAddress: string;
  privateZamaTokenAddress: string;
  zamaTokenAddress: string;
  zamaVaultAddress: string;
  collateralAddress: string;
}): string {
  const lines: string[] = [];
  lines.push("# Deployments (Auto-generated)");
  lines.push("");
  lines.push("> This file is updated automatically by `frontend/scripts/deploy-fhevm-sepolia.ts`.");
  lines.push("> Do not edit manually.");
  lines.push("");
  lines.push("## Latest");
  lines.push("");
  lines.push(`- Network: ${info.network}`);
  lines.push(`- Chain ID: ${info.chainId}`);
  lines.push(`- Timestamp: ${info.timestamp}`);
  lines.push(`- Deployer: ${info.deployer}`);
  lines.push("");
  lines.push("## Contracts");
  lines.push("");
  lines.push("| Name | Address | Explorer |");
  lines.push("| --- | --- | --- |");
  const row = (name: string, address: string) =>
    `| ${name} | ${address} | ${explorerLink(info.chainId, address)} |`;
  lines.push(row("EncryptedBalance", info.balanceAddress));
  lines.push(row("PrivateZamaToken (pZAMA)", info.privateZamaTokenAddress));
  lines.push(row("ZamaToken", info.zamaTokenAddress));
  lines.push(row("EncryptedERC20Vault", info.zamaVaultAddress));
  lines.push(row("EncryptedCollateral", info.collateralAddress));
  lines.push("");
  lines.push("## Source of truth");
  lines.push("");
  lines.push("- `frontend/lib/deployments.json` (machine-readable)");
  lines.push("- `frontend/DEPLOYMENTS.md` (human-readable)");
  lines.push("");
  return lines.join("\n");
}

function getEnvAddress(key) {
  const v = process.env[key];
  if (!v || typeof v !== "string") return undefined;
  const trimmed = v.trim();
  if (!trimmed) return undefined;
  if (!ethers.isAddress(trimmed)) return undefined;
  return trimmed;
}

function truthyEnv(key: string): boolean {
  const v = process.env[key];
  if (!v) return false;
  const normalized = String(v).trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "y";
}

function upsertEnvVar(envText: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(envText)) return envText.replace(re, line);
  // Append at end (keep a trailing newline)
  const suffix = envText.endsWith("\n") ? "" : "\n";
  return `${envText}${suffix}${line}\n`;
}

async function main() {
  console.log("Deploying to FHEVM Sepolia Testnet...");

  const existingDeployments = readExistingDeployments();

  // The fhevm hardhat plugin lazily initializes some internals that are used
  // by its provider wrapper when estimating gas / mutating errors.
  // If we don't initialize it, a failing estimateGas can be masked by:
  // "HardhatFhevmError: The Hardhat Fhevm plugin is not initialized."
  if (hre.fhevm && typeof hre.fhevm.initializeCLIApi === "function") {
    console.log("Initializing FHEVM Hardhat plugin...");
    await hre.fhevm.initializeCLIApi();
    console.log("FHEVM Hardhat plugin initialized.");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Nonce management: public RPCs can easily get out of sync ("nonce too low" / "replacement underpriced")
  // if there are pending txs or parallel deploy attempts. We pin nonces explicitly.
  let nextNonce;
  try {
    nextNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
  } catch {
    nextNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  }
  console.log("Starting nonce:", nextNonce);

  // Deploy / reuse EncryptedBalance
  const forceRedeployBalance = truthyEnv("FORCE_REDEPLOY_BALANCE");
  let balanceAddress =
    getDeploymentsAddress(existingDeployments, "balanceAddress") ||
    getEnvAddress("NEXT_PUBLIC_BALANCE_CONTRACT_ADDRESS") ||
    getEnvAddress("NEXT_PUBLIC_CONTRACT_ADDRESS");
  if (balanceAddress && !forceRedeployBalance) {
    console.log("\nUsing existing EncryptedBalance:", balanceAddress);
  } else {
    console.log(`\nDeploying EncryptedBalance${forceRedeployBalance ? " (forced redeploy)" : ""}...`);
    const EncryptedBalance = await ethers.getContractFactory("EncryptedBalance");
    const encryptedBalance = await EncryptedBalance.deploy({ nonce: nextNonce++ });
    await encryptedBalance.waitForDeployment();
    balanceAddress = await encryptedBalance.getAddress();
    console.log("EncryptedBalance deployed to:", balanceAddress);
  }

  // Deploy / reuse PrivateZamaToken (FHE-native private token)
  const forceRedeployPrivateToken = truthyEnv("FORCE_REDEPLOY_PRIVATE_ZAMA_TOKEN");
  let privateZamaTokenAddress =
    getDeploymentsAddress(existingDeployments, "privateZamaTokenAddress") ||
    getEnvAddress("NEXT_PUBLIC_PRIVATE_ZAMA_TOKEN_ADDRESS");
  if (privateZamaTokenAddress && !forceRedeployPrivateToken) {
    console.log("\nUsing existing PrivateZamaToken:", privateZamaTokenAddress);
  } else {
    console.log(`\nDeploying PrivateZamaToken${forceRedeployPrivateToken ? " (forced redeploy)" : ""}...`);
    const PrivateZamaToken = await ethers.getContractFactory("PrivateZamaToken");
    const privateZamaToken = await PrivateZamaToken.deploy({ nonce: nextNonce++ });
    await privateZamaToken.waitForDeployment();
    privateZamaTokenAddress = await privateZamaToken.getAddress();
    console.log("PrivateZamaToken deployed to:", privateZamaTokenAddress);
  }

  // Deploy / reuse ZamaToken
  let zamaTokenAddress =
    getDeploymentsAddress(existingDeployments, "zamaTokenAddress") ||
    getEnvAddress("NEXT_PUBLIC_ZAMA_TOKEN_ADDRESS");
  if (zamaTokenAddress) {
    console.log("\nUsing existing ZamaToken:", zamaTokenAddress);
  } else {
    console.log("\nDeploying ZamaToken...");
    const ZamaToken = await ethers.getContractFactory("ZamaToken");
    const zamaToken = await ZamaToken.deploy({ nonce: nextNonce++ });
    await zamaToken.waitForDeployment();
    zamaTokenAddress = await zamaToken.getAddress();
    console.log("ZamaToken deployed to:", zamaTokenAddress);
  }

  // Deploy / reuse EncryptedERC20Vault
  let zamaVaultAddress =
    getDeploymentsAddress(existingDeployments, "zamaVaultAddress") ||
    getEnvAddress("NEXT_PUBLIC_ZAMA_VAULT_ADDRESS");
  if (zamaVaultAddress) {
    console.log("\nUsing existing EncryptedERC20Vault:", zamaVaultAddress);
  } else {
    console.log("\nDeploying EncryptedERC20Vault...");
    const Vault = await ethers.getContractFactory("EncryptedERC20Vault");
    const vault = await Vault.deploy(zamaTokenAddress, { nonce: nextNonce++ });
    await vault.waitForDeployment();
    zamaVaultAddress = await vault.getAddress();
    console.log("EncryptedERC20Vault deployed to:", zamaVaultAddress);
  }

  // Deploy EncryptedCollateral contract
  const forceRedeployCollateral = truthyEnv("FORCE_REDEPLOY_COLLATERAL");
  let collateralAddress =
    getDeploymentsAddress(existingDeployments, "collateralAddress") ||
    getEnvAddress("NEXT_PUBLIC_COLLATERAL_CONTRACT_ADDRESS");
  if (collateralAddress && !forceRedeployCollateral) {
    console.log("\nUsing existing EncryptedCollateral:", collateralAddress);
  } else {
    console.log(`\nDeploying EncryptedCollateral${forceRedeployCollateral ? " (forced redeploy)" : ""}...`);
    const EncryptedCollateral = await ethers.getContractFactory("EncryptedCollateral");
    const encryptedCollateral = await EncryptedCollateral.deploy({ nonce: nextNonce++ });
    await encryptedCollateral.waitForDeployment();
    collateralAddress = await encryptedCollateral.getAddress();
    console.log("EncryptedCollateral deployed to:", collateralAddress);
  }

  // Save deployment info
  const deploymentInfo = {
    network: "fhevmSepolia",
    balanceAddress,
    privateZamaTokenAddress,
    zamaTokenAddress,
    zamaVaultAddress,
    collateralAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
  };

  // Write a non-secret deployment summary that can be committed.
  try {
    const deploymentsPath = path.join(__dirname, "../lib/deployments.json");
    fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2) + "\n");
    console.log("Wrote frontend/lib/deployments.json");
  } catch (e) {
    console.warn("Warning: failed to write frontend/lib/deployments.json:", e);
  }

  // Write a non-secret, human-readable deployment summary.
  try {
    const mdPath = path.join(__dirname, "../DEPLOYMENTS.md");
    fs.writeFileSync(mdPath, renderDeploymentsMarkdown(deploymentInfo), "utf8");
    console.log("Wrote frontend/DEPLOYMENTS.md");
  } catch (e) {
    console.warn("Warning: failed to write frontend/DEPLOYMENTS.md:", e);
  }

  console.log("\n=== Deployment Info ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("========================\n");

  console.log("\n=== Frontend env vars ===");
  console.log(`NEXT_PUBLIC_BALANCE_CONTRACT_ADDRESS=${balanceAddress}`);
  console.log(`NEXT_PUBLIC_PRIVATE_ZAMA_TOKEN_ADDRESS=${privateZamaTokenAddress}`);
  console.log(`NEXT_PUBLIC_ZAMA_TOKEN_ADDRESS=${zamaTokenAddress}`);
  console.log(`NEXT_PUBLIC_ZAMA_VAULT_ADDRESS=${zamaVaultAddress}`);
  console.log(`NEXT_PUBLIC_COLLATERAL_CONTRACT_ADDRESS=${collateralAddress}`);
  console.log("=========================\n");

  // Address source-of-truth: frontend/lib/deployments.json (safe to commit).
  // Keep frontend/.env.local secrets-only by default (e.g. PRIVATE_KEY).
  // If you *really* want to also write NEXT_PUBLIC_* addresses into .env.local, opt-in via UPDATE_ENV_LOCAL=1.
  if (truthyEnv("UPDATE_ENV_LOCAL")) {
    try {
      const envPath = path.join(__dirname, "../.env.local");
      const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
      let updated = existing;
      updated = upsertEnvVar(updated, "NEXT_PUBLIC_BALANCE_CONTRACT_ADDRESS", balanceAddress);
      updated = upsertEnvVar(updated, "NEXT_PUBLIC_PRIVATE_ZAMA_TOKEN_ADDRESS", privateZamaTokenAddress);
      updated = upsertEnvVar(updated, "NEXT_PUBLIC_ZAMA_TOKEN_ADDRESS", zamaTokenAddress);
      updated = upsertEnvVar(updated, "NEXT_PUBLIC_ZAMA_VAULT_ADDRESS", zamaVaultAddress);
      updated = upsertEnvVar(updated, "NEXT_PUBLIC_COLLATERAL_CONTRACT_ADDRESS", collateralAddress);
      // Keep legacy var aligned
      updated = upsertEnvVar(updated, "NEXT_PUBLIC_CONTRACT_ADDRESS", balanceAddress);
      fs.writeFileSync(envPath, updated, "utf8");
      console.log("Updated frontend/.env.local with deployed addresses (UPDATE_ENV_LOCAL=1).");
    } catch (e) {
      console.warn("Warning: failed to update frontend/.env.local:", e);
    }
  } else {
    console.log("Skipped updating frontend/.env.local (UPDATE_ENV_LOCAL not set). Using frontend/lib/deployments.json.");
  }

  // Verify gateway configuration
  console.log("\n=== Gateway Configuration ===");
  console.log("Make sure your FHEVM plugin is properly configured with the gateway.");
  console.log("Gateway URL should be set in your environment or hardhat config.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
