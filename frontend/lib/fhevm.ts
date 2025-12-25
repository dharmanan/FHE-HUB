import type { TypedDataDomain, TypedDataField } from "ethers";
import { Contract, Signer, type InterfaceAbi } from "ethers";

type EncryptedInputBuilder = {
  add64: (value: number | bigint) => EncryptedInputBuilder;
  encrypt: () => Promise<{ handles: Uint8Array[]; inputProof: Uint8Array }>;
};

type FhevmInstance = {
  createEncryptedInput: (contractAddress: string, userAddress: string) => EncryptedInputBuilder;
  generateKeypair: () => { publicKey: string; privateKey: string };
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: string | number,
    durationDays: string | number,
    delegatedAccount?: string,
  ) => unknown;
  userDecrypt: (
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: string | number,
    durationDays: string | number,
  ) => Promise<Record<string, unknown>>;
};

let fhevmInstance: FhevmInstance | null = null;
let fhevmInstanceConfigKey: string | null = null;

function buildInstanceConfigKey(config: Record<string, unknown>): string {
  // Keep it stable + minimal; only include fields that affect proof validity.
  const relevant = {
    chainId: config.chainId,
    network: config.network,
    relayerUrl: config.relayerUrl,
    aclContractAddress: config.aclContractAddress,
    kmsContractAddress: config.kmsContractAddress,
    inputVerifierContractAddress: config.inputVerifierContractAddress,
  };
  return JSON.stringify(relevant);
}

function to0xHex(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return `0x${hex}`;
}

function bigintTo0x32(value: bigint): string {
  if (value < 0n) throw new Error("Encrypted handle must be >= 0");
  // euint* values are ABI-encoded as uint256; represent as a 32-byte hex string.
  return `0x${value.toString(16).padStart(64, "0")}`;
}

function normalize0xHex(value: string): string {
  return value.startsWith("0x") ? value : `0x${value}`;
}

type UserKeypair = { publicKey: string; privateKey: string };

function loadOrCreateUserKeypair(instance: FhevmInstance, userAddress?: string): UserKeypair {
  if (typeof window === "undefined") {
    throw new Error("FHEVM keypair requires a browser environment");
  }

  const normalizedAddress = (userAddress || "").trim().toLowerCase();
  const baseKey = "fhevm.userKeypair";
  const storageKey = normalizedAddress ? `${baseKey}.${normalizedAddress}` : baseKey;

  // Migration path: older builds stored a single keypair under `fhevm.userKeypair`.
  // If we have the old key but not the per-address key yet, copy it.
  if (storageKey !== baseKey) {
    const current = window.localStorage.getItem(storageKey);
    if (!current) {
      const legacy = window.localStorage.getItem(baseKey);
      if (legacy) {
        window.localStorage.setItem(storageKey, legacy);
      }
    }
  }

  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as Partial<UserKeypair>;
      if (typeof parsed.publicKey === "string" && typeof parsed.privateKey === "string") {
        return { publicKey: parsed.publicKey, privateKey: parsed.privateKey };
      }
    } catch {
      // ignore corrupted storage
    }
  }

  const keypair = instance.generateKeypair();
  window.localStorage.setItem(storageKey, JSON.stringify(keypair));
  return keypair;
}

export async function getFhevmInstance(): Promise<FhevmInstance> {
  // In Next.js dev (HMR), module state can persist across edits while env vars change.
  // If the SDK instance is created with stale core addresses, on-chain verifyInput will revert.
  // So we cache only when the config key matches.

  // Important: @zama-fhe/relayer-sdk/web is browser-only (uses `self`, `window`, `navigator`).
  // Next.js may evaluate modules during SSR/prerender, so we dynamically import it.
  if (typeof window === "undefined") {
    throw new Error("FHEVM instance can only be initialized in the browser");
  }

  // Some relayer-sdk bundles expect a Node-like `global` (they do `global.fetch = ...`).
  // In browsers `global` is not defined, so we alias it to globalThis.
  const g = globalThis as unknown as { global?: unknown };
  if (g.global == null) {
    g.global = globalThis;
  }

  const { initSDK, createInstance, SepoliaConfig } = await import("@zama-fhe/relayer-sdk/web");

  // relayer-sdk@0.3.x: initSDK() needs explicit WASM locations when used in some bundlers.
  // We serve them from Next.js `public/` to keep the runtime resolution reliable.
  try {
    await initSDK({
      tfheParams: "/tfhe_bg.wasm",
      kmsParams: "/kms_lib_bg.wasm",
      // If the page isn't crossOriginIsolated, thread init is disabled by the SDK.
    });
  } catch (error: unknown) {
    const isIsolated = typeof window !== "undefined" ? (window as unknown as { crossOriginIsolated?: boolean }).crossOriginIsolated : undefined;
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `FHEVM SDK init failed: ${message}. ` +
        `Make sure /tfhe_bg.wasm and /kms_lib_bg.wasm are reachable. ` +
        `crossOriginIsolated=${String(isIsolated)}`,
    );
  }

  // Per Zama relayer SDK docs: initialize with the provided network config.
  // We use SepoliaConfig by default and allow overrides through NEXT_PUBLIC env vars.
  const config = {
    ...SepoliaConfig,
    network: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || SepoliaConfig.network,
    relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || SepoliaConfig.relayerUrl,
    // Some deployments may use different core contract addresses.
    // If encryption proofs are rejected on-chain (verifyCiphertext reverts),
    // these overrides allow matching the addresses expected by the host chain.
    aclContractAddress:
      process.env.NEXT_PUBLIC_FHEVM_ACL_CONTRACT_ADDRESS || SepoliaConfig.aclContractAddress,
    kmsContractAddress:
      process.env.NEXT_PUBLIC_FHEVM_KMS_CONTRACT_ADDRESS || SepoliaConfig.kmsContractAddress,
    inputVerifierContractAddress:
      process.env.NEXT_PUBLIC_FHEVM_INPUT_VERIFIER_CONTRACT_ADDRESS ||
      SepoliaConfig.inputVerifierContractAddress,
  };

  const nextKey = buildInstanceConfigKey(config as unknown as Record<string, unknown>);
  if (fhevmInstance && fhevmInstanceConfigKey === nextKey) {
    return fhevmInstance;
  }

  fhevmInstance = await createInstance(config);
  fhevmInstanceConfigKey = nextKey;
  return fhevmInstance;
}

export async function getContract(
  signer: Signer,
  contractAddress: string,
  contractAbi: InterfaceAbi,
): Promise<Contract> {
  return new Contract(contractAddress, contractAbi, signer);
}

type Eip712TypedData = {
  domain: TypedDataDomain;
  types: Record<string, TypedDataField[]>;
  message: Record<string, unknown>;
};

export async function encryptValue(
  value: number | bigint,
  userAddress: string,
  contractAddress: string,
): Promise<{ handle: string; inputProof: string }> {
  const instance = await getFhevmInstance();
  const encryptedInput = instance.createEncryptedInput(contractAddress, userAddress);
  // We encode amounts as 64-bit integers. Callers may pass bigint (recommended) or number.
  encryptedInput.add64(value);
  const result = await encryptedInput.encrypt();

  // For this dapp we pack a single value -> handle[0]
  const handle = to0xHex(result.handles[0]);
  const inputProof = to0xHex(result.inputProof);
  return { handle, inputProof };
}

export async function decryptHandle(
  handle: string | bigint,
  signer: Signer,
  userAddress: string,
  contractAddress: string,
): Promise<bigint> {
  const [value] = await decryptHandles([handle], signer, userAddress, contractAddress);
  return value;
}

export async function decryptHandles(
  handles: Array<string | bigint>,
  signer: Signer,
  userAddress: string,
  contractAddress: string,
): Promise<bigint[]> {
  const instance = await getFhevmInstance();

  const normalizedHandles = handles.map((h) =>
    typeof h === "bigint" ? bigintTo0x32(h) : normalize0xHex(h),
  );

  const keypair = loadOrCreateUserKeypair(instance, userAddress);
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 7;

  const typedData = instance.createEIP712(
    keypair.publicKey,
    [contractAddress],
    startTimestamp,
    durationDays,
  ) as unknown as Eip712TypedData;

  // ethers v6 expects `types` WITHOUT the EIP712Domain definition.
  const messageTypes: Record<string, TypedDataField[]> = { ...typedData.types };
  delete messageTypes.EIP712Domain;

  const signature = await signer.signTypedData(typedData.domain, messageTypes, typedData.message);

  const results = await instance.userDecrypt(
    normalizedHandles.map((h) => ({ handle: h, contractAddress })),
    keypair.privateKey,
    keypair.publicKey,
    signature,
    [contractAddress],
    userAddress,
    startTimestamp,
    durationDays,
  );

  return normalizedHandles.map((h) => {
    const normalized = h.toLowerCase();
    const direct = results[normalized as keyof typeof results];
    if (direct != null) return BigInt(direct as unknown as bigint);
    throw new Error(`Decryption returned no value for handle ${h}`);
  });
}

export async function decryptBool(
  handle: string | bigint,
  signer: Signer,
  userAddress: string,
  contractAddress: string,
): Promise<boolean> {
  const value = await decryptHandle(handle, signer, userAddress, contractAddress);
  return value !== 0n;
}

