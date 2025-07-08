import { NextRequest, NextResponse } from 'next/server';
import { discover, AidError, DiscoveryOptions } from '@agentcommunity/aid';

/**
 * Defines the expected shape of the JSON body for the POST request.
 * This provides type safety for the incoming data.
 */
interface DiscoverRequestBody {
  domain: string;
  protocol?: 'v1' | 'v2'; // Assuming specific protocol versions, adjust if needed
  timeout?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Assert the type of the request body. We will validate its contents immediately after.
    const body = (await request.json()) as DiscoverRequestBody;
    const { domain, protocol, timeout } = body;

    // The initial checks for the presence and type of 'domain' are good.
    if (!domain) {
      return NextResponse.json({ success: false, error: 'Domain is required' }, { status: 400 });
    }

    if (typeof domain !== 'string' || domain.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid domain format' }, { status: 400 });
    }

    // Construct the options object with a defined type.
    // The discover function will handle undefined properties gracefully.
    const options: DiscoveryOptions = {
      protocol,
      timeout,
    };

    const result = await discover(domain, options);

    // Using a URL object once to avoid repeated parsing is more efficient.
    const resultUri = new URL(result.record.uri);

    return NextResponse.json({
      success: true,
      data: {
        v: result.record.v,
        uri: result.record.uri,
        protocol: result.record.proto,
        host: resultUri.hostname,
        port: resultUri.port ? Number.parseInt(resultUri.port, 10) : 443,
        auth: result.record.auth,
        desc: result.record.desc,
      },
      metadata: {
        dnsQuery: result.queryName,
        lookupTime: 0, // We don't measure this currently
        recordType: 'TXT',
        source: 'DNS',
        txtRecord: result.raw,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Discovery error:', error);

    let errorMessage = 'Discovery failed';
    let statusCode = 500;
    let numericCode: number | undefined;

    if (error instanceof AidError) {
      errorMessage = error.message;
      numericCode = error.code;

      switch (error.errorCode) {
        case 'ERR_NO_RECORD':
          statusCode = 404;
          break;
        case 'ERR_INVALID_TXT':
        case 'ERR_UNSUPPORTED_PROTO':
          statusCode = 400;
          break;
        case 'ERR_SECURITY':
          statusCode = 403;
          break;
        default:
          statusCode = 400;
      }
    } else if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      // Safely handle Node.js system errors (like network errors)
      switch (error.code) {
        case 'ENOTFOUND':
          errorMessage = 'Domain not found or DNS resolution failed';
          statusCode = 404;
          break;
        case 'ETIMEOUT':
          errorMessage = 'DNS query timeout - try again later';
          statusCode = 408;
          break;
        default:
          // If it's another type of error object, use its message if available.
          if ('message' in error && typeof error.message === 'string') {
            errorMessage = error.message;
          }
      }
    } else if (error instanceof Error) {
      // Fallback for generic Error instances
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        // CORRECTED LINE: Check if numericCode is not undefined before spreading the object
        ...(numericCode !== undefined && { code: numericCode }),
        timestamp: new Date().toISOString(),
      },
      { status: statusCode },
    );
  }
}
