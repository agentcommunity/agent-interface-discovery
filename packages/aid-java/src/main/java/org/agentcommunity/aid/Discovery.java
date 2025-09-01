package org.agentcommunity.aid;

import java.net.IDN;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

public final class Discovery {
  private Discovery() {}

  public static final class DiscoveryOptions {
    public String protocol;
    public Duration timeout = Duration.ofSeconds(5);
    public boolean wellKnownFallback = true;
    public Duration wellKnownTimeout = Duration.ofSeconds(2);
  }

  public static final class DiscoveryResult {
    public final AidRecord record;
    public final int ttl;
    public final String queryName;
    public DiscoveryResult(AidRecord record, int ttl, String queryName) {
      this.record = record; this.ttl = ttl; this.queryName = queryName;
    }
  }

  private static String toALabel(String domain) {
    try { return IDN.toASCII(domain); } catch (Exception e) { return domain; }
  }

  private static class DoHAnswer { String data; int TTL; }

  private static List<String> queryTxtDoH(String fqdn, Duration timeout) {
    String url = "https://cloudflare-dns.com/dns-query?name=" + URI.create("http://x/"+fqdn).getRawPath().substring(3) + "&type=TXT";
    HttpClient http = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).connectTimeout(timeout).build();
    HttpRequest req = HttpRequest.newBuilder(URI.create(url)).timeout(timeout).header("Accept", "application/dns-json").GET().build();
    try {
      HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
      if (res.statusCode() / 100 != 2) throw new AidError("ERR_DNS_LOOKUP_FAILED", "DoH HTTP "+res.statusCode());
      String body = res.body();
      // naive JSON scan for "data":"..." occurrences to avoid pulling a JSON lib beyond JDK
      List<String> out = new ArrayList<>();
      int idx = 0;
      while ((idx = body.indexOf("\"data\"", idx)) >= 0) {
        int colon = body.indexOf(':', idx);
        if (colon < 0) break;
        int q1 = body.indexOf('"', colon+1);
        if (q1 < 0) break;
        int q2 = body.indexOf('"', q1+1);
        if (q2 < 0) break;
        String data = body.substring(q1+1, q2);
        if (data.length() >= 2 && data.startsWith("\"") && data.endsWith("\""))
          data = data.substring(1, data.length()-1);
        out.add(data);
        idx = q2+1;
      }
      if (out.isEmpty()) throw new AidError("ERR_NO_RECORD", "No TXT answers for "+fqdn);
      return out;
    } catch (AidError e) { throw e; }
    catch (Exception e) { throw new AidError("ERR_DNS_LOOKUP_FAILED", e.getMessage()); }
  }

  private static AidRecord parseFirstValid(List<String> txts, Duration timeout) {
    AidError last = null;
    for (String txt : txts) {
      try {
        AidRecord rec = Parser.parse(txt);
        if (rec.pka != null) Handshake.performHandshake(rec.uri, rec.pka, rec.kid == null ? "" : rec.kid, timeout);
        return rec;
      } catch (AidError e) { last = e; }
    }
    throw last != null ? last : new AidError("ERR_NO_RECORD", "No valid AID record in TXT answers");
  }

  public static DiscoveryResult discover(String domain, DiscoveryOptions options) {
    if (options == null) options = new DiscoveryOptions();
    String alabel = toALabel(domain);
    List<String> names = new ArrayList<>();
    if (options.protocol != null && !options.protocol.isEmpty()) {
      names.add(Constants.DNS_SUBDOMAIN + "._" + options.protocol + "." + alabel);
      names.add(Constants.DNS_SUBDOMAIN + "." + options.protocol + "." + alabel);
    }
    names.add(Constants.DNS_SUBDOMAIN + "." + alabel);

    AidError last = null;
    for (String name : names) {
      try {
        List<String> txts = queryTxtDoH(name, options.timeout);
        AidRecord rec = parseFirstValid(txts, options.timeout);
        // TTL not exposed via naive parse; assume 0 (unknown)
        return new DiscoveryResult(rec, 0, name);
      } catch (AidError e) {
        last = e;
        if (!"ERR_NO_RECORD".equals(e.errorCode)) break;
      }
    }

    if (options.wellKnownFallback && last != null && ("ERR_NO_RECORD".equals(last.errorCode) || "ERR_DNS_LOOKUP_FAILED".equals(last.errorCode))) {
      AidRecord rec = WellKnown.fetch(alabel, options.wellKnownTimeout, false);
      return new DiscoveryResult(rec, Constants.DNS_TTL_MIN, Constants.DNS_SUBDOMAIN+"."+alabel);
    }
    throw last != null ? last : new AidError("ERR_DNS_LOOKUP_FAILED", "DNS query failed");
  }
}

