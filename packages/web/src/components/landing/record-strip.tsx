'use client';

export function RecordStrip() {
  return (
    <section className="py-6 md:py-8 bg-muted border-y border-border/50">
      <div className="container mx-auto container-padding">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-base md:text-lg text-muted-foreground">
            One <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">_agent</code> TXT
            record for instant discovery and agent identity you can verify.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              simple example:
            </div>
            <div className="w-full max-w-3xl rounded-lg border border-border/50 bg-card px-4 py-3 text-left text-xs md:text-sm font-mono text-foreground overflow-x-auto">
              _agent.example.com. // TXT &quot;v=aid1;uri=https://api.example.com/mcp;p=mcp&quot;
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
