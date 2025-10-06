/**
 * GENERATED FILE - DO NOT EDIT
 *
 * This file is auto-generated from protocol/examples.yml by scripts/generate-examples.ts
 * To make changes, edit the YAML file and run: pnpm gen
 */

// Auto-generated Terraform locals for AID examples
// Run 'pnpm gen' after updating protocol/examples.yml

locals {
  auth0 = {
    name  = "_agent.auth0"
    value = "v=aid1;u=https://ai.auth0.com/mcp;p=mcp;a=pat;k=zEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGhI;i=a1;d=https://auth0.com/docs/get-started/auth0-mcp-server;s=Auth0 MCP (Mock Service)"
  }

  complete_v1_1 = {
    name  = "_agent.complete_v1_1"
    value = "v=aid1;p=mcp;u=https://api.complete.agentcommunity.org/mcp;k=z7rW8rTq8o4mM6vVf7w1k3m4uQn9p2YxCAbcDeFgHiJ;i=g1;d=https://docs.agentcommunity.org/complete;e=2026-12-31T23:59:59Z;s=Complete v1.1 with all features"
  }

  deprecated = {
    name  = "_agent.deprecated"
    value = "v=aid1;u=https://api.deprecated.agentcommunity.org/mcp;p=mcp;a=pat;e=2025-12-31T23:59:59Z;d=https://docs.agentcommunity.org/migration;s=Deprecated - migrate soon"
  }

  firecrawl = {
    name  = "_agent.firecrawl"
    value = "v=aid1;u=https://api.firecrawl.dev;p=a2a;k=zIjKlMnOpQrStUvWxYz0123456789AbCdEfGhIjKlM;i=f1;d=https://docs.firecrawl.dev/mcp-server;s=Firecrawl A2A (Mock Service)"
  }

  local_docker = {
    name  = "_agent.local_docker"
    value = "v=aid1;u=docker:myimage;p=local;s=Local Docker Agent"
  }

  messy = {
    name  = "_agent.messy"
    value = " v=aid1 ; u=https://api.example.com/mcp ; p=mcp ; extra=ignored "
  }

  multi_string = {
    name  = "_agent.multi_string"
    value = "v=aid1;u=https://api.example.com/mcp;p=mcp;s=Multi string part 1"
  }

  no_server = {
    name  = "_agent.no_server"
    value = "v=aid1;u=https://does-not-exist.agentcommunity.org:1234;p=mcp;s=Offline Agent"
  }

  pka_basic = {
    name  = "_agent.pka_basic"
    value = "v=aid1;p=mcp;u=https://api.example.com/mcp;k=z7rW8rTq8o4mM6vVf7w1k3m4uQn9p2YxCAbcDeFgHiJ;i=p1;s=Basic PKA Example"
  }

  playwright = {
    name  = "_agent.playwright"
    value = "v=aid1;u=https://api.playwright.dev;p=openapi;k=zMnOpQrStUvWxYz0123456789AbCdEfGhIjKlMnOp;i=p1;d=https://github.com/microsoft/playwright-mcp;s=Playwright OpenAPI (Mock Service)"
  }

  secure = {
    name  = "_agent.secure"
    value = "v=aid1;u=https://api.secure.agentcommunity.org/mcp;p=mcp;a=pat;k=z7rW8rTq8o4mM6vVf7w1k3m4uQn9p2YxCAbcDeFgHiJ;i=g1;d=https://docs.agentcommunity.org/secure;s=Secure MCP with PKA"
  }

  simple = {
    name  = "_agent.simple"
    value = "v=aid1;u=https://api.example.com/mcp;p=mcp;a=pat;s=Basic MCP Example"
  }

  supabase = {
    name  = "_agent.supabase"
    value = "v=aid1;u=https://api.supabase.com/mcp;p=mcp;a=pat;k=zAbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEf;i=s1;d=https://supabase.com/docs/guides/getting-started/mcp;s=Supabase MCP (Mock Service)"
  }

  // Combined map of all examples for easy reference
  all_examples = {
    auth0 = local.auth0
    complete_v1_1 = local.complete_v1_1
    deprecated = local.deprecated
    firecrawl = local.firecrawl
    local_docker = local.local_docker
    messy = local.messy
    multi_string = local.multi_string
    no_server = local.no_server
    pka_basic = local.pka_basic
    playwright = local.playwright
    secure = local.secure
    simple = local.simple
    supabase = local.supabase
  }
}