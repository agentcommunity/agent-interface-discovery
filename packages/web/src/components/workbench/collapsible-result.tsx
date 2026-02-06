'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Info, ChevronDown } from 'lucide-react';

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, className: 'text-emerald-600' },
  error: { icon: XCircle, className: 'text-red-500' },
  loading: { icon: Loader2, className: 'text-amber-500 animate-spin' },
  info: { icon: Info, className: 'text-blue-500' },
} as const;

interface CollapsibleResultProps {
  status: keyof typeof STATUS_CONFIG;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleResult({
  status,
  title,
  defaultOpen = false,
  children,
}: CollapsibleResultProps) {
  const [open, setOpen] = useState(defaultOpen);
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-2xl bg-muted/50 border border-border/40 hover:bg-muted/70 transition-colors cursor-pointer text-left"
      >
        <StatusIcon className={`w-4 h-4 shrink-0 ${config.className}`} />
        <span className="flex-1 text-sm font-medium text-foreground">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
