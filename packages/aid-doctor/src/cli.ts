#!/usr/bin/env node

import { Command } from 'commander';
import {
  discover,
  AidError,
  enforceRedirectPolicy,
  type DiscoveryResult,
  PROTOCOL_TOKENS,
  AUTH_TOKENS,
} from '@agentcommunity/aid';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import clipboardy from 'clipboardy';
import { buildTxtRecord, validateTxtRecord, type AidGeneratorData } from './generator';

const program = new Command();

// Package info
program
  .name('aid-doctor')
  .description('CLI tool for Agent Interface Discovery (AID)')
  .version('0.1.0');

/**
 * Format the discovery result for human-readable output
 */
function formatDiscoveryResult(result: DiscoveryResult, domain: string): string {
  const { record, queryName } = result;

  const lines = [
    chalk.green(`✅ AID Record Found for ${domain}`),
    '',
    chalk.bold('Record Details:'),
    `  Domain: ${chalk.cyan(domain)}`,
    `  Query: ${chalk.gray(queryName)}`,
    `  Version: ${chalk.yellow(record.v)}`,
    `  Protocol: ${chalk.magenta(record.proto)}`,
    `  URI: ${chalk.blue(record.uri)}`,
  ];

  if (record.auth) {
    lines.push(`  Auth: ${chalk.yellow(record.auth)}`);
  }

  if (record.desc) {
    lines.push(`  Description: ${chalk.white(record.desc)}`);
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
  .option('-p, --protocol <protocol>', 'Try protocol-specific subdomain first')
  .option('-t, --timeout <ms>', 'DNS query timeout in milliseconds', '5000')
  .option('--code', 'Exit with the specific error code on failure (for scripting)')
  .action(
    async (domain: string, options: { protocol?: string; timeout: string; code?: boolean }) => {
      const spinner = ora(`Checking AID record for ${domain}...`).start();

      try {
        const result = await discover(domain, {
          ...(options.protocol && { protocol: options.protocol }),
          timeout: Number.parseInt(options.timeout),
        });

        // Enforce redirect security unless explicitly skipped (CI placeholder URIs)
        if (result.record.proto !== 'local' && process.env.AID_SKIP_SECURITY !== '1') {
          spinner.text = 'Validating redirect policy...';
          await enforceRedirectPolicy(result.record.uri, Number.parseInt(options.timeout));
        }

        spinner.stop();
        console.log(formatDiscoveryResult(result, domain));

        // Exit with success code
        process.exit(0);
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
  .action(async (domain: string, options: { protocol?: string; timeout: string }) => {
    try {
      const result = await discover(domain, {
        ...(options.protocol && { protocol: options.protocol }),
        timeout: Number.parseInt(options.timeout),
      });

      // Optionally enforce redirect policy
      if (result.record.proto !== 'local') {
        await enforceRedirectPolicy(result.record.uri, Number.parseInt(options.timeout));
      }

      // Output successful result
      console.log(
        JSON.stringify(
          {
            success: true,
            domain,
            queryName: result.queryName,
            record: result.record,
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        ),
      );

      process.exit(0);
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
  });

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
    ]);

    // We cast here because inquirer provides a partial object based on answers
    const formData = answers as AidGeneratorData;
    const txtRecord = buildTxtRecord(formData);
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
  .action(() => {
    console.log(
      [
        chalk.bold('aid-doctor') + ' - Agent Interface Discovery CLI',
        `Version: ${chalk.green('0.1.0')}`,
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
