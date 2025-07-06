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

#####################
# Variables
#####################

variable "zone" {
  description = "Delegated zone managed in Vercel (e.g. showcase.aid.agentcommunity.org)"
  type        = string
}

variable "team_id" {
  description = "Vercel team ID"
  type        = string
}

#####################
# Showcase records
#####################

locals {
  record_prefix = "_agent"

  records = {
    simple = {
      # becomes _agent.simple.showcase.aid.agentcommunity.org in DNS
      name  = "${local.record_prefix}.simple"
      value = "v=aid1;uri=https://api.example.com/mcp;p=mcp"
    }
    local_docker = {
      name  = "${local.record_prefix}.local-docker"
      value = "v=aid1;uri=docker://myimage;proto=local;desc=Local Docker Agent"
    }
    messy = {
      name  = "${local.record_prefix}.messy"
      value = " v=aid1 ; uri=https://api.example.com/mcp ; p=mcp ; extra=ignored "
    }
    multi_string = {
      name  = "${local.record_prefix}.multi-string"
      value = "v=aid1;uri=https://api.example.com/mcp;p=mcp;desc=Multi string part 1"
    }
    supabase = {
      name  = "${local.record_prefix}.supabase"
      value = "v=aid1;uri=https://api.supabase.com/mcp;proto=mcp;auth=pat;desc=(Community Showcase)"
    }
    auth0 = {
      name  = "${local.record_prefix}.auth0"
      value = "v=aid1;uri=https://ai.auth0.com/mcp;proto=mcp;auth=pat;desc=(Community Showcase)"
    }
    openai = {
      name  = "${local.record_prefix}.openai"
      value = "v=aid1;uri=https://api.openai.com/v1/assistants;proto=openapi;desc=OpenAI Assistants API"
    }
  }
}

# Iterate and create DNS TXT records
resource "vercel_dns_record" "showcase" {
  for_each = local.records

  domain    = var.zone              # <= showcase.aid.agentcommunity.org
  name      = each.value.name       # just the left-hand label(s)
  type      = "TXT"
  value     = each.value.value
  team_id   = var.team_id
} 