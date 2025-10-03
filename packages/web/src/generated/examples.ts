/**
 * GENERATED FILE - DO NOT EDIT
 *
 * This file is auto-generated from protocol/examples.yml by scripts/generate-examples.ts
 * To make changes, edit the YAML file and run: pnpm gen
 */

import { type ComponentType } from 'react';

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
}

export const BASIC_EXAMPLES: Example[] = [
  {
    title: 'Simple',
    label: 'Simple',
    domain: 'simple.agentcommunity.org',
    icon: '🤖',
    content: 'v=aid1;u=https://api.example.com/mcp;p=mcp;a=pat;s=Basic MCP Example',
    category: 'basic',
  },
  {
    title: 'Local Docker',
    label: 'Local Docker',
    domain: 'local-docker.agentcommunity.org',
    icon: '🐳',
    content: 'v=aid1;u=docker:myimage;p=local;s=Local Docker Agent',
    category: 'basic',
  },
  {
    title: 'Messy',
    label: 'Messy',
    domain: 'messy.agentcommunity.org',
    icon: '🧹',
    content: ' v=aid1 ; u=https://api.example.com/mcp ; p=mcp ; extra=ignored ',
    category: 'basic',
  },
  {
    title: 'Multi String',
    label: 'Multi String',
    domain: 'multi-string.agentcommunity.org',
    icon: '📄',
    content: 'v=aid1;u=https://api.example.com/mcp;p=mcp;s=Multi string part 1',
    category: 'basic',
  },
  {
    title: 'Pka Basic',
    label: 'Pka Basic',
    domain: 'pka-basic.agentcommunity.org',
    icon: '🔐',
    content:
      'v=aid1;p=mcp;u=https://api.example.com/mcp;k=z7rW8rTq8o4mM6vVf7w1k3m4uQn9p2YxCAbcDeFgHiJ;i=p1;s=Basic PKA Example',
    category: 'basic',
  },
  {
    title: 'Complete V1 1',
    label: 'Complete V1 1',
    domain: 'complete.agentcommunity.org',
    icon: '✨',
    content:
      'v=aid1;p=mcp;u=https://api.complete.agentcommunity.org/mcp;k=z7rW8rTq8o4mM6vVf7w1k3m4uQn9p2YxCAbcDeFgHiJ;i=g1;d=https://docs.agentcommunity.org/complete;e=2026-12-31T23:59:59Z;s=Complete v1.1 with all features',
    category: 'basic',
  },
];

export const REAL_WORLD_EXAMPLES: Example[] = [
  {
    title: 'Supabase',
    label: 'Supabase',
    domain: 'supabase.agentcommunity.org',
    icon: '/icons/supabase.svg',
    content:
      'v=aid1;u=https://api.supabase.com/mcp;p=mcp;a=pat;k=zAbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEf;i=s1;d=https://supabase.com/docs/guides/getting-started/mcp;s=Supabase MCP (Mock Service)',
    category: 'real_world',
  },
  {
    title: 'Auth0',
    label: 'Auth0',
    domain: 'auth0.agentcommunity.org',
    icon: '/icons/auth0.svg',
    content:
      'v=aid1;u=https://ai.auth0.com/mcp;p=mcp;a=pat;k=zEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGhI;i=a1;d=https://auth0.com/docs/get-started/auth0-mcp-server;s=Auth0 MCP (Mock Service)',
    category: 'real_world',
  },
  {
    title: 'Firecrawl',
    label: 'Firecrawl',
    domain: 'firecrawl.agentcommunity.org',
    icon: '🔥',
    content:
      'v=aid1;u=https://api.firecrawl.dev;p=a2a;k=zIjKlMnOpQrStUvWxYz0123456789AbCdEfGhIjKlM;i=f1;d=https://docs.firecrawl.dev/mcp-server;s=Firecrawl A2A (Mock Service)',
    category: 'real_world',
  },
  {
    title: 'Playwright',
    label: 'Playwright',
    domain: 'playwright.agentcommunity.org',
    icon: '/icons/playwright.svg',
    content:
      'v=aid1;u=https://api.playwright.dev;p=openapi;k=zMnOpQrStUvWxYz0123456789AbCdEfGhIjKlMnOp;i=p1;d=https://github.com/microsoft/playwright-mcp;s=Playwright OpenAPI (Mock Service)',
    category: 'real_world',
  },
];

export const OTHER_CHAT_EXAMPLES: Example[] = [
  {
    title: 'No Server',
    label: 'No Server',
    domain: 'no-server.agentcommunity.org',
    icon: '❌',
    content: 'v=aid1;u=https://does-not-exist.agentcommunity.org:1234;p=mcp;s=Offline Agent',
    category: 'error_cases',
  },
  {
    title: 'Deprecated',
    label: 'Deprecated',
    domain: 'deprecated.agentcommunity.org',
    icon: '⚠️',
    content:
      'v=aid1;u=https://api.deprecated.agentcommunity.org/mcp;p=mcp;a=pat;e=2025-12-31T23:59:59Z;d=https://docs.agentcommunity.org/migration;s=Deprecated - migrate soon',
    category: 'error_cases',
  },
  {
    title: 'Secure',
    label: 'Secure',
    domain: 'secure.agentcommunity.org',
    icon: '🔒',
    content:
      'v=aid1;u=https://api.secure.agentcommunity.org/mcp;p=mcp;a=pat;k=z7rW8rTq8o4mM6vVf7w1k3m4uQn9p2YxCAbcDeFgHiJ;i=g1;d=https://docs.agentcommunity.org/secure;s=Secure MCP with PKA',
    category: 'error_cases',
  },
];
