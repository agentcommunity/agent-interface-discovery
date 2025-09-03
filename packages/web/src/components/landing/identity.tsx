'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Codeblock } from '@/components/ui/codeblock';
import { ShieldCheck } from 'lucide-react';

const TXT_PKA_SNIPPET = `_agent.example.com. 300 IN TXT \
  "v=aid1;\\\n  u=https://api.example.com/mcp;\\\n  p=mcp;\\\n  k=z7rW8rTq8o4mM6vVf7w1k3m4uQn9p2YxCAbcDeFgHiJ;\\\n  i=g1"`;

export function Identity() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container mx-auto container-padding">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <h2 className="mb-4 text-4xl md:text-5xl font-bold tracking-tight">Identity (PKA)</h2>
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground">
              Public Key for Agents: verify that you are connecting to the right endpoint.
            </p>
          </div>

          <Card className="card-feature shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 animate-fade-in">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </span>
                How it works
              </CardTitle>
              <CardDescription>
                PKA adds a public key (`k`) and a key id (`i`) to your `_agent` TXT record. Clients
                send a small challenge and verify an HTTP signature from your server using that key.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 text-sm leading-relaxed">
                  <p className="text-muted-foreground">
                    In short: DNS tells clients where to connect; Identity (PKA) lets clients verify
                    who is on the other end.
                  </p>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>Publish `k` (public key) and `i` (key id) in your TXT record</li>
                    <li>Client sends an `AID-Challenge` to your `uri`</li>
                    <li>Server returns an HTTP signature (Ed25519) covering the request</li>
                    <li>Client verifies the signature using `k`</li>
                  </ul>
                  <div>
                    <Button variant="outline" asChild>
                      <Link href="https://docs.agentcommunity.org/aid/Reference/identity_pka">
                        Learn more
                      </Link>
                    </Button>
                  </div>
                </div>
                <div>
                  <Codeblock title="txt" content={TXT_PKA_SNIPPET} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
