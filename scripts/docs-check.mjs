import { promises as fs } from 'node:fs';
import path from 'node:path';

const DOCS_PREFIX = 'https://docs.agentcommunity.org/aid';
const REFERENCE_FILES = [
  'README.md',
  'packages/web/src/components/layout/footer.tsx',
  'packages/web/src/components/layout/header.tsx',
  'packages/web/src/components/landing/hero.tsx',
  'packages/web/src/components/landing/identity.tsx',
  'packages/web/src/components/landing/quick-start.tsx',
  'packages/web/src/components/landing/showcase.tsx',
  'packages/web/src/components/landing/solution.tsx',
  'packages/web/src/components/workbench/v11-fields/security-fields.tsx',
];

const REQUIRED_DOCS = [
  'index.md',
  'specification.md',
  'security.md',
  'rationale.md',
  'versioning.md',
  'Reference/discovery_api.md',
  'Reference/identity_pka.md',
  'Reference/protocols.md',
  'Reference/troubleshooting.md',
  'Tooling/aid_doctor.md',
];

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const extractDocLinks = (content) => {
  const pattern = /https:\/\/docs\.agentcommunity\.org\/aid(?:\/[^\s)"'`>]*)?/g;
  return [...content.matchAll(pattern)].map((match) => match[0]);
};

const buildCandidates = (url) => {
  const pathname = new URL(url).pathname;
  if (!pathname.startsWith('/aid')) {
    return [];
  }

  const trimmed = pathname.slice('/aid'.length).replace(/\/+$/, '');
  if (!trimmed) {
    return ['index.md'];
  }

  const relativePath = decodeURIComponent(trimmed.replace(/^\/+/, ''));
  return [`${relativePath}.md`, path.join(relativePath, 'index.md')];
};

const findMissingLinks = async (repoRoot) => {
  const docsRoot = path.join(repoRoot, 'packages', 'docs');
  const missing = [];

  for (const relativeFile of REFERENCE_FILES) {
    const absoluteFile = path.join(repoRoot, relativeFile);
    const content = await fs.readFile(absoluteFile, 'utf8');
    const links = extractDocLinks(content);

    for (const link of links) {
      if (!link.startsWith(DOCS_PREFIX)) {
        continue;
      }
      const candidates = buildCandidates(link);
      if (candidates.length === 0) {
        continue;
      }

      let found = false;
      for (const candidate of candidates) {
        const candidatePath = path.join(docsRoot, candidate);
        if (await fileExists(candidatePath)) {
          found = true;
          break;
        }
      }

      if (!found) {
        missing.push({ file: relativeFile, url: link, candidates });
      }
    }
  }

  return missing;
};

const verifyRequiredDocs = async (repoRoot) => {
  const docsRoot = path.join(repoRoot, 'packages', 'docs');
  const missing = [];

  for (const relativeFile of REQUIRED_DOCS) {
    const absoluteFile = path.join(docsRoot, relativeFile);
    if (!(await fileExists(absoluteFile))) {
      missing.push(relativeFile);
    }
  }

  return missing;
};

const main = async () => {
  const repoRoot = process.cwd();
  const missingLinks = await findMissingLinks(repoRoot);
  const missingRequiredDocs = await verifyRequiredDocs(repoRoot);

  if (missingRequiredDocs.length > 0) {
    console.error('Missing required canonical docs files:');
    for (const missing of missingRequiredDocs) {
      console.error(`- packages/docs/${missing}`);
    }
    process.exit(1);
  }

  if (missingLinks.length > 0) {
    console.error('Invalid docs links. External docs must map to files in packages/docs:');
    for (const item of missingLinks) {
      console.error(`- ${item.file}: ${item.url}`);
      console.error(`  expected one of: ${item.candidates.join(' or ')}`);
    }
    process.exit(1);
  }

  console.log('docs:check passed');
  console.log('Canonical docs source: packages/docs');
  console.log('External docs links map to in-repo markdown files.');
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`docs:check failed: ${message}`);
  process.exit(1);
});
