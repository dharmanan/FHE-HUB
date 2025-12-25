// For the relayer SDK, the host chain is Sepolia on testnet.
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");

// Non-secret defaults for demo deployments.
// These are safe to commit (they're public on-chain addresses).
import defaultBalanceContract from "./contract.json";
import deployments from "./deployments.json";

// Contract addresses (env-first).
// NOTE: Don't default to a Hardhat local address when running on Sepolia.
// If no env var is provided for a non-local chain, keep it empty so the UI can
// surface a clear configuration error instead of calling an EOA / empty address.
const DEFAULT_HARDHAT_BALANCE_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const DEFAULT_SEPOLIA_BALANCE_ADDRESS =
	(typeof defaultBalanceContract?.address === "string" && defaultBalanceContract.address.trim()) ||
	"";

const DEFAULT_BALANCE_ADDRESS_FROM_DEPLOYMENTS =
	(typeof (deployments as unknown as { balanceAddress?: string }).balanceAddress === "string" &&
		(deployments as unknown as { balanceAddress?: string }).balanceAddress!.trim()) ||
	"";

const DEFAULT_COLLATERAL_ADDRESS_FROM_DEPLOYMENTS =
	(typeof (deployments as unknown as { collateralAddress?: string }).collateralAddress === "string" &&
		(deployments as unknown as { collateralAddress?: string }).collateralAddress!.trim()) ||
	"";

const DEFAULT_PRIVATE_ZAMA_TOKEN_ADDRESS_FROM_DEPLOYMENTS =
	(typeof (deployments as unknown as { privateZamaTokenAddress?: string }).privateZamaTokenAddress === "string" &&
		(deployments as unknown as { privateZamaTokenAddress?: string }).privateZamaTokenAddress!.trim()) ||
	"";

const DEFAULT_ZAMA_TOKEN_ADDRESS_FROM_DEPLOYMENTS =
	(typeof (deployments as unknown as { zamaTokenAddress?: string }).zamaTokenAddress === "string" &&
		(deployments as unknown as { zamaTokenAddress?: string }).zamaTokenAddress!.trim()) ||
	"";

const DEFAULT_ZAMA_VAULT_ADDRESS_FROM_DEPLOYMENTS =
	(typeof (deployments as unknown as { zamaVaultAddress?: string }).zamaVaultAddress === "string" &&
		(deployments as unknown as { zamaVaultAddress?: string }).zamaVaultAddress!.trim()) ||
	"";

export const BALANCE_CONTRACT_ADDRESS =
	CHAIN_ID === 31337
		? process.env.NEXT_PUBLIC_BALANCE_CONTRACT_ADDRESS ||
			process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
			DEFAULT_HARDHAT_BALANCE_ADDRESS
		: DEFAULT_BALANCE_ADDRESS_FROM_DEPLOYMENTS ||
			process.env.NEXT_PUBLIC_BALANCE_CONTRACT_ADDRESS ||
			process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
			DEFAULT_SEPOLIA_BALANCE_ADDRESS;

export const COLLATERAL_CONTRACT_ADDRESS =
	DEFAULT_COLLATERAL_ADDRESS_FROM_DEPLOYMENTS ||
	process.env.NEXT_PUBLIC_COLLATERAL_CONTRACT_ADDRESS ||
	"";

export const ZAMA_TOKEN_ADDRESS =
	DEFAULT_ZAMA_TOKEN_ADDRESS_FROM_DEPLOYMENTS || process.env.NEXT_PUBLIC_ZAMA_TOKEN_ADDRESS || "";

export const ZAMA_VAULT_ADDRESS =
	DEFAULT_ZAMA_VAULT_ADDRESS_FROM_DEPLOYMENTS || process.env.NEXT_PUBLIC_ZAMA_VAULT_ADDRESS || "";

export const PRIVATE_ZAMA_TOKEN_ADDRESS =
	DEFAULT_PRIVATE_ZAMA_TOKEN_ADDRESS_FROM_DEPLOYMENTS ||
	process.env.NEXT_PUBLIC_PRIVATE_ZAMA_TOKEN_ADDRESS ||
	"";

// Import ABIs
import balanceAbi from "./abi/EncryptedBalance.json";
import collateralAbi from "./abi/EncryptedCollateral.json";
import zamaTokenAbi from "./abi/ZamaToken.json";
import zamaVaultAbi from "./abi/EncryptedERC20Vault.json";
import privateZamaTokenAbi from "./abi/PrivateZamaToken.json";

export const BALANCE_CONTRACT_ABI = balanceAbi.abi;
export const COLLATERAL_CONTRACT_ABI = collateralAbi.abi;

export const ZAMA_TOKEN_ABI = zamaTokenAbi.abi;
export const ZAMA_VAULT_ABI = zamaVaultAbi.abi;

export const PRIVATE_ZAMA_TOKEN_ABI = privateZamaTokenAbi.abi;
