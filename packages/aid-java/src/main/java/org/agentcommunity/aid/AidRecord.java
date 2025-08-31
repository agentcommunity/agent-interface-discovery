package org.agentcommunity.aid;

public final class AidRecord {
  public final String v;
  public final String uri;
  public final String proto;
  public final String auth; // nullable
  public final String desc; // nullable
  public final String docs; // nullable
  public final String dep;  // nullable
  public final String pka;  // nullable
  public final String kid;  // nullable

  public AidRecord(String v, String uri, String proto, String auth, String desc, String docs, String dep, String pka, String kid) {
    this.v = v;
    this.uri = uri;
    this.proto = proto;
    this.auth = auth;
    this.desc = desc;
    this.docs = docs;
    this.dep = dep;
    this.pka = pka;
    this.kid = kid;
  }
}
