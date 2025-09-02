#!/usr/bin/env node

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { AidError, PROTOCOL_TOKENS, AUTH_TOKENS } from '@agentcommunity/aid';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import clipboardy from 'clipboardy';
import { validateTxtRecord, type AidGeneratorData } from './generator';
import { runCheck } from './checker';
import type { CheckOptions, DoctorReport } from './types';
import { generateEd25519, verifyPka } from './keys';

const program = new Command();

// Package info
program
  .name('aid-doctor')
  .description('CLI tool for Agent Identity & Discovery (AID)')
  .version('0.1.0');

/**
 * Format the discovery result for human-readable output
 */
function formatDiscoveryResult(result: DoctorReport, domain: string): string {
  const { record, queried } = result;

  const lines = [
    chalk.green(`✅ AID Record Found for ${domain}`),
    '',
    chalk.bold('Record Details:'),
    `  Domain: ${chalk.cyan(domain)}`,
    `  Query: ${chalk.gray(queried.attempts[0]?.name ?? '')}`,
    `  Version: ${chalk.yellow(record.parsed?.v ?? 'aid1')}`,
    `  Protocol: ${chalk.magenta(record.parsed?.proto ?? '')}`,
    `  URI: ${chalk.blue(record.parsed?.uri ?? '')}`,
  ];

  if (record.parsed?.auth) {
    lines.push(`  Auth: ${chalk.yellow(record.parsed.auth)}`);
  }

  if (record.parsed?.desc) {
    lines.push(`  Description: ${chalk.white(record.parsed.desc)}`);
  }

  return lines.join('\n');
}

/**
 * Format an error for human-readable output
 */
function formatError(error: unknown, domain: string): string {
  if (error instanceof AidError) {
    const codeColor = error.code >= 1003 ? chalk.red : chalk.yellow;
    return [
      chalk.red(`❌ AID Discovery Failed for ${domain}`),
      '',
      `  Error Code: ${codeColor(error.code)} (${error.errorCode})`,
      `  Message: ${error.message}`,
    ].join('\n');
  }

  return [
    chalk.red(`❌ Unexpected Error for ${domain}`),
    '',
    `  ${error instanceof Error ? error.message : String(error)}`,
  ].join('\n');
}

// Check command - human-readable report
program
  .command('check <domain>')
  .description('Check a domain for AID records and display a human-readable report')
  .option('-p, --protocol <protocol>', 'Diagnostics hint only; base-first remains canonical')
  .option(
    '--probe-proto-subdomain',
    'If base TXT is missing and --protocol set, probe _agent._<proto>.<domain>',
    false,
  )
  .option(
    '--probe-proto-even-if-base',
    'Probe proto subdomain even when base exists (diagnostics only)',
    false,
  )
  .option('-t, --timeout <ms>', 'DNS query timeout in milliseconds', '5000')
  .option('--no-fallback', 'Disable .well-known fallback on DNS miss', false)
  .option('--fallback-timeout <ms>', 'Timeout for .well-known fetch (ms)', '2000')
  .option('--show-details', 'Show TLS/DNSSEC/PKA short details', false)
  .option('--dump-well-known [path]', 'On fallback failure, print or save body snippet', false)
  .option('--code', 'Exit with the specific error code on failure (for scripting)')
  .action(
    async (
      domain: string,
      options: {
        protocol?: string;
        timeout: string;
        noFallback?: boolean;
        fallbackTimeout?: string;
        showDetails?: boolean;
        code?: boolean;
      },
    ) => {
      const spinner = ora(`Checking AID record for ${domain}...`).start();

      try {
        const report = await runCheck(domain, {
          protocol: options.protocol,
          timeoutMs: Number.parseInt(options.timeout),
          allowFallback: options.noFallback ? false : true,
          wellKnownTimeoutMs: Number.parseInt(options.fallbackTimeout || '2000'),
          showDetails: options.showDetails,
          probeProtoSubdomain: false,
          probeProtoEvenIfBase: false,
          dumpWellKnownPath: null,
        } as CheckOptions);

        spinner.stop();
        // Base output
        const base = formatDiscoveryResult(report, domain);
        const extras: string[] = [];
        if (options.showDetails) {
          const fallbackUsed = report.queried.wellKnown.used;
          extras.push(
            `  Fallback: ${fallbackUsed ? chalk.yellow('used (.well-known)') : chalk.green('not used (DNS)')}`,
          );
          if (report.pka.present) {
            const kid = report.pka.kid ?? '(none)';
            extras.push(`  PKA: ${chalk.green('present')}, kid=${chalk.cyan(kid)}`);
          } else {
            extras.push(`  PKA: ${chalk.gray('absent')}`);
          }
        }
        console.log([base, ...(extras.length ? [''].concat(extras) : [])].join('\n'));

        // Exit with report exit code
        process.exit(report.exitCode);
      } catch (error) {
        spinner.stop();
        console.log(formatError(error, domain));

        // Exit with error code
        if (options.code && error instanceof AidError) {
          process.exit(error.code);
        } else {
          process.exit(1);
        }
      }
    },
  );

// JSON command - machine-readable JSON output
program
  .command('json <domain>')
  .description('Check a domain for AID records and output machine-readable JSON')
  .option('-p, --protocol <protocol>', 'Try protocol-specific subdomain first')
  .option('-t, --timeout <ms>', 'DNS query timeout in milliseconds', '5000')
  .option('--no-fallback', 'Disable .well-known fallback on DNS miss', false)
  .option('--fallback-timeout <ms>', 'Timeout for .well-known fetch (ms)', '2000')
  .action(
    async (
      domain: string,
      options: {
        protocol?: string;
        timeout: string;
        noFallback?: boolean;
        fallbackTimeout?: string;
      },
    ) => {
      try {
        const report = await runCheck(domain, {
          protocol: options.protocol,
          timeoutMs: Number.parseInt(options.timeout),
          allowFallback: options.noFallback ? false : true,
          wellKnownTimeoutMs: Number.parseInt(options.fallbackTimeout || '2000'),
          probeProtoSubdomain: false,
          probeProtoEvenIfBase: false,
          showDetails: false,
          dumpWellKnownPath: null,
        } as CheckOptions);

        console.log(JSON.stringify(report, null, 2));
        process.exit(report.exitCode);
      } catch (error) {
        // Output error result
        if (error instanceof AidError) {
          console.log(
            JSON.stringify(
              {
                success: false,
                domain,
                error: {
                  code: error.code,
                  errorCode: error.errorCode,
                  message: error.message,
                },
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          );

          process.exit(error.code);
        } else {
          console.log(
            JSON.stringify(
              {
                success: false,
                domain,
                error: {
                  code: 1,
                  errorCode: 'UNKNOWN_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          );

          process.exit(1);
        }
      }
    },
  );

// PKA helpers
program
  .command('pka')
  .description('PKA key helpers')
  .addCommand(
    new Command('generate')
      .description(
        'Generate a new Ed25519 keypair and print the public key (z...); private key saved to ~/.aid/keys',
      )
      .option('--label <name>', 'Key label (filename prefix)')
      .option('--out <dir>', 'Output directory for private key')
      .option('--print-private', 'Also print private key PEM to stdout (not recommended)', false)
      .action(async (opts: { label?: string; out?: string; printPrivate?: boolean }) => {
        const { publicKey, privatePath } = await generateEd25519(
          opts.label,
          opts.out,
          Boolean(opts.printPrivate),
        );
        console.log(publicKey);
        console.error(`Saved private key to ${privatePath}`);
        if (opts.printPrivate) {
          console.error('Printing private key was requested; handle with care.');
        }
      }),
  )
  .addCommand(
    new Command('verify')
      .description('Verify a PKA public key string')
      .requiredOption('--key <pka>', 'z-prefixed multibase Ed25519 public key')
      .action((opts: { key: string }) => {
        const res = verifyPka(opts.key);
        if (res.valid) console.log('✅ valid');
        else {
          console.log('❌ invalid' + (res.reason ? `: ${res.reason}` : ''));
          process.exitCode = 1;
        }
      }),
  );

// Generator command
program
  .command('generate')
  .description('Run an interactive prompt to generate a new AID record')
  .action(async () => {
    console.log(chalk.bold.cyan('AID Record Generator'));
    console.log(chalk.gray('This tool will guide you through creating a valid DNS TXT record.\n'));

    const answers = await inquirer.prompt<Partial<AidGeneratorData>>([
      {
        type: 'input',
        name: 'domain',
        message: 'What is the primary domain for your agent?',
        validate: (input: string) => (input ? true : 'Domain cannot be empty.'),
      },
      {
        type: 'input',
        name: 'uri',
        message: "What is the full URI of your agent's endpoint?",
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URI (e.g., https://api.example.com/agent).';
          }
        },
      },
      {
        type: 'list',
        name: 'proto',
        message: 'Select the communication protocol:',
        choices: Object.keys(PROTOCOL_TOKENS),
        default: 'mcp',
      },
      {
        type: 'list',
        name: 'auth',
        message: 'Select the authentication method (if any):',
        choices: ['none', ...Object.keys(AUTH_TOKENS)],
        filter: (val: string) => (val === 'none' ? '' : val),
      },
      {
        type: 'input',
        name: 'desc',
        message: 'Enter a short description (optional):',
        validate: (input: string) => {
          if (!input) return true; // Optional field
          const byteLength = new TextEncoder().encode(input).length;
          return byteLength <= 60 || `Description is ${byteLength} bytes (max 60).`;
        },
      },
      {
        type: 'input',
        name: 'docs',
        message: 'Docs URL (https, optional):',
        validate: (input: string) => {
          if (!input) return true;
          try {
            const u = new URL(input);
            return u.protocol === 'https:' || 'Docs must be https:// URL';
          } catch {
            return 'Docs must be https:// URL';
          }
        },
      },
      {
        type: 'input',
        name: 'dep',
        message: 'Deprecation date (ISO 8601 UTC, e.g., 2026-01-01T00:00:00Z, optional):',
        validate: (input: string) => {
          if (!input) return true;
          return (
            (/Z$/.test(input) && !Number.isNaN(Date.parse(input))) || 'Must be ISO 8601 UTC with Z'
          );
        },
      },
      {
        type: 'confirm',
        name: 'addPka',
        message: 'Add PKA endpoint proof now?',
        default: false,
      },
      {
        type: 'input',
        name: 'pka',
        message: 'PKA public key (z-prefixed multibase Ed25519):',
        when: (a: { addPka?: boolean }) => Boolean(a.addPka),
        validate: (input: string) => {
          if (!input) return 'PKA key required when adding PKA';
          const r = verifyPka(input);
          return r.valid || r.reason || 'Invalid';
        },
      },
      {
        type: 'input',
        name: 'kid',
        message: 'kid (1-6 chars [a-z0-9]):',
        when: (a: { addPka?: boolean }) => Boolean(a.addPka),
        validate: (input: string) =>
          /^(?:[a-z0-9]{1,6})$/.test(input) || 'kid must match [a-z0-9]{1,6}',
      },
    ]);

    // We cast here because inquirer provides a partial object based on answers
    const formData = answers as AidGeneratorData;
    const full = (await import('./generator')).buildTxtRecordVariant(formData, false);
    const alias = (await import('./generator')).buildTxtRecordVariant(formData, true);
    const fullLen = new TextEncoder().encode(full).length;
    const aliasLen = new TextEncoder().encode(alias).length;
    const suggest = aliasLen <= fullLen ? alias : full;
    const txtRecord = suggest;
    const validation = validateTxtRecord(txtRecord);

    console.log(chalk.green('\n--- Generation Complete ---\n'));
    console.log(chalk.bold('Host:'));
    console.log(chalk.yellow(`_agent.${formData.domain}`));
    console.log('');
    console.log(chalk.bold('Type:'));
    console.log(chalk.yellow('TXT'));
    console.log('');
    console.log(chalk.bold('Value:'));
    console.log(chalk.yellow(txtRecord));
    console.log('');

    if (validation.isValid) {
      try {
        await clipboardy.write(txtRecord);
        console.log(
          chalk.bold.green('✅ Success! The TXT record value has been copied to your clipboard.'),
        );
      } catch {
        // The error object is not needed, so we use an optional catch binding.
        console.log(chalk.red('Could not copy to clipboard. Please copy the value manually.'));
      }
    } else {
      console.log(chalk.bold.red(`🔥 Validation Failed: ${validation.error}`));
    }
  });

// Version command with additional info
program
  .command('version')
  .description('Show version information')
  .action(async () => {
    let version = '0.0.0';
    try {
      const pkgUrl = new URL('../package.json', import.meta.url);
      const fileContents = await readFile(pkgUrl, 'utf8');
      const pkg = JSON.parse(fileContents) as { version?: string };
      version = pkg.version ?? version;
    } catch {
      // ignore - fallback stays 0.0.0
    }
    console.log(
      [
        chalk.bold('aid-doctor') + ' - Agent Identity & Discovery CLI',
        `Version: ${chalk.green(version)}`,
        `Node: ${chalk.gray(process.version)}`,
        `Platform: ${chalk.gray(process.platform)}`,
        '',
        'For more information, visit:',
        chalk.blue('https://aid.agentcommunity.org'),
      ].join('\n'),
    );
  });

// Parse command line arguments
program.parse();
