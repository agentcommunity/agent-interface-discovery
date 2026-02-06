import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Zap, Layers, ShieldCheck } from 'lucide-react';

const solutions: Array<{
  number: string;
  icon: typeof Globe;
  title: string;
  description: string;
  iconColor: string;
  iconBg: string;
  links: Array<{ label: string; href: string }>;
  badges?: string[];
}> = [
  {
    number: '1',
    icon: Globe,
    title: 'One DNS TXT Record',
    description:
      'Add a single _agent.example.com TXT record. That&apos;s it. No registries, no APIs, no complexity.',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    links: [
      { label: 'Quick Start', href: 'https://docs.agentcommunity.org/aid/quickstart/index' },
      { label: 'Specification', href: 'https://docs.agentcommunity.org/aid/specification' },
    ],
  },
  {
    number: '2',
    icon: Zap,
    title: 'Instant Discovery',
    description:
      'Any tool can find your agent by looking up the _agent subdomain. Falls back to .well-known/agent when DNS is restricted.',
    iconColor: 'text-accent-foreground',
    iconBg: 'bg-accent/20',
    links: [
      {
        label: 'Discovery API',
        href: 'https://docs.agentcommunity.org/aid/Reference/discovery_api',
      },
      {
        label: 'Troubleshooting',
        href: 'https://docs.agentcommunity.org/aid/Reference/troubleshooting',
      },
    ],
  },
  {
    number: '3',
    icon: Layers,
    title: 'Protocol-Agnostic',
    description: 'Works with any agent protocol — just change the p= token in your record.',
    badges: ['mcp', 'a2a', 'openapi', 'grpc', 'graphql', 'websocket', 'ucp'],
    iconColor: 'text-primary',
    iconBg: 'bg-muted',
    links: [
      { label: 'MCP Guide', href: 'https://docs.agentcommunity.org/aid/quickstart/quickstart_mcp' },
      { label: 'A2A Guide', href: 'https://docs.agentcommunity.org/aid/quickstart/quickstart_a2a' },
      {
        label: 'OpenAPI Guide',
        href: 'https://docs.agentcommunity.org/aid/quickstart/quickstart_openapi',
      },
      { label: 'Protocols', href: 'https://docs.agentcommunity.org/aid/Reference/protocols' },
    ],
  },
  {
    number: '4',
    icon: ShieldCheck,
    title: 'Agent Identity',
    description:
      'Publish a public key (PKA) and let clients verify your endpoint using HTTP Message Signatures (Ed25519).',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    links: [
      {
        label: 'Identity & PKA',
        href: 'https://docs.agentcommunity.org/aid/Reference/identity_pka',
      },
      { label: 'Security', href: 'https://docs.agentcommunity.org/aid/security' },
    ],
  },
];

export function Solution() {
  return (
    <section className="section-padding">
      <div className="container mx-auto container-padding">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <h2 className="mb-4 text-4xl md:text-5xl font-bold tracking-tight">
              How <span className="text-gradient">Agent Discovery</span> Solves This
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground">
              Three simple principles that eliminate integration complexity
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {solutions.map((solution, index) => (
              <Card
                key={index}
                className="card-feature relative overflow-hidden shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="absolute top-4 right-4 text-8xl font-bold text-muted-foreground/10 select-none transition-all duration-300 group-hover:text-muted-foreground/20">
                  {solution.number}
                </div>
                <CardHeader className="pb-4 relative z-10">
                  <div
                    className={`w-12 h-12 ${solution.iconBg} rounded-xl flex items-center justify-center ${solution.iconColor} mb-4 shadow-soft-xs transition-all duration-300 group-hover:scale-110 group-hover:shadow-soft-md`}
                  >
                    <solution.icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <CardTitle className="text-xl transition-colors duration-300 group-hover:text-foreground">
                    {solution.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-base leading-relaxed transition-colors duration-300 group-hover:text-muted-foreground/80">
                    {solution.description}
                  </CardDescription>
                  {solution.badges && solution.badges.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {solution.badges.map((b) => (
                        <span
                          key={b}
                          className="inline-block text-xs font-mono bg-muted px-2 py-0.5 rounded-md border border-border/50"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                  {solution.links && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {solution.links.map((link, linkIndex) => (
                        <a
                          key={linkIndex}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 underline decoration-1 underline-offset-2"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
