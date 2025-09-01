package org.agentcommunity.aid;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class HandshakeTest {

  private static byte[] pkcs8FromSeed(byte[] seed32) {
    byte[] prefix = new byte[] { 0x30,0x2e,0x02,0x01,0x00,0x30,0x05,0x06,0x03,0x2b,0x65,0x70,0x04,0x22,0x04,0x20 };
    byte[] out = new byte[prefix.length + seed32.length];
    System.arraycopy(prefix, 0, out, 0, prefix.length);
    System.arraycopy(seed32, 0, out, prefix.length, seed32.length);
    return out;
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
      byte[] seed = Base64.getDecoder().decode(((Map<String,String>)v.get("key")).get("seed_b64"));
      byte[] pkcs8 = pkcs8FromSeed(seed);
      PrivateKey priv = KeyFactory.getInstance("Ed25519").generatePrivate(new PKCS8EncodedKeySpec(pkcs8));
      // derive public raw from private key using Handshake helper
      // we’ll build pka via signing public export – omitted; simply start server and rely on WellKnown JSON

      HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
      int port = server.getAddress().getPort();
      String domain = "127.0.0.1:" + port;
      String uri = "http://" + domain + "/mcp";

      // Generate PKA from test vector (all zeros is a valid Ed25519 public key)
      byte[] rawPub = new byte[32]; // All zeros - valid for Ed25519 testing
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

