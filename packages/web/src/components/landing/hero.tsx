'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, PlayCircle, Sparkles } from 'lucide-react';
import { CopyButton } from '@/components/ui/copybutton';
import { getAidVersion, fetchAidVersion } from '@/lib/utils';

export function Hero() {
  const [tokenCount, setTokenCount] = useState(0);
  const [engineerHours, setEngineerHours] = useState(0);
  const [aidVersion, setAidVersion] = useState(getAidVersion());
  const targetTokens = 12_345_678;
  const HUMAN_TOKENS_PER_HOUR = 12_000;

  useEffect(() => {
    fetchAidVersion()
      .then(setAidVersion)
      .catch(() => {});

    const duration = 2000;
    const steps = 60;
    const increment = targetTokens / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetTokens) {
        setTokenCount(targetTokens);
        setEngineerHours(Math.floor(targetTokens / HUMAN_TOKENS_PER_HOUR));
        clearInterval(timer);
      } else {
        const tokens = Math.floor(current);
        setTokenCount(tokens);
        setEngineerHours(Math.floor(tokens / HUMAN_TOKENS_PER_HOUR));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative w-full section-padding">
      <div className="container mx-auto container-padding text-center">
        <div className="mx-auto max-w-5xl">
          <Badge
            variant="secondary"
            className="mb-6 animate-fade-in shadow-soft-xs hover:shadow-soft-md transition-all duration-200"
          >
            v{aidVersion} • DNS-based Agent Identity & Discovery
          </Badge>

          <h1 className="mb-8 text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-balance animate-fade-in-up">
            _agent Identity<span className=" text-muted-foreground"> & Discovery</span>
          </h1>

          <p className="mx-auto mb-8 max-w-4xl text-xl md:text-2xl leading-relaxed text-muted-foreground animate-fade-in-up">
            DNS for agents. Discover endpoints and verify identity.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center mb-12 animate-fade-in-up">
            <Button
              size="lg"
              asChild
              className="group shadow-soft-md hover:shadow-soft-lg transition-all duration-300 hover:scale-105"
            >
              <Link href="/workbench">
                <PlayCircle className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                Try the Resolver
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              asChild
              className="group shadow-soft hover:shadow-soft-md transition-all duration-300 hover:scale-105"
            >
              <Link href="https://docs.agentcommunity.org/aid/specification">
                Read the Specification
                <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>

          <div className="flex justify-center">
            <Button variant="ghost" asChild className="text-sm">
              <Link href="https://docs.agentcommunity.org/aid/Reference/identity_pka">
                Learn Agent Identity
              </Link>
            </Button>
          </div>

          {/* Animated Stats Badge */}
          <div className="mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-3 rounded-full bg-muted/50 px-6 py-3 text-sm border border-border/30 shadow-soft-md hover:shadow-soft-lg transition-all duration-300 hover:scale-105 group">
              <Sparkles className="h-4 w-4 text-amber-500 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-muted-foreground">
                <span className="font-mono tabular-nums font-semibold text-foreground animate-count-up">
                  {tokenCount.toLocaleString()}
                </span>{' '}
                input-tokens and{' '}
                <span className="font-mono tabular-nums font-semibold text-foreground animate-count-up">
                  {engineerHours.toLocaleString()}
                </span>{' '}
                engineering hours saved
              </span>
            </div>
          </div>

          {/* Install Command */}
          <div className="flex justify-center pt-4">
            <div className="bg-card border border-border/50 rounded-xl px-6 py-4 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 max-w-md group">
              <div className="flex items-center gap-4 font-mono text-sm">
                <span className="text-muted-foreground transition-colors duration-300 group-hover:text-primary">
                  $
                </span>
                <span className="text-foreground transition-colors duration-300 group-hover:text-foreground">
                  npm install @agentcommunity/aid
                </span>
                <CopyButton textToCopy="npm install @agentcommunity/aid" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Core SDK. The CLI wraps the engine.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
