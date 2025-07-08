'use client';

import { useState, useEffect } from 'react';
import { DiscoveryChat } from '@/components/workbench/discovery-chat';
import { GeneratorPanel } from '@/components/workbench/generator-panel';
import { Button } from '@/components/ui/button';

const WorkbenchPage = () => {
  const [mode, setMode] = useState<'resolver' | 'generator'>('resolver');

  // Handle hash-based routing
  useEffect(() => {
    // This check ensures the effect's logic only runs in the browser.
    // On the server, `globalThis.window` is undefined.
    if (globalThis.window === undefined) {
      return;
    }

    const updateModeFromHash = () => {
      const hash = globalThis.location.hash.slice(1); // Remove the '#'
      if (hash === 'generator') {
        setMode('generator');
      } else {
        setMode('resolver'); // Default to resolver
      }
    };

    // Set initial mode from hash
    updateModeFromHash();

    // Listen for hash changes
    globalThis.addEventListener('hashchange', updateModeFromHash);

    return () => {
      globalThis.removeEventListener('hashchange', updateModeFromHash);
    };
  }, []);

  const handleModeChange = (newMode: 'resolver' | 'generator') => {
    setMode(newMode);
    // Update URL hash without triggering a page reload
    const newHash = newMode === 'generator' ? '#generator' : '';
    // This check prevents errors during server-side rendering.
    if (globalThis.window !== undefined) {
      globalThis.history.replaceState(null, '', `/workbench${newHash}`);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with mode switcher only */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-center">
            {/* Mode Switcher */}
            <div className="inline-flex rounded-lg border bg-muted p-1">
              <Button
                variant={mode === 'resolver' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('resolver')}
                className="rounded-md transition-all duration-200"
              >
                Resolve
              </Button>
              <Button
                variant={mode === 'generator' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeChange('generator')}
                className="rounded-md transition-all duration-200"
              >
                Generate
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - takes up remaining space */}
      <div className="relative flex-1 min-h-0">
        <div className="h-full max-w-4xl mx-auto relative">
          {/* Resolver Panel */}
          <div
            className={`absolute inset-0 transition-all duration-300 ease-in-out ${
              mode === 'resolver'
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-full pointer-events-none'
            }`}
          >
            <DiscoveryChat />
          </div>

          {/* Generator Panel */}
          <div
            className={`absolute inset-0 transition-all duration-300 ease-in-out ${
              mode === 'generator'
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-full pointer-events-none'
            }`}
          >
            <GeneratorPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkbenchPage;
