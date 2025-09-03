'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  BASIC_EXAMPLES,
  REAL_WORLD_EXAMPLES,
  OTHER_CHAT_EXAMPLES,
  type Example,
} from '@/lib/constants';

interface ExamplePickerProps {
  variant: 'buttons' | 'toggle';
  onSelect: (example: Example) => void;
  disabled?: boolean;
}

// A small sub-component to render a single example item, handling all icon types.
function ExampleItem({ example }: { example: Example }) {
  const { icon, title, label } = example;
  const displayLabel = label || title;

  const renderIcon = () => {
    if (typeof icon === 'string') {
      if (icon.startsWith('/')) {
        // It's an image path
        return <Image src={icon} alt={title} width={16} height={16} className="w-4 h-4" />;
      }
      // It's an emoji
      return <span>{icon}</span>;
    }
    // It's a React component type
    const IconComponent = icon;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center gap-2">
      {renderIcon()}
      <span className="truncate">{displayLabel}</span>
    </div>
  );
}

export function ExamplePicker({ variant, onSelect, disabled }: ExamplePickerProps) {
  if (variant === 'toggle') {
    return (
      <div className="w-full">
        <div className="border-b border-muted mb-4 w-full" />
        <ToggleGroup
          type="single"
          onValueChange={(value) => {
            const ex = [...BASIC_EXAMPLES, ...REAL_WORLD_EXAMPLES].find((e) => e.content === value);
            if (ex) onSelect(ex);
          }}
          className="flex flex-col sm:flex-row gap-6 w-full items-start"
        >
          <div className="flex flex-col items-start gap-2 w-full sm:w-1/2">
            <h3 className="text-sm font-semibold">Simple Examples</h3>
            <div className="flex flex-wrap gap-2 w-full">
              {BASIC_EXAMPLES.map((ex) => (
                <ToggleGroupItem key={ex.title} value={ex.content} className="text-sm font-medium text-foreground">
                  {ex.title}
                </ToggleGroupItem>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 w-full sm:w-1/2">
            <h3 className="text-sm font-semibold">Real World Examples</h3>
            <div className="flex flex-wrap gap-2 w-full">
              {REAL_WORLD_EXAMPLES.map((ex) => (
                <ToggleGroupItem key={ex.title} value={ex.content} className="flex items-center gap-2 text-sm font-medium !text-foreground">
                  <ExampleItem example={ex} />
                </ToggleGroupItem>
              ))}
            </div>
          </div>
        </ToggleGroup>
      </div>
    );
  }

  // Default to 'buttons' variant for the chat resolver
  const allChatExamples = [...BASIC_EXAMPLES, ...REAL_WORLD_EXAMPLES, ...OTHER_CHAT_EXAMPLES];

  return (
    <div className="flex flex-wrap gap-2 mb-2 justify-center">
      {allChatExamples.map((ex) => (
        <Button
          key={ex.title}
          variant="outline"
          className="text-sm px-3 py-1 h-auto"
          onClick={() => onSelect(ex)}
          disabled={disabled}
        >
          <ExampleItem example={ex} />
        </Button>
      ))}
    </div>
  );
}
