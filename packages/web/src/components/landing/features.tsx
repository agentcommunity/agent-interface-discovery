import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Puzzle, Clock, Settings } from 'lucide-react';

const problems = [
  {
    icon: AlertTriangle,
    title: 'Manual Integration Hell',
    description:
      'Every AI agent requires custom client code, documentation diving, and endless configuration tweaks.',
  },
  {
    icon: Puzzle,
    title: 'Protocol Fragmentation',
    description:
      'MCP, A2A, OpenAPI, local packages—each agent speaks a different language with different auth flows.',
  },
  {
    icon: Clock,
    title: 'Wasted Development Time',
    description:
      'Developers spend weeks building what should be automatic: finding and connecting to AI services.',
  },
  {
    icon: Settings,
    title: 'No Discovery Standard',
    description:
      'There&apos;s no universal way to find agent capabilities. Each provider invents their own discovery method.',
  },
];

export function Problem() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container mx-auto container-padding">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <h2 className="mb-4 text-4xl md:text-5xl font-bold tracking-tight">
              The AI Integration Problem
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground">
              Connecting to AI agents shouldn&apos;t require a PhD in API archaeology
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {problems.map((problem, index) => (
              <Card
                key={index}
                className="card-feature bg-card/50 border-border/50 hover:bg-card transition-all duration-300 shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 group"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 shadow-soft-xs transition-all duration-300 group-hover:scale-110 group-hover:shadow-soft-md">
                      <problem.icon className="h-6 w-6 text-destructive transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg transition-colors duration-300 group-hover:text-foreground">
                        {problem.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed transition-colors duration-300 group-hover:text-muted-foreground/80">
                    {problem.description}
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
