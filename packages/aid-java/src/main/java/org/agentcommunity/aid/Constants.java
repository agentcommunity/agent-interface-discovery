// GENERATED FILE - DO NOT EDIT
package org.agentcommunity.aid;

public final class Constants {
  private Constants() {}
  public static final String SPEC_VERSION = "aid1";
  public static final String PROTO_A2A = "a2a";
  public static final String PROTO_GRAPHQL = "graphql";
  public static final String PROTO_GRPC = "grpc";
  public static final String PROTO_LOCAL = "local";
  public static final String PROTO_MCP = "mcp";
  public static final String PROTO_OPENAPI = "openapi";
  public static final String PROTO_WEBSOCKET = "websocket";
  public static final String PROTO_ZEROCONF = "zeroconf";
  public static final String AUTH_APIKEY = "apikey";
  public static final String AUTH_BASIC = "basic";
  public static final String AUTH_CUSTOM = "custom";
  public static final String AUTH_MTLS = "mtls";
  public static final String AUTH_NONE = "none";
  public static final String AUTH_OAUTH2_CODE = "oauth2_code";
  public static final String AUTH_OAUTH2_DEVICE = "oauth2_device";
  public static final String AUTH_PAT = "pat";
  public static final int ERR_DNS_LOOKUP_FAILED = 1004;
  public static final int ERR_FALLBACK_FAILED = 1005;
  public static final int ERR_INVALID_TXT = 1001;
  public static final int ERR_NO_RECORD = 1000;
  public static final int ERR_SECURITY = 1003;
  public static final int ERR_UNSUPPORTED_PROTO = 1002;
  public static final String DNS_SUBDOMAIN = "_agent";
  public static final int DNS_TTL_MIN = 300;
  public static final int DNS_TTL_MAX = 900;
  public static final String[] LOCAL_URI_SCHEMES = new String[] {"docker", "npx", "pip" };
}