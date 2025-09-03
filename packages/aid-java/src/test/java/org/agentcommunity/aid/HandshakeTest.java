// src/test/java/your/pkg/HandshakeTest.java
package org.agentcommunity.aid;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class HandshakeTest {

  static class Vector {
    public String id;
    public String overrideAlg;     // "ed25519" or "rsa"
    public String overrideKeyId;   // "g1" or "b2" etc
    public String expect;          // "pass" or "fail"
  }

  static class Policy {
    final String expectedAlg = "ed25519";
    final String expectedKid = "g1";
  }

  static class KeyRing {
    static class Entry {
      final String alg;
      final String kid;
      final KeyPair kp;
      Entry(String alg, String kid, KeyPair kp) { this.alg = alg; this.kid = kid; this.kp = kp; }
    }
    final Map<String, Entry> byKid = new HashMap<>();
    void put(String alg, String kid, KeyPair kp) { byKid.put(kid, new Entry(alg, kid, kp)); }
    Entry getByKid(String kid) { return byKid.get(kid); }
    Optional<Entry> anyByAlg(String alg) {
      return byKid.values().stream().filter(e -> e.alg.equals(alg)).findFirst();
    }
  }

  static final ObjectMapper MAPPER = new ObjectMapper();
  static final Policy POLICY = new Policy();
  static final KeyRing RING = initRing();

  private static KeyRing initRing() {
    try {
      KeyRing r = new KeyRing();
      KeyPairGenerator ed = KeyPairGenerator.getInstance("Ed25519");
      KeyPair edkp = ed.generateKeyPair();
      r.put("ed25519", "g1", edkp);

      KeyPairGenerator rsa = KeyPairGenerator.getInstance("RSA");
      rsa.initialize(2048);
      KeyPair rsakp = rsa.generateKeyPair();
      r.put("rsa", "b2", rsakp);

      return r;
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  void vectorsHandshake() throws Exception {
    List<Vector> vectors = loadVectors("/vectors.json");

    for (Vector v : vectors) {
      String alg = v.overrideAlg != null ? v.overrideAlg.toLowerCase(Locale.ROOT) : POLICY.expectedAlg;
      String kid = v.overrideKeyId != null ? v.overrideKeyId : POLICY.expectedKid;

      // Pick a signing key that matches the chosen alg and kid if possible
      KeyRing.Entry entry = RING.getByKid(kid);
      if (entry == null || !entry.alg.equals(alg)) {
        // If kid maps to an entry with different alg, fall back to any key with the requested alg
        entry = RING.anyByAlg(alg).orElseThrow(() -> new IllegalStateException("No key for alg=" + alg));
      }

      // Build header and sign a compact JWS-like structure for testing
      String headerJson = "{\"alg\":\"" + alg + "\",\"kid\":\"" + kid + "\"}";
      byte[] payload = "hello".getBytes();
      String jws = sign(headerJson, payload, alg, entry.kp.getPrivate());

      boolean validated = false;
      boolean verified = false;
      String failStage = null;
      String failMsg = null;

      try {
        validateHeader(headerJson, POLICY);
        validated = true;

        verified = verify(jws, RING);
        if (!verified) {
          failStage = "verify";
          failMsg = "signature verify failed";
        }
      } catch (ValidationException ve) {
        failStage = "validate";
        failMsg = ve.getMessage();
      }

      // Diagnostics to make the failing vector obvious in CI logs
      System.out.printf(
          Locale.ROOT,
          "vector=%s expect=%s alg=%s kid=%s validated=%s verified=%s failStage=%s failMsg=%s%n",
          v.id, v.expect, alg, kid, validated, verified, failStage, failMsg
      );

      if ("pass".equalsIgnoreCase(v.expect)) {
        assertTrue(validated, v.id + ": expected validation to pass");
        assertTrue(verified, v.id + ": expected signature verification to pass");
      } else {
        // Failure vectors must fail at validation, not verify
        assertEquals("validate", failStage,
            v.id + ": expected failure at validation but got " + failStage + " (" + failMsg + ")");
      }
    }
  }

  private static List<Vector> loadVectors(String resourcePath) throws Exception {
    try (InputStream in = HandshakeTest.class.getResourceAsStream(resourcePath)) {
      assertNotNull(in, "missing " + resourcePath);
      return MAPPER.readValue(in, new TypeReference<List<Vector>>() {});
    }
  }

  private static void validateHeader(String headerJson, Policy p) throws Exception {
    Map<?, ?> h = MAPPER.readValue(headerJson, Map.class);
    String alg = Objects.toString(h.get("alg"), null);
    String kid = Objects.toString(h.get("kid"), null);
    if (!Objects.equals(alg, p.expectedAlg)) {
      throw new ValidationException("alg mismatch expected=" + p.expectedAlg + " got=" + alg);
    }
    if (!Objects.equals(kid, p.expectedKid)) {
      throw new ValidationException("kid mismatch expected=" + p.expectedKid + " got=" + kid);
    }
  }

  private static String sign(String headerJson, byte[] payload, String alg, PrivateKey priv) throws Exception {
    String h = Base64.getUrlEncoder().withoutPadding().encodeToString(headerJson.getBytes());
    String p = Base64.getUrlEncoder().withoutPadding().encodeToString(payload);
    byte[] input = (h + "." + p).getBytes();
    Signature s = "ed25519".equals(alg) ? Signature.getInstance("Ed25519")
        : "rsa".equals(alg) ? Signature.getInstance("SHA256withRSA")
        : null;
    if (s == null) throw new IllegalArgumentException("unsupported alg: " + alg);
    s.initSign(priv);
    s.update(input);
    String sig = Base64.getUrlEncoder().withoutPadding().encodeToString(s.sign());
    return h + "." + p + "." + sig;
  }

  private static boolean verify(String jws, KeyRing ring) throws Exception {
    String[] parts = jws.split("\\.");
    if (parts.length != 3) return false;
    String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
    Map<?, ?> h = MAPPER.readValue(headerJson, Map.class);
    String alg = Objects.toString(h.get("alg"), null);
    String kid = Objects.toString(h.get("kid"), null);

    KeyRing.Entry e = ring.getByKid(kid);
    if (e == null || !Objects.equals(alg, e.alg)) return false;

    byte[] input = (parts[0] + "." + parts[1]).getBytes();
    byte[] sig = Base64.getUrlDecoder().decode(parts[2]);

    Signature v = "ed25519".equals(alg) ? Signature.getInstance("Ed25519")
        : "rsa".equals(alg) ? Signature.getInstance("SHA256withRSA")
        : null;
    if (v == null) return false;
    v.initVerify(e.kp.getPublic());
    v.update(input);
    return v.verify(sig);
  }

  static class ValidationException extends Exception {
    ValidationException(String m) { super(m); }
  }
}

