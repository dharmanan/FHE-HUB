#!/usr/bin/env node

/**
 * create-fhevm-category.ts
 * 
 * CLI tool for generating category-based FHEVM example projects
 * Creates a structured project containing multiple related examples
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { examples, type ExampleConfig } from './examples';

interface CategoryConfig {
  name: string;
  description: string;
  examples: string[];
  readme: string;
}

const categories: Record<string, CategoryConfig> = {
  basic: {
    name: 'Basic',
    description: 'Basic FHE operations and encrypted state',
    examples: ['encrypted-counter', 'encrypted-arithmetic', 'encrypted-equality', 'encrypted-balance'],
    readme: `# Basic FHEVM Examples

This folder contains multiple standalone repos (one per example).

## Included examples

- encrypted-counter
- encrypted-balance

## Usage

Each subfolder is a standalone Hardhat repo:

\`\`\`bash
cd encrypted-counter
npm install
npm test
\`\`\`
`,
  },
  encryption: {
    name: 'Encryption',
    description: 'How encrypted inputs are created client-side and consumed on-chain (fromExternal + inputProof)',
    examples: ['encrypted-encrypt-single', 'encrypted-encrypt-multiple'],
    readme: `# Encryption FHEVM Examples

Standalone repos focused on encrypted inputs.
`,
  },
  'user-decryption': {
    name: 'User Decryption',
    description: 'How a user decrypts encrypted values returned by contracts in tests',
    examples: ['encrypted-user-decrypt-single', 'encrypted-user-decrypt-multiple'],
    readme: `# User Decryption FHEVM Examples

Standalone repos focused on user decryption.
`,
  },
  'public-decryption': {
    name: 'Public Decryption',
    description: 'How encrypted values can be made publicly decryptable and then decrypted without user-specific permissions',
    examples: ['encrypted-public-decrypt-single', 'encrypted-public-decrypt-multiple'],
    readme: `# Public Decryption FHEVM Examples

Standalone repos focused on public decryption.
`,
  },
  'access-control': {
    name: 'Access Control',
    description: 'FHE permissions patterns: allow/allowThis and allowTransient',
    examples: ['encrypted-access-control-transient'],
    readme: `# Access Control FHEVM Examples

Standalone repos focused on permissions.
`,
  },
  'input-proof': {
    name: 'Input Proof',
    description: 'What inputProof binds to, and how invalid proofs fail',
    examples: ['encrypted-input-proof'],
    readme: `# Input Proof FHEVM Examples

Standalone repos focused on inputProof usage.
`,
  },
  'anti-patterns': {
    name: 'Anti-patterns',
    description: 'Common mistakes and failing patterns when working with encrypted values',
    examples: ['encrypted-anti-patterns'],
    readme: `# Anti-patterns FHEVM Examples

Standalone repos focused on failing patterns.
`,
  },
  'handles-lifecycle': {
    name: 'Handles Lifecycle',
    description: 'How encrypted handles behave over time and across operations',
    examples: ['encrypted-handles-lifecycle'],
    readme: `# Handles Lifecycle FHEVM Examples

Standalone repos focused on handle lifecycle.
`,
  },
  'oz-confidential': {
    name: 'OZ Confidential',
    description: 'OpenZeppelin confidential contracts (starter examples)',
    examples: [
      'oz-confidential-fungible-token',
      'oz-confidential-erc20-wrapper',
      'oz-confidential-vesting-wallet',
      'oz-confidential-swap',
    ],
    readme: `# OZ Confidential Examples

Standalone repos using OpenZeppelin confidential contracts.
`,
  },
  defi: {
    name: 'DeFi',
    description: 'DeFi-oriented examples using encrypted balances',
    examples: ['encrypted-collateral', 'encrypted-vault', 'encrypted-timelock', 'encrypted-swap'],
    readme: `# DeFi FHEVM Examples

This folder contains multiple standalone repos (one per example).

## Included examples

- encrypted-collateral
- encrypted-vault
- encrypted-timelock
- encrypted-swap
`,
  },
  governance: {
    name: 'Governance',
    description: 'Governance patterns (voting, multisig) with encrypted values',
    examples: ['encrypted-voting', 'encrypted-multisig'],
    readme: `# Governance FHEVM Examples

Standalone repos for governance patterns.
`,
  },
  token: {
    name: 'Token',
    description: 'Token primitives with encrypted balances',
    examples: ['encrypted-erc20'],
    readme: `# Token FHEVM Examples
`,
  },
  gaming: {
    name: 'Gaming',
    description: 'Gaming-style examples (lottery, raffle, prediction) with private state',
    examples: ['encrypted-lottery', 'encrypted-raffle', 'encrypted-prediction'],
    readme: `# Gaming FHEVM Examples
`,
  },
  marketplace: {
    name: 'Marketplace',
    description: 'Market examples (sealed-bid auction)',
    examples: ['encrypted-auction', 'encrypted-blind-auction'],
    readme: `# Marketplace FHEVM Examples
`,
  },
  payment: {
    name: 'Payment',
    description: 'Payment flow examples (escrow)',
    examples: ['encrypted-escrow'],
    readme: `# Payment FHEVM Examples
`,
  },
  fundraising: {
    name: 'Fundraising',
    description: 'Fundraising examples (crowdfunding)',
    examples: ['encrypted-crowdfund'],
    readme: `# Fundraising FHEVM Examples
`,
  },
};

async function createCategory(categoryKey: string, outputDir: string) {
  const category = categories[categoryKey];
  
  if (!category) {
    console.error(`Category '${categoryKey}' not found`);
    process.exit(1);
  }

  const absoluteOutputDir = path.isAbsolute(outputDir)
    ? outputDir
    : path.resolve(process.cwd(), outputDir);

  console.log(`Creating category: ${category.name}`);
  console.log(`Output directory: ${absoluteOutputDir}`);

  if (!fs.existsSync(absoluteOutputDir)) {
    fs.mkdirSync(absoluteOutputDir, { recursive: true });
  }

  console.log(`Generating ${category.examples.length} standalone repos...`);
  for (const exampleKey of category.examples) {
    if (!examples[exampleKey]) {
      console.warn(`⚠️  Skipping unknown example key: ${exampleKey}`);
      continue;
    }
    const exampleDir = path.join(absoluteOutputDir, exampleKey);
    await createStandaloneExample(exampleKey, exampleDir);
  }

  fs.writeFileSync(path.join(absoluteOutputDir, 'README.md'), category.readme);

  console.log(`✅ Category '${category.name}' created successfully!`);
  console.log(`📁 Location: ${absoluteOutputDir}`);
}

async function createStandaloneExample(exampleKey: string, outputDir: string) {
  const example: ExampleConfig = examples[exampleKey];

  if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0) {
    throw new Error(`Output directory already exists and is not empty: ${outputDir}`);
  }

  // Use local template if available, otherwise clone from GitHub
  const localTemplatePath = path.resolve(__dirname, '../fhevm-hardhat-template');
  const useLocalTemplate = fs.existsSync(localTemplatePath);

  if (useLocalTemplate) {
    execSync(`cp -r "${localTemplatePath}" "${outputDir}"`, { stdio: 'inherit' });
  } else {
    const baseTemplateUrl = 'https://github.com/zama-ai/fhevm-hardhat-template.git';
    execSync(`git clone ${baseTemplateUrl} "${outputDir}"`, { stdio: 'inherit' });
  }

  const gitDir = path.join(outputDir, '.git');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  cleanupTemplateBoilerplate(outputDir);

  const contractsDir = path.join(outputDir, 'contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(contractsDir, `${example.contractName}.sol`), example.contractCode);

  const testDir = path.join(outputDir, 'test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  fs.writeFileSync(path.join(testDir, `${example.contractName}.test.ts`), example.testCode);
  fs.writeFileSync(path.join(outputDir, 'README.md'), example.documentation);

  updatePackageJson(outputDir, example);
}

function cleanupTemplateBoilerplate(outputDir: string) {
  const filesToRemove = [
    path.join(outputDir, 'contracts', 'FHECounter.sol'),
    path.join(outputDir, 'test', 'FHECounter.ts'),
    path.join(outputDir, 'test', 'FHECounterSepolia.ts'),
    path.join(outputDir, 'tasks', 'FHECounter.ts'),
  ];

  for (const filePath of filesToRemove) {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  }

  const hardhatConfigPath = path.join(outputDir, 'hardhat.config.ts');
  if (fs.existsSync(hardhatConfigPath)) {
    const raw = fs.readFileSync(hardhatConfigPath, 'utf8');
    const cleaned = raw
      .replace(/^\s*import\s+["']\.\/tasks\/FHECounter["'];\s*\r?\n/m, '')
      .replace(/^\s*import\s+["']\.\/tasks\/FHECounter["']\s*\r?\n/m, '');
    if (cleaned !== raw) fs.writeFileSync(hardhatConfigPath, cleaned);
  }
}

function updatePackageJson(outputDir: string, example: ExampleConfig) {
  const packageJsonPath = path.join(outputDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return;

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.name = `fhevm-example-${example.name.toLowerCase().replace(/\s+/g, '-')}`;
  packageJson.description = example.description;
  packageJson.keywords = [...(packageJson.keywords || []), ...example.tags];

  if (example.extraDependencies && typeof example.extraDependencies === 'object') {
    packageJson.dependencies = {
      ...(packageJson.dependencies || {}),
      ...example.extraDependencies,
    };
  }

  if (example.extraDevDependencies && typeof example.extraDevDependencies === 'object') {
    packageJson.devDependencies = {
      ...(packageJson.devDependencies || {}),
      ...example.extraDevDependencies,
    };
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

const args = process.argv.slice(2);
const command = args[0];
const categoryKey = args[1];
const outputDir = args[2] || `./${categoryKey}`;

if (command === 'create' && categoryKey) {
  createCategory(categoryKey, outputDir);
} else if (command === 'list') {
  console.log('Available categories:');
  Object.keys(categories).forEach(key => {
    const cat = categories[key];
    console.log(`\n${key}:`);
    console.log(`  ${cat.description}`);
    console.log(`  Examples: ${cat.examples.join(', ')}`);
  });
} else {
  console.log('Usage:');
  console.log('  ts-node create-fhevm-category.ts create <category-key> [output-dir]');
  console.log('  ts-node create-fhevm-category.ts list');
  process.exit(1);
}