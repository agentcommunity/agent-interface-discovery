import { v1Adapter } from './v1';
import type { SpecAdapter } from './types';

// For now we have only v1; this indirection allows future versions.
export const selectAdapter = (_version?: string): SpecAdapter => v1Adapter;

export * from './types';
