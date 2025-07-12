---
title: 'Quick Start'
description: 'Publish and discover your first agent in minutes.'
icon: material/rocket-launch

edit_url: https://github.com/agentcommunity/agent-interface-discovery/edit/main/packages/docs/index.md
extra_css_class: aid-page
---

# Quick Start Guide

Fast track for using Agent Interface Discovery.

---

## Part 1: For Providers (Publishing Your Agent)

Do you have an agent with an API endpoint? Let's make it discoverable. All you need is access to your domain's DNS settings.

### Step 1: Gather Your Agent's Info

You need two things:

1.  **URI:** The full URL to your agent's endpoint.
    - _Example:_ `https://api.my-cool-saas.com/agent/v1`
2.  **Protocol:** The protocol it speaks. Let's assume `mcp`.
    - _Example:_ `mcp`

### Step 2: Generate the TXT Record Content

The AID record is a single string of `key=value` pairs.

```
v=aid1;uri=https://api.my-cool-saas.com/agent/v1;p=mcp;desc=My Cool SaaS AI
```

> **Tip:** Use our [**Live Generator**](https://aid.agentcommunity.org/workbench) to create this string and avoid typos!

### Step 3: Add the Record to Your DNS

Go to your DNS provider (Cloudflare, Vercel, GoDaddy, etc.) and add a new `TXT` record.

- **Type:** `TXT`
- **Name (or Host):** `_agent` (for the domain `my-cool-saas.com`)
- **Content (or Value):** The string from Step 2.
- **TTL:** `300` (5 minutes) is a good starting point.

Here's how it might look in Vercel's DNS dashboard:

![Vercel DNS Example](../assets/vercel-dns-example.png) <!-- You would add an actual image here -->

### Step 4: Verify Your Record

Wait a few minutes for DNS to propagate. You can then check your work using a command-line tool or our web resolver.

**Using the command line:**

```bash
# For Mac/Linux
dig TXT _agent.my-cool-saas.com

# For Windows
nslookup -q=TXT _agent.my-cool-saas.com
```

**The output should show your record!**

---

## Part 2: For Clients (Discovering an Agent)

Now let's write code to find an agent. We provide libraries in several languages to make this trivial.

### TypeScript / JavaScript

Install the library:

```bash
pnpm add @agentcommunity/aid
```

Then use the `discover` function:

```typescript
import { discover } from '@agentcommunity/aid';

try {
  // Use a real, AID-enabled domain
  const { record, ttl } = await discover('supabase.agentcommunity.org');

  console.log('Discovery successful!');
  console.log(`  -> Protocol: ${record.proto}`); // "mcp"
  console.log(`  -> URI: ${record.uri}`); // "https://api.supabase.com/mcp"
  console.log(`  -> Description: ${record.desc}`); // "Supabase MCP"
} catch (error) {
  console.error(`Discovery failed: ${error.message}`);
}
```

### Python

Install the library:

```bash
pip install aid-discovery
```

Then use the `discover` function:

```python
from aid_py import discover, AidError

try:
    # Use a real, AID-enabled domain
    result = discover("supabase.agentcommunity.org")

    print("Discovery successful!")
    print(f"  -> Protocol: {result.record.proto}") # "mcp"
    print(f"  -> URI: {result.record.uri}") # "https://api.supabase.com/mcp"
    print(f"  -> Description: {result.record.desc}") # "Supabase MCP"

except AidError as e:
    print(f"Discovery failed: {e}")
```

**That's it!** You now have the agent's URI and can proceed to connect to it using its specified protocol.
