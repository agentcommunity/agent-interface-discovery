const DEFAULT_SITE_URL = 'https://aid.agentcommunity.org';

export const SITE_NAME = 'Agent Identity & Discovery';
export const SITE_TITLE = `${SITE_NAME} — DNS for Agents`;
export const SITE_DESCRIPTION = 'DNS-first agent discovery and identity for the agentic web.';
export const SITE_X_HANDLE = '@agentcommunity_';

function normalizeSiteUrl(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL;
  return normalizeSiteUrl(fromEnv);
}

export function getMetadataBase(): URL {
  return new URL(getSiteUrl());
}
