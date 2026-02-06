import { LiveDatasource } from '@/lib/datasources/live-datasource';
import type { Datasource, ProtocolToken } from '@/lib/datasources/types';
import { MockDatasource } from '@/lib/datasources/mock-datasource';
import { toolManifests } from '@/lib/tool-manifest-data';
import type { ScenarioManifest } from '@/lib/tool-manifest-types';
import { AuthRequiredError } from '@/hooks/use-connection';
import { isOk } from '@/lib/types/result';
import { selectAdapter } from '@/spec-adapters';
import type { DiscoveryResult } from '@/hooks/use-discovery';
import type { EngineState, ChatLogMessage } from './types';
import { uniqueId } from './reducer';

interface EngineActions {
  addMessage: (msg: ChatLogMessage) => void;
  sendAssistant: (content: string) => Promise<void>;
  setStatus: (status: EngineState['status']) => void;
  setDiscovery: (result: DiscoveryResult) => void;
  setHandshake: (result: import('@/hooks/use-connection').HandshakeResult) => void;
}

function selectDatasource(domain: string, datasource: Datasource | undefined): Datasource {
  const scenario: ScenarioManifest | undefined = toolManifests[domain];
  return (
    datasource ?? (scenario && !scenario.live ? new MockDatasource(domain) : new LiveDatasource())
  );
}

export async function processDomain(
  domain: string,
  datasource: Datasource | undefined,
  actions: EngineActions,
) {
  const scenario: ScenarioManifest | undefined = toolManifests[domain];
  const selectedDs = selectDatasource(domain, datasource);

  await (scenario?.narrative1
    ? actions.sendAssistant(scenario.narrative1.replace('{domain}', domain))
    : actions.sendAssistant('Let me see… Connecting with AID…'));

  // 1. Discovery phase
  actions.setStatus('discovering');
  const discoveryRes = await selectedDs.discover(domain);
  actions.setDiscovery(discoveryRes);

  if (!isOk(discoveryRes)) {
    actions.addMessage({
      type: 'discovery_result',
      id: uniqueId(),
      result: discoveryRes,
      domain,
    });

    if (scenario?.narrative2) {
      const errMsg = discoveryRes.error.message ?? 'Error';
      await actions.sendAssistant(scenario.narrative2.replace('{error}', errMsg));
    } else {
      await actions.sendAssistant(
        'I could not find an _agent record for ' +
          domain +
          '. If you manage this domain you can create one using our generator tool.',
      );
    }

    actions.setStatus('discovery_failed');
    return;
  }

  const { record: discoveryRecord } = discoveryRes.value;
  const proto = String(discoveryRecord.proto ?? 'mcp') as ProtocolToken;
  const uri = String(discoveryRecord.uri ?? '');
  const desc = String(discoveryRecord.desc ?? '');
  const auth = discoveryRecord.auth as string | undefined;

  try {
    const adapter = selectAdapter('v1');
    void adapter.normalizeRecord(discoveryRecord);
  } catch {
    // non-fatal
  }

  if (scenario?.narrative2 && !scenario.narrative2.includes('{error}')) {
    const formatted = scenario.narrative2
      .replace('{desc}', desc)
      .replace('{protocol}', proto)
      .replace('{uri}', uri)
      .replace('{domain}', domain);
    await actions.sendAssistant(formatted);
  }

  actions.addMessage({
    type: 'discovery_result',
    id: uniqueId(),
    result: discoveryRes,
    domain,
  });

  // 2. Connection phase
  actions.setStatus('connecting');
  const handshakeRes = await selectedDs.handshake(uri, {
    proto,
    authHint: auth,
  });
  actions.setHandshake(handshakeRes);

  if (isOk(handshakeRes)) {
    try {
      const adapter = selectAdapter('v1');
      void adapter.normalizeHandshake(handshakeRes.value);
    } catch {
      // Best-effort
    }

    const handshakeData = handshakeRes.value;

    if (handshakeData.guidance) {
      actions.addMessage({
        type: 'connection_result',
        id: uniqueId(),
        status: 'success',
        discovery: discoveryRes.value,
        result: handshakeRes,
      });

      const protoUpper = proto.toUpperCase();
      await actions.sendAssistant(
        'AID discovery successful! This agent uses the ' +
          protoUpper +
          ' protocol. ' +
          'Connection testing in the workbench is available for MCP agents. ' +
          'See the guidance below for how to connect to this ' +
          protoUpper +
          ' agent.',
      );
      actions.setStatus('connected');
      return;
    }

    // MCP Handshake succeeded
    actions.addMessage({
      type: 'connection_result',
      id: uniqueId(),
      status: 'success',
      discovery: discoveryRes.value,
      result: handshakeRes,
    });
    if (scenario?.narrative3) {
      const capCount = handshakeData.capabilities.length;
      const pkaStatus = handshakeData.security?.pka?.verified
        ? 'PKA verified'
        : (handshakeData.security?.pka?.present
          ? 'PKA present'
          : 'no PKA');
      const tlsStatus =
        handshakeData.security?.tls?.valid === true
          ? 'TLS valid'
          : (handshakeData.security?.tls?.valid === false
            ? 'TLS invalid'
            : 'TLS unknown');
      await actions.sendAssistant(
        scenario.narrative3.replace('{capCount}', String(capCount)) +
          '\nSecurity: ' +
          pkaStatus +
          '; ' +
          tlsStatus +
          '.',
      );
    }
    actions.setStatus('connected');
    return;
  }

  // Handshake failed
  if (handshakeRes.error instanceof AuthRequiredError) {
    actions.addMessage({
      type: 'connection_result',
      id: uniqueId(),
      status: 'needs_auth',
      discovery: discoveryRes.value,
      result: handshakeRes,
    });
    actions.setStatus('needs_auth');
    await actions.sendAssistant(
      'Connection not established (authentication required). AID worked. I do not have your private keys - you need to provide a token to continue. (Do not copy your keys here, this is a test environment)',
    );
  } else {
    const reason = handshakeRes.error.message || 'Unknown reason';
    await actions.sendAssistant('Agent connection not established. AID worked. ' + reason);
    actions.addMessage({
      type: 'connection_result',
      id: uniqueId(),
      status: 'error',
      discovery: discoveryRes.value,
      result: handshakeRes,
    });
    actions.setStatus('failed');
  }
}

export async function provideAuth(
  token: string,
  state: EngineState,
  datasource: Datasource | undefined,
  actions: EngineActions,
) {
  if (state.status !== 'needs_auth' || !state.discovery || !isOk(state.discovery)) return;

  const rec = state.discovery.value.record;
  const authUri = String(rec.uri ?? '');
  const authProto = String(rec.proto ?? 'mcp') as ProtocolToken;
  const authHint = rec.auth as string | undefined;
  actions.setStatus('connecting');
  actions.addMessage({
    type: 'tool_event',
    id: uniqueId(),
    tool: 'connection',
    detail: 'auth_retry',
  });

  const selectedDs = selectDatasource(state.domain!, datasource);

  const handshakeRes = await selectedDs.handshake(authUri, {
    authBearer: token,
    proto: authProto,
    authHint,
  });
  actions.setHandshake(handshakeRes);

  if (isOk(handshakeRes)) {
    actions.setStatus('connected');
    actions.addMessage({
      type: 'tool_event',
      id: uniqueId(),
      tool: 'connection',
      detail: 'succeeded',
    });
    actions.addMessage({
      type: 'connection_result',
      id: uniqueId(),
      status: 'success',
      discovery: state.discovery.value,
      result: handshakeRes,
    });
  } else {
    actions.setStatus('failed');
    actions.addMessage({
      type: 'tool_event',
      id: uniqueId(),
      tool: 'connection',
      detail: 'failed',
    });
    actions.addMessage({
      type: 'connection_result',
      id: uniqueId(),
      status: 'error',
      discovery: state.discovery.value,
      result: handshakeRes,
    });
  }
}
