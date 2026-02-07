import type { EngineState, Action } from './types';

export const initialState: EngineState = {
  status: 'idle',
  domain: null,
  messages: [],
};

export function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'SET_DOMAIN':
      return { ...state, domain: action.domain };
    case 'SET_DISCOVERY':
      return { ...state, discovery: action.result };
    case 'SET_HANDSHAKE':
      return { ...state, handshake: action.result };
    case 'REPLACE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.id ? action.message : message,
        ),
      };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    default:
      return state;
  }
}

export const uniqueId = () => Date.now() + '-' + Math.random();

const DOMAIN_LABEL_REGEX = /^(xn--)?[a-z0-9-]+$/i;

export function normalizeDomainInput(
  input: string,
): { ok: true; domain: string } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: 'Domain is required.' };
  }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let hostname = '';
  try {
    hostname = new URL(candidate).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return {
      ok: false,
      error: 'Input must be a valid domain or URL containing a domain.',
    };
  }

  if (!hostname) {
    return { ok: false, error: 'Input does not include a domain.' };
  }

  if (!hostname.includes('.')) {
    return {
      ok: false,
      error: 'Use a fully-qualified domain (for example: example.com).',
    };
  }

  if (hostname.length > 253) {
    return { ok: false, error: 'Domain is too long (max 253 characters).' };
  }

  const labels = hostname.split('.');
  for (const label of labels) {
    if (!label) {
      return { ok: false, error: 'Domain labels cannot be empty.' };
    }
    if (label.length > 63) {
      return { ok: false, error: 'Each domain label must be 63 characters or less.' };
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return { ok: false, error: 'Domain labels cannot start or end with a hyphen.' };
    }
    if (!DOMAIN_LABEL_REGEX.test(label)) {
      return {
        ok: false,
        error: 'Domain contains invalid characters.',
      };
    }
  }

  return { ok: true, domain: hostname };
}

export const isValidDomain = (domain: string) => normalizeDomainInput(domain).ok;
