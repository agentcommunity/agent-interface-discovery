interface TitleSectionProps {
  mode: 'resolver' | 'generator';
}

const MODE_CONFIG = {
  resolver: {
    title: 'Resolver',
    subtitle: 'Discover and initialize agents from any domain',
  },
  generator: {
    title: 'Generator',
    subtitle: 'Create a DNS TXT record to make your agent discoverable',
  },
} as const;

export function TitleSection({ mode }: TitleSectionProps) {
  const config = MODE_CONFIG[mode];

  return (
    <div className="text-center pt-2 pb-2">
      <h1 className="text-3xl font-semibold">
        <span className="text-foreground">Agent Identity & Discovery </span>
        <span className="text-muted-foreground">{config.title}</span>
      </h1>
      <p className="text-muted-foreground text-lg">{config.subtitle}</p>
    </div>
  );
}
