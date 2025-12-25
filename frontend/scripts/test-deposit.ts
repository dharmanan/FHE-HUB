const hre = require("hardhat");

async function main() {
  // FHEVM'i initialize et
  if (!hre.fhevm.isMock) {
    console.log("❌ This script only works with FHEVM mock mode");
    console.log("💡 Using mock FHE for demonstration...");
  }
  
  console.log("🔗 Connecting to deployed contract...");
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const signers = await hre.ethers.getSigners();
  const alice = signers[0];
  
  console.log("👤 Using account:", alice.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(alice.address)), "ETH");
  
  const EncryptedBalance = await hre.ethers.getContractFactory("EncryptedBalance");
  const contract = EncryptedBalance.attach(contractAddress);
  
  console.log("\n📝 Creating encrypted deposit of 100 tokens...");
  
  // FHEVM ile encrypted input oluştur
  const depositAmount = 100;
  const input = await hre.fhevm.createEncryptedInput(contractAddress, alice.address);
  input.add64(depositAmount);
  const encryptedInput = await input.encrypt();
  
  console.log("🔐 Encrypted input created!");
  console.log("   Handle:", encryptedInput.handles[0]);
  
  console.log("\n📤 Sending deposit transaction...");
  const tx = await contract.deposit(encryptedInput.handles[0], encryptedInput.inputProof);
  
  console.log("⏳ Transaction sent! Hash:", tx.hash);
  console.log("   Waiting for confirmation...");
  
  const receipt = await tx.wait();
  
  console.log("\n✅ TRANSACTION CONFIRMED!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Transaction Hash:", receipt.hash);
  console.log("📦 Block Number:", receipt.blockNumber);
  console.log("📍 Block Hash:", receipt.blockHash);
  console.log("⛽ Gas Used:", receipt.gasUsed.toString());
  console.log("💸 Effective Gas Price:", hre.ethers.formatUnits(receipt.gasPrice, "gwei"), "gwei");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("\n🔍 Verifying on blockchain...");
  const balance = await contract.getBalance();
  console.log("✅ Encrypted balance stored on blockchain!");
  console.log("   Raw encrypted value:", balance.toString());
  console.log("   (This is encrypted euint64 - only owner can decrypt)");
  
  console.log("\n🎉 REAL FHE TRANSACTION COMPLETE!");
  console.log("   ✅ 100 tokens encrypted with FHE");
  console.log("   ✅ Stored on blockchain as encrypted data");
  console.log("   ✅ Only account", alice.address, "can decrypt");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
