'use client';

export function RecordStrip() {
  return (
    <section className="py-6 md:py-8">
      <div className="container mx-auto container-padding">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-border/50 bg-muted px-4 py-3 text-center shadow-soft">
            <p className="text-base md:text-lg text-muted-foreground">
              One <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">_agent</code>{' '}
              TXT record for instant discovery.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
