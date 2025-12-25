// eslint-disable-next-line @typescript-eslint/no-var-requires
const hre = require("hardhat");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createInstance, SepoliaConfig } = require("@zama-fhe/relayer-sdk/node");

async function main() {
  if (hre.fhevm && typeof hre.fhevm.initializeCLIApi === "function") {
    await hre.fhevm.initializeCLIApi();
  }

  const { ethers } = hre;
  const [signer] = await ethers.getSigners();

  const tokenAddress = process.env.NEXT_PUBLIC_PRIVATE_ZAMA_TOKEN_ADDRESS;
  if (!tokenAddress) throw new Error("Missing NEXT_PUBLIC_PRIVATE_ZAMA_TOKEN_ADDRESS");

  const cfg = {
    ...SepoliaConfig,
    network: process.env.SEPOLIA_RPC_URL || SepoliaConfig.network,
    relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || SepoliaConfig.relayerUrl,
    aclContractAddress:
      process.env.NEXT_PUBLIC_FHEVM_ACL_CONTRACT_ADDRESS || SepoliaConfig.aclContractAddress,
    kmsContractAddress:
      process.env.NEXT_PUBLIC_FHEVM_KMS_CONTRACT_ADDRESS || SepoliaConfig.kmsContractAddress,
    inputVerifierContractAddress:
      process.env.NEXT_PUBLIC_FHEVM_INPUT_VERIFIER_CONTRACT_ADDRESS ||
      SepoliaConfig.inputVerifierContractAddress,
  };

  console.log("Signer:", signer.address);
  console.log("PrivateZamaToken:", tokenAddress);
  console.log("Relayer cfg:", {
    network: cfg.network,
    relayerUrl: cfg.relayerUrl,
    acl: cfg.aclContractAddress,
    kms: cfg.kmsContractAddress,
    inputVerifier: cfg.inputVerifierContractAddress,
  });

  const instance = await createInstance(cfg);

  const input = instance.createEncryptedInput(tokenAddress, signer.address);
  input.add64(1n);
  const enc = await input.encrypt();
  const handle = `0x${Buffer.from(enc.handles[0]).toString("hex")}`;
  const proof = `0x${Buffer.from(enc.inputProof).toString("hex")}`;
  console.log("Encrypted input:", { handleLen: handle.length, proofLen: proof.length });

  const Token = await ethers.getContractFactory("PrivateZamaToken");
  const token = Token.attach(tokenAddress).connect(signer);

  console.log("Sending faucet tx...");
  const tx = await token.faucet(handle, proof, { gasLimit: 3_000_000 });
  console.log("Tx:", tx.hash);
  const receipt = await tx.wait();
  console.log("Receipt status:", receipt.status);
  console.log("Gas used:", receipt.gasUsed.toString());
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
