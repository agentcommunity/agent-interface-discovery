'use client';

import { useState, useEffect } from 'react';
import { DiscoveryChat } from '@/components/workbench/discovery-chat';
import { GeneratorPanel } from '@/components/workbench/generator-panel';

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

  return (
    <div className="h-full">
      {/* Main content area - takes up remaining space */}
      <div className="relative h-full">
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
  );
};

export default WorkbenchPage;
