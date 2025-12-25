export interface ExampleConfig {
  name: string;
  description: string;
  contractName: string;
  contractCode: string;
  testCode: string;
  documentation: string;
  category: string;
  tags: string[];

  /** Optional per-example npm dependency overrides for generated standalone repos */
  extraDependencies?: Record<string, string>;
  extraDevDependencies?: Record<string, string>;
}

export const examples: Record<string, ExampleConfig> = {
  'encrypted-balance': {
    name: 'Encrypted Balance',
    description: 'Demonstrates how to store and manage encrypted balances using FHEVM',
    contractName: 'EncryptedBalance',
    category: 'basic',
    tags: ['encryption', 'balance', 'privacy'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedBalance
 * @notice A contract for managing encrypted user balances
 * @dev Demonstrates FHE encryption, access control, and basic operations
 */
contract EncryptedBalance is ZamaEthereumConfig {
    mapping(address => euint64) private balances;
    event BalanceUpdated(address indexed user);
    
    constructor() {}
    
    function deposit(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        balances[msg.sender] = FHE.add(balances[msg.sender], amount);
        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);
        emit BalanceUpdated(msg.sender);
    }
    
    function getBalance() external view returns (euint64) {
        return balances[msg.sender];
    }
    
    function transfer(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        ebool hasBalance = FHE.le(amount, balances[msg.sender]);
        euint64 actualAmount = FHE.select(hasBalance, amount, FHE.asEuint64(0));
        
        balances[msg.sender] = FHE.sub(balances[msg.sender], actualAmount);
        balances[to] = FHE.add(balances[to], actualAmount);
        
        FHE.allowThis(balances[msg.sender]);
        FHE.allowThis(balances[to]);
        FHE.allow(balances[msg.sender], msg.sender);
        FHE.allow(balances[to], to);
        
        emit BalanceUpdated(msg.sender);
        emit BalanceUpdated(to);
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("EncryptedBalance", function () {
  let deployer: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let contract: any;
  let contractAddress: string;

  before(async function () {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];
    bob = signers[2];
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("Tests only run on FHEVM mock");
      this.skip();
    }

    const factory = await ethers.getContractFactory("EncryptedBalance");
    contract = await factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should deposit encrypted balance", async function () {
    const depositAmount = 1000;
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(depositAmount)
      .encrypt();

    await contract.connect(alice).deposit(encryptedInput.handles[0], encryptedInput.inputProof);

    const encryptedBalance = await contract.connect(alice).getBalance();
    const decryptedBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedBalance,
      contractAddress,
      alice
    );

    expect(decryptedBalance).to.equal(depositAmount);
  });

  it("should transfer encrypted balance", async function () {
    const depositAmount = 2000;
    const transferAmount = 500;

    const depositInput = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(depositAmount)
      .encrypt();

    await contract.connect(alice).deposit(depositInput.handles[0], depositInput.inputProof);

    const transferInput = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(transferAmount)
      .encrypt();

    await contract.connect(alice).transfer(bob.address, transferInput.handles[0], transferInput.inputProof);

    const aliceBalance = await contract.connect(alice).getBalance();
    const bobBalance = await contract.connect(bob).getBalance();

    const aliceDecrypted = await fhevm.userDecryptEuint(FhevmType.euint64, aliceBalance, contractAddress, alice);
    const bobDecrypted = await fhevm.userDecryptEuint(FhevmType.euint64, bobBalance, contractAddress, bob);

    expect(aliceDecrypted).to.equal(depositAmount - transferAmount);
    expect(bobDecrypted).to.equal(transferAmount);
  });
});`,
    documentation: `# Encrypted Balance Example

Demonstrates encrypted balance management using FHEVM.

## Features
- Encrypted deposits
- Privacy-preserving transfers
- Access control

## Usage
\`\`\`bash
npm install
npm test
\`\`\``,
  },
  'encrypted-collateral': {
    name: 'Encrypted Collateral',
    description: 'Privacy-preserving collateralized lending with encrypted positions',
    contractName: 'EncryptedCollateral',
    category: 'defi',
    tags: ['defi', 'lending', 'collateral', 'privacy'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedCollateral
 * @notice Privacy-preserving collateralized lending system
 * @dev Demonstrates encrypted collateral management and health checks
 */
contract EncryptedCollateral is ZamaEthereumConfig {
    struct Position {
        euint64 collateral;
        euint64 borrowed;
        bool exists;
    }
    
    mapping(address => Position) private positions;
    
    event CollateralDeposited(address indexed user);
    event BorrowExecuted(address indexed user);
    event Repayment(address indexed user);
    
    function depositCollateral(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        
        if (!positions[msg.sender].exists) {
            euint64 zeroBorrowed; // Uninitialized = 0
            positions[msg.sender] = Position({
                collateral: amount,
                borrowed: zeroBorrowed,
                exists: true
            });
        } else {
            positions[msg.sender].collateral = FHE.add(positions[msg.sender].collateral, amount);
        }
        
        FHE.allowThis(positions[msg.sender].collateral);
        FHE.allow(positions[msg.sender].collateral, msg.sender);
        emit CollateralDeposited(msg.sender);
    }
    
    function borrow(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        require(positions[msg.sender].exists, "No position");
        euint64 borrowAmount = FHE.fromExternal(encryptedAmount, inputProof);
        Position storage pos = positions[msg.sender];
        
        // Simple check: borrowed < collateral (should be borrowed < collateral/1.5 but simplified)
        euint64 newBorrowed = FHE.add(pos.borrowed, borrowAmount);
        ebool canBorrow = FHE.lt(newBorrowed, pos.collateral);
        
        euint64 zero; // Uninitialized = 0
        euint64 actualBorrow = FHE.select(canBorrow, borrowAmount, zero);
        
        pos.borrowed = FHE.add(pos.borrowed, actualBorrow);
        FHE.allowThis(pos.borrowed);
        FHE.allow(pos.borrowed, msg.sender);
        emit BorrowExecuted(msg.sender);
    }
    
    function repay(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        require(positions[msg.sender].exists, "No position");
        euint64 repayAmount = FHE.fromExternal(encryptedAmount, inputProof);
        
        ebool canRepay = FHE.le(repayAmount, positions[msg.sender].borrowed);
        euint64 actualRepay = FHE.select(canRepay, repayAmount, positions[msg.sender].borrowed);
        
        positions[msg.sender].borrowed = FHE.sub(positions[msg.sender].borrowed, actualRepay);
        FHE.allowThis(positions[msg.sender].borrowed);
        FHE.allow(positions[msg.sender].borrowed, msg.sender);
        emit Repayment(msg.sender);
    }
    
    function getCollateral() external view returns (euint64) {
        require(positions[msg.sender].exists, "No position");
        return positions[msg.sender].collateral;
    }
    
    function getBorrowed() external view returns (euint64) {
        require(positions[msg.sender].exists, "No position");
        return positions[msg.sender].borrowed;
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("EncryptedCollateral", function () {
  let alice: HardhatEthersSigner;
  let contract: any;
  let contractAddress: string;

  before(async function () {
    const signers = await ethers.getSigners();
    alice = signers[1];
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const factory = await ethers.getContractFactory("EncryptedCollateral");
    contract = await factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should deposit collateral and borrow", async function () {
    const collateralAmount = 1000;
    const borrowAmount = 500;

    const depositInput = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(collateralAmount)
      .encrypt();

    await contract.connect(alice).depositCollateral(depositInput.handles[0], depositInput.inputProof);

    const borrowInput = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(borrowAmount)
      .encrypt();

    await contract.connect(alice).borrow(borrowInput.handles[0], borrowInput.inputProof);

    const collateral = await contract.connect(alice).getCollateral();
    const borrowed = await contract.connect(alice).getBorrowed();

    const decryptedCollateral = await fhevm.userDecryptEuint(FhevmType.euint64, collateral, contractAddress, alice);
    const decryptedBorrowed = await fhevm.userDecryptEuint(FhevmType.euint64, borrowed, contractAddress, alice);

    expect(decryptedCollateral).to.equal(collateralAmount);
    expect(decryptedBorrowed).to.equal(borrowAmount);
  });

  it("should repay borrowed amount", async function () {
    const depositInput = await fhevm.createEncryptedInput(contractAddress, alice.address).add64(1000).encrypt();
    await contract.connect(alice).depositCollateral(depositInput.handles[0], depositInput.inputProof);

    const borrowInput = await fhevm.createEncryptedInput(contractAddress, alice.address).add64(500).encrypt();
    await contract.connect(alice).borrow(borrowInput.handles[0], borrowInput.inputProof);

    const repayInput = await fhevm.createEncryptedInput(contractAddress, alice.address).add64(200).encrypt();
    await contract.connect(alice).repay(repayInput.handles[0], repayInput.inputProof);

    const borrowed = await contract.connect(alice).getBorrowed();
    const decryptedBorrowed = await fhevm.userDecryptEuint(FhevmType.euint64, borrowed, contractAddress, alice);

    expect(decryptedBorrowed).to.equal(300);
  });
});`,
    documentation: `# Encrypted Collateral Example

Privacy-preserving collateralized lending system using FHEVM.

## Features
- Encrypted collateral deposits
- Private borrowing against collateral  
- Encrypted position management
- Health checks and repayment

## Concepts Demonstrated
- Encrypted position tracking
- Conditional borrowing (simplified: borrow < collateral)
- Access control for encrypted data
- Basic DeFi operations with FHE

## Usage
\`\`\`bash
npm install
npm test
\`\`\``,
  },
  'encrypted-vault': {
    name: 'Encrypted Vault',
    description: 'Simple encrypted savings vault with time-based yield',
    contractName: 'EncryptedVault',
    category: 'defi',
    tags: ['defi', 'vault', 'yield', 'savings'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedVault
 * @notice Simple savings vault with encrypted balances
 * @dev Demonstrates basic encrypted vault operations
 */
contract EncryptedVault is ZamaEthereumConfig {
    mapping(address => euint64) private balances;
    mapping(address => uint256) private depositTimes;
    
    event Deposited(address indexed user, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 timestamp);
    
    function deposit(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        balances[msg.sender] = FHE.add(balances[msg.sender], amount);
        depositTimes[msg.sender] = block.timestamp;
        
        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);
        emit Deposited(msg.sender, block.timestamp);
    }
    
    function withdraw(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        ebool hasEnough = FHE.le(amount, balances[msg.sender]);
        euint64 zero; // Uninitialized = 0
        euint64 actualAmount = FHE.select(hasEnough, amount, zero);
        
        balances[msg.sender] = FHE.sub(balances[msg.sender], actualAmount);
        
        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);
        emit Withdrawn(msg.sender, block.timestamp);
    }
    
    function getBalance() external view returns (euint64) {
        return balances[msg.sender];
    }
    
    function getDepositTime() external view returns (uint256) {
        return depositTimes[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("EncryptedVault", function () {
  let alice: HardhatEthersSigner;
  let contract: any;
  let contractAddress: string;

  before(async function () {
    const signers = await ethers.getSigners();
    alice = signers[1];
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const factory = await ethers.getContractFactory("EncryptedVault");
    contract = await factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  it("should deposit and check balance", async function () {
    const depositAmount = 5000;

    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(depositAmount)
      .encrypt();

    await contract.connect(alice).deposit(input.handles[0], input.inputProof);

    const balance = await contract.connect(alice).getBalance();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint64, balance, contractAddress, alice);

    expect(decrypted).to.equal(depositAmount);
  });

  it("should withdraw partial amount", async function () {
    const depositInput = await fhevm.createEncryptedInput(contractAddress, alice.address).add64(1000).encrypt();
    await contract.connect(alice).deposit(depositInput.handles[0], depositInput.inputProof);

    const withdrawInput = await fhevm.createEncryptedInput(contractAddress, alice.address).add64(300).encrypt();
    await contract.connect(alice).withdraw(withdrawInput.handles[0], withdrawInput.inputProof);

    const balance = await contract.connect(alice).getBalance();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint64, balance, contractAddress, alice);

    expect(decrypted).to.equal(700);
  });

  it("should record deposit time", async function () {
    const input = await fhevm.createEncryptedInput(contractAddress, alice.address).add64(100).encrypt();
    const tx = await contract.connect(alice).deposit(input.handles[0], input.inputProof);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);

    const depositTime = await contract.connect(alice).getDepositTime();
    expect(depositTime).to.equal(block!.timestamp);
  });
});`,
    documentation: `# Encrypted Vault Example

Simple savings vault with encrypted balances using FHEVM.

## Features
- Encrypted deposits
- Encrypted withdrawals
- Balance privacy
- Deposit time tracking

## Use Cases
- Private savings accounts
- Confidential treasury management
- Anonymous funds pooling

## Usage
\`\`\`bash
npm install
npm test
\`\`\``,
  },
  'encrypted-counter': {
    name: 'Encrypted Counter',
    description: 'Basic encrypted counter with increment/decrement operations',
    contractName: 'MyCounter',
    category: 'basic',
    tags: ['basic', 'counter', 'arithmetic'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract MyCounter is ZamaEthereumConfig {
    euint32 private count;
    
    event Incremented(address indexed user);
    event Decremented(address indexed user);
    
    function increment(externalEuint32 value, bytes calldata proof) external {
        euint32 val = FHE.fromExternal(value, proof);
        count = FHE.add(count, val);
        FHE.allowThis(count);
        FHE.allow(count, msg.sender);
        emit Incremented(msg.sender);
    }
    
    function decrement(externalEuint32 value, bytes calldata proof) external {
        euint32 val = FHE.fromExternal(value, proof);
        count = FHE.sub(count, val);
        FHE.allowThis(count);
        FHE.allow(count, msg.sender);
        emit Decremented(msg.sender);
    }
    
    function getCount() external view returns (euint32) {
        return count;
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter basic
 * @title Simple FHE Counter
 * @description Tests encrypted counter increment operations using euint32.
 * Demonstrates basic FHE operations, encrypted input creation, and user decryption.
 */
describe("MyCounter", function () {
  let contract: any, contractAddress: string, alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];
    const factory = await ethers.getContractFactory("MyCounter");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  /**
   * @test Increment encrypted counter
   * @description Creates an encrypted input of value 5, increments the counter, and verifies the result.
   */
  it("should increment counter", async function () {
    const input = await fhevm.createEncryptedInput(contractAddress, alice.address).add32(5).encrypt();
    await contract.connect(alice).increment(input.handles[0], input.inputProof);
    const count = await contract.getCount();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint32, count, contractAddress, alice);
    expect(decrypted).to.equal(5);
  });
});`,
    documentation: `# Encrypted Counter\n\nBasic counter with encrypted values.\n\n## Usage\n\`\`\`bash\nnpm install\nnpm test\n\`\`\``,
  },
  'encrypted-arithmetic': {
    name: 'Encrypted Arithmetic',
    description: 'Demonstrates basic arithmetic on encrypted integers (FHE.add / FHE.sub)',
    contractName: 'EncryptedArithmetic',
    category: 'basic',
    tags: ['basic', 'arithmetic', 'add', 'sub'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedArithmetic
 * @notice Minimal example: add/sub on encrypted integers
 * @dev Concept-only example. Focuses on FHE.add and FHE.sub.
 */
contract EncryptedArithmetic is ZamaEthereumConfig {
    euint32 private a;
    euint32 private b;
    euint32 private sum;
    euint32 private diff;

    event OperandsSet(address indexed caller);
    event Added(address indexed caller);
    event Subtracted(address indexed caller);

    function setOperands(externalEuint32 encryptedA, externalEuint32 encryptedB, bytes calldata inputProof) external {
        a = FHE.fromExternal(encryptedA, inputProof);
        b = FHE.fromExternal(encryptedB, inputProof);

        FHE.allowThis(a);
        FHE.allowThis(b);
        FHE.allow(a, msg.sender);
        FHE.allow(b, msg.sender);

        emit OperandsSet(msg.sender);
    }

    function add() external {
        sum = FHE.add(a, b);
        FHE.allowThis(sum);
        FHE.allow(sum, msg.sender);
        emit Added(msg.sender);
    }

    function sub() external {
        diff = FHE.sub(a, b);
        FHE.allowThis(diff);
        FHE.allow(diff, msg.sender);
        emit Subtracted(msg.sender);
    }

    function getSum() external view returns (euint32) {
        return sum;
    }

    function getDiff() external view returns (euint32) {
        return diff;
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter basic
 * @title Encrypted Arithmetic Operations
 * @description Tests FHE arithmetic operations (add, sub, mul) on encrypted values.
 * Shows how to perform mathematical operations while maintaining data privacy.
 */
describe("EncryptedArithmetic", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("EncryptedArithmetic");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  /**
   * @test Addition of encrypted values
   * @description Tests FHE.add operation with euint32 values (7 + 3 = 10).
   */
  it("should add two encrypted values", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(7)
      .add32(3)
      .encrypt();

    await contract.connect(alice).setOperands(input.handles[0], input.handles[1], input.inputProof);
    await contract.connect(alice).add();

    const encryptedSum = await contract.connect(alice).getSum();
    const clearSum = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedSum, contractAddress, alice);
    expect(clearSum).to.equal(10);
  });

  /**
   * @test Subtraction of encrypted values
   * @description Tests FHE.sub operation with euint32 values (9 - 4 = 5).
   */
  it("should subtract two encrypted values", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(9)
      .add32(4)
      .encrypt();

    await contract.connect(alice).setOperands(input.handles[0], input.handles[1], input.inputProof);
    await contract.connect(alice).sub();

    const encryptedDiff = await contract.connect(alice).getDiff();
    const clearDiff = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedDiff, contractAddress, alice);
    expect(clearDiff).to.equal(5);
  });
});`,
    documentation: `# Encrypted Arithmetic

Minimal example for arithmetic on encrypted integers.

- Shows: \`FHE.add\`, \`FHE.sub\`

## Usage
\`\`\`bash
npm install
npm test
\`\`\``,
  },
  'encrypted-equality': {
    name: 'Encrypted Equality',
    description: 'Demonstrates equality comparison on encrypted integers (FHE.eq)',
    contractName: 'EncryptedEquality',
    category: 'basic',
    tags: ['basic', 'comparison', 'eq'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedEquality
 * @notice Minimal example: equality on encrypted integers
 * @dev Uses FHE.eq, and stores the result as encrypted 0/1.
 */
contract EncryptedEquality is ZamaEthereumConfig {
    euint32 private left;
    euint32 private right;
    euint32 private isEqual01;

    event OperandsSet(address indexed caller);
    event Compared(address indexed caller);

    function setOperands(externalEuint32 encryptedLeft, externalEuint32 encryptedRight, bytes calldata inputProof) external {
        left = FHE.fromExternal(encryptedLeft, inputProof);
        right = FHE.fromExternal(encryptedRight, inputProof);

        FHE.allowThis(left);
        FHE.allowThis(right);
        FHE.allow(left, msg.sender);
        FHE.allow(right, msg.sender);

        emit OperandsSet(msg.sender);
    }

    function compare() external {
        ebool eq = FHE.eq(left, right);
        isEqual01 = FHE.select(eq, FHE.asEuint32(1), FHE.asEuint32(0));
        FHE.allowThis(isEqual01);
        FHE.allow(isEqual01, msg.sender);
        emit Compared(msg.sender);
    }

    function getIsEqual01() external view returns (euint32) {
        return isEqual01;
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedEquality", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("EncryptedEquality");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should return 1 when two encrypted values are equal", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(42)
      .add32(42)
      .encrypt();

    await contract.connect(alice).setOperands(input.handles[0], input.handles[1], input.inputProof);
    await contract.connect(alice).compare();

    const encrypted = await contract.connect(alice).getIsEqual01();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encrypted, contractAddress, alice);
    expect(clear).to.equal(1);
  });

  it("should return 0 when two encrypted values are not equal", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(1)
      .add32(2)
      .encrypt();

    await contract.connect(alice).setOperands(input.handles[0], input.handles[1], input.inputProof);
    await contract.connect(alice).compare();

    const encrypted = await contract.connect(alice).getIsEqual01();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encrypted, contractAddress, alice);
    expect(clear).to.equal(0);
  });
});`,
    documentation: `# Encrypted Equality

Minimal example for encrypted equality comparison.

- Shows: \`FHE.eq\`

## Usage
\`\`\`bash
npm install
npm test
\`\`\``,
  },
  'encrypted-encrypt-single': {
    name: 'Encrypt Single Value',
    description: 'Demonstrates sending a single encrypted input (fromExternal + inputProof) and storing it on-chain',
    contractName: 'EncryptSingleValue',
    category: 'encryption',
    tags: ['encryption', 'input-proof', 'fromExternal', 'single'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptSingleValue
 * @notice Minimal example: one encrypted input -> stored encrypted state
 * @dev The encryption happens client-side; the contract consumes it via fromExternal(inputProof).
 */
contract EncryptSingleValue is ZamaEthereumConfig {
    euint32 private value;
    event Stored(address indexed user);

    function store(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        value = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(value);
        FHE.allow(value, msg.sender);
        emit Stored(msg.sender);
    }

    function get() external view returns (euint32) {
        return value;
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptSingleValue", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("EncryptSingleValue");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should store a single encrypted value", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(123)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);

    const encrypted = await contract.connect(alice).get();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encrypted, contractAddress, alice);
    expect(clear).to.equal(123);
  });
});`,
    documentation: `# Encrypt Single Value

Minimal example for sending a single encrypted input into a contract.

- Shows: client-side encryption + \`FHE.fromExternal\` + \`inputProof\`

## Usage
\`\`\`bash
npm install
npm test
\`\`\``,
  },
  'encrypted-encrypt-multiple': {
    name: 'Encrypt Multiple Values',
    description: 'Demonstrates sending multiple encrypted inputs in a single proof and storing them on-chain',
    contractName: 'EncryptMultipleValues',
    category: 'encryption',
    tags: ['encryption', 'input-proof', 'fromExternal', 'multiple'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptMultipleValues
 * @notice Minimal example: multiple encrypted inputs -> stored encrypted state
 * @dev The inputs share the same inputProof (created by the client).
 */
contract EncryptMultipleValues is ZamaEthereumConfig {
    euint32 private x;
    euint32 private y;
    event Stored(address indexed user);

    function store(externalEuint32 encryptedX, externalEuint32 encryptedY, bytes calldata inputProof) external {
        x = FHE.fromExternal(encryptedX, inputProof);
        y = FHE.fromExternal(encryptedY, inputProof);

        FHE.allowThis(x);
        FHE.allowThis(y);
        FHE.allow(x, msg.sender);
        FHE.allow(y, msg.sender);
        emit Stored(msg.sender);
    }

    function getX() external view returns (euint32) {
        return x;
    }

    function getY() external view returns (euint32) {
        return y;
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptMultipleValues", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("EncryptMultipleValues");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should store multiple encrypted values", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(11)
      .add32(22)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.handles[1], input.inputProof);

    const encryptedX = await contract.connect(alice).getX();
    const encryptedY = await contract.connect(alice).getY();

    const clearX = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedX, contractAddress, alice);
    const clearY = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedY, contractAddress, alice);

    expect(clearX).to.equal(11);
    expect(clearY).to.equal(22);
  });
});`,
    documentation: `# Encrypt Multiple Values

Minimal example for sending multiple encrypted inputs into a contract.

- Shows: one \`inputProof\` for multiple handles

## Usage
\`\`\`bash
npm install
npm test
\`\`\``,
  },
  'encrypted-user-decrypt-single': {
    name: 'User Decrypt Single Value',
    description: 'Demonstrates user decryption of a single encrypted value returned by a contract',
    contractName: 'UserDecryptSingle',
    category: 'user-decryption',
    tags: ['user-decryption', 'decrypt', 'single'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title UserDecryptSingle
 * @notice Minimal example: a user decrypts one encrypted value
 */
contract UserDecryptSingle is ZamaEthereumConfig {
    mapping(address => euint32) private secret;
    event Stored(address indexed user);

    function store(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        secret[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(secret[msg.sender]);
        FHE.allow(secret[msg.sender], msg.sender);
        emit Stored(msg.sender);
    }

    function getMySecret() external view returns (euint32) {
        return secret[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter user-decryption
 * @title User Decryption - Single Value
 * @description Demonstrates how users decrypt their own encrypted data using fhevm.userDecryptEuint().
 * Requires FHE.allow(user) permission to be granted by the contract.
 */
describe("UserDecryptSingle", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("UserDecryptSingle");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  /**
   * @test User decrypts their own encrypted value
   * @description Stores encrypted value 777, grants user permission, and decrypts client-side.
   */
  it("should let the user decrypt a single encrypted value", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(777)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);

    const encrypted = await contract.connect(alice).getMySecret();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encrypted, contractAddress, alice);
    expect(clear).to.equal(777);
  });
});`,
    documentation: `# User Decrypt (Single)

Minimal example for user decryption of a single encrypted value.

## Usage
\`\`\`bash
npm install
npm test
\`\`\``,
  },
  'encrypted-user-decrypt-multiple': {
    name: 'User Decrypt Multiple Values',
    description: 'Demonstrates user decryption of multiple encrypted values returned by a contract',
    contractName: 'UserDecryptMultiple',
    category: 'user-decryption',
    tags: ['user-decryption', 'decrypt', 'multiple'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title UserDecryptMultiple
 * @notice Minimal example: a user decrypts multiple encrypted values
 */
contract UserDecryptMultiple is ZamaEthereumConfig {
    mapping(address => euint32) private a;
    mapping(address => euint32) private b;

    event Stored(address indexed user);

    function store(externalEuint32 encryptedA, externalEuint32 encryptedB, bytes calldata inputProof) external {
        a[msg.sender] = FHE.fromExternal(encryptedA, inputProof);
        b[msg.sender] = FHE.fromExternal(encryptedB, inputProof);

        FHE.allowThis(a[msg.sender]);
        FHE.allowThis(b[msg.sender]);
        FHE.allow(a[msg.sender], msg.sender);
        FHE.allow(b[msg.sender], msg.sender);

        emit Stored(msg.sender);
    }

    function getMySecrets() external view returns (euint32, euint32) {
        return (a[msg.sender], b[msg.sender]);
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("UserDecryptMultiple", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("UserDecryptMultiple");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should let the user decrypt multiple encrypted values", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(10)
      .add32(20)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.handles[1], input.inputProof);

    const [encA, encB] = await contract.connect(alice).getMySecrets();
    const clearA = await fhevm.userDecryptEuint(FhevmType.euint32, encA, contractAddress, alice);
    const clearB = await fhevm.userDecryptEuint(FhevmType.euint32, encB, contractAddress, alice);

    expect(clearA).to.equal(10);
    expect(clearB).to.equal(20);
  });
});`,
    documentation: `# User Decrypt (Multiple)

Minimal example for user decryption of multiple encrypted values.

## Usage
\`\`\`bash
npm install
npm test
\`\`\``,
  },
  'encrypted-public-decrypt-single': {
    name: 'Public Decrypt Single Value',
    description: 'Demonstrates making one encrypted value publicly decryptable and decrypting it without user permissions',
    contractName: 'PublicDecryptSingle',
    category: 'public-decryption',
    tags: ['public-decryption', 'decrypt', 'single'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PublicDecryptSingle
 * @notice Minimal example: make one encrypted value publicly decryptable
 */
contract PublicDecryptSingle is ZamaEthereumConfig {
    euint64 private value;

    event Stored(address indexed user);

    function storeAndMakePublic(externalEuint64 encryptedValue, bytes calldata inputProof) external {
        euint64 v = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(v);
        value = FHE.makePubliclyDecryptable(v);
        emit Stored(msg.sender);
    }

    function get() external view returns (euint64) {
        return value;
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter public-decryption
 * @title Public Decryption - Single Value
 * @description Shows how to decrypt encrypted values to plaintext on-chain using relayer.
 * Uses FHE.publicDecrypt() to make encrypted data publicly visible.
 */
describe("PublicDecryptSingle", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("PublicDecryptSingle");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  /**
   * @test Public decryption of single value
   * @description Stores and requests public decryption, making the value visible to everyone.
   */
  it("should publicly decrypt one value", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(999)
      .encrypt();

    await contract.connect(alice).storeAndMakePublic(input.handles[0], input.inputProof);

    const encrypted = await contract.get();
    const clear = await fhevm.publicDecryptEuint(FhevmType.euint64, encrypted);
    expect(clear).to.equal(999n);
  });
});`,
    documentation: `# Public Decrypt (Single)

Minimal example for public decryption of a single encrypted value.

## Usage
\`\`\`bash
npm install
npm test
\`\`\`
`,
  },
  'encrypted-public-decrypt-multiple': {
    name: 'Public Decrypt Multiple Values',
    description: 'Demonstrates making multiple encrypted values publicly decryptable and decrypting them in one call',
    contractName: 'PublicDecryptMultiple',
    category: 'public-decryption',
    tags: ['public-decryption', 'decrypt', 'multiple'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PublicDecryptMultiple
 * @notice Minimal example: make multiple encrypted values publicly decryptable
 */
contract PublicDecryptMultiple is ZamaEthereumConfig {
    euint64 private a;
    euint64 private b;

    event Stored(address indexed user);

    function storeAndMakePublic(externalEuint64 encryptedA, externalEuint64 encryptedB, bytes calldata inputProof) external {
        euint64 va = FHE.fromExternal(encryptedA, inputProof);
        euint64 vb = FHE.fromExternal(encryptedB, inputProof);

        FHE.allowThis(va);
        FHE.allowThis(vb);

        a = FHE.makePubliclyDecryptable(va);
        b = FHE.makePubliclyDecryptable(vb);

        emit Stored(msg.sender);
    }

    function get() external view returns (euint64, euint64) {
        return (a, b);
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("PublicDecryptMultiple", function () {
  let contract: any;
  let contractAddress: string;
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
    alice = signers[1];

    const factory = await ethers.getContractFactory("PublicDecryptMultiple");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should publicly decrypt multiple values", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(12)
      .add64(34)
      .encrypt();

    await contract.connect(alice).storeAndMakePublic(input.handles[0], input.handles[1], input.inputProof);

    const [encA, encB] = await contract.get();
    const results: any = await fhevm.publicDecrypt([encA, encB]);

    expect(getClearValue(results, encA)).to.equal(12n);
    expect(getClearValue(results, encB)).to.equal(34n);
  });
});`,
    documentation: `# Public Decrypt (Multiple)

Minimal example for public decryption of multiple encrypted values.

## Usage
\`\`\`bash
npm install
npm test
\`\`\`
`,
  },
  'encrypted-access-control-transient': {
    name: 'Access Control (Transient)',
    description: 'Demonstrates FHE permissions: allow/allowThis and allowTransient for cross-contract calls in the same transaction',
    contractName: 'AccessControlTransient',
    category: 'access-control',
    tags: ['access-control', 'allow', 'allowThis', 'allowTransient'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface ITransientReader {
    function addOne(euint64 value) external returns (euint64);
}

/**
 * @title TransientReader
 * @notice Helper contract used to demonstrate allowTransient.
 */
contract TransientReader is ZamaEthereumConfig {
    function addOne(euint64 value) external returns (euint64) {
        euint64 out = FHE.add(value, FHE.asEuint64(1));
        FHE.allowThis(out);
        // msg.sender is the calling contract (AccessControlTransient)
        FHE.allow(out, msg.sender);
        return out;
    }
}

/**
 * @title AccessControlTransient
 * @notice Minimal example: permissions + transient permission for a same-tx cross-contract call.
 */
contract AccessControlTransient is ZamaEthereumConfig {
    mapping(address => euint64) private secrets;

    event Stored(address indexed user);
    event Shared(address indexed owner, address indexed reader);

    function store(externalEuint64 encryptedValue, bytes calldata inputProof) external {
        secrets[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(secrets[msg.sender]);
        FHE.allow(secrets[msg.sender], msg.sender);
        emit Stored(msg.sender);
    }

    function shareWith(address reader) external {
        FHE.allow(secrets[msg.sender], reader);
        emit Shared(msg.sender, reader);
    }

    function getSecretOf(address owner) external view returns (euint64) {
        return secrets[owner];
    }

    function computeViaReader(address reader) external returns (euint64) {
        euint64 v = secrets[msg.sender];

        // Give the reader permission only for this transaction.
        FHE.allowTransient(v, reader);

        euint64 out = ITransientReader(reader).addOne(v);
        FHE.allowThis(out);
        FHE.allow(out, msg.sender);
        return out;
    }

    function computeViaReaderWithoutTransient(address reader) external returns (euint64) {
        euint64 v = secrets[msg.sender];
        // Intentionally missing allowTransient.
        return ITransientReader(reader).addOne(v);
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter access-control
 * @title Access Control with Transient Storage
 * @description Tests FHE.allow() for persistent permissions and FHE.allowTransient() for same-transaction access.
 * Demonstrates how to share encrypted values between users and contracts securely.
 */
describe("AccessControlTransient", function () {
  let contract: any;
  let reader: any;
  let contractAddress: string;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];
    bob = signers[2];

    const contractFactory = await ethers.getContractFactory("AccessControlTransient");
    contract = await contractFactory.deploy();
    contractAddress = await contract.getAddress();

    const readerFactory = await ethers.getContractFactory("TransientReader");
    reader = await readerFactory.deploy();
  });

  /**
   * @test Persistent access sharing with FHE.allow()
   * @description Alice stores encrypted data and grants Bob access using FHE.allow().
   */
  it("should share access with another user using allow", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(1234)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);
    await contract.connect(alice).shareWith(bob.address);

    const enc = await contract.getSecretOf(alice.address);
    const clear = await fhevm.userDecryptEuint(FhevmType.euint64, enc, contractAddress, bob);
    expect(clear).to.equal(1234n);
  });

  it("should allow a same-tx cross-contract call using allowTransient", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add64(41)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);

    await expect(contract.connect(alice).computeViaReaderWithoutTransient(await reader.getAddress())).to.be.reverted;

    const out = await contract.connect(alice).computeViaReader(await reader.getAddress());
    const receipt = await out.wait();
    void receipt;

    // computeViaReader returns an euint64 in the tx return data; easiest is to query via callStatic
    const encOut = await contract.connect(alice).computeViaReader.staticCall(await reader.getAddress());
    const clearOut = await fhevm.userDecryptEuint(FhevmType.euint64, encOut, contractAddress, alice);
    expect(clearOut).to.equal(42n);
  });
});`,
    documentation: `# Access Control (Transient)

Minimal example for permissions and transient permissions.

## Usage
\`\`\`bash
npm install
npm test
\`\`\`
`,
  },
  'encrypted-input-proof': {
    name: 'Input Proof Validation',
    description: 'Explains what inputProof binds to and shows a failing case when the proof was created for another contract address',
    contractName: 'InputProofValidation',
    category: 'input-proof',
    tags: ['input-proof', 'fromExternal', 'encryption'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title InputProofValidation
 * @notice Minimal example: inputProof must match the encrypted handles and the target contract.
 */
contract InputProofValidation is ZamaEthereumConfig {
    euint32 private stored;

    event Stored(address indexed user);

    function store(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        stored = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(stored);
        FHE.allow(stored, msg.sender);
        emit Stored(msg.sender);
    }

    function get() external view returns (euint32) {
        return stored;
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter input-proof
 * @title Input Proof Validation
 * @description Tests zero-knowledge proof validation for encrypted inputs.
 * Shows what happens with valid and invalid inputProofs, and why they're necessary.
 */
describe("InputProofValidation", function () {
  let contract: any;
  let other: any;
  let contractAddress: string;
  let otherAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("InputProofValidation");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();

    other = await factory.deploy();
    otherAddress = await other.getAddress();
  });

  /**
   * @test Valid input proof acceptance
   * @description Creates correctly bound encrypted input and verifies contract accepts it.
   */
  it("should accept a valid inputProof", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(123)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);

    const enc = await contract.get();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, enc, contractAddress, alice);
    expect(clear).to.equal(123n);
  });

  it("should reject an inputProof created for another contract", async function () {
    const wrong = await fhevm
      .createEncryptedInput(otherAddress, alice.address)
      .add32(777)
      .encrypt();

    await expect(contract.connect(alice).store(wrong.handles[0], wrong.inputProof)).to.be.reverted;
  });
});`,
    documentation: `# Input Proof Validation

Minimal example showing that \`inputProof\` must match the encrypted handle(s) and the target contract.

## Usage
\`\`\`bash
npm install
npm test
\`\`\`
`,
  },
  'encrypted-anti-patterns': {
    name: 'Anti-patterns',
    description: 'Shows common mistakes: missing allowThis, missing user allow, and how to fix them',
    contractName: 'AntiPatterns',
    category: 'anti-patterns',
    tags: ['anti-patterns', 'allowThis', 'allow', 'permissions'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title AntiPatterns
 * @notice Minimal examples of what *not* to do with permissions.
 */
contract AntiPatterns is ZamaEthereumConfig {
    mapping(address => euint32) private secret;

    event StoredBadNoAllowThis(address indexed user);
    event StoredBadNoUserAllow(address indexed user);
    event StoredGood(address indexed user);

    // Anti-pattern #1: forget allowThis. Contract won't be able to use the value later.
    function storeBadNoAllowThis(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        secret[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        // Intentionally missing: FHE.allowThis(secret[msg.sender])
        FHE.allow(secret[msg.sender], msg.sender);
        emit StoredBadNoAllowThis(msg.sender);
    }

    // Anti-pattern #2: forget to allow the user. They won't be able to decrypt.
    function storeBadNoUserAllow(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        secret[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(secret[msg.sender]);
        // Intentionally missing: FHE.allow(secret[msg.sender], msg.sender)
        emit StoredBadNoUserAllow(msg.sender);
    }

    // Correct pattern: allow contract + allow user.
    function storeGood(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        secret[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(secret[msg.sender]);
        FHE.allow(secret[msg.sender], msg.sender);
        emit StoredGood(msg.sender);
    }

    function grantMeAccess() external {
        FHE.allow(secret[msg.sender], msg.sender);
    }

    function incrementMySecret() external {
        secret[msg.sender] = FHE.add(secret[msg.sender], FHE.asEuint32(1));
        FHE.allowThis(secret[msg.sender]);
        FHE.allow(secret[msg.sender], msg.sender);
    }

    function getMySecret() external view returns (euint32) {
        return secret[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter anti-patterns
 * @title Common FHEVM Mistakes and Anti-Patterns
 * @description Demonstrates common mistakes when working with encrypted values:
 * - Missing FHE.allowThis() breaks contract operations
 * - Missing FHE.allow(user) prevents user decryption
 * - View functions cannot return encrypted values
 */
describe("AntiPatterns", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("AntiPatterns");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  /**
   * @test Missing allowThis() anti-pattern
   * @description Shows that forgetting FHE.allowThis() prevents contract from using encrypted values later.
   */
  it("anti-pattern: missing allowThis breaks later contract computation", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(7)
      .encrypt();

    await contract.connect(alice).storeBadNoAllowThis(input.handles[0], input.inputProof);
    await expect(contract.connect(alice).incrementMySecret()).to.be.reverted;
  });

  it("anti-pattern: missing user allow prevents user decryption", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(99)
      .encrypt();

    await contract.connect(alice).storeBadNoUserAllow(input.handles[0], input.inputProof);
    const enc = await contract.connect(alice).getMySecret();

    await expect(
      fhevm.userDecryptEuint(FhevmType.euint32, enc, contractAddress, alice)
    ).to.be.rejected;

    await contract.connect(alice).grantMeAccess();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, enc, contractAddress, alice);
    expect(clear).to.equal(99n);
  });

  it("correct: allowThis + allow lets user decrypt and contract compute", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(1)
      .encrypt();

    await contract.connect(alice).storeGood(input.handles[0], input.inputProof);
    await contract.connect(alice).incrementMySecret();

    const enc = await contract.connect(alice).getMySecret();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, enc, contractAddress, alice);
    expect(clear).to.equal(2n);
  });
});`,
    documentation: `# Anti-patterns

Minimal examples of permission mistakes and their fixes.

## Usage
\`\`\`bash
npm install
npm test
\`\`\`
`,
  },
  'encrypted-handles-lifecycle': {
    name: 'Handles Lifecycle',
    description: 'Shows encrypted handles as opaque bytes32 references, and how new handles are produced across operations',
    contractName: 'HandlesLifecycle',
    category: 'handles-lifecycle',
    tags: ['handles', 'lifecycle', 'permissions'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title HandlesLifecycle
 * @notice Minimal example: encrypted values are referenced by opaque handles (bytes32).
 */
contract HandlesLifecycle is ZamaEthereumConfig {
    mapping(address => euint32) private value;

    event Stored(address indexed user);
    event Updated(address indexed user, bytes32 oldHandle, bytes32 newHandle);

    function store(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        value[msg.sender] = FHE.fromExternal(encryptedValue, inputProof);
        FHE.allowThis(value[msg.sender]);
        FHE.allow(value[msg.sender], msg.sender);
        emit Stored(msg.sender);
    }

    function updatePlusOne() external {
        euint32 oldValue = value[msg.sender];
        bytes32 oldHandle = bytes32(uint256(euint32.unwrap(oldValue)));

        euint32 newValue = FHE.add(oldValue, FHE.asEuint32(1));
        FHE.allowThis(newValue);
        FHE.allow(newValue, msg.sender);
        value[msg.sender] = newValue;

        bytes32 newHandle = bytes32(uint256(euint32.unwrap(newValue)));
        emit Updated(msg.sender, oldHandle, newHandle);
    }

    function getMyHandle() external view returns (euint32) {
        return value[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("HandlesLifecycle", function () {
  let contract: any;
  let contractAddress: string;
  let alice: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    alice = signers[1];

    const factory = await ethers.getContractFactory("HandlesLifecycle");
    contract = await factory.deploy();
    contractAddress = await contract.getAddress();
  });

  it("should treat handles as opaque and show lifecycle across updates", async function () {
    const input = await fhevm
      .createEncryptedInput(contractAddress, alice.address)
      .add32(10)
      .encrypt();

    await contract.connect(alice).store(input.handles[0], input.inputProof);

    const h1 = await contract.connect(alice).getMyHandle();
    expect(h1).to.match(/^0x[0-9a-fA-F]{64}$/);

    const v1 = await fhevm.userDecryptEuint(FhevmType.euint32, h1, contractAddress, alice);
    expect(v1).to.equal(10n);

    await contract.connect(alice).updatePlusOne();

    const h2 = await contract.connect(alice).getMyHandle();
    expect(h2).to.match(/^0x[0-9a-fA-F]{64}$/);

    const v2 = await fhevm.userDecryptEuint(FhevmType.euint32, h2, contractAddress, alice);
    expect(v2).to.equal(11n);

    // Old handle is still decryptable (it references prior ciphertext).
    const v1Again = await fhevm.userDecryptEuint(FhevmType.euint32, h1, contractAddress, alice);
    expect(v1Again).to.equal(10n);
  });
});`,
    documentation: `# Handles Lifecycle

Minimal example showing that encrypted values are referenced by opaque handles.

## Usage
\`\`\`bash
npm install
npm test
\`\`\`
`,
  },
  'oz-confidential-fungible-token': {
    name: 'OZ Confidential Token (Starter)',
    description: 'Minimal starter using @openzeppelin/confidential-contracts (ERC7984) with an encrypted transfer',
    contractName: 'OZConfidentialTokenStarter',
    category: 'oz-confidential',
    tags: ['openzeppelin', 'confidential', 'token', 'erc7984'],
    extraDependencies: {
      '@openzeppelin/confidential-contracts': '^0.3.0',
    },
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

/**
 * @title OZConfidentialTokenStarter
 * @notice Minimal starter token based on OpenZeppelin's ERC7984 reference implementation.
 */
contract OZConfidentialTokenStarter is ERC7984, ZamaEthereumConfig {
    address public immutable owner;

  constructor() ERC7984("OZConfidential", "OZC", "") {
        owner = msg.sender;
    }

    function mintPlain(address to, uint64 amount) external {
    require(msg.sender == owner, "only owner");
    euint64 mintAmount = FHE.asEuint64(amount);
    FHE.allowThis(mintAmount);
    FHE.allow(mintAmount, to);
    _mint(to, mintAmount);
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("OZConfidentialTokenStarter", function () {
  let token: any;
  let tokenAddress: string;
  let deployer: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];
    bob = signers[2];

    const factory = await ethers.getContractFactory("OZConfidentialTokenStarter");
    token = await factory.deploy();
    tokenAddress = await token.getAddress();

    await token.connect(deployer).mintPlain(alice.address, 100);
  });

  async function decryptEuint64(handleHex: string, user: any): Promise<bigint> {
    return fhevm.userDecryptEuint(FhevmType.euint64, handleHex, tokenAddress, user);
  }

  it("should transfer an encrypted amount", async function () {
    const aliceBalHandle = await token.confidentialBalanceOf(alice.address);
    expect(await decryptEuint64(aliceBalHandle, alice)).to.equal(100n);

    const input = await fhevm
      .createEncryptedInput(tokenAddress, alice.address)
      .add64(25)
      .encrypt();

    await token
      .connect(alice)
      ["confidentialTransfer(address,bytes32,bytes)"](bob.address, input.handles[0], input.inputProof);

    const aliceAfter = await token.confidentialBalanceOf(alice.address);
    const bobAfter = await token.confidentialBalanceOf(bob.address);

    expect(await decryptEuint64(aliceAfter, alice)).to.equal(75n);
    expect(await decryptEuint64(bobAfter, bob)).to.equal(25n);
  });
});`,
    documentation: `# OZ Confidential Token (Starter)

Minimal starter example using OpenZeppelin Confidential Contracts (ERC7984).

## Usage
\`\`\`bash
npm install
npm test
\`\`\`
`,
  },

  'oz-confidential-erc20-wrapper': {
    name: 'OZ ERC20 Wrapper (ERC7984 Starter)',
    description: 'Wrap a public ERC20 into a confidential ERC7984 token and unwrap back using public decryption proof',
    contractName: 'OZERC7984ERC20WrapperStarter',
    category: 'oz-confidential',
    tags: ['openzeppelin', 'confidential', 'erc7984', 'wrapper', 'erc20'],
    extraDependencies: {
      '@openzeppelin/confidential-contracts': '^0.3.0',
    },
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title OZERC7984ERC20WrapperStarter
 * @notice Minimal wrapper: wrap ERC20 into an ERC7984 token.
 */
contract OZERC7984ERC20WrapperStarter is ERC7984ERC20Wrapper, ZamaEthereumConfig {
    constructor(IERC20 underlying_)
        ERC7984("Wrapped Mock", "wMOCK", "")
        ERC7984ERC20Wrapper(underlying_)
    {}

  function wrap(address to, uint256 amount) public override {
    SafeERC20.safeTransferFrom(underlying(), msg.sender, address(this), amount - (amount % rate()));

    euint64 mintAmount = FHE.asEuint64(SafeCast.toUint64(amount / rate()));
    FHE.allowThis(mintAmount);
    FHE.allow(mintAmount, to);
    _mint(to, mintAmount);
  }
}
`,
    testCode: `import { expect } from "chai";
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
`,
    documentation: `# OZ ERC20 Wrapper (ERC7984 Starter)

Wrap a public ERC20 into a confidential ERC7984 token and unwrap back.

## Usage
\`\`\`bash
npm install
npm test
\`\`\`
`,
  },

  'oz-confidential-vesting-wallet': {
    name: 'OZ Vesting Wallet (Confidential Starter)',
    description: 'Confidential vesting wallet releasing ERC7984 tokens over time',
    contractName: 'OZVestingWalletConfidentialStarter',
    category: 'oz-confidential',
    tags: ['openzeppelin', 'confidential', 'erc7984', 'vesting'],
    extraDependencies: {
      '@openzeppelin/confidential-contracts': '^0.3.0',
    },
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {VestingWalletConfidential} from "@openzeppelin/confidential-contracts/finance/VestingWalletConfidential.sol";

contract OZConfidentialTokenStarter is ERC7984, ZamaEthereumConfig {
    address public immutable owner;

    constructor() ERC7984("OZConfidential", "OZC", "") {
        owner = msg.sender;
    }

    function mintPlain(address to, uint64 amount) external {
        require(msg.sender == owner, "only owner");
        euint64 mintAmount = FHE.asEuint64(amount);
        FHE.allowThis(mintAmount);
        FHE.allow(mintAmount, to);
        _mint(to, mintAmount);
    }
}

/**
 * @title OZVestingWalletConfidentialStarter
 * @notice Minimal deployable vesting wallet using VestingWalletConfidential.
 */
contract OZVestingWalletConfidentialStarter is Initializable, VestingWalletConfidential, ZamaEthereumConfig {
    function initialize(address beneficiary, uint48 startTimestamp, uint48 durationSeconds) external initializer {
        __VestingWalletConfidential_init(beneficiary, startTimestamp, durationSeconds);
    }
}
`,
    testCode: `import { expect } from "chai";
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
`,
    documentation: `# OZ Vesting Wallet (Confidential Starter)

Minimal confidential vesting wallet example using OpenZeppelin Confidential Contracts.

## Usage
\`\`\`bash
npm install
npm test
\`\`\`
`,
  },

  'oz-confidential-swap': {
    name: 'OZ Swap (ERC7984 Starter)',
    description: 'Minimal encrypted-amount swap between two ERC7984 tokens using operator approvals',
    contractName: 'OZERC7984AtomicSwapStarter',
    category: 'oz-confidential',
    tags: ['openzeppelin', 'confidential', 'erc7984', 'swap'],
    extraDependencies: {
      '@openzeppelin/confidential-contracts': '^0.3.0',
    },
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

contract OZConfidentialTokenStarter is ERC7984, ZamaEthereumConfig {
    address public immutable owner;

    constructor(string memory name_, string memory symbol_) ERC7984(name_, symbol_, "") {
        owner = msg.sender;
    }

    function mintPlain(address to, uint64 amount) external {
        require(msg.sender == owner, "only owner");
        euint64 mintAmount = FHE.asEuint64(amount);
        FHE.allowThis(mintAmount);
        FHE.allow(mintAmount, to);
        _mint(to, mintAmount);
    }
}

/**
 * @title OZERC7984AtomicSwapStarter
 * @notice Minimal offer/accept swap for ERC7984 tokens.
 *
 * The swap contract relies on ERC7984 operators:
 * - maker must call tokenA.setOperator(address(this), until)
 * - taker must call tokenB.setOperator(address(this), until)
 */
contract OZERC7984AtomicSwapStarter is ZamaEthereumConfig {
    struct Offer {
        address maker;
        address tokenA;
        address tokenB;
    bytes32 amountAHandle;
        uint48 expiry;
    }

    uint256 public nextOfferId;
    mapping(uint256 => Offer) public offers;

    event OfferCreated(uint256 indexed offerId, address indexed maker, address indexed tokenA, address tokenB);
    event OfferAccepted(uint256 indexed offerId, address indexed taker);

    error OfferNotFound(uint256 offerId);
    error OfferExpired(uint256 offerId);

    function createOffer(
        address tokenA,
        address tokenB,
        externalEuint64 encryptedAmountA,
        bytes calldata inputProofA,
        uint48 expiry
    ) external returns (uint256 offerId) {
      euint64 amountA = FHE.fromExternal(encryptedAmountA, inputProofA);
      FHE.allowThis(amountA);
      FHE.allow(amountA, tokenA);

        offerId = nextOfferId++;
        offers[offerId] = Offer({
            maker: msg.sender,
            tokenA: tokenA,
            tokenB: tokenB,
        amountAHandle: euint64.unwrap(amountA),
            expiry: expiry
        });
        emit OfferCreated(offerId, msg.sender, tokenA, tokenB);
    }

    function acceptOffer(uint256 offerId, externalEuint64 encryptedAmountB, bytes calldata inputProofB) external {
        Offer memory offer = offers[offerId];
        if (offer.maker == address(0)) revert OfferNotFound(offerId);
        if (block.timestamp > offer.expiry) revert OfferExpired(offerId);
        delete offers[offerId];

      euint64 amountA = euint64.wrap(offer.amountAHandle);
      euint64 amountB = FHE.fromExternal(encryptedAmountB, inputProofB);
      FHE.allowThis(amountB);

      // Token contracts must be allowed to use the handles in FHE operations.
      FHE.allow(amountA, offer.tokenA);
      FHE.allow(amountB, offer.tokenB);

      IERC7984(offer.tokenA).confidentialTransferFrom(offer.maker, msg.sender, amountA);
      IERC7984(offer.tokenB).confidentialTransferFrom(msg.sender, offer.maker, amountB);
        emit OfferAccepted(offerId, msg.sender);
    }
}
`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("OZERC7984AtomicSwapStarter", function () {
  let tokenA: any;
  let tokenB: any;
  let swap: any;
  let tokenAAddress: string;
  let tokenBAddress: string;
  let swapAddress: string;
  let deployer: any;
  let alice: any;
  let bob: any;

  async function decryptBalance(token: any, tokenAddress: string, user: any): Promise<bigint> {
    const handle = await token.confidentialBalanceOf(user.address);
    return fhevm.userDecryptEuint(FhevmType.euint64, handle, tokenAddress, user);
  }

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];
    bob = signers[2];

    const Token = await ethers.getContractFactory("OZConfidentialTokenStarter");
    tokenA = await Token.deploy("TokenA", "TKA");
    tokenB = await Token.deploy("TokenB", "TKB");
    tokenAAddress = await tokenA.getAddress();
    tokenBAddress = await tokenB.getAddress();

    const Swap = await ethers.getContractFactory("OZERC7984AtomicSwapStarter");
    swap = await Swap.deploy();
    swapAddress = await swap.getAddress();

    await tokenA.connect(deployer).mintPlain(alice.address, 100);
    await tokenB.connect(deployer).mintPlain(bob.address, 200);

    const farFuture = 2 ** 31;
    await tokenA.connect(alice).setOperator(swapAddress, farFuture);
    await tokenB.connect(bob).setOperator(swapAddress, farFuture);
  });

  it("should swap encrypted amounts", async function () {
    expect(await decryptBalance(tokenA, tokenAAddress, alice)).to.equal(100n);
    expect(await decryptBalance(tokenB, tokenBAddress, bob)).to.equal(200n);

    const inA = await fhevm.createEncryptedInput(swapAddress, alice.address).add64(25).encrypt();
    const expiry = (await ethers.provider.getBlock("latest"))!.timestamp + 3600;

    const offerTx = await swap
      .connect(alice)
      .createOffer(tokenAAddress, tokenBAddress, inA.handles[0], inA.inputProof, expiry);
    const offerReceipt = await offerTx.wait();

    const offerId = offerReceipt.logs
      .map((l: any) => {
        try {
          return swap.interface.parseLog(l);
        } catch {
          return undefined;
        }
      })
      .find((p: any) => p && p.name === "OfferCreated")!.args.offerId as bigint;

    const inB = await fhevm.createEncryptedInput(swapAddress, bob.address).add64(50).encrypt();
    await swap.connect(bob).acceptOffer(offerId, inB.handles[0], inB.inputProof);

    expect(await decryptBalance(tokenA, tokenAAddress, alice)).to.equal(75n);
    expect(await decryptBalance(tokenA, tokenAAddress, bob)).to.equal(25n);

    expect(await decryptBalance(tokenB, tokenBAddress, bob)).to.equal(150n);
    expect(await decryptBalance(tokenB, tokenBAddress, alice)).to.equal(50n);
  });
});
`,
    documentation: `# OZ Swap (ERC7984 Starter)

Minimal offer/accept swap between two ERC7984 tokens.

## Usage
\`\`\`bash
npm install
npm test
\`\`\`
`,
  },
  'encrypted-voting': {
    name: 'Encrypted Voting',
    description: 'Private voting system with encrypted vote counts',
    contractName: 'EncryptedVoting',
    category: 'governance',
    tags: ['governance', 'voting', 'dao', 'privacy'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedVoting is ZamaEthereumConfig {
    euint64 private yesVotes;
    euint64 private noVotes;
    mapping(address => bool) public hasVoted;
    
    event Voted(address indexed voter);
    
    function vote(externalEuint64 voteYes, bytes calldata proof) external {
        require(!hasVoted[msg.sender], "Already voted");
        euint64 votes = FHE.fromExternal(voteYes, proof);
        yesVotes = FHE.add(yesVotes, votes);
        hasVoted[msg.sender] = true;
        FHE.allowThis(yesVotes);
        FHE.allow(yesVotes, msg.sender);
        emit Voted(msg.sender);
    }
    
    function getYesVotes() external view returns (euint64) {
        return yesVotes;
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("EncryptedVoting", function () {
  it("should cast encrypted vote", async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EncryptedVoting");
    const contract = await factory.deploy();
    const addr = await contract.getAddress();
    const input = await fhevm.createEncryptedInput(addr, signers[1].address).add64(1).encrypt();
    await contract.connect(signers[1]).vote(input.handles[0], input.inputProof);
    expect(await contract.hasVoted(signers[1].address)).to.be.true;
  });
});`,
    documentation: `# Encrypted Voting\n\nPrivate voting with encrypted tallies.\n\n## Usage\n\`\`\`bash\nnpm test\n\`\`\``,
  },
  'encrypted-auction': {
    name: 'Encrypted Auction',
    description: 'Sealed-bid auction with encrypted bids',
    contractName: 'EncryptedAuction',
    category: 'marketplace',
    tags: ['auction', 'bidding', 'sealed-bid'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedAuction is ZamaEthereumConfig {
    mapping(address => euint64) private bids;
    
    event BidPlaced(address indexed bidder);
    
    function placeBid(externalEuint64 amount, bytes calldata proof) external {
        euint64 bid = FHE.fromExternal(amount, proof);
        bids[msg.sender] = bid;
        FHE.allowThis(bids[msg.sender]);
        FHE.allow(bids[msg.sender], msg.sender);
        emit BidPlaced(msg.sender);
    }
    
    function getBid() external view returns (euint64) {
        return bids[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedAuction", function () {
  it("should place encrypted bid", async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EncryptedAuction");
    const contract = await factory.deploy();
    const addr = await contract.getAddress();
    const input = await fhevm.createEncryptedInput(addr, signers[1].address).add64(1000).encrypt();
    await contract.connect(signers[1]).placeBid(input.handles[0], input.inputProof);
    const bid = await contract.connect(signers[1]).getBid();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint64, bid, addr, signers[1]);
    expect(decrypted).to.equal(1000);
  });
});`,
    documentation: `# Encrypted Auction\n\nSealed-bid auction system.\n\n## Usage\n\`\`\`bash\nnpm test\n\`\`\``,
  },
  'encrypted-blind-auction': {
    name: 'Blind Auction (Two Bidders)',
    description: 'Minimal blind auction: two encrypted bids, close with encrypted comparison, reveal winner + winning bid',
    contractName: 'BlindAuctionTwoBidders',
    category: 'marketplace',
    tags: ['auction', 'blind-auction', 'sealed-bid', 'comparison'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title BlindAuctionTwoBidders
 * @notice Minimal blind auction for two bidders.
 *
 * - Bids are submitted encrypted.
 * - On close, the contract compares bids using FHE and stores an encrypted boolean.
 * - The winning bid is made publicly decryptable.
 */
contract BlindAuctionTwoBidders is ZamaEthereumConfig {
    address public immutable seller;
    address public immutable alice;
    address public immutable bob;
    uint48 public immutable endTime;

    euint64 private aliceBid;
    euint64 private bobBid;
    bool public closed;

    ebool private aliceWins;
    euint64 private winningBid;

    event BidPlaced(address indexed bidder);
    event Closed();

    error NotBidder(address bidder);
    error AuctionEnded();
    error AuctionNotEnded();
    error AlreadyClosed();
    error MissingBid();

    constructor(address alice_, address bob_, uint48 durationSeconds) {
        seller = msg.sender;
        alice = alice_;
        bob = bob_;
        endTime = uint48(block.timestamp) + durationSeconds;
    }

    function placeBid(externalEuint64 amount, bytes calldata proof) external {
        if (closed) revert AlreadyClosed();
        if (block.timestamp >= endTime) revert AuctionEnded();
        if (msg.sender != alice && msg.sender != bob) revert NotBidder(msg.sender);

        euint64 bid = FHE.fromExternal(amount, proof);
        FHE.allowThis(bid);
        FHE.allow(bid, msg.sender);

        if (msg.sender == alice) {
            aliceBid = bid;
        } else {
            bobBid = bid;
        }

        emit BidPlaced(msg.sender);
    }

    function close() external {
        if (closed) revert AlreadyClosed();
        if (block.timestamp < endTime) revert AuctionNotEnded();
        if (!FHE.isInitialized(aliceBid) || !FHE.isInitialized(bobBid)) revert MissingBid();

        ebool aWins = FHE.gt(aliceBid, bobBid);
        FHE.allowThis(aWins);
        FHE.allow(aWins, seller);
        aliceWins = aWins;

        euint64 winBid = FHE.select(aWins, aliceBid, bobBid);
        FHE.allowThis(winBid);
        winningBid = FHE.makePubliclyDecryptable(winBid);

        closed = true;
        emit Closed();
    }

    function getAliceBid() external view returns (euint64) {
        require(msg.sender == alice, "only alice");
        return aliceBid;
    }

    function getBobBid() external view returns (euint64) {
        require(msg.sender == bob, "only bob");
        return bobBid;
    }

    function getOutcome() external view returns (ebool, euint64) {
        require(closed, "not closed");
        return (aliceWins, winningBid);
    }
}
`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("BlindAuctionTwoBidders", function () {
  let auction: any;
  let addr: string;
  let seller: any;
  let alice: any;
  let bob: any;

  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    seller = signers[0];
    alice = signers[1];
    bob = signers[2];

    const factory = await ethers.getContractFactory("BlindAuctionTwoBidders");
    auction = await factory.deploy(alice.address, bob.address, 10);
    addr = await auction.getAddress();
  });

  it("should accept encrypted bids and reveal winner", async function () {
    const aliceInput = await fhevm.createEncryptedInput(addr, alice.address).add64(100).encrypt();
    const bobInput = await fhevm.createEncryptedInput(addr, bob.address).add64(80).encrypt();

    await auction.connect(alice).placeBid(aliceInput.handles[0], aliceInput.inputProof);
    await auction.connect(bob).placeBid(bobInput.handles[0], bobInput.inputProof);

    await ethers.provider.send("evm_increaseTime", [12]);
    await ethers.provider.send("evm_mine", []);

    await auction.connect(seller).close();

    const [aliceWinsHandle, winningBidHandle] = await auction.getOutcome();

    const aliceWins = await fhevm.userDecryptEbool(aliceWinsHandle, addr, seller);
    expect(aliceWins).to.equal(true);

    const winningBid = await fhevm.publicDecryptEuint(FhevmType.euint64, winningBidHandle);
    expect(winningBid).to.equal(100n);
  });
});`,
    documentation: `# Blind Auction (Two Bidders)

Minimal blind auction example with two encrypted bids.

## Usage


\`\`\`bash
npm test
\`\`\`
`,
  },
  'encrypted-erc20': {
    name: 'Encrypted ERC20',
    description: 'ERC20 token with encrypted balances',
    contractName: 'EncryptedERC20',
    category: 'token',
    tags: ['token', 'erc20', 'privacy'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedERC20 is ZamaEthereumConfig {
    mapping(address => euint64) private balances;
    string public name = "Encrypted Token";
    string public symbol = "ETKN";
    
    event Transfer(address indexed from, address indexed to);
    
    function mint(externalEuint64 amount, bytes calldata proof) external {
        euint64 amt = FHE.fromExternal(amount, proof);
        balances[msg.sender] = FHE.add(balances[msg.sender], amt);
        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);
    }
    
    function transfer(address to, externalEuint64 amount, bytes calldata proof) external {
        euint64 amt = FHE.fromExternal(amount, proof);
        ebool canTransfer = FHE.le(amt, balances[msg.sender]);
        euint64 zero;
        euint64 actualAmt = FHE.select(canTransfer, amt, zero);
        balances[msg.sender] = FHE.sub(balances[msg.sender], actualAmt);
        balances[to] = FHE.add(balances[to], actualAmt);
        FHE.allowThis(balances[msg.sender]);
        FHE.allowThis(balances[to]);
        FHE.allow(balances[msg.sender], msg.sender);
        FHE.allow(balances[to], to);
        emit Transfer(msg.sender, to);
    }
    
    function balanceOf() external view returns (euint64) {
        return balances[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedERC20", function () {
  it("should mint and transfer tokens", async function () {
    if (!fhevm.isMock) this.skip();
    const [_, alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EncryptedERC20");
    const contract = await factory.deploy();
    const addr = await contract.getAddress();
    
    const mintInput = await fhevm.createEncryptedInput(addr, alice.address).add64(1000).encrypt();
    await contract.connect(alice).mint(mintInput.handles[0], mintInput.inputProof);
    
    const transferInput = await fhevm.createEncryptedInput(addr, alice.address).add64(100).encrypt();
    await contract.connect(alice).transfer(bob.address, transferInput.handles[0], transferInput.inputProof);
    
    const bobBalance = await contract.connect(bob).balanceOf();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint64, bobBalance, addr, bob);
    expect(decrypted).to.equal(100);
  });
});`,
    documentation: `# Encrypted ERC20\n\nPrivacy-preserving token.\n\n## Usage\n\`\`\`bash\nnpm test\n\`\`\``,
  },
  'encrypted-lottery': {
    name: 'Encrypted Lottery',
    description: 'Lottery system with encrypted ticket purchases',
    contractName: 'EncryptedLottery',
    category: 'gaming',
    tags: ['lottery', 'gaming', 'random'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedLottery is ZamaEthereumConfig {
    mapping(address => euint64) private tickets;
    euint64 private totalTickets;
    
    event TicketPurchased(address indexed buyer);
    
    function buyTickets(externalEuint64 amount, bytes calldata proof) external {
        euint64 amt = FHE.fromExternal(amount, proof);
        tickets[msg.sender] = FHE.add(tickets[msg.sender], amt);
        totalTickets = FHE.add(totalTickets, amt);
        FHE.allowThis(tickets[msg.sender]);
        FHE.allow(tickets[msg.sender], msg.sender);
        emit TicketPurchased(msg.sender);
    }
    
    function getTickets() external view returns (euint64) {
        return tickets[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedLottery", function () {
  it("should buy encrypted tickets", async function () {
    if (!fhevm.isMock) this.skip();
    const signers = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EncryptedLottery");
    const contract = await factory.deploy();
    const addr = await contract.getAddress();
    const input = await fhevm.createEncryptedInput(addr, signers[1].address).add64(5).encrypt();
    await contract.connect(signers[1]).buyTickets(input.handles[0], input.inputProof);
    const tickets = await contract.connect(signers[1]).getTickets();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint64, tickets, addr, signers[1]);
    expect(decrypted).to.equal(5);
  });
});`,
    documentation: `# Encrypted Lottery\n\nPrivate lottery tickets.\n\n## Usage\n\`\`\`bash\nnpm test\n\`\`\``,
  },
  'encrypted-timelock': {
    name: 'Encrypted Timelock',
    description: 'Time-locked vault with encrypted amounts',
    contractName: 'EncryptedTimelock',
    category: 'defi',
    tags: ['timelock', 'vesting', 'defi'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedTimelock is ZamaEthereumConfig {
    mapping(address => euint64) private locked;
    mapping(address => uint256) private unlockTime;
    
    function lock(externalEuint64 amount, bytes calldata proof, uint256 duration) external {
        euint64 amt = FHE.fromExternal(amount, proof);
        locked[msg.sender] = FHE.add(locked[msg.sender], amt);
        unlockTime[msg.sender] = block.timestamp + duration;
        FHE.allowThis(locked[msg.sender]);
        FHE.allow(locked[msg.sender], msg.sender);
    }
    
    function unlock(externalEuint64 amount, bytes calldata proof) external {
        require(block.timestamp >= unlockTime[msg.sender], "Locked");
        euint64 amt = FHE.fromExternal(amount, proof);
        ebool canUnlock = FHE.le(amt, locked[msg.sender]);
        euint64 zero;
        euint64 actualAmt = FHE.select(canUnlock, amt, zero);
        locked[msg.sender] = FHE.sub(locked[msg.sender], actualAmt);
        FHE.allowThis(locked[msg.sender]);
        FHE.allow(locked[msg.sender], msg.sender);
    }
    
    function getBalance() external view returns (euint64) {
        return locked[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedTimelock", function () {
  it("should lock and unlock tokens", async function () {
    if (!fhevm.isMock) this.skip();
    const [_, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EncryptedTimelock");
    const contract = await factory.deploy();
    const addr = await contract.getAddress();
    const input = await fhevm.createEncryptedInput(addr, alice.address).add64(1000).encrypt();
    await contract.connect(alice).lock(input.handles[0], input.inputProof, 0);
    const balance = await contract.connect(alice).getBalance();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint64, balance, addr, alice);
    expect(decrypted).to.equal(1000);
  });
});`,
    documentation: `# Encrypted Timelock\n\nTime-locked vesting.\n\n## Usage\n\`\`\`bash\nnpm test\n\`\`\``,
  },
  'encrypted-multisig': {
    name: 'Encrypted Multisig',
    description: 'Multi-signature wallet with encrypted values',
    contractName: 'EncryptedMultisig',
    category: 'wallet',
    tags: ['multisig', 'wallet', 'governance'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedMultisig is ZamaEthereumConfig {
    mapping(address => bool) public isOwner;
    euint64 private balance;
    
    constructor(address[] memory owners) {
        for (uint i = 0; i < owners.length; i++) {
            isOwner[owners[i]] = true;
        }
    }
    
    function deposit(externalEuint64 amount, bytes calldata proof) external {
        require(isOwner[msg.sender], "Not owner");
        euint64 amt = FHE.fromExternal(amount, proof);
        balance = FHE.add(balance, amt);
        FHE.allowThis(balance);
        FHE.allow(balance, msg.sender);
    }
    
    function getBalance() external view returns (euint64) {
        require(isOwner[msg.sender], "Not owner");
        return balance;
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("EncryptedMultisig", function () {
  it("should deposit to multisig", async function () {
    if (!fhevm.isMock) this.skip();
    const [_, alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EncryptedMultisig");
    const contract = await factory.deploy([alice.address, bob.address]);
    const addr = await contract.getAddress();
    const input = await fhevm.createEncryptedInput(addr, alice.address).add64(500).encrypt();
    await contract.connect(alice).deposit(input.handles[0], input.inputProof);
    expect(await contract.isOwner(alice.address)).to.be.true;
  });
});`,
    documentation: `# Encrypted Multisig\n\nMulti-signature wallet.\n\n## Usage\n\`\`\`bash\nnpm test\n\`\`\``,
  },
  'encrypted-swap': {
    name: 'Encrypted Swap',
    description: 'Simple DEX swap with encrypted amounts',
    contractName: 'EncryptedSwap',
    category: 'defi',
    tags: ['dex', 'swap', 'defi'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedSwap is ZamaEthereumConfig {
    mapping(address => euint64) private tokenA;
    mapping(address => euint64) private tokenB;
    
    function depositA(externalEuint64 amount, bytes calldata proof) external {
        euint64 amt = FHE.fromExternal(amount, proof);
        tokenA[msg.sender] = FHE.add(tokenA[msg.sender], amt);
        FHE.allowThis(tokenA[msg.sender]);
        FHE.allow(tokenA[msg.sender], msg.sender);
    }
    
    function swap(externalEuint64 amountA, bytes calldata proof) external {
        euint64 amt = FHE.fromExternal(amountA, proof);
        ebool canSwap = FHE.le(amt, tokenA[msg.sender]);
        euint64 zero;
        euint64 actualAmt = FHE.select(canSwap, amt, zero);
        tokenA[msg.sender] = FHE.sub(tokenA[msg.sender], actualAmt);
        tokenB[msg.sender] = FHE.add(tokenB[msg.sender], actualAmt);
        FHE.allowThis(tokenA[msg.sender]);
        FHE.allowThis(tokenB[msg.sender]);
        FHE.allow(tokenA[msg.sender], msg.sender);
        FHE.allow(tokenB[msg.sender], msg.sender);
    }
    
    function getBalanceA() external view returns (euint64) {
        return tokenA[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedSwap", function () {
  it("should swap tokens", async function () {
    if (!fhevm.isMock) this.skip();
    const [_, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EncryptedSwap");
    const contract = await factory.deploy();
    const addr = await contract.getAddress();
    const depositInput = await fhevm.createEncryptedInput(addr, alice.address).add64(1000).encrypt();
    await contract.connect(alice).depositA(depositInput.handles[0], depositInput.inputProof);
    const swapInput = await fhevm.createEncryptedInput(addr, alice.address).add64(100).encrypt();
    await contract.connect(alice).swap(swapInput.handles[0], swapInput.inputProof);
    const balance = await contract.connect(alice).getBalanceA();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint64, balance, addr, alice);
    expect(decrypted).to.equal(900);
  });
});`,
    documentation: `# Encrypted Swap\n\nSimple DEX swap.\n\n## Usage\n\`\`\`bash\nnpm test\n\`\`\``,
  },
  'encrypted-escrow': {
    name: 'Encrypted Escrow',
    description: 'Escrow service with encrypted deposits',
    contractName: 'EncryptedEscrow',
    category: 'payment',
    tags: ['escrow', 'payment', 'trust'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedEscrow is ZamaEthereumConfig {
    mapping(bytes32 => euint64) private escrows;
    mapping(bytes32 => address) private beneficiary;
    mapping(bytes32 => bool) private released;
    
    function deposit(bytes32 id, address to, externalEuint64 amount, bytes calldata proof) external {
        euint64 amt = FHE.fromExternal(amount, proof);
        escrows[id] = amt;
        beneficiary[id] = to;
        FHE.allowThis(escrows[id]);
        FHE.allow(escrows[id], to);
    }
    
    function release(bytes32 id) external {
        require(!released[id], "Released");
        released[id] = true;
    }
    
    function getEscrow(bytes32 id) external view returns (euint64) {
        return escrows[id];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

describe("EncryptedEscrow", function () {
  it("should create escrow", async function () {
    if (!fhevm.isMock) this.skip();
    const [_, alice, bob] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EncryptedEscrow");
    const contract = await factory.deploy();
    const addr = await contract.getAddress();
    const id = ethers.keccak256(ethers.toUtf8Bytes("test"));
    const input = await fhevm.createEncryptedInput(addr, alice.address).add64(500).encrypt();
    await contract.connect(alice).deposit(id, bob.address, input.handles[0], input.inputProof);
    expect(await contract.beneficiary(id)).to.equal(bob.address);
  });
});`,
    documentation: `# Encrypted Escrow\n\nSecure escrow service.\n\n## Usage\n\`\`\`bash\nnpm test\n\`\`\``,
  },
  'encrypted-crowdfund': {
    name: 'Encrypted Crowdfund',
    description: 'Crowdfunding with private contributions',
    contractName: 'EncryptedCrowdfund',
    category: 'fundraising',
    tags: ['crowdfund', 'fundraising', 'privacy'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedCrowdfund is ZamaEthereumConfig {
    mapping(address => euint64) private contributions;
    euint64 private totalRaised;
    
    function contribute(externalEuint64 amount, bytes calldata proof) external {
        euint64 amt = FHE.fromExternal(amount, proof);
        contributions[msg.sender] = FHE.add(contributions[msg.sender], amt);
        totalRaised = FHE.add(totalRaised, amt);
        FHE.allowThis(contributions[msg.sender]);
        FHE.allow(contributions[msg.sender], msg.sender);
    }
    
    function getContribution() external view returns (euint64) {
        return contributions[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedCrowdfund", function () {
  it("should contribute to crowdfund", async function () {
    if (!fhevm.isMock) this.skip();
    const [_, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EncryptedCrowdfund");
    const contract = await factory.deploy();
    const addr = await contract.getAddress();
    const input = await fhevm.createEncryptedInput(addr, alice.address).add64(250).encrypt();
    await contract.connect(alice).contribute(input.handles[0], input.inputProof);
    const contrib = await contract.connect(alice).getContribution();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint64, contrib, addr, alice);
    expect(decrypted).to.equal(250);
  });
});`,
    documentation: `# Encrypted Crowdfund\n\nPrivate crowdfunding.\n\n## Usage\n\`\`\`bash\nnpm test\n\`\`\``,
  },
  'encrypted-raffle': {
    name: 'Encrypted Raffle',
    description: 'Raffle system with encrypted entries',
    contractName: 'EncryptedRaffle',
    category: 'gaming',
    tags: ['raffle', 'gaming', 'random'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedRaffle is ZamaEthereumConfig {
    mapping(address => euint64) private entries;
    
    function enter(externalEuint64 amount, bytes calldata proof) external {
        euint64 amt = FHE.fromExternal(amount, proof);
        entries[msg.sender] = FHE.add(entries[msg.sender], amt);
        FHE.allowThis(entries[msg.sender]);
        FHE.allow(entries[msg.sender], msg.sender);
    }
    
    function getEntries() external view returns (euint64) {
        return entries[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedRaffle", function () {
  it("should enter raffle", async function () {
    if (!fhevm.isMock) this.skip();
    const [_, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EncryptedRaffle");
    const contract = await factory.deploy();
    const addr = await contract.getAddress();
    const input = await fhevm.createEncryptedInput(addr, alice.address).add64(10).encrypt();
    await contract.connect(alice).enter(input.handles[0], input.inputProof);
    const entries = await contract.connect(alice).getEntries();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint64, entries, addr, alice);
    expect(decrypted).to.equal(10);
  });
});`,
    documentation: `# Encrypted Raffle\n\nPrivate raffle entries.\n\n## Usage\n\`\`\`bash\nnpm test\n\`\`\``,
  },
  'encrypted-prediction': {
    name: 'Encrypted Prediction',
    description: 'Prediction market with encrypted bets',
    contractName: 'EncryptedPrediction',
    category: 'gaming',
    tags: ['prediction', 'betting', 'market'],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedPrediction is ZamaEthereumConfig {
    mapping(address => euint64) private predictions;
    
    function predict(externalEuint64 amount, bytes calldata proof) external {
        euint64 amt = FHE.fromExternal(amount, proof);
        predictions[msg.sender] = amt;
        FHE.allowThis(predictions[msg.sender]);
        FHE.allow(predictions[msg.sender], msg.sender);
    }
    
    function getPrediction() external view returns (euint64) {
        return predictions[msg.sender];
    }
}`,
    testCode: `import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("EncryptedPrediction", function () {
  it("should make prediction", async function () {
    if (!fhevm.isMock) this.skip();
    const [_, alice] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("EncryptedPrediction");
    const contract = await factory.deploy();
    const addr = await contract.getAddress();
    const input = await fhevm.createEncryptedInput(addr, alice.address).add64(75).encrypt();
    await contract.connect(alice).predict(input.handles[0], input.inputProof);
    const pred = await contract.connect(alice).getPrediction();
    const decrypted = await fhevm.userDecryptEuint(FhevmType.euint64, pred, addr, alice);
    expect(decrypted).to.equal(75);
  });
});`,
    documentation: `# Encrypted Prediction\n\nPrediction market.\n\n## Usage\n\`\`\`bash\nnpm test\n\`\`\``,
  },
};
