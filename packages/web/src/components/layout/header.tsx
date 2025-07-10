'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Bot, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


// This function handles the click, updates the URL, and manually fires the event.
// Moved to the outer scope to fix the 'unicorn/consistent-function-scoping' lint error.
const handleModeChange = (newMode: 'resolver' | 'generator') => {
  const newHash = newMode === 'generator' ? '#generator' : '';
  // This check prevents errors during server-side rendering.
  if (globalThis.window !== undefined) {
    globalThis.history.replaceState(null, '', `/workbench${newHash}`);
    // Manually dispatch a hashchange event so other components can react
    globalThis.dispatchEvent(new Event('hashchange'));
  }
};

function WorkbenchModeSwitcher() {
  const [mode, setMode] = useState<'resolver' | 'generator'>('resolver');

  // This effect listens for hash changes to keep the switcher UI in sync
  useEffect(() => {
    const handleHashChange = () => {
      const hash = globalThis.location.hash.slice(1);
      setMode(hash === 'generator' ? 'generator' : 'resolver');
    };

    handleHashChange(); // Set initial state
    globalThis.addEventListener('hashchange', handleHashChange);
    return () => globalThis.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="inline-flex rounded-lg border bg-muted p-1">
      <Button
        variant={mode === 'resolver' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('resolver')}
        className="w-24 rounded-md transition-all duration-200"
      >
        Resolve
      </Button>
      <Button
        variant={mode === 'generator' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleModeChange('generator')}
        className="w-24 rounded-md transition-all duration-200"
      >
        Generate
      </Button>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const isWorkbench = pathname === '/workbench';


  const navigation = [
    { name: 'Docs', href: 'https://docs.agentcommunity.org', external: true },
    {
      name: 'GitHub',
      href: 'https://github.com/agentcommunity/aid-interface-discovery',
      external: true,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-soft shadow-soft">
      <div className="container flex h-16 items-center">
        <Link href="/" className="group mr-8 flex items-center gap-3 font-bold">
          <div className="p-1.5 bg-muted rounded-lg transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110 shadow-soft-xs group-hover:shadow-soft-md">
            <Bot className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
          </div>
          <span className="text-xl tracking-tight transition-colors duration-300 group-hover:text-foreground">
            AID
          </span>
        </Link>

        <div className="flex-1 flex justify-center">
          {isWorkbench ? (
            <WorkbenchModeSwitcher />
          ) : (
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {/* Future-proofing: could add back home-page specific nav items here */}
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <nav className="hidden sm:flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className={cn(
                  'transition-all duration-200 hover:text-foreground flex items-center gap-1 hover:scale-105',
                  'text-muted-foreground',
                )}
              >
                {item.name}
                {item.external && (
                  <ExternalLink className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                )}
              </Link>
            ))}
          </nav>
          {isWorkbench ? (
            <Button disabled className="shadow-soft-md">
              Workbench
            </Button>
          ) : (
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft-md hover:shadow-soft-lg transition-all duration-300 hover:scale-105"
            >
              <Link href="/workbench">Try the Workbench</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
