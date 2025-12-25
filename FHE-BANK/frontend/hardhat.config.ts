import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin";

// Load gitignored local secrets first.
const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(THIS_DIR, ".env.local") });
// Then load .env if present (legacy).
dotenv.config();

const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SEPOLIA_ACCOUNTS = PRIVATE_KEY ? [PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: SEPOLIA_ACCOUNTS,
      chainId: 11155111,
      timeout: 120000,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
