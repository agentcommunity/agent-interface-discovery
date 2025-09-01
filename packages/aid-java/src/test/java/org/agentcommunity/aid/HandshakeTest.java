package org.agentcommunity.aid;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.NamedParameterSpec;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class HandshakeTest {

  private static final class FixedRandom extends java.security.SecureRandom {
    private final byte[] seed;
    private int offset = 0;
    FixedRandom(byte[] seed) { this.seed = seed.clone(); }
    @Override public void nextBytes(byte[] bytes) {
      for (int i = 0; i < bytes.length; i++) {
        bytes[i] = seed[offset % seed.length];
        offset++;
      }
    }
  }

  private static String b58encode(byte[] bytes) {
    final String ALPHA = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    int zeros = 0; while (zeros < bytes.length && bytes[zeros] == 0) zeros++;
    int size = (int)Math.ceil(bytes.length * Math.log(256) / Math.log(58)) + 1;
    byte[] b = new byte[size];
    int length = 0;
    for (int i = zeros; i < bytes.length; i++) {
      int carry = bytes[i] & 0xFF;
      int j = size - 1;
      while (carry != 0 || j >= size - length) {
        carry += 256 * (b[j] & 0xFF);
        b[j] = (byte)(carry % 58);
        carry /= 58;
        j--;
      }
      length = size - 1 - j;
    }
    int it = size - length; while (it < size && b[it] == 0) it++;
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < zeros; i++) out.append('1');
    for (int i = it; i < size; i++) out.append(ALPHA.charAt(b[i]));
    return out.toString();
  }

  @Test
  public void vectorsHandshake() throws Exception {
    if (!"1".equals(System.getenv().getOrDefault("AID_RUN_INTEGRATION", "0"))) {
      return;
    }
    // Load vectors
    java.nio.file.Path root = java.nio.file.Paths.get(".").toAbsolutePath();
    while (root != null && !root.getFileName().toString().equals("agent-interface-discovery")) root = root.getParent();
    var json = java.nio.file.Files.readString(root.resolve("protocol/pka_vectors.json"));
    var doc = new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, java.util.Map.class);
    @SuppressWarnings("unchecked")
    var vectors = (java.util.List<java.util.Map<String, Object>>) doc.get("vectors");

    for (var v : vectors) {
      @SuppressWarnings("unchecked") Map<String,String> keyMap = (Map<String,String>) v.get("key");
      byte[] seed = Base64.getDecoder().decode(keyMap.get("seed_b64"));

      // Generate a deterministic Ed25519 keypair from the provided seed so pub/priv match
      KeyPairGenerator kpg = KeyPairGenerator.getInstance("Ed25519");
      kpg.initialize(new NamedParameterSpec("Ed25519"), new FixedRandom(seed));
      KeyPair kp = kpg.generateKeyPair();
      PrivateKey priv = kp.getPrivate();
      byte[] spki = kp.getPublic().getEncoded();
      // Extract raw 32-byte public key from SPKI encoding
      byte[] rawPub = java.util.Arrays.copyOfRange(spki, spki.length - 32, spki.length);

      HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
      int port = server.getAddress().getPort();
      String domain = "127.0.0.1:" + port;
      String uri = "http://" + domain + "/mcp";

      // Generate PKA from the derived public key
      String pka = "z" + b58encode(rawPub);

      server.createContext("/.well-known/agent", new HttpHandler() {
        @Override public void handle(HttpExchange ex) throws IOException {
          String body = "{\"v\":\"aid1\",\"u\":\"" + uri + "\",\"p\":\"mcp\",\"k\":\"" + pka + "\",\"i\":\"g1\"}";
          ex.getResponseHeaders().add("content-type", "application/json");
          byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
          ex.sendResponseHeaders(200, bytes.length);
          try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
        }
      });
      server.createContext("/mcp", new HttpHandler() {
        @Override public void handle(HttpExchange ex) throws IOException {
          List<String> dateList = ex.getRequestHeaders().get("Date");
          List<String> chList = ex.getRequestHeaders().get("AID-Challenge");
          String date = (dateList != null && !dateList.isEmpty()) ? dateList.get(0) : java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME.format(java.time.ZonedDateTime.now(java.time.ZoneOffset.UTC));
          String challenge = (chList != null && !chList.isEmpty()) ? chList.get(0) : "";
          String[] order = new String[] {"AID-Challenge","@method","@target-uri","host","date"};
          StringBuilder sb = new StringBuilder();
          for (String item : order) {
            switch (item) {
              case "AID-Challenge": sb.append("\"AID-Challenge\": ").append(challenge).append('\n'); break;
              case "@method": sb.append("\"@method\": GET\n"); break;
              case "@target-uri": sb.append("\"@target-uri\": ").append(uri).append('\n'); break;
              case "host": sb.append("\"host\": ").append(domain).append('\n'); break;
              case "date": sb.append("\"date\": ").append(date).append('\n'); break;
            }
          }
          long created = System.currentTimeMillis() / 1000L;
          String params = "(\"AID-Challenge\" \"@method\" \"@target-uri\" \"host\" \"date\");created=" + created + ";keyid=g1;alg=\"ed25519\"";
          sb.append("\"@signature-params\": ").append(params);
          byte[] base = sb.toString().getBytes(StandardCharsets.UTF_8);
          byte[] sig;
          try {
            Signature s = Signature.getInstance("Ed25519"); s.initSign(priv); s.update(base); sig = s.sign();
          } catch (Exception e) { throw new IOException(e); }
          ex.getResponseHeaders().add("Signature-Input", params.replace("(", "sig=("));
          ex.getResponseHeaders().add("Signature", "sig=:" + Base64.getEncoder().encodeToString(sig) + ":");
          ex.getResponseHeaders().add("Date", date);
          ex.sendResponseHeaders(200, 0);
          ex.close();
        }
      });
      server.start();
      try {
        assertDoesNotThrow(() -> WellKnown.fetch(domain, Duration.ofSeconds(3), true));
      } finally {
        server.stop(0);
      }
    }
  }
}

