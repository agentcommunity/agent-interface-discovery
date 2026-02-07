'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Codeblock } from '@/components/ui/codeblock';
import { Code, Download } from 'lucide-react';
import {
  buildSnippets,
  INSTALL_COMMANDS,
  LANGUAGE_LABELS,
  LANGUAGES,
  type SnippetLanguage,
} from '@/lib/sdk-snippets';

interface ConnectSnippetProps {
  domain: string;
}

export function ConnectSnippet({ domain }: ConnectSnippetProps) {
  const [lang, setLang] = useState<SnippetLanguage>('typescript');
  const snippets = buildSnippets(domain);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Code className="w-4 h-4" />
        Connect from your code
      </div>

      <Codeblock
        title={LANGUAGE_LABELS[lang]}
        content={snippets[lang]}
        rightSlot={
          <div className="flex gap-1 flex-wrap">
            {LANGUAGES.map((l) => (
              <Button
                key={l}
                size="sm"
                variant={lang === l ? 'default' : 'outline'}
                className="text-xs px-2 py-0.5 h-6"
                onClick={() => setLang(l)}
              >
                {LANGUAGE_LABELS[l]}
              </Button>
            ))}
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <Download className="w-3 h-3 text-muted-foreground" />
        <code className="text-xs text-muted-foreground bg-background border rounded px-1.5 py-0.5">
          {INSTALL_COMMANDS[lang]}
        </code>
      </div>
    </div>
  );
}
