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
provider "vercel" {
  # Allow overriding the team via variable so CI can target BlockSpace
  team_id = var.team_id
}

########################
# Variables
########################

variable "zone" {
  description = "Root DNS zone for showcase records (e.g., aid.agentcommunity.org)"
  type        = string
}

variable "team_id" {
  description = "Vercel team ID (e.g., team_xxxxxxxxxxxxxxxxxxxx)"
  type        = string
}

########################
# Ideal-spec reference records
########################

locals {
  records = {
    simple = {
      name  = "_agent.simple.showcase"   # FQDN relative to `var.zone`
      value = "v=aid1;uri=https://api.example.com/mcp;p=mcp"
    }
    local_docker = {
      name  = "_agent.local-docker.showcase"
      value = "v=aid1;uri=docker://myimage;proto=local;desc=Local Docker Agent"
    }
    messy = {
      name  = "_agent.messy.showcase"
      value = " v=aid1 ; uri=https://api.example.com/mcp ; p=mcp ; extra=ignored "
    }
    multi_string = {
      name  = "_agent.multi-string.showcase"
      value = "v=aid1;uri=https://api.example.com/mcp;p=mcp;desc=Multi string part 1" # Note: Vercel supports single-line only; concatenation handled by client
    }
    supabase = {
      name  = "_agent.supabase.showcase"
      value = "v=aid1;uri=https://api.supabase.com/mcp;proto=mcp;auth=pat;desc=(Community Showcase)"
    }
    auth0 = {
      name  = "_agent.auth0.showcase"
      value = "v=aid1;uri=https://ai.auth0.com/mcp;proto=mcp;auth=pat;desc=(Community Showcase)"
    }
    openai = {
      name  = "_agent.openai.showcase"
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
} 