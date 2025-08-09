'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink } from 'lucide-react';

const toolkitPackages = [
  {
    name: 'TypeScript / JS',
    package: '@agentcommunity/aid',
    description: 'Core discovery library – Node.js & browser',
    features: ['Promise-based API', 'TypeScript types', 'Built-in validation'],
    href: 'https://www.npmjs.com/package/@agentcommunity/aid',
    badge: 'Stable',
  },
  {
    name: 'CLI – AID Doctor',
    package: '@agentcommunity/aid-doctor',
    description: 'Validate & generate DNS records from the terminal',
    features: ['Record linting', 'Security checks', 'JSON/YAML output'],
    href: 'https://www.npmjs.com/package/@agentcommunity/aid-doctor',
    badge: 'Stable',
  },
  {
    name: 'Go',
    package: 'github.com/agentcommunity/aid-go',
    description: 'High-performance Go client',
    features: ['Zero allocations', 'Context support', 'No external deps'],
    href: 'https://pkg.go.dev/github.com/agentcommunity/aid-go',
    badge: 'Stable',
  },
  {
    name: 'Python',
    package: 'aid-discovery',
    description: 'Idiomatic Python client',
    features: ['Type hints', 'Clean API'],
    href: 'https://pypi.org/project/aid-discovery/',
    badge: 'Beta',
  },
  {
    name: 'Web Workbench',
    package: 'Interactive tool',
    description: 'Try AID in the browser – no install',
    features: ['Live DNS lookup', 'Shareable links', 'Export configs'],
    href: '/workbench',
    badge: 'Stable',
  },
];

export function Toolkit() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container mx-auto container-padding">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <h2 className="mb-4 text-4xl md:text-5xl font-bold tracking-tight">
              Complete Developer Toolkit
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground">
              Everything you need to build AID-powered applications
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {toolkitPackages.map((pkg, index) => (
              <Card
                key={index}
                className="card-feature flex flex-col shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={
                        pkg.badge === 'Stable'
                          ? 'success'
                          : (pkg.badge === 'Beta'
                            ? 'warning'
                            : 'default')
                      }
                      className="text-xs shadow-soft-xs transition-all duration-300 group-hover:shadow-soft-md group-hover:scale-105"
                    >
                      {pkg.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg transition-colors duration-300 group-hover:text-foreground">
                    {pkg.name}
                  </CardTitle>
                  <div className="text-sm font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded border border-border/30 shadow-soft-xs transition-all duration-300 group-hover:bg-muted/70">
                    {pkg.package}
                  </div>
                  <CardDescription className="text-sm transition-colors duration-300 group-hover:text-muted-foreground/80">
                    {pkg.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 mb-6 flex-1">
                    {pkg.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-2 text-sm transition-colors duration-300 group-hover:text-muted-foreground/90"
                      >
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 transition-all duration-300 group-hover:scale-110" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full group-button shadow-soft hover:shadow-soft-md transition-all duration-200 hover:scale-105"
                    asChild
                  >
                    <Link
                      href={pkg.href}
                      target={pkg.href.startsWith('http') ? '_blank' : undefined}
                    >
                      {pkg.href.startsWith('/') ? 'Try Now' : 'View Package'}
                      <ExternalLink className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center animate-fade-in">
            <Button
              size="lg"
              asChild
              className="shadow-soft-md hover:shadow-soft-lg transition-all duration-300 hover:scale-105"
            >
              <Link href="https://github.com/agentcommunity" target="_blank">
                <ExternalLink className="mr-2 h-5 w-5" />
                View All on GitHub
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
