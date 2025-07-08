import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDomain(domain: string): string {
  // Remove protocol if present
  const cleanDomain = domain.replace(/^https?:\/\//, '');
  // Remove trailing slash
  return cleanDomain.replace(/\/$/, '');
}

export function isValidDomain(domain: string): boolean {
  const domainRegex = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
  return domainRegex.test(formatDomain(domain));
}

// Define constants for time units in seconds for clarity and maintainability.
// The linter requires separators for all numbers with 4 or more digits.
const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_DAY = 86_400;

export function timeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / MILLISECONDS_IN_SECOND);

  if (diffInSeconds < SECONDS_IN_MINUTE) {
    return 'just now';
  }

  if (diffInSeconds < SECONDS_IN_HOUR) {
    const minutes = Math.floor(diffInSeconds / SECONDS_IN_MINUTE);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  if (diffInSeconds < SECONDS_IN_DAY) {
    const hours = Math.floor(diffInSeconds / SECONDS_IN_HOUR);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // If none of the above, calculate days.
  const days = Math.floor(diffInSeconds / SECONDS_IN_DAY);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
