'use client';
import React from 'react';
import { Terminal } from 'lucide-react';
import { CopyButton } from './copybutton';
import { cn } from '@/lib/utils';

interface CodeblockProps {
  title?: string;
  content: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'inline';
  rightSlot?: React.ReactNode;
}

export function Codeblock({
  title,
  content,
  showLineNumbers = false,
  className = '',
  icon = <Terminal className="w-4 h-4" />,
  variant = 'default',
  rightSlot,
}: CodeblockProps) {
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-3 py-2 bg-muted border rounded-lg text-sm max-w-full',
          className,
        )}
      >
        <div className="flex items-center gap-2 overflow-x-auto min-w-0">
          {icon && icon}
          {title && (
            <span className="text-muted-foreground font-medium whitespace-nowrap shrink-0">{title}</span>
          )}
          <code className="text-foreground font-mono text-sm whitespace-pre break-all truncate block max-w-[60vw] sm:max-w-[50vw]">
            {content}
          </code>
        </div>
        <CopyButton
          textToCopy={content}
          className="h-7 w-7 hover:bg-accent hover:text-accent-foreground"
        />
      </div>
    );
  }

  return (
    <div className={cn('relative group', className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 text-sm bg-muted border border-b-0 rounded-t-lg">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-muted-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {rightSlot && <div>{rightSlot}</div>}
            <CopyButton
              textToCopy={content}
              className="h-7 w-7 hover:bg-accent hover:text-accent-foreground"
            />
          </div>
        </div>
      )}

      <div className="relative">
        {!title && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <CopyButton
              textToCopy={content}
              className="h-7 w-7 bg-background border hover:bg-accent hover:text-accent-foreground"
            />
          </div>
        )}

        <pre
          className={cn(
            'bg-muted/50 px-4 py-3 overflow-x-auto text-sm font-mono border',
            title ? 'rounded-b-lg rounded-t-none' : 'rounded-lg',
            showLineNumbers && 'pl-12',
          )}
        >
          <code className="text-foreground">
            {showLineNumbers
              ? content.split('\n').map((line, index) => (
                  <div key={index} className="table-row">
                    <span className="table-cell pr-4 text-right text-muted-foreground/50 select-none">
                      {index + 1}
                    </span>
                    <span className="table-cell">{line}</span>
                  </div>
                ))
              : content}
          </code>
        </pre>
      </div>
    </div>
  );
}
