#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const EXAMPLES: string[] = [
  // Core required set
  'encrypted-counter',
  'encrypted-arithmetic',
  'encrypted-equality',
  'encrypted-encrypt-single',
  'encrypted-encrypt-multiple',
  'encrypted-user-decrypt-single',
  'encrypted-user-decrypt-multiple',
  'encrypted-public-decrypt-single',
  'encrypted-public-decrypt-multiple',
  // Didactic extras
  'encrypted-access-control-transient',
  'encrypted-input-proof',
  'encrypted-anti-patterns',
  'encrypted-handles-lifecycle',
  // OpenZeppelin confidential / ERC7984
  'oz-confidential-fungible-token',
  'oz-confidential-erc20-wrapper',
  'oz-confidential-vesting-wallet',
  'oz-confidential-swap',
  // Marketplace
  'encrypted-blind-auction',
];

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const onlyIndex = args.indexOf('--only');
  const fromIndex = args.indexOf('--from');
  const only = onlyIndex >= 0 ? args[onlyIndex + 1] : undefined;
  const from = fromIndex >= 0 ? args[fromIndex + 1] : undefined;
  return { only, from };
}

function sh(command: string, cwd?: string) {
  execSync(command, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      // Keep npm quieter & more deterministic in CI
      npm_config_fund: 'false',
      npm_config_audit: 'false',
    },
  });
}

function main() {
  const { only, from } = parseArgs(process.argv);

  const rootDir = path.resolve(__dirname, '..');
  const outDir = path.join(rootDir, 'output', '.smoke');

  let selectedExamples = [...EXAMPLES];
  if (only) {
    if (!EXAMPLES.includes(only)) {
      throw new Error(`Unknown example for --only: ${only}`);
    }
    selectedExamples = [only];
  } else if (from) {
    const fromIdx = EXAMPLES.indexOf(from);
    if (fromIdx === -1) {
      throw new Error(`Unknown example for --from: ${from}`);
    }
    selectedExamples = EXAMPLES.slice(fromIdx);
  }

  console.log(`\n🧪 Smoke test starting (${selectedExamples.length} repos)\nRoot: ${rootDir}`);
  if (only) console.log(`Mode: --only ${only}`);
  if (from) console.log(`Mode: --from ${from}`);

  if (fs.existsSync(outDir)) {
    console.log(`\n🧹 Cleaning previous output: ${outDir}`);
    // Deleting node_modules trees can be very slow via JS recursion; use system rm.
    sh(`rm -rf "${outDir}"`, rootDir);
  }
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n🧪 Smoke test output: ${outDir}`);

  for (const exampleKey of selectedExamples) {
    const exampleDir = path.join(outDir, exampleKey);

    const startedAt = Date.now();
    let succeeded = false;

    console.log(`\n=== Generate: ${exampleKey} ===`);

    try {
      sh(`npm run create-example -- create ${exampleKey} ${exampleDir}`, rootDir);

      console.log(`\n=== Test: ${exampleKey} ===`);
      // Generated repos may adjust dependencies per-example; prefer npm install.
      // (npm ci requires package-lock.json to be perfectly in-sync, which won't
      // be true if the template lockfile is copied and then package.json changes.)
      sh(`npm install --loglevel=warn`, exampleDir);
      sh(`npm test`, exampleDir);
      succeeded = true;
    } catch (e) {
      console.error(`\n❌ Smoke test failed for: ${exampleKey}`);
      throw e;
    } finally {
      if (succeeded && process.env.SMOKE_KEEP_NODE_MODULES !== 'true') {
        console.log(`\n🧹 Cleaning node_modules: ${exampleKey}`);
        sh(`rm -rf "${path.join(exampleDir, 'node_modules')}"`, exampleDir);
        sh(`rm -f "${path.join(exampleDir, 'package-lock.json')}"`, exampleDir);
      }
      const elapsedMs = Date.now() - startedAt;
      console.log(`=== Done: ${exampleKey} (${Math.round(elapsedMs / 1000)}s) ===`);
    }
  }

  console.log(`\n✅ Smoke test passed (${selectedExamples.length} repos).`);
}

main();
