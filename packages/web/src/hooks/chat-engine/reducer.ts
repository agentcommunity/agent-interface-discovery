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
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    default:
      return state;
  }
}

export const uniqueId = () => Date.now() + '-' + Math.random();

export const isValidDomain = (domain: string) => {
  const regex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
  return regex.test(domain);
};
