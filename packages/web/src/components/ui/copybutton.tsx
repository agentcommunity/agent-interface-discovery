'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
}

export function CopyButton({ textToCopy, className }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  // This function correctly handles the async nature of the clipboard API.
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
      setTimeout(() => {
        setHasCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text to clipboard:', error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-6 w-6', className)}
      // This is the key fix:
      // We provide a synchronous arrow function to onClick.
      // Inside it, we call our async function and use `void` to
      // explicitly ignore the returned promise, satisfying all lint rules.
      onClick={() => void copyToClipboard()}
    >
      {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      <span className="sr-only">Copy</span>
    </Button>
  );
}
