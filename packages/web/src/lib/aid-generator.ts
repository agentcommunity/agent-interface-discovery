/**
 * @/lib/aid-generator - Standalone logic for generating AID records.
 *
 * This logic was previously in the `@agentcommunity/aid-web-generator` package.
 * It's placed here to be used by the GeneratorPanel component.
 */

import { parse } from '@agentcommunity/aid';
import type { ProtocolToken, AuthToken } from '@agentcommunity/aid';

// Export the types needed by the UI
export type AidGeneratorData = {
  uri: string;
  proto: ProtocolToken | '';
  auth: AuthToken | '';
  desc: string;
  domain: string;
};

// The core logic function
export function buildTxtRecord(formData: AidGeneratorData): string {
  const parts = ['v=aid1'];
  if (formData.uri) parts.push(`uri=${formData.uri}`);
  const protoKey = parts.join(';').length > 200 ? 'p' : 'proto';
  if (formData.proto) parts.push(`${protoKey}=${formData.proto}`);
  if (formData.auth) parts.push(`auth=${formData.auth}`);
  if (formData.desc) parts.push(`desc=${formData.desc}`);
  return parts.join(';');
}

// The validation logic
export function validateTxtRecord(record: string): { isValid: boolean; error?: string } {
  try {
    parse(record);
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : 'Invalid' };
  }
}
