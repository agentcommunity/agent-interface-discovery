package org.agentcommunity.aid;

public final class AidRecord {
  public final String v;
  public final String uri;
  public final String proto;
  public final String auth; // nullable
  public final String desc; // nullable

  public AidRecord(String v, String uri, String proto, String auth, String desc) {
    this.v = v;
    this.uri = uri;
    this.proto = proto;
    this.auth = auth;
    this.desc = desc;
  }
}