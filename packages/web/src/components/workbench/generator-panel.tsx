'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Textarea } from '@/components/ui/textarea';
import { Codeblock } from '@/components/ui/codeblock';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExamplePicker } from './example-picker';
import {
  CheckCircle2,
  XCircle,
  Globe,
  Lightbulb,
  Link as LinkIcon,
  AlertCircle,
  ChevronDown,
  Key,
} from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

import {
  buildTxtRecord,
  validateTxtRecord,
  type AidGeneratorData,
} from '@agentcommunity/aid-web-generator';

import { AUTH_TOKENS, PROTOCOL_TOKENS } from '@agentcommunity/aid';
import type { ProtocolToken, AuthToken } from '@agentcommunity/aid';

type FormData = AidGeneratorData;


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
    uri: 'https://{example.com}',
    proto: '',
    auth: '',
    desc: '',
    domain: 'example.com',
  });

  const txtRecordString = useMemo(() => buildTxtRecord(formData), [formData]);
  const validationResult = useMemo(() => validateTxtRecord(txtRecordString), [txtRecordString]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev: FormData) => ({ ...prev, [field]: value }));
  };

  const handleExampleSelect = (content: string) => {
    const parsed = parseExample(content);
    setFormData((prev: FormData) => ({ ...prev, ...parsed }));
  };

  const dnsHost = `_agent.${formData.domain}`;
  const descByteLength = new TextEncoder().encode(formData.desc).length;
  const isDescTooLong = descByteLength > 60;

  return (

    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AID Generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Protocol <span className="text-destructive">*</span>
                </label>
                <ToggleGroup
                  type="single"
                  className="mt-2 flex flex-wrap gap-2"
                  value={formData.proto}
                  onValueChange={(v) => updateField('proto', v)}
                >
                  {PROTOCOL_ORDER.map((proto) => (
                    <ToggleGroupItem key={proto} value={proto} className="text-left capitalize">
                      {proto.toUpperCase()}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div>
                <label className="text-sm font-medium">Authentication (optional)</label>
                <ToggleGroup
                  type="single"
                  className="mt-2 flex flex-wrap gap-2"
                  value={formData.auth}
                  onValueChange={(v) => updateField('auth', v)}
                >
                  <ToggleGroupItem value="">none</ToggleGroupItem>
                  {(Object.keys(AUTH_TOKENS) as AuthToken[]).map((auth) => (
                    <ToggleGroupItem key={auth} value={auth} className="capitalize">
                      {auth}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <label htmlFor="uri" className="text-sm font-medium">
                  URI <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="uri"
                    className="pl-10"
                    placeholder="https://{example.com}"
                    value={formData.uri}
                    onFocus={() =>
                      formData.uri === 'https://{example.com}' && updateField('uri', '')
                    }
                    onChange={(e) => updateField('uri', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="domain" className="text-sm font-medium">
                  Domain
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="domain"
                    className="pl-10"
                    placeholder="example.com"
                    value={formData.domain}
                    onChange={(e) => updateField('domain', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="desc" className="text-sm font-medium">
                  Description
                  <span
                    className={`ml-2 text-xs ${
                      isDescTooLong ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                  >
                    {descByteLength}/60 bytes
                  </span>
                </label>
                <Textarea
                  id="desc"
                  placeholder="Short description"
                  value={formData.desc}
                  onChange={(e) => updateField('desc', e.target.value)}
                />
                {isDescTooLong && (
                  <p className="text-xs text-destructive">
                    Description exceeds 60 UTF-8 bytes limit
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-base">Preview</CardTitle>
              {validationResult.isValid ? (
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
                <Codeblock
                  title="Value"
                  icon={<Key className="w-4 h-4" />}
                  content={txtRecordString}
                  variant="inline"
                />
              </div>

              {validationResult.isValid && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>Ready to publish!</AlertTitle>
                  <AlertDescription>
                    Add the DNS record above to your DNS provider.
                  </AlertDescription>
                </Alert>
              )}

              {!validationResult.isValid && validationResult.error && (
                <p className="text-sm text-destructive flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 mt-0.5" />
                  {validationResult.error}
                </p>
              )}

              {validationResult.isValid && (
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
            <ExamplePicker variant="toggle" onSelect={handleExampleSelect} />
          </div>
        </div>
      </div>
    </div>
  );
}
