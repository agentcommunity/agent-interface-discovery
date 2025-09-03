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
        </div>
      </div>
    </section>
  );
}
