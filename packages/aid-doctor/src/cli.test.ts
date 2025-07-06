import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Basic smoke tests for the aid-doctor CLI
describe('AID Doctor CLI', () => {
  describe('Package integrity', () => {
    it('should have a valid package.json', () => {
      const packagePath = path.resolve(__dirname, '../package.json');
      const packageContent = readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);

      expect(packageJson.name).toBe('@agentcommunity/aid-doctor');
      expect(packageJson.bin).toBeDefined();
      expect(packageJson.bin['aid-doctor']).toBe('./dist/cli.js');
    });

    it('should have CLI entry point file', () => {
      const cliPath = path.resolve(__dirname, './cli.ts');
      const cliContent = readFileSync(cliPath, 'utf8');

      // Check for basic CLI structure
      expect(cliContent).toContain('#!/usr/bin/env node');
      expect(cliContent).toContain('commander');
      expect(cliContent).toContain('program');
    });

    it('should have index export file', () => {
      const indexPath = path.resolve(__dirname, './index.ts');
      const indexContent = readFileSync(indexPath, 'utf8');

      // Check for basic export structure
      expect(indexContent).toContain('export');
    });
  });

  describe('CLI commands', () => {
    it('should have valid CLI structure', () => {
      const cliPath = path.resolve(__dirname, './cli.ts');
      const cliContent = readFileSync(cliPath, 'utf8');

      // Check that the CLI has the expected commander structure
      expect(cliContent).toContain('.name(');
      expect(cliContent).toContain('.description(');
      expect(cliContent).toContain('.version(');
      expect(cliContent).toContain('.command(');
    });
  });
});
