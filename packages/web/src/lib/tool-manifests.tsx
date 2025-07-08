import { toolManifests } from './tool-manifest-data';
import type { ToolManifest, EnhancedCapability } from './tool-manifest-types';

/**
 * Gets the manifest for a given domain, falling back to a default if not found.
 * @param domain The domain to look up.
 * @returns The corresponding ToolManifest.
 */
export function getManifestForDomain(domain: string): ToolManifest {
  return (
    toolManifests[domain] || toolManifests['live-unsupported'] || toolManifests['default-failure']
  );
}

/**
 * Helper function to get enhanced descriptions and names for agent capabilities.
 * @param capability The basic capability object.
 * @returns An EnhancedCapability with a formatted name and description.
 */
export function getEnhancedCapability(capability: {
  id: string;
  type: 'tool' | 'resource';
}): EnhancedCapability {
  const descriptions: Record<string, string> = {
    // Simple agent
    echo: 'Echo back any message',
    greet: 'Generate personalized greetings',

    // Supabase agent
    create_table: 'Create new database tables',
    execute_sql: 'Run SQL queries on your database',
    list_tables: 'List all tables in your database',
    get_schema: 'Retrieve database schema information',
    create_function: 'Create database functions and triggers',
    manage_auth: 'Manage user authentication and permissions',

    // Auth0 agent
    create_user: 'Create new user accounts',
    authenticate_user: 'Authenticate user credentials',
    manage_roles: 'Create and assign user roles',
    create_application: 'Register new applications',
    configure_sso: 'Set up single sign-on integrations',

    // Messy agent
    random_chaos: 'Generate random chaotic outputs',
    break_things: 'Intentionally break stuff for testing',
    confuse_user: 'Generate confusing responses',

    // Firecrawl agent
    firecrawl_scrape: 'Scrape content from a single URL.',
    firecrawl_search: 'Search the web and optionally extract content from results.',
    firecrawl_crawl: 'Starts an asynchronous crawl job on a website.',
    firecrawl_deep_research: 'Conduct deep web research on a query using intelligent crawling.',
    firecrawl_extract: 'Extract structured information from web pages using an LLM.',

    // Playwright agent
    browser_snapshot: 'Capture accessibility snapshot of the current page.',
    browser_click: 'Perform click on a web page.',
    browser_type: 'Type text into an editable element.',
    browser_file_upload: 'Upload one or multiple files.',
    browser_wait_for: 'Wait for text to appear or disappear.',
    browser_press_key: 'Press a key on the keyboard.',

    // Local Docker Agent
    list_containers: 'List all running Docker containers.',
    run_command: 'Run a command inside a specified container.',
    get_logs: 'Get logs from a specified container.',

    // Multi-String Agent
    concat_strings: 'Concatenate multiple strings into one.',
    split_string: 'Split a string by a delimiter.',
    reverse_string: 'Reverse the characters in a string.',
  };

  const formattedName = capability.id
    .replaceAll('_', ' ')
    // Use replaceAll for clarity when using a global regex.
    .replaceAll(/\b\w/g, (letter: string) => letter.toUpperCase());

  return {
    ...capability,
    name: formattedName,
    description: descriptions[capability.id] || 'No description available',
  };
}
