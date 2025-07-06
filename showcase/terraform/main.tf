terraform {
  required_version = ">= 1.3.0"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.4"
    }
  }
}

# Provider config expects `VERCEL_TOKEN` env var supplied via GitHub Actions secret
provider "vercel" {}

########################
# Variables
########################

variable "zone" {
  description = "Root DNS zone for showcase records (e.g., aid.agentcommunity.org)"
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
  }
}

# Iterate and create DNS TXT records
resource "vercel_dns_record" "showcase" {
  for_each = local.records

  zone      = var.zone
  name      = each.value.name
  type      = "TXT"
  value     = each.value.value
  ttl       = 3600
} 