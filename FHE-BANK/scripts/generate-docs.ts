#!/usr/bin/env node

/**
 * generate-docs.ts
 *
 * Automated documentation generator for FHEVM examples.
 *
 * Modes:
 * - Hub mode: generates docs from the shared examples registry (scripts/examples.ts)
 * - Filesystem mode: generates docs by scanning contracts/ and test/ directories
 *
 * Output is GitBook-compatible: README.md + SUMMARY.md + one markdown file per contract.
 */

import * as fs from 'fs';
import * as path from 'path';

import { examples } from './examples';

interface ParsedContract {
  name: string;
  description: string;
  chapter: string;
  functions: FunctionDoc[];
  events: EventDoc[];

  // Present when generating from the hub registry.
  exampleKey?: string;
  exampleName?: string;
  exampleDocumentation?: string;
}

interface FunctionDoc {
  name: string;
  description: string;
  params: ParamDoc[];
  returns?: string;
  code: string;
}

interface ParamDoc {
  name: string;
  type: string;
  description: string;
}

interface EventDoc {
  name: string;
  description: string;
}

class DocumentationGenerator {
  private outputDir: string;
  private contractsDir: string;
  private testsDir: string;
  private mode: 'hub' | 'filesystem';
  private generatedFiles: Set<string>;

  private static readonly manifestFileName = '.docs-manifest.json';

  constructor(projectRoot: string, outputDir: string, mode: 'hub' | 'filesystem') {
    this.contractsDir = path.join(projectRoot, 'contracts');
    this.testsDir = path.join(projectRoot, 'test');
    this.outputDir = outputDir;
    this.mode = mode;
    this.generatedFiles = new Set();

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generate() {
    console.log('📚 Generating documentation...');

    this.removePreviouslyGeneratedFiles();

    const { contracts, tests } = this.mode === 'hub'
      ? this.parseFromHubRegistry()
      : this.parseFromFilesystem();

    this.generateMainReadme(contracts);

    contracts.forEach(contract => {
      this.generateContractDoc(contract, tests);
    });

    this.generateGitBookSummary(contracts);

    this.writeManifest();

    console.log(`✅ Documentation generated in ${this.outputDir}`);
  }

  private stripLeadingH1(markdown: string): string {
    const trimmed = markdown.trim();
    if (!trimmed) return '';

    const lines = trimmed.split(/\r?\n/);
    if (lines.length === 0) return '';

    // Many registry docs start with "# Title". We already render an H1, so drop it.
    if (lines[0].startsWith('# ')) {
      return lines.slice(1).join('\n').trim();
    }
    return trimmed;
  }

  private removePreviouslyGeneratedFiles() {
    const manifestPath = path.join(this.outputDir, DocumentationGenerator.manifestFileName);
    if (!fs.existsSync(manifestPath)) return;

    try {
      const raw = fs.readFileSync(manifestPath, 'utf8');
      const parsed = JSON.parse(raw) as { files?: string[] };
      const files = Array.isArray(parsed.files) ? parsed.files : [];

      for (const fileName of files) {
        // Only allow removing markdown files within outputDir.
        if (!fileName.endsWith('.md')) continue;
        const fullPath = path.join(this.outputDir, fileName);
        if (path.dirname(fullPath) !== this.outputDir) continue;
        if (fs.existsSync(fullPath)) fs.rmSync(fullPath, { force: true });
      }
    } catch {
      // If manifest is corrupted, do nothing to avoid deleting user files.
    }
  }

  private writeGeneratedFile(fileName: string, content: string) {
    const fullPath = path.join(this.outputDir, fileName);
    fs.writeFileSync(fullPath, content);
    this.generatedFiles.add(fileName);
  }

  private writeManifest() {
    const manifestPath = path.join(this.outputDir, DocumentationGenerator.manifestFileName);
    const files = Array.from(this.generatedFiles).sort();
    fs.writeFileSync(manifestPath, JSON.stringify({ files }, null, 2));
  }

  private parseFromHubRegistry(): { contracts: ParsedContract[]; tests: Map<string, string[]> } {
    const contracts: ParsedContract[] = [];
    const tests = new Map<string, string[]>();

    for (const exampleKey of Object.keys(examples)) {
      const example = examples[exampleKey];
      const parsed = this.parseContract(example.contractCode, `${example.contractName}.sol`, example.contractName);
      if (!parsed) continue;

      // In hub registry we use category as chapter unless overridden in contract annotations.
      if (!parsed.chapter || parsed.chapter === 'general') {
        parsed.chapter = example.category;
      }
      if (!parsed.description) {
        parsed.description = example.description;
      }

      parsed.exampleKey = exampleKey;
      parsed.exampleName = example.name;
      parsed.exampleDocumentation = example.documentation;

      contracts.push(parsed);

      // Associate test cases by contract name using the registry's testCode.
      const testDescriptions = this.extractTestCases(example.testCode);
      tests.set(parsed.name, testDescriptions);
    }

    return { contracts, tests };
  }

  private parseFromFilesystem(): { contracts: ParsedContract[]; tests: Map<string, string[]> } {
    const contracts: ParsedContract[] = [];

    const contractFiles = this.collectFilesRecursive(this.contractsDir, (p) => p.endsWith('.sol'));
    for (const filePath of contractFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = this.parseContract(content, path.basename(filePath));
      if (parsed) contracts.push(parsed);
    }

    const tests = this.parseTestsFromFilesystem();
    return { contracts, tests };
  }

  private parseContract(content: string, filename: string, preferredContractName?: string): ParsedContract | null {
    const preferred = preferredContractName?.trim();

    const fallbackNameMatch =
      content.match(/^\s*(?:abstract\s+)?contract\s+(\w+)\b/m) ||
      content.match(/^\s*interface\s+(\w+)\b/m) ||
      content.match(/^\s*library\s+(\w+)\b/m);
    if (!fallbackNameMatch) return null;

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const preferredDeclRegex = preferred
      ? new RegExp(
          String.raw`\/\*\*[\s\S]*?\*\/\s*(?:abstract\s+)?contract\s+${escapeRegExp(preferred)}\b`,
          'm'
        )
      : null;
    const preferredNameRegex = preferred
      ? new RegExp(String.raw`^\s*(?:abstract\s+)?contract\s+${escapeRegExp(preferred)}\b`, 'm')
      : null;

    const name = preferred && preferredNameRegex && preferredNameRegex.test(content) ? preferred : fallbackNameMatch[1];

    // Prefer the doc-comment that is closest to the preferred contract declaration (hub mode)
    // so helper contracts/interfaces earlier in the same source don't “steal” the description.
    const contractCommentMatch = preferredDeclRegex ? content.match(preferredDeclRegex) : null;
    const commentBlock = contractCommentMatch
      ? contractCommentMatch[0].match(/\/\*\*[\s\S]*?\*\//)?.[0]
      : content.match(/\/\*\*[\s\S]*?\*\//)?.[0];

    let description = '';
    let chapter = 'general';

    if (commentBlock) {
      const titleMatch = commentBlock.match(/@title\s+(.+)/);
      const noticeMatch = commentBlock.match(/@notice\s+(.+)/);
      const chapterMatch = commentBlock.match(/(?:@chapter:|chapter:)\s*([\w-]+)/);

      description = noticeMatch ? noticeMatch[1].trim() : titleMatch ? titleMatch[1].trim() : '';
      chapter = chapterMatch ? chapterMatch[1].trim() : 'general';
    }

    const functions = this.parseFunctions(content);
    const events = this.parseEvents(content);

    return { name, description, chapter, functions, events };
  }

  private parseFunctions(content: string): FunctionDoc[] {
    const functions: FunctionDoc[] = [];
    
    const functionRegex = /\/\*\*[\s\S]*?\*\/\s*function\s+(\w+)\s*\([^)]*\)[^{]*\{/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const functionName = match[1];
      
      const commentMatch = fullMatch.match(/\/\*\*([\s\S]*?)\*\//);
      let description = '';
      const params: ParamDoc[] = [];
      let returns: string | undefined;

      if (commentMatch) {
        const comment = commentMatch[1];
        
        const noticeMatch = comment.match(/@notice\s+(.+)/);
        description = noticeMatch ? noticeMatch[1].trim() : '';

        const paramMatches = comment.matchAll(/@param\s+(\w+)\s+(.+)/g);
        for (const pm of paramMatches) {
          params.push({
            name: pm[1],
            type: 'auto',
            description: pm[2].trim()
          });
        }

        const returnMatch = comment.match(/@return\s+(.+)/);
        returns = returnMatch ? returnMatch[1].trim() : undefined;
      }

      const funcSigMatch = fullMatch.match(/function\s+\w+\s*\([^)]*\)[^{]*/);
      const code = funcSigMatch ? funcSigMatch[0] : '';

      functions.push({
        name: functionName,
        description,
        params,
        returns,
        code: code.trim()
      });
    }

    return functions;
  }

  private parseEvents(content: string): EventDoc[] {
    const events: EventDoc[] = [];
    const eventRegex = /event\s+(\w+)\s*\([^)]*\);/g;
    let match;

    while ((match = eventRegex.exec(content)) !== null) {
      events.push({
        name: match[1],
        description: `Event emitted by ${match[1]}`
      });
    }

    return events;
  }

  private parseTestsFromFilesystem(): Map<string, string[]> {
    const tests = new Map<string, string[]>();

    const testFiles = this.collectFilesRecursive(this.testsDir, (p) => p.endsWith('.test.ts'));
    for (const filePath of testFiles) {
      const content = fs.readFileSync(filePath, 'utf8');

      // Prefer describe("ContractName") association when present.
      const describeMatch = content.match(/describe\s*\(\s*["'`](\w+)["'`]/);
      const contractName = describeMatch?.[1] ?? path.basename(filePath).replace(/\.test\.ts$/, '');
      tests.set(contractName, this.extractTestCases(content));
    }

    return tests;
  }

  private extractTestCases(testFileContent: string): string[] {
    const testDescriptions: string[] = [];
    const itRegex = /it\s*\(\s*["'`]([^"'`]+)["'`]/g;
    let match;
    while ((match = itRegex.exec(testFileContent)) !== null) {
      testDescriptions.push(match[1]);
    }
    return testDescriptions;
  }

  private collectFilesRecursive(rootDir: string, predicate: (filePath: string) => boolean): string[] {
    const results: string[] = [];
    if (!rootDir || !fs.existsSync(rootDir)) return results;

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && predicate(fullPath)) {
          results.push(fullPath);
        }
      }
    };

    walk(rootDir);
    return results;
  }

  private generateMainReadme(contracts: ParsedContract[]) {
    let readme = `# FHEVM Examples

This documentation is auto-generated from the examples registry in this repository.

Each page is a quick reference (what the example shows, key events, and the test cases covered). For a fuller walkthrough, generate the standalone repo for an example and read its README.

## Examples by Category

`;

    const byChapter = new Map<string, ParsedContract[]>();
    contracts.forEach(contract => {
      const chapter = contract.chapter;
      if (!byChapter.has(chapter)) {
        byChapter.set(chapter, []);
      }
      byChapter.get(chapter)!.push(contract);
    });

    byChapter.forEach((contracts, chapter) => {
      readme += `### ${this.formatChapterName(chapter)}\n\n`;
      contracts.forEach(contract => {
        const keySuffix = contract.exampleKey ? ` (key: \`${contract.exampleKey}\`)` : '';
        readme += `- **[${contract.name}](${contract.name}.md)**: ${contract.description}${keySuffix}\n`;
      });
      readme += '\n';
    });

    this.writeGeneratedFile('README.md', readme);
  }

  private generateContractDoc(contract: ParsedContract, tests: Map<string, string[]>) {
    let doc = `# ${contract.name}\n\n`;
    if (contract.description) {
      doc += `${contract.description}\n\n`;
    }
    doc += `Category: ${this.formatChapterName(contract.chapter)}\n\n`;

    if (contract.exampleKey) {
      doc += `## Run Locally\n\n`;
      doc += `\`\`\`bash\n`;
      doc += `# Generate a standalone repo for this example\n`;
      doc += `npm run create-example create ${contract.exampleKey} ./output/${contract.exampleKey}\n\n`;
      doc += `cd ./output/${contract.exampleKey}\n`;
      doc += `npm install\n`;
      doc += `npm test\n`;
      doc += `\`\`\`\n\n`;

      doc += `Tip: to verify everything in one go, run the hub smoke test:\n\n`;
      doc += `\`\`\`bash\n`;
      doc += `npm run smoke-test -- --only ${contract.exampleKey}\n`;
      doc += `\`\`\`\n\n`;
    }

    const embeddedDoc = contract.exampleDocumentation ? this.stripLeadingH1(contract.exampleDocumentation) : '';
    if (embeddedDoc) {
      doc += `## Walkthrough\n\n${embeddedDoc}\n\n`;
    }

    if (contract.events.length > 0) {
      doc += `## Events\n\n`;
      for (const event of contract.events) {
        doc += `- \`${event.name}\`\n`;
      }
      doc += '\n';
    }

    const testCases = tests.get(contract.name);
    if (testCases && testCases.length > 0) {
      doc += `## Tests\n\n`;
      for (const testCase of testCases) {
        doc += `- ${testCase}\n`;
      }
      doc += '\n';
    }

    this.writeGeneratedFile(`${contract.name}.md`, doc);
  }

  private generateGitBookSummary(contracts: ParsedContract[]) {
    let summary = `# Summary

* [Introduction](README.md)

## Examples

`;

    const byChapter = new Map<string, ParsedContract[]>();
    contracts.forEach(contract => {
      if (!byChapter.has(contract.chapter)) {
        byChapter.set(contract.chapter, []);
      }
      byChapter.get(contract.chapter)!.push(contract);
    });

    byChapter.forEach((contracts, chapter) => {
      summary += `\n### ${this.formatChapterName(chapter)}\n\n`;
      contracts.forEach(contract => {
        summary += `* [${contract.name}](${contract.name}.md)\n`;
      });
    });

    this.writeGeneratedFile('SUMMARY.md', summary);
  }

  private formatChapterName(chapter: string): string {
    return chapter
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

const args = process.argv.slice(2);
const normalizedArgs = args.filter((a) => a !== '--all');
const hubMode = normalizedArgs.includes('--hub');
const cleanedArgs = normalizedArgs.filter((a) => a !== '--hub');

// Backwards-compatible positional args:
// 1) projectRoot (default '.')
// 2) outputDir   (default './docs')
const projectRoot = cleanedArgs[0] || '.';
const outputDir = cleanedArgs[1] || './docs';

// Auto-detect hub mode when running inside the hub repo (scripts/examples.ts exists).
// Standalone example repos won't have this file, so they fall back to filesystem scanning.
const hasHubRegistry = fs.existsSync(path.join(projectRoot, 'scripts', 'examples.ts'));
const mode: 'hub' | 'filesystem' = hubMode ? 'hub' : (hasHubRegistry ? 'hub' : 'filesystem');
const generator = new DocumentationGenerator(projectRoot, outputDir, mode);
generator.generate().catch(console.error);