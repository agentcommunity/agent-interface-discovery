interface TitleSectionProps {
  mode: 'resolver' | 'generator';
}

const MODE_CONFIG = {
  resolver: {
    title: 'Resolver',
    subtitle: 'Discover and initialize MCP agents from any domain',
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
        <span className="text-gray-900">Agent Interface Discovery </span>
        <span className="text-gray-500">{config.title}</span>
      </h1>
      <p className="text-gray-600 text-lg">{config.subtitle}</p>
    </div>
  );
}
