#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'node:path';
import { parse } from 'yaml';
import prettier from 'prettier';

/**
 * Code generation script for AID examples
 *
 * This script reads protocol/examples.yml and generates examples for all
 * consumers: Terraform deployment and Web UI constants.
 */

interface ExampleRecord {
  domain: string;
  record: string;
  icon: string;
  description: string;
  category: string;
}

interface ExamplesData {
  examples: {
    [category: string]: {
      [name: string]: ExampleRecord;
    };
  };
}

interface FormattedExample extends ExampleRecord {
  name: string;
}

const GENERATED_WARNING = `/**
 * GENERATED FILE - DO NOT EDIT
 *
 * This file is auto-generated from protocol/examples.yml by scripts/generate-examples.ts
 * To make changes, edit the YAML file and run: pnpm gen
 */`;

function generateTerraformLocals(examples: ExamplesData): string {
  const allExamples: Record<string, { name: string; value: string }> = {};

  // Flatten all examples into a single map
  Object.entries(examples.examples).forEach(([, categoryExamples]) => {
    Object.entries(categoryExamples).forEach(([name, example]) => {
      allExamples[name] = {
        name: `_agent.${name}`,
        value: example.record,
      };
    });
  });

  // Create individual locals for each example
  const individualLocals = Object.entries(allExamples)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([name, config]) => `  ${name} = {
    name  = "${config.name}"
    value = "${config.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"
  }`,
    )
    .join('\n\n');

  // Create a combined map for easy reference
  const combinedMap = Object.keys(allExamples)
    .sort()
    .map((name) => `    ${name} = local.${name}`)
    .join('\n');

  return `${GENERATED_WARNING}

// Auto-generated Terraform locals for AID examples
// Run 'pnpm gen' after updating protocol/examples.yml

locals {
${individualLocals}

  // Combined map of all examples for easy reference
  all_examples = {
${combinedMap}
  }
}`;
}

function generateWebConstants(examples: ExamplesData): string {
  // Group examples by category
  const categories = examples.examples;

  // Build TypeScript interfaces and constants
  const exampleInterface = `import { type ComponentType } from 'react';

// Define the props we expect our icon components to accept.
interface IconProps {
  className?: string;
}

// A type that can be a string (for paths/emojis) or a React component that accepts IconProps.
export type ExampleIcon = string | ComponentType<IconProps>;

export interface Example {
  title: string;
  label?: string;
  icon: ExampleIcon;
  content: string;
  domain: string;
  category: string;
}`;

  // Note: We generate category-specific exports below in combinedExports
  const constants: string[] = [];

  // Create combined exports
  const allExamples = Object.values(categories).flatMap((cat) =>
    Object.entries(cat).map(([name, example]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      ...example,
    })),
  );

  const basicExamples = allExamples.filter((ex) => ex.category === 'basic');
  const realWorldExamples = allExamples.filter((ex) => ex.category === 'real_world');
  const otherExamples = allExamples.filter((ex) => ex.category === 'error_cases');

  function formatExampleArray(examples: FormattedExample[]): string {
    return examples
      .map(
        (ex) => `  {
    title: '${ex.name}',
    label: '${ex.name}',
    domain: '${ex.domain}',
    icon: '${ex.icon}',
    content: '${ex.record.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',
    category: '${ex.category}',
  }`,
      )
      .join(',\n');
  }

  const combinedExports = `export const BASIC_EXAMPLES: Example[] = [
${formatExampleArray(basicExamples)}
];

export const REAL_WORLD_EXAMPLES: Example[] = [
${formatExampleArray(realWorldExamples)}
];

export const OTHER_CHAT_EXAMPLES: Example[] = [
${formatExampleArray(otherExamples)}
];`;

  return `${GENERATED_WARNING}

${exampleInterface}

${constants.join('\n\n')}

${combinedExports}`;
}

// --- Top-level script execution ---

try {
  // Read and parse YAML file
  const yamlPath = path.resolve(process.cwd(), 'protocol/examples.yml');
  const yamlContent = readFileSync(yamlPath, 'utf8');
  const examples = parse(yamlContent) as ExamplesData;

  // Generate Terraform locals
  const terraformContent = generateTerraformLocals(examples);
  const terraformOutputPath = path.resolve(process.cwd(), 'showcase/terraform/examples.tf');

  writeFileSync(terraformOutputPath, terraformContent);
  console.log('✅ Generated examples.tf from protocol/examples.yml');
  console.log(`   Output: ${terraformOutputPath}`);

  // Generate Web constants
  const webContent = generateWebConstants(examples);

  // Use project's prettier configuration for consistency
  const prettierOptions = await prettier.resolveConfig(process.cwd());
  let webFormatted: string;
  try {
    webFormatted = await prettier.format(webContent, {
      semi: prettierOptions?.semi ?? true,
      singleQuote: prettierOptions?.singleQuote ?? true,
      trailingComma: (prettierOptions?.trailingComma as 'all' | 'es5' | 'none') ?? 'all',
      printWidth: prettierOptions?.printWidth ?? 100,
      parser: 'typescript',
    });
  } catch {
    console.warn('⚠️ Prettier formatting (Web examples) failed. Writing unformatted output.');
    webFormatted = webContent;
  }

  const webOutputDir = path.resolve(process.cwd(), 'packages/web/src/generated');
  const webOutputPath = path.resolve(webOutputDir, 'examples.ts');
  mkdirSync(webOutputDir, { recursive: true });

  writeFileSync(webOutputPath, webFormatted);
  console.log('✅ Generated examples.ts from protocol/examples.yml');
  console.log(`   Output: ${webOutputPath}`);
} catch (error) {
  console.error('❌ Failed to generate examples:', error);
  process.exit(1);
}
