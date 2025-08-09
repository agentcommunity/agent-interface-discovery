// New minimal 3-step Quick Start aligned with docs & README
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Rocket, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Codeblock } from '@/components/ui/codeblock';

// --- Code snippets identical to README / docs ------------------------------
const DISCOVER_SNIPPETS: Record<string, string> = {
  typescript: `import { discover } from '@agentcommunity/aid'

const { record } = await discover('example.com')
console.log(record.uri) // https://api.example.com/mcp`,
  python: `from aid_py import discover

record = discover('example.com')
print(record.uri) # https://api.example.com/mcp`,
  go: `import "github.com/agentcommunity/aid-go"

rec, err := aid.Discover("example.com")
if err != nil { /* handle */ }
fmt.Println(rec.Record.URI) // https://api.example.com/mcp`,
};

const DNS_SNIPPET = `_agent.example.com. 300 IN TXT "v=aid1;uri=https://api.example.com/mcp;p=mcp"`;
const TERRAFORM_SNIPPET = `resource "cloudflare_record" "aid" {
  zone_id = var.zone_id
  name    = "_agent"
  type    = "TXT"
  value   = "v=aid1;uri=https://api.example.com/mcp;p=mcp"
}`;

const VALIDATE_CLI = `# Install validator
npm i -g @agentcommunity/aid-doctor

# Validate your domain
aid-doctor check example.com`;

// ---------------------------------------------------------------------------

export function QuickStart() {
  const [step, setStep] = useState<'discover' | 'publish' | 'validate'>('discover');
  const [lang, setLang] = useState<'typescript' | 'python' | 'go'>('typescript');
  const [publishTab, setPublishTab] = useState<'dns' | 'terraform'>('dns');

  const STEPS: Array<{ id: 'discover' | 'publish' | 'validate'; label: string; Icon: LucideIcon }> =
    [
      { id: 'discover', label: 'Discover', Icon: Compass },
      { id: 'publish', label: 'Publish', Icon: Rocket },
      { id: 'validate', label: 'Validate', Icon: CheckCircle2 },
    ];

  return (
    <section className="section-padding bg-muted/30">
      <div className="container mx-auto container-padding">
        <div className="mx-auto max-w-4xl">
          {/* Heading */}
          <div className="mb-12 text-center animate-fade-in">
            <h2 className="mb-4 text-4xl md:text-5xl font-bold tracking-tight">Quick Start</h2>
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground">
              Discover, publish and validate in minutes
            </p>
          </div>

          {/* Hero Card */}
          <Card className="card-feature shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 animate-fade-in">
            <CardHeader className="pb-6">
              {/* Step toggle group (iconic, theme-aligned) */}
              <div className="flex justify-center gap-3">
                {STEPS.map((item, idx) => {
                  const active = step === item.id;
                  const Icon: LucideIcon = item.Icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setStep(item.id)}
                      className={`card-interactive px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm font-medium border border-border/50 shadow-soft-xs hover:shadow-soft-md ${
                        active ? 'bg-primary/10 border-primary/30' : 'bg-card/50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Step {idx + 1}
                        </div>
                        <div className={`leading-tight ${active ? 'text-foreground' : ''}`}>
                          {item.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardHeader>

            <CardContent>
              {step === 'discover' && (
                <Codeblock
                  title="discover"
                  content={DISCOVER_SNIPPETS[lang]}
                  rightSlot={
                    <div className="flex gap-1">
                      {(['typescript', 'python', 'go'] as const).map((l) => (
                        <Button
                          key={l}
                          size="sm"
                          variant={lang === l ? 'default' : 'outline'}
                          className="capitalize text-xs"
                          onClick={() => setLang(l)}
                        >
                          {l}
                        </Button>
                      ))}
                    </div>
                  }
                />
              )}

              {step === 'publish' && (
                <Codeblock
                  title={publishTab}
                  content={publishTab === 'dns' ? DNS_SNIPPET : TERRAFORM_SNIPPET}
                  rightSlot={
                    <div className="flex gap-1">
                      {(['dns', 'terraform'] as const).map((t) => (
                        <Button
                          key={t}
                          size="sm"
                          variant={publishTab === t ? 'default' : 'outline'}
                          className="capitalize text-xs"
                          onClick={() => setPublishTab(t)}
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  }
                />
              )}

              {step === 'validate' && (
                <div className="space-y-4">
                  <Codeblock title="cli" content={VALIDATE_CLI} />
                  <Button
                    asChild
                    className="shadow-soft hover:shadow-soft-md transition-all duration-200 hover:scale-105 w-full sm:w-auto"
                  >
                    <a href="/workbench" target="_blank" rel="noopener noreferrer">
                      Open Web Workbench
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Docs link */}
          <div className="mt-8 text-center">
            <a
              href="https://docs.agentcommunity.org/aid"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              Need more? Read the full Quick Start guide ↗︎
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
