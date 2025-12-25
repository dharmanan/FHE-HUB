#!/usr/bin/env node

/**
 * create-fhevm-example.ts
 * 
 * CLI tool for generating standalone FHEVM example repositories
 * This script clones the base template and customizes it with specific contracts and tests
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { examples, type ExampleConfig } from './examples';

async function createExample(exampleKey: string, outputDir: string) {
  const example = examples[exampleKey];
  
  if (!example) {
    console.error(`Example '${exampleKey}' not found`);
    process.exit(1);
  }

  // Convert to absolute path
  const absoluteOutputDir = path.isAbsolute(outputDir) 
    ? outputDir 
    : path.resolve(process.cwd(), outputDir);

  console.log(`Creating example: ${example.name}`);
  console.log(`Output directory: ${absoluteOutputDir}`);

  if (fs.existsSync(absoluteOutputDir) && fs.readdirSync(absoluteOutputDir).length > 0) {
    console.error(`Output directory already exists and is not empty: ${absoluteOutputDir}`);
    process.exit(1);
  }

  // Create parent directory if it doesn't exist
  const parentDir = path.dirname(absoluteOutputDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Use local template if available, otherwise clone from GitHub
  const localTemplatePath = path.resolve(__dirname, '../fhevm-hardhat-template');
  const useLocalTemplate = fs.existsSync(localTemplatePath);
  
  if (useLocalTemplate) {
    console.log('Copying local base template...');
    try {
      execSync(`cp -r "${localTemplatePath}" "${absoluteOutputDir}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to copy local template');
      process.exit(1);
    }
  } else {
    const baseTemplateUrl = 'https://github.com/zama-ai/fhevm-hardhat-template.git';
    console.log('Cloning base template from GitHub...');
    try {
      execSync(`git clone ${baseTemplateUrl} "${absoluteOutputDir}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to clone base template');
      process.exit(1);
    }
  }

  const gitDir = path.join(absoluteOutputDir, '.git');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  cleanupTemplateBoilerplate(absoluteOutputDir);

  const contractsDir = path.join(absoluteOutputDir, 'contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(contractsDir, `${example.contractName}.sol`), example.contractCode);

  const testDir = path.join(absoluteOutputDir, 'test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  fs.writeFileSync(path.join(testDir, `${example.contractName}.test.ts`), example.testCode);
  fs.writeFileSync(path.join(absoluteOutputDir, 'README.md'), example.documentation);

  updatePackageJson(absoluteOutputDir, example);
  cleanupCopiedLockfiles(absoluteOutputDir);

  console.log(`✅ Example '${example.name}' created successfully!`);
  console.log(`📁 Location: ${absoluteOutputDir}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${absoluteOutputDir}`);
  console.log(`  npm install`);
  console.log(`  npm test`);
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
  
  if (fs.existsSync(packageJsonPath)) {
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
}

function cleanupCopiedLockfiles(outputDir: string) {
  // The base template may include lockfiles. Since we mutate package.json per-example
  // (name/description + optional deps), any copied lockfile can become stale.
  // Removing it avoids confusing npm ci failures; users can regenerate with npm install.
  const lockfiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'];
  for (const lockfile of lockfiles) {
    const lockPath = path.join(outputDir, lockfile);
    if (fs.existsSync(lockPath)) {
      fs.rmSync(lockPath, { force: true });
    }
  }
}

const args = process.argv.slice(2);
const command = args[0];
const exampleKey = args[1];
const outputDir = args[2] || `./${exampleKey}`;

if (command === 'create' && exampleKey) {
  createExample(exampleKey, outputDir);
} else if (command === 'list') {
  console.log('Available examples:');
  Object.keys(examples).forEach(key => {
    console.log(`  - ${key}: ${examples[key].description}`);
  });
} else {
  console.log('Usage:');
  console.log('  ts-node create-fhevm-example.ts create <example-key> [output-dir]');
  console.log('  ts-node create-fhevm-example.ts list');
  process.exit(1);
}