import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Zap, Layers } from 'lucide-react';

const solutions = [
  {
    number: '1',
    icon: Globe,
    title: 'Universal Discovery',
    description: 'Type any domain name and instantly discover available AI agents through DNS.',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    number: '2',
    icon: Zap,
    title: 'Zero Manual Configuration',
    description: 'No keys to juggle or docs to read. Discover and connect.',
    iconColor: 'text-accent-foreground',
    iconBg: 'bg-accent/20',
  },
  {
    number: '3',
    icon: Layers,
    title: 'Protocol-Agnostic',
    description: 'Supports MCP, A2A, OpenAPI, local packages and any custom protocol.',
    iconColor: 'text-primary',
    iconBg: 'bg-muted',
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

          <div className="grid gap-8 md:grid-cols-3">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
