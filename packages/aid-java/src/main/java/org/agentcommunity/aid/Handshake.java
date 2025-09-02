package org.agentcommunity.aid;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.security.SecureRandom;

public final class Handshake {
  private Handshake() {}

  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private static String asciiToLower(String s) {
    char[] chars = s.toCharArray();
    for (int i = 0; i < chars.length; i++) {
        char c = chars[i];
        if (c >= 'A' && c <= 'Z') {
            chars[i] = (char) (c + ('a' - 'A'));
        }
    }
    return new String(chars);
  }

  private static byte[] multibaseDecode(String s) {
    if (s == null || s.isEmpty()) throw new AidError("ERR_SECURITY", "Empty PKA");
    if (s.charAt(0) != 'z') throw new AidError("ERR_SECURITY", "Unsupported multibase prefix");
    return Base58.decode(s.substring(1));
  }

  private static class SigData {
    String[] covered;
    long created;
    String keyidRaw;
    String keyid;
    String alg;
    byte[] signature;
    String responseDate;
  }

  private static SigData parseSignatureHeaders(HttpResponse<byte[]> res) {
    String sigInput = getHeader(res, "Signature-Input");
    String sig = getHeader(res, "Signature");
    if (sigInput == null || sig == null) throw new AidError("ERR_SECURITY", "Missing signature headers");
    Matcher inside = Pattern.compile("sig=\\(\\s*([^)]*?)\\s*\\)", Pattern.CASE_INSENSITIVE).matcher(sigInput);
    if (!inside.find()) throw new AidError("ERR_SECURITY", "Invalid Signature-Input");
    List<String> items = new ArrayList<>();
    Matcher m = Pattern.compile("\"([^\"]+)\"").matcher(inside.group(1));
    while (m.find()) items.add(m.group(1));
    if (items.isEmpty()) throw new AidError("ERR_SECURITY", "Invalid Signature-Input");

    String[] required = new String[]{"aid-challenge", "@method", "@target-uri", "host", "date"};
    if (items.size() != required.length) {
      throw new AidError("ERR_SECURITY", "Signature-Input must cover required fields");
    }

    List<String> lower = new ArrayList<>();
    for (String it : items) lower.add(asciiToLower(it));
    Collections.sort(lower);
    Arrays.sort(required);

    boolean areEqual = true;
    for (int i = 0; i < required.length; i++) {
        if (!MessageDigest.isEqual(
                lower.get(i).getBytes(StandardCharsets.UTF_8),
                required[i].getBytes(StandardCharsets.UTF_8))) {
            areEqual = false;
            // Deliberately not breaking early
        }
    }
    if (!areEqual) {
        throw new AidError("ERR_SECURITY", "Signature-Input must cover required fields");
    }

    Matcher mc = Pattern.compile("(?:^|;)\\s*created=(\\d+)", Pattern.CASE_INSENSITIVE).matcher(sigInput);
    Matcher mk = Pattern.compile("(?:^|;)\\s*keyid=([^;\\s]+)", Pattern.CASE_INSENSITIVE).matcher(sigInput);
    Matcher ma = Pattern.compile("(?:^|;)\\s*alg=\"([^\"]+)\"", Pattern.CASE_INSENSITIVE).matcher(sigInput);
    if (!mc.find() || !mk.find() || !ma.find()) throw new AidError("ERR_SECURITY", "Invalid Signature-Input");
    long created;
    try {
      created = Long.parseLong(mc.group(1));
    } catch (NumberFormatException e) {
      throw new AidError("ERR_SECURITY", "Invalid created timestamp");
    }
    String keyidRaw = mk.group(1);
    String keyid = keyidRaw.replaceAll("^\"(.+)\"$", "$1");
    String alg = asciiToLower(ma.group(1));

    Matcher ms = Pattern.compile("sig\\s*=\\s*:\\s*([^:]+)\\s*:", Pattern.CASE_INSENSITIVE).matcher(sig);
    if (!ms.find()) throw new AidError("ERR_SECURITY", "Invalid Signature header");
    byte[] signature = Base64.getDecoder().decode(ms.group(1));
    String responseDate = getHeader(res, "Date");

    SigData d = new SigData();
    d.covered = items.toArray(new String[0]);
    d.created = created;
    d.keyidRaw = keyidRaw;
    d.keyid = keyid;
    d.alg = alg;
    d.signature = signature;
    d.responseDate = responseDate;
    return d;
  }

  private static String getHeader(HttpResponse<byte[]> res, String name) {
    Optional<List<String>> v = res.headers().map().entrySet().stream()
        .filter(e -> e.getKey().equalsIgnoreCase(name))
        .map(Map.Entry::getValue)
        .findFirst();
    if (v.isEmpty() || v.get().isEmpty()) return null;
    return v.get().get(0);
  }

  private static byte[] buildSignatureBase(String[] covered, long created, String keyidRaw, String alg, String method, String targetUri, String host, String date, String challenge) {
    StringBuilder sb = new StringBuilder();
    for (String item : covered) {
      String lower = asciiToLower(item);
      boolean appended = false;
      if (MessageDigest.isEqual(lower.getBytes(StandardCharsets.UTF_8), "aid-challenge".getBytes(StandardCharsets.UTF_8))) {
        sb.append("\"AID-Challenge\": ").append(challenge).append('\n');
        appended = true;
      }
      if (MessageDigest.isEqual(lower.getBytes(StandardCharsets.UTF_8), "@method".getBytes(StandardCharsets.UTF_8))) {
        sb.append("\"@method\": ").append(method).append('\n');
        appended = true;
      }
      if (MessageDigest.isEqual(lower.getBytes(StandardCharsets.UTF_8), "@target-uri".getBytes(StandardCharsets.UTF_8))) {
        sb.append("\"@target-uri\": ").append(targetUri).append('\n');
        appended = true;
      }
      if (MessageDigest.isEqual(lower.getBytes(StandardCharsets.UTF_8), "host".getBytes(StandardCharsets.UTF_8))) {
        sb.append("\"host\": ").append(host).append('\n');
        appended = true;
      }
      if (MessageDigest.isEqual(lower.getBytes(StandardCharsets.UTF_8), "date".getBytes(StandardCharsets.UTF_8))) {
        sb.append("\"date\": ").append(date).append('\n');
        appended = true;
      }
      if (!appended) {
        throw new AidError("ERR_SECURITY", "Unsupported covered field: " + item);
      }
    }
    StringBuilder quoted = new StringBuilder();
    for (int i = 0; i < covered.length; i++) {
      if (i > 0) quoted.append(' ');
      quoted.append('"').append(covered[i]).append('"');
    }
    String params = "(" + quoted + ");created=" + created + ";keyid=" + keyidRaw + ";alg=\"" + alg + "\"";
    sb.append("\"@signature-params\": ").append(params);
    return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
  }

  private static PublicKey publicKeyFromRawEd25519(byte[] raw32) {
    // SPKI: 30 2a 30 05 06 03 2b 65 70 03 21 00 || raw
    byte[] prefix = new byte[] { 0x30,0x2a,0x30,0x05,0x06,0x03,0x2b,0x65,0x70,0x03,0x21,0x00 };
    byte[] spki = new byte[prefix.length + raw32.length];
    System.arraycopy(prefix, 0, spki, 0, prefix.length);
    System.arraycopy(raw32, 0, spki, prefix.length, raw32.length);
    try {
      X509EncodedKeySpec spec = new X509EncodedKeySpec(spki);
      return KeyFactory.getInstance("Ed25519").generatePublic(spec);
    } catch (Exception e) {
      throw new AidError("ERR_SECURITY", "PKA verification unavailable: Ed25519 provider missing");
    }
  }

  public static void performHandshake(String uri, String pka, String kid, Duration timeout) {
    if (kid == null || kid.isEmpty()) throw new AidError("ERR_SECURITY", "Missing kid for PKA");
    URI u = URI.create(uri);
    HttpClient http = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).connectTimeout(timeout).build();
    byte[] nonce = new byte[32]; SECURE_RANDOM.nextBytes(nonce);
    String challenge = Base64.getUrlEncoder().withoutPadding().encodeToString(nonce);
    String date = java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME.format(java.time.ZonedDateTime.now(java.time.ZoneOffset.UTC));
    HttpRequest req = HttpRequest.newBuilder(URI.create(uri)).timeout(timeout).header("AID-Challenge", challenge).header("Date", date).GET().build();
    HttpResponse<byte[]> res;
    try { res = http.send(req, HttpResponse.BodyHandlers.ofByteArray()); }
    catch (Exception e) { throw new AidError("ERR_SECURITY", e.getMessage()); }
    if (res.statusCode() / 100 != 2) throw new AidError("ERR_SECURITY", "Handshake HTTP " + res.statusCode());

    SigData sd = parseSignatureHeaders(res);
    long now = System.currentTimeMillis() / 1000L;
    if (Math.abs(now - sd.created) > 300) throw new AidError("ERR_SECURITY", "Signature created timestamp outside acceptance window");
    String respDate = sd.responseDate;
    if (respDate != null) {
      try {
        long epoch = java.time.ZonedDateTime.parse(respDate, java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME.withLocale(Locale.US)).toEpochSecond();
        if (Math.abs(now - epoch) > 300) throw new AidError("ERR_SECURITY", "HTTP Date header outside acceptance window");
      } catch (java.time.format.DateTimeParseException e) {
        throw new AidError("ERR_SECURITY", "Invalid Date header");
      }
    }
    if (!MessageDigest.isEqual(sd.keyid.getBytes(StandardCharsets.UTF_8), kid.getBytes(StandardCharsets.UTF_8))) {
      throw new AidError("ERR_SECURITY", "Signature keyid mismatch");
    }
    if (!MessageDigest.isEqual("ed25519".getBytes(StandardCharsets.UTF_8), sd.alg.getBytes(StandardCharsets.UTF_8))) {
      throw new AidError("ERR_SECURITY", "Unsupported signature algorithm");
    }

    String host = u.getAuthority();
    byte[] base = buildSignatureBase(sd.covered, sd.created, sd.keyidRaw, sd.alg, "GET", uri, host, (respDate != null ? respDate : date), challenge);
    byte[] pub = multibaseDecode(pka);
    if (pub.length != 32) throw new AidError("ERR_SECURITY", "Invalid PKA length");
    PublicKey pk = publicKeyFromRawEd25519(pub);
    try {
      Signature verifier = Signature.getInstance("Ed25519");
      verifier.initVerify(pk);
      verifier.update(base);
      if (!verifier.verify(sd.signature)) throw new AidError("ERR_SECURITY", "PKA signature verification failed");
    } catch (AidError e) {
      throw e;
    } catch (Exception e) {
      throw new AidError("ERR_SECURITY", "PKA verification unavailable: " + e.getMessage());
    }
  }
}

