#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
// Import the functions from your own package's library entrypoint
import { buildTxtRecord, validateTxtRecord, type AidGeneratorData } from './index';
// Import constants from the single source of truth
import { PROTOCOL_TOKENS, AUTH_TOKENS } from '@agentcommunity/aid';

async function main() {
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
}

// Use a self-executing async function to run the CLI
void main();
