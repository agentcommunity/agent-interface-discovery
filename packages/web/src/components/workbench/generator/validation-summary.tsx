import { AlertCircle } from 'lucide-react';

interface ValidationSummaryProps {
  errors: Array<{ code: string; message: string }>;
}

export function ValidationSummary({ errors }: ValidationSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <ul className="text-sm text-destructive space-y-1">
      {errors.map((e) => (
        <li key={e.code} className="flex items-start gap-1">
          <AlertCircle className="h-3 w-3 mt-0.5" /> {e.message}
        </li>
      ))}
    </ul>
  );
}
