'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Github, Bot, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const [hash, setHash] = useState('');

  useEffect(() => {
    const updateHash = () => {
      setHash(globalThis.location.hash); // instead of window.location.hash
    };

    updateHash(); // Initialize
    globalThis.addEventListener('hashchange', updateHash);
    return () => globalThis.removeEventListener('hashchange', updateHash);
  }, []);

  // Enhance this to handle hash when pathname is the same
  const isActive = (href: string) => {
    if (href.includes('#')) {
      const [basePath, targetHash] = href.split('#');
      return pathname === basePath && hash === `#${targetHash}`;
    }
    if (href === '/workbench' && pathname === '/workbench') {
      return !hash || hash === '#'; // treat base /workbench with no hash as active
    }
    return pathname === href;
  };

  const navigation = [
    { name: 'Resolver', href: '/workbench', external: false },
    { name: 'Generator', href: '/workbench#generator', external: false },
    { name: 'Docs', href: 'https://docs.agentcommunity.org', external: true },
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

        <nav className="flex items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className={cn(
                'transition-all duration-200 hover:text-foreground flex items-center gap-1 hover:scale-105',
                isActive(item.href) ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {item.name}
              {item.external && (
                <ExternalLink className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground shadow-soft hover:shadow-soft-md transition-all duration-200 hover:scale-105"
          >
            <Link
              href="https://github.com/agentcommunity/aid-interface-discovery"
              target="_blank"
              className="flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </Link>
          </Button>

          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft-md hover:shadow-soft-lg transition-all duration-300 hover:scale-105"
          >
            <Link href="/workbench">Try the Workbench</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
