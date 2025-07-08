'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Codeblock } from '@/components/ui/codeblock';
import { Zap, Code, CheckCircle, Globe } from 'lucide-react';

const codeExamples = {
  discover: {
    typescript: `import { discover } from '@agentcommunity/aid'

const result = await discover('example.com')
console.log(result.record.uri)    // https://api.example.com/mcp
console.log(result.record.proto)  // mcp
console.log(result.record.auth)   // pat`,
    python: `from aid_py import discover

result = discover('example.com')
print(result.record.uri)    # https://api.example.com/mcp
print(result.record.proto)  # mcp
print(result.record.auth)   # pat`,
    go: `import "github.com/agentcommunity/aid-go"

result, err := aid.Discover("example.com")
if err != nil {
    log.Fatal(err)
}
fmt.Println(result.Record.URI)    // https://api.example.com/mcp`,
  },
  publish: {
    dns: `# Add this TXT record to your domain
_agent.example.com. 300 IN TXT "v=aid1;uri=https://api.example.com/mcp;proto=mcp;auth=pat;desc=My AI Agent"`,
    terraform: `resource "cloudflare_record" "agent" {
  zone_id = var.zone_id
  name    = "_agent"
  type    = "TXT"
  value   = "v=aid1;uri=https://api.example.com/mcp;proto=mcp;auth=pat"
}`,
    cli: `# Use the dig command to test
dig TXT _agent.example.com

# Or use our validator
npx @agentcommunity/aid-doctor check example.com`,
  },
  validate: {
    cli: `# Install the AID Doctor CLI
npm install -g @agentcommunity/aid-doctor

# Validate your implementation  
aid-doctor check example.com`,
    workbench: `# Try in the web workbench
# Visit: https://aid.agentcommunity.org/workbench
# Enter your domain: example.com`,
  },
};

const flows = [
  {
    id: 'discover',
    title: 'Discover',
    icon: Zap,
    description: 'Query any domain to find agents',
    shortDesc: 'Find agents',
  },
  {
    id: 'publish',
    title: 'Publish',
    icon: Code,
    description: 'Add DNS records to your domain',
    shortDesc: 'Add records',
  },
  {
    id: 'validate',
    title: 'Validate',
    icon: CheckCircle,
    description: 'Test your implementation',
    shortDesc: 'Test setup',
  },
  {
    id: 'multilang',
    title: 'Multi-Lang',
    icon: Globe,
    description: 'Use in any programming language',
    shortDesc: 'Any language',
  },
];

export function QuickStart() {
  const [activeFlow, setActiveFlow] = useState('discover');
  const [selectedLanguage, setSelectedLanguage] = useState('typescript');

  return (
    <section className="section-padding bg-muted/30">
      <div className="container mx-auto container-padding">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <h2 className="mb-4 text-4xl md:text-5xl font-bold tracking-tight">
              Get Started in 4 Steps
            </h2>
            <p className="text-xl md:text-2xl leading-relaxed text-muted-foreground">
              From zero to discovering agents in minutes
            </p>
          </div>

          <Tabs value={activeFlow} onValueChange={setActiveFlow} className="w-full">
            {/* Mobile: Dropdown-style tabs */}
            <div className="block sm:hidden mb-8">
              <TabsList className="grid grid-cols-2 w-full h-auto p-1 shadow-soft">
                {flows.slice(0, 2).map((flow) => (
                  <TabsTrigger
                    key={flow.id}
                    value={flow.id}
                    className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-background data-[state=active]:shadow-soft-xs text-xs transition-all duration-200"
                  >
                    <flow.icon className="h-4 w-4" />
                    <div className="font-semibold">{flow.title}</div>
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsList className="grid grid-cols-2 w-full h-auto p-1 mt-2 shadow-soft">
                {flows.slice(2).map((flow) => (
                  <TabsTrigger
                    key={flow.id}
                    value={flow.id}
                    className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-background data-[state=active]:shadow-soft-xs text-xs transition-all duration-200"
                  >
                    <flow.icon className="h-4 w-4" />
                    <div className="font-semibold">{flow.title}</div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Desktop: Horizontal tabs */}
            <div className="hidden sm:block">
              <TabsList className="grid grid-cols-4 max-w-4xl mx-auto mb-8 h-auto p-1 shadow-soft-md">
                {flows.map((flow) => (
                  <TabsTrigger
                    key={flow.id}
                    value={flow.id}
                    className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-background data-[state=active]:shadow-soft-xs transition-all duration-200 hover:bg-muted/50"
                  >
                    <flow.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <div className="text-center">
                      <div className="font-semibold text-sm lg:text-base">{flow.title}</div>
                      <div className="text-xs text-muted-foreground hidden lg:block leading-tight">
                        {flow.description}
                      </div>
                      <div className="text-xs text-muted-foreground block lg:hidden leading-tight">
                        {flow.shortDesc}
                      </div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="discover" className="space-y-4 animate-fade-in">
              <Card className="card-feature shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Discover Agents from Any Domain
                  </CardTitle>
                  <CardDescription>
                    Use the discover function to automatically find agent endpoints via DNS
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.keys(codeExamples.discover).map((lang) => (
                      <Button
                        key={lang}
                        variant={selectedLanguage === lang ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedLanguage(lang)}
                        className="capitalize text-xs sm:text-sm transition-all duration-200 hover:scale-105"
                      >
                        {lang}
                      </Button>
                    ))}
                  </div>
                  <Codeblock
                    content={
                      codeExamples.discover[selectedLanguage as keyof typeof codeExamples.discover]
                    }
                    variant="inline"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="publish" className="space-y-4 animate-fade-in">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="card-feature shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      DNS TXT Record
                    </CardTitle>
                    <CardDescription>Add this record to your domain</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Codeblock content={codeExamples.publish.dns} variant="inline" />
                  </CardContent>
                </Card>

                <Card className="card-feature shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      Infrastructure as Code
                    </CardTitle>
                    <CardDescription>Terraform example</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Codeblock content={codeExamples.publish.terraform} variant="inline" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="validate" className="space-y-4 animate-fade-in">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="card-feature shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      CLI Validator
                    </CardTitle>
                    <CardDescription>Test your implementation from command line</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Codeblock content={codeExamples.validate.cli} variant="inline" />
                  </CardContent>
                </Card>

                <Card className="card-feature shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Web Workbench
                    </CardTitle>
                    <CardDescription>Interactive testing in your browser</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Codeblock content={codeExamples.validate.workbench} variant="inline" />
                    <Button
                      asChild
                      className="w-full shadow-soft hover:shadow-soft-md transition-all duration-200 hover:scale-105"
                    >
                      <a href="/workbench" target="_blank">
                        Open Workbench
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="multilang" className="space-y-4 animate-fade-in">
              <Card className="card-feature shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Universal Language Support
                  </CardTitle>
                  <CardDescription>AID works with every major programming language</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {[
                      { name: 'TypeScript', package: '@agentcommunity/aid', status: 'ready' },
                      { name: 'Python', package: 'aid-py', status: 'ready' },
                      { name: 'Go', package: 'github.com/agentcommunity/aid-go', status: 'ready' },
                    ].map((lang) => (
                      <div
                        key={lang.name}
                        className="p-4 rounded-lg bg-muted/50 border border-border/30 text-center shadow-soft hover:shadow-soft-md transition-all duration-200 hover:-translate-y-1"
                      >
                        <div className="font-semibold text-base sm:text-lg">{lang.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono break-all">
                          {lang.package}
                        </div>
                        <Badge variant="default" className="mt-2 text-xs shadow-soft-xs">
                          Ready
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <Button
                      variant="outline"
                      asChild
                      className="shadow-soft hover:shadow-soft-md transition-all duration-200 hover:scale-105"
                    >
                      <a href="https://github.com/agentcommunity" target="_blank">
                        View All Libraries
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
