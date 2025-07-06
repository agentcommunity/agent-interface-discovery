terraform {
  required_version = ">= 1.3.0"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.4"
    }
  }
}

# Provider config expects `VERCEL_API_TOKEN` env var supplied via GitHub Actions secret
provider "vercel" {}

########################
# Variables
########################

variable "zone" {
  description = "Apex DNS zone managed in Vercel (e.g., agentcommunity.org)"
  type        = string
}

variable "team_id" {
  description = "Vercel team ID"
  type        = string
}

########################
# Ideal-spec reference records
########################

locals {
  # We will define the common prefix here to keep the records clean
  record_prefix = "_agent"

  records = {
    simple = {
      # The name is now just the unique part of the subdomain.
      # The full name will be constructed by Vercel as:
      # _agent.simple.showcase.aid.agentcommunity.org
      name  = "${local.record_prefix}.simple.showcase.aid"
      value = "v=aid1;uri=https://api.example.com/mcp;p=mcp"
    }
    local_docker = {
      name  = "${local.record_prefix}.local-docker.showcase.aid"
      value = "v=aid1;uri=docker://myimage;proto=local;desc=Local Docker Agent"
    }
    messy = {
      name  = "${local.record_prefix}.messy.showcase.aid"
      value = " v=aid1 ; uri=https://api.example.com/mcp ; p=mcp ; extra=ignored "
    }
    multi_string = {
      name  = "${local.record_prefix}.multi-string.showcase.aid"
      value = "v=aid1;uri=https://api.example.com/mcp;p=mcp;desc=Multi string part 1"
    }
    supabase = {
      name  = "${local.record_prefix}.supabase.showcase.aid"
      value = "v=aid1;uri=https://api.supabase.com/mcp;proto=mcp;auth=pat;desc=(Community Showcase)"
    }
    auth0 = {
      name  = "${local.record_prefix}.auth0.showcase.aid"
      value = "v=aid1;uri=https://ai.auth0.com/mcp;proto=mcp;auth=pat;desc=(Community Showcase)"
    }
    openai = {
      name  = "${local.record_prefix}.openai.showcase.aid"
      value = "v=aid1;uri=https://api.openai.com/v1/assistants;proto=openapi;desc=OpenAI Assistants API"
    }
  }
}

# Iterate and create DNS TXT records
resource "vercel_dns_record" "showcase" {
  for_each = local.records

  domain    = var.zone
  name      = each.value.name
  type      = "TXT"
  value     = each.value.value
  team_id   = var.team_id
} 