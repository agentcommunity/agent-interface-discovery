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
    content: 'v=aid1;uri=https://api.example.com/mcp;p=mcp',
  },
  {
    title: 'Local',
    label: 'Local Docker',
    domain: 'local-docker.agentcommunity.org',
    icon: Bot, // Store the component type
    content: 'v=aid1;uri=docker:myimage;proto=local;desc=Local Docker Agent',
  },
  {
    title: 'Messy',
    label: 'Messy',
    domain: 'messy.agentcommunity.org',
    icon: Bot, // Store the component type
    content: ' v=aid1 ; uri=https://api.example.com/mcp ; p=mcp ; extra=ignored ',
  },
  {
    title: 'Multi',
    label: 'Multi String',
    domain: 'multi-string.agentcommunity.org',
    icon: Bot, // Store the component type
    content: 'v=aid1;uri=https://api.example.com/mcp;p=mcp;desc=Multi string part 1',
  },
];

export const REAL_WORLD_EXAMPLES: Example[] = [
  {
    title: 'Supabase',
    domain: 'supabase.agentcommunity.org',
    icon: '/icons/supabase.svg',
    content:
      'v=aid1;uri=https://api.supabase.com/mcp;proto=mcp;auth=pat;desc=Supabase Community Showcase - Normative mismatch to spec.',
  },
  {
    title: 'Auth0',
    domain: 'auth0.agentcommunity.org',
    icon: '/icons/auth0.svg',
    content:
      'v=aid1;uri=https://ai.auth0.com/mcp;proto=mcp;auth=pat;desc=Auth0 Community Showcase - Normative mismatch to spec.',
  },
  {
    title: 'Firecrawl',
    domain: 'firecrawl.agentcommunity.org',
    icon: '🔥',
    content:
      'v=aid1;uri=https://api.firecrawl.dev;proto=a2a;desc=Firecrawl - Community Showcase - Normative mismatch to spec.',
  },
  {
    title: 'Playwright',
    domain: 'playwright.agentcommunity.org',
    icon: '/icons/playwright.svg',
    content:
      'v=aid1;uri=https://api.playwright.dev;proto=openapi;desc=Playwright Community Showcase - Normative mismatch to spec.',
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
