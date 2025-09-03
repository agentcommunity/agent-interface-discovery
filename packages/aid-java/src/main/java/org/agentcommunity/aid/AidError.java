package org.agentcommunity.aid;

public class AidError extends RuntimeException {
  public final int code;        // numeric, e.g. 1001
  public final String errorCode; // symbolic, e.g. ERR_INVALID_TXT

  public AidError(String errorCode, String message) {
    super(message);
    this.errorCode = errorCode;
    this.code = ErrorCodes.codeFor(errorCode);
  }

  public AidError(String errorCode) {
    this(errorCode, ErrorCodes.messageFor(errorCode));
  }

  static final class ErrorCodes {
    private ErrorCodes() {}

    static int codeFor(String errorCode) {
      switch (errorCode) {
        case "ERR_NO_RECORD":
          return Constants.ERR_NO_RECORD;
        case "ERR_INVALID_TXT":
          return Constants.ERR_INVALID_TXT;
        case "ERR_UNSUPPORTED_PROTO":
          return Constants.ERR_UNSUPPORTED_PROTO;
        case "ERR_SECURITY":
          return Constants.ERR_SECURITY;
        case "ERR_DNS_LOOKUP_FAILED":
          return Constants.ERR_DNS_LOOKUP_FAILED;
        case "ERR_FALLBACK_FAILED":
          return Constants.ERR_FALLBACK_FAILED;
        default:
          throw new IllegalArgumentException("Unknown error code: " + errorCode);
      }
    }

    static String messageFor(String errorCode) {
      switch (errorCode) {
        case "ERR_NO_RECORD":
          return "No _agent TXT record was found for the domain";
        case "ERR_INVALID_TXT":
          return "A record was found but is malformed or missing required keys";
        case "ERR_UNSUPPORTED_PROTO":
          return "The record is valid, but the client does not support the specified protocol";
        case "ERR_SECURITY":
          return "Discovery failed due to a security policy (e.g., DNSSEC failure, local execution denied)";
        case "ERR_DNS_LOOKUP_FAILED":
          return "The DNS query failed for a network-related reason";
        case "ERR_FALLBACK_FAILED":
          return "The .well-known fallback failed or returned invalid data";
        default:
          return "Unknown error";
      }
    }
  }
}
