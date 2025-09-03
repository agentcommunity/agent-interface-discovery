import { type ComponentType } from 'react';
import { Bot } from 'lucide-react';

// Define the props we expect our icon components to accept.
interface IconProps {
  className?: string;
}

// A type that can be a string (for paths/emojis) or a React component that accepts IconProps.
export type ExampleIcon = string | ComponentType<IconProps>;

export interface Example {
  title: string;
  label?: string; // For the chat buttons, optional
  icon: ExampleIcon;
  content: string; // The TXT record string
  domain: string; // The domain to submit to the chat engine
}

export const BASIC_EXAMPLES: Example[] = [
  {
    title: 'Simple',
    label: 'Simple',
    domain: 'simple.agentcommunity.org',
    icon: Bot, // Store the component type, NOT the JSX element <Bot />
    content: 'v=aid1;u=https://api.example.com/mcp;p=mcp;a=pat;s=Example',
  },
  {
    title: 'Local',
    label: 'Local Docker',
    domain: 'local-docker.agentcommunity.org',
    icon: Bot, // Store the component type
    content: 'v=aid1;u=docker:myimage;p=local;s=Local Docker Agent',
  },
  {
    title: 'Messy',
    label: 'Messy',
    domain: 'messy.agentcommunity.org',
    icon: Bot, // Store the component type
    content: ' v=aid1 ; u=https://api.example.com/mcp ; p=mcp ; extra=ignored ',
  },
  {
    title: 'Multi',
    label: 'Multi String',
    domain: 'multi-string.agentcommunity.org',
    icon: Bot, // Store the component type
    content: 'v=aid1;u=https://api.example.com/mcp;p=mcp;s=Multi string part 1',
  },
  {
    title: 'PKA Example',
    label: 'With PKA',
    domain: 'secure.agentcommunity.org',
    icon: '🔐', // Secure example with PKA endpoint proof
    content: 'v=aid1;u=https://api.secure.agentcommunity.org/mcp;p=mcp;a=pat;k=z7rW8rTq8o4mM6vVf7w1k3m4uQn9p2YxCAbcDeFgHiJ;i=g1;d=https://docs.agentcommunity.org/secure;s=Secure MCP with PKA',
  },
  {
    title: 'Deprecated',
    label: 'Deprecated',
    domain: 'deprecated.agentcommunity.org',
    icon: '⚠️', // Deprecation warning
    content: 'v=aid1;u=https://api.deprecated.agentcommunity.org/mcp;p=mcp;a=pat;e=2025-12-31T23:59:59Z;d=https://docs.agentcommunity.org/migration;s=Deprecated - migrate soon',
  },
  {
    title: 'Complete v1.1',
    label: 'Complete v1.1',
    domain: 'complete.agentcommunity.org',
    icon: '✨', // Complete v1.1 example
    content: 'v=aid1;p=mcp;u=https://api.complete.agentcommunity.org/mcp;k=z7rW8rTq8o4mM6vVf7w1k3m4uQn9p2YxCAbcDeFgHiJ;i=g1;d=https://docs.agentcommunity.org/complete;e=2026-12-31T23:59:59Z;s=Complete v1.1 with all features',
  },
];

export const REAL_WORLD_EXAMPLES: Example[] = [
  {
    title: 'Supabase',
    domain: 'supabase.agentcommunity.org',
    icon: '/icons/supabase.svg',
    content:
      'v=aid1;u=https://api.supabase.com/mcp;p=mcp;a=pat;d=https://supabase.com/docs/guides/getting-started/mcp;s=Supabase MCP (Mock Service)',
  },
  {
    title: 'Auth0',
    domain: 'auth0.agentcommunity.org',
    icon: '/icons/auth0.svg',
    content:
      'v=aid1;u=https://ai.auth0.com/mcp;p=mcp;a=pat;d=https://auth0.com/docs/get-started/auth0-mcp-server;s=Auth0 MCP (Mock Service)',
  },
  {
    title: 'Firecrawl',
    domain: 'firecrawl.agentcommunity.org',
    icon: '🔥',
    content:
      'v=aid1;u=https://api.firecrawl.dev;p=a2a;d=https://docs.firecrawl.dev/mcp-server;s=Firecrawl MCP (Mock Service)',
  },
  {
    title: 'Playwright',
    domain: 'playwright.agentcommunity.org',
    icon: '/icons/playwright.svg',
    content:
      'v=aid1;u=https://api.playwright.dev;p=openapi;d=https://github.com/microsoft/playwright-mcp;s=Playwright OpenAPI (Mock Service)',
  },
];

export const OTHER_CHAT_EXAMPLES: Example[] = [
  {
    title: 'Not Found',
    label: 'Not Found',
    domain: 'example.invalid',
    icon: '❌',
    content: '',
  },
  {
    title: 'Offline Agent',
    label: 'Offline Agent',
    domain: 'no-server.agentcommunity.org',
    icon: '👻',
    content: '',
  },
];

export const AID_GENERATOR_URL = 'https://aid.agentcommunity.org/workbench#generator';
