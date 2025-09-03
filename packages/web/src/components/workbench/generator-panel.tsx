'use client';

import { useState, useMemo } from 'react';
//
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
//
import { Codeblock } from '@/components/ui/codeblock';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExamplePicker } from './example-picker';
import {
  CheckCircle2,
  XCircle,
  Globe,
  Lightbulb,
  AlertCircle,
  ChevronDown,
  Key,
} from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';



import { buildTxtRecord as buildTxtV11, buildWellKnownJson, computeBytes, suggestAliases, validate as validateV11, parseRecordString } from '@/lib/generator/core';
import type { AidGeneratorFormData } from '@/lib/generator/types';
import { CoreFields } from './v11-fields/core-fields';
import { MetadataFields } from './v11-fields/metadata-fields';
import { SecurityFields } from './v11-fields/security-fields';


import type { ProtocolToken, AuthToken } from '@agentcommunity/aid';

type FormData = AidGeneratorFormData & { useAliases: boolean };

type FormPatch = Partial<FormData>;

const PROTOCOL_ORDER: ProtocolToken[] = ['mcp', 'a2a', 'openapi', 'local'];

function parseExample(example: string): Partial<FormData> {
  const parts = new Map(
    example.split(';').map((p) => {
      const [key, ...value] = p.split('=');
      return [key, value.join('=')];
    }),
  );

  const parsedData: Partial<FormData> = {};
  if (parts.has('uri')) parsedData.uri = parts.get('uri');
  if (parts.has('proto') || parts.has('p')) {
    parsedData.proto = (parts.get('proto') || parts.get('p') || '') as ProtocolToken;
  }
  if (parts.has('auth')) {
    parsedData.auth = (parts.get('auth') || '') as AuthToken;
  }
  if (parts.has('desc')) parsedData.desc = parts.get('desc');

  return parsedData;
}

export function GeneratorPanel() {
  const [formData, setFormData] = useState<FormData>({
    domain: 'example.com',
    uri: '',
    proto: 'mcp',
    auth: 'pat',
    desc: '',
    docs: '',
    dep: '',
    pka: '',
    kid: '',
    useAliases: true,
  });

  const txtRecordString = useMemo(() => buildTxtV11(formData, { useAliases: formData.useAliases }), [formData]);
  const { txtBytes, descBytes } = useMemo(() => computeBytes(txtRecordString, formData.desc), [txtRecordString, formData.desc]);
  const specValidation = useMemo(() => validateV11(formData), [formData]);
  const [serverResult, setServerResult] = useState<{
    txt: string;
    json: Record<string, unknown>;
    bytes: { txt: number; desc: number };
    errors: Array<{ code: string; message: string }>;
    warnings: Array<{ code: string; message: string }>;
    success: boolean;
    suggestAliases?: boolean;
  } | null>(null);

  // Debounced server validation
  useMemo(() => {
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/generator/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = (await res.json()) as typeof serverResult;
        setServerResult(json as any);
      } catch {
        /* no-op */
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [formData]);

  const dnsHost = `_agent.${formData.domain}`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AID Generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CoreFields
                proto={formData.proto}
                auth={formData.auth}
                uri={formData.uri}
                domain={formData.domain}
                onChange={(patch: FormPatch) => setFormData((p) => ({ ...p, ...patch }))}
              />

              <MetadataFields
                desc={formData.desc}
                docs={formData.docs}
                dep={formData.dep}
                descBytes={descBytes}
                onChange={(patch: FormPatch) => setFormData((p) => ({ ...p, ...patch }))}
              />

              <SecurityFields
                pka={formData.pka}
                kid={formData.kid}
                onChange={(patch: FormPatch) => setFormData((p) => ({ ...p, ...patch }))}
              />

              {/* Description now lives in MetadataFields with bytes counter */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-2">
              <div className="flex flex-row justify-between items-center">
                <CardTitle className="text-base">Preview</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Aliases</span>
                    <Toggle
                      pressed={formData.useAliases}
                      onPressedChange={(v) => setFormData((p) => ({ ...p, useAliases: v }))}
                      aria-label="Toggle alias keys"
                    >
                      {formData.useAliases ? 'On' : 'Off'}
                    </Toggle>
                    {serverResult && (
                      <span className="text-xs">
                        {serverResult.suggestAliases ? '(suggested)' : '(full preferred)'}
                      </span>
                    )}
                  </div>
                  {(serverResult?.success ?? specValidation.isValid) ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Valid
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-destructive">
                    <XCircle className="w-4 h-4" />
                    Invalid
                  </div>
                )}
                </div>
              </div>
              {serverResult && !serverResult.success ? (
                <ul className="text-sm text-destructive space-y-1">
                  {serverResult.errors.map((e) => (
                    <li key={e.code} className="flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 mt-0.5" /> {e.message}
                    </li>
                  ))}
                </ul>
              ) : !specValidation.isValid ? (
                <ul className="text-sm text-destructive space-y-1">
                  {specValidation.errors.map((e) => (
                    <li key={e.code} className="flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 mt-0.5" /> {e.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <p className="mb-1 font-medium">DNS Record:</p>
                <Codeblock
                  title="Host"
                  icon={<Globe className="w-4 h-4" />}
                  content={dnsHost}
                  variant="inline"
                />
                <div className="flex items-center gap-2 px-4 text-sm text-muted-foreground">
                  <span className="font-mono">Type</span>
                  <span>TXT</span>
                </div>
                <div className="flex items-center gap-3">
                  <Codeblock
                    title="Value"
                    icon={<Key className="w-4 h-4" />}
                    content={serverResult?.txt || txtRecordString}
                    variant="inline"
                  />
                  <div className={`text-xs ${(serverResult?.bytes.txt ?? txtBytes) > 255 ? 'text-destructive' : 'text-muted-foreground'}`}>{serverResult?.bytes.txt ?? txtBytes} bytes</div>
                </div>
              </div>

              <div className="text-sm space-y-2">
                <p className="mb-1 font-medium">.well-known Fallback (JSON)</p>
                <Codeblock
                  title="/\.well-known/agent"
                  icon={<Globe className="w-4 h-4" />}
                  content={JSON.stringify(serverResult?.json || buildWellKnownJson(formData, { useAliases: formData.useAliases }), null, 2)}
                />
              </div>

              {specValidation.isValid && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>Ready to publish!</AlertTitle>
                  <AlertDescription>
                    Add the DNS record above to your DNS provider.
                  </AlertDescription>
                </Alert>
              )}

              {!specValidation.isValid && (
                <ul className="text-sm text-destructive space-y-1">
                  {specValidation.errors.map((e) => (
                    <li key={e.code} className="flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 mt-0.5" /> {e.message}
                    </li>
                  ))}
                </ul>
              )}

              {specValidation.isValid && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center text-sm text-muted-foreground gap-1 hover:text-foreground mt-2">
                    <ChevronDown className="w-4 h-4" />
                    Guide for common DNS providers
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 text-sm text-muted-foreground pl-1">
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>
                        <strong>Cloudflare:</strong> DNS → Records → Add TXT
                      </li>
                      <li>
                        <strong>Route53:</strong> Hosted zones → Create record
                      </li>
                      <li>
                        <strong>Google Cloud DNS:</strong> Zone → Add record
                      </li>
                      <li>
                        <strong>Namecheap:</strong> Advanced DNS → Add new record
                      </li>
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <ExamplePicker
              variant="toggle"
              onSelect={async (ex) => {
                // Load example TXT into form (and set domain)
                const parsed = parseRecordString(ex.content);
                const aliasesSuggested = await suggestAliases({
                  domain: ex.domain,
                  uri: parsed.uri ?? '',
                  proto: parsed.proto ?? 'mcp',
                  auth: parsed.auth ?? '',
                  desc: parsed.desc ?? '',
                  docs: parsed.docs,
                  dep: parsed.dep,
                  pka: parsed.pka,
                  kid: parsed.kid,
                });
                setFormData((prev) => ({
                  ...prev,
                  domain: ex.domain,
                  uri: parsed.uri ?? prev.uri,
                  proto: parsed.proto ?? prev.proto,
                  auth: parsed.auth ?? prev.auth,
                  desc: parsed.desc ?? prev.desc,
                  docs: parsed.docs ?? prev.docs,
                  dep: parsed.dep ?? prev.dep,
                  pka: parsed.pka ?? prev.pka,
                  kid: parsed.kid ?? prev.kid,
                  useAliases: aliasesSuggested,
                }));
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
