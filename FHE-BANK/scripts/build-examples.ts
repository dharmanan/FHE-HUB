#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { examples } from './examples';

const CORE_EXAMPLES: string[] = [
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

function sh(command: string, cwd?: string) {
	execSync(command, { cwd, stdio: 'inherit' });
}

function rmDir(targetPath: string) {
	if (!fs.existsSync(targetPath)) return;
	sh(`rm -rf "${targetPath}"`);
}

function parseArgs(argv: string[]) {
	const args = argv.slice(2);
	const onlyIndex = args.indexOf('--only');
	const only = onlyIndex >= 0 ? args[onlyIndex + 1] : undefined;
	const core = args.includes('--core');
	return { only, core };
}

function main() {
	const { only, core } = parseArgs(process.argv);

	const rootDir = path.resolve(__dirname, '..');
	const outDir = path.join(rootDir, 'examples');

	if (only && !examples[only]) {
		console.error(`Unknown example for --only: ${only}`);
		process.exit(1);
	}
	if (core) {
		const unknownCore = CORE_EXAMPLES.filter((k) => examples[k] == null);
		if (unknownCore.length > 0) {
			console.error(`CORE_EXAMPLES contains unknown keys: ${unknownCore.join(', ')}`);
			process.exit(1);
		}
	}

	const keys = Object.keys(examples).sort();
	const selectedKeys = only ? [only] : core ? [...CORE_EXAMPLES] : keys;

	fs.mkdirSync(outDir, { recursive: true });

	console.log(`\n📦 Building examples into: ${outDir}`);
	if (only) console.log(`Mode: --only ${only}`);
	if (core && !only) console.log(`Mode: --core (${selectedKeys.length} examples)`);

	for (const key of selectedKeys) {
		const exampleDir = path.join(outDir, key);

		console.log(`\n=== Build: ${key} ===`);
		rmDir(exampleDir);
		sh(`npm run create-example -- create ${key} ${exampleDir}`, rootDir);

		// Keep the generated repos clean for git: don't commit lockfiles by default.
		const lockPath = path.join(exampleDir, 'package-lock.json');
		if (fs.existsSync(lockPath)) fs.rmSync(lockPath, { force: true });
	}

	console.log(`\n✅ Done.`);
	console.log(`Next: cd examples/<example-key> && npm install && npm test`);
	console.log(`Tip: use --core to avoid regenerating everything.`);
}

main();