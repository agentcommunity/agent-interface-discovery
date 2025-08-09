package org.agentcommunity.aid;

import java.net.URI;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public final class Parser {
  private Parser() {}

  public static AidRecord parse(String txtRecord) {
    Map<String, String> raw = parseRawRecord(txtRecord);
    return validateRecord(raw);
  }

  private static Map<String, String> parseRawRecord(String txtRecord) {
    Map<String, String> record = new HashMap<>();
    String[] parts = txtRecord.split(";");
    for (String part : parts) {
      String pair = part.trim();
      if (pair.isEmpty()) continue;
      int idx = pair.indexOf('=');
      if (idx < 0) {
        throw new AidError("ERR_INVALID_TXT", "Invalid key-value pair: " + pair);
      }
      String key = pair.substring(0, idx).trim().toLowerCase(Locale.ROOT);
      String value = pair.substring(idx + 1).trim();
      if (key.isEmpty() || value.isEmpty()) {
        throw new AidError("ERR_INVALID_TXT", "Empty key or value in pair: " + pair);
      }
      if (record.containsKey(key)) {
        throw new AidError("ERR_INVALID_TXT", "Duplicate key: " + key);
      }
      // Only store known keys; ignore unknown for fwd-compat
      switch (key) {
        case "v":
        case "uri":
        case "proto":
        case "p":
        case "auth":
        case "desc":
          record.put(key, value);
          break;
        default:
          // ignore unknown
      }
    }
    return record;
  }

  public static AidRecord validateRecord(Map<String, String> raw) {
    // Required fields
    if (!raw.containsKey("v")) {
      throw new AidError("ERR_INVALID_TXT", "Missing required field: v");
    }
    if (!raw.containsKey("uri")) {
      throw new AidError("ERR_INVALID_TXT", "Missing required field: uri");
    }

    boolean hasProto = raw.containsKey("proto");
    boolean hasP = raw.containsKey("p");
    if (hasProto && hasP) {
      throw new AidError("ERR_INVALID_TXT", "Cannot specify both \"proto\" and \"p\" fields");
    }
    if (!hasProto && !hasP) {
      throw new AidError("ERR_INVALID_TXT", "Missing required field: proto (or p)");
    }

    String version = raw.get("v");
    if (!Constants.SPEC_VERSION.equals(version)) {
      throw new AidError(
          "ERR_INVALID_TXT",
          "Unsupported version: " + version + ". Expected: " + Constants.SPEC_VERSION);
    }

    String protoValue = hasProto ? raw.get("proto") : raw.get("p");

    // Validate protocol token: only compare against known constants
    if (!isValidProto(protoValue)) {
      throw new AidError("ERR_UNSUPPORTED_PROTO", "Unsupported protocol: " + protoValue);
    }

    // Auth token
    if (raw.containsKey("auth") && !isValidAuth(raw.get("auth"))) {
      throw new AidError("ERR_INVALID_TXT", "Invalid auth token: " + raw.get("auth"));
    }

    // Desc length check (≤ 60 UTF-8 bytes)
    if (raw.containsKey("desc")) {
      int bytes = raw.get("desc").getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
      if (bytes > 60) {
        throw new AidError("ERR_INVALID_TXT", "Description field must be ≤ 60 UTF-8 bytes");
      }
    }

    String uri = raw.get("uri");
    if ("local".equals(protoValue)) {
      // must be allowed local scheme
      String scheme = extractScheme(uri);
      if (!isAllowedLocalScheme(scheme)) {
        throw new AidError(
            "ERR_INVALID_TXT",
            "Invalid URI scheme for local protocol. Must be one of: " + String.join(", ", Constants.LOCAL_URI_SCHEMES));
      }
    } else {
      if (!uri.startsWith("https://")) {
        throw new AidError(
            "ERR_INVALID_TXT",
            "Invalid URI scheme for remote protocol '" + protoValue + "'. MUST be 'https:'");
      }
      try {
        URI u = URI.create(uri);
        if (u.getScheme() == null || u.getHost() == null) {
          throw new IllegalArgumentException();
        }
      } catch (Exception e) {
        throw new AidError("ERR_INVALID_TXT", "Invalid URI format: " + uri);
      }
    }

    String auth = raw.getOrDefault("auth", null);
    String desc = raw.getOrDefault("desc", null);
    return new AidRecord(Constants.SPEC_VERSION, uri, protoValue, auth, desc);
  }

  public static boolean isValidProto(String token) {
    // Compare against generated PROTO_* constants
    return "mcp".equals(token)
        || "a2a".equals(token)
        || "openapi".equals(token)
        || "local".equals(token);
  }

  private static boolean isValidAuth(String token) {
    return "none".equals(token)
        || "pat".equals(token)
        || "apikey".equals(token)
        || "basic".equals(token)
        || "oauth2_device".equals(token)
        || "oauth2_code".equals(token)
        || "mtls".equals(token)
        || "custom".equals(token);
  }

  private static boolean isAllowedLocalScheme(String scheme) {
    if (scheme == null) return false;
    for (String s : Constants.LOCAL_URI_SCHEMES) {
      if (s.equals(scheme)) return true;
    }
    return false;
  }

  private static String extractScheme(String uri) {
    int idx = uri.indexOf(':');
    if (idx <= 0) return null;
    return uri.substring(0, idx);
  }
}