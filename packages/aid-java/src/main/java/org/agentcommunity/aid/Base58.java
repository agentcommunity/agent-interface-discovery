package org.agentcommunity.aid;

import java.math.BigInteger;

final class Base58 {
  private static final String ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  static byte[] decode(String s) {
    if (s == null || s.isEmpty()) return new byte[0];
    BigInteger n = BigInteger.ZERO;
    for (int i = 0; i < s.length(); i++) {
      int idx = ALPHABET.indexOf(s.charAt(i));
      if (idx < 0) throw new AidError("ERR_SECURITY", "Invalid base58 character");
      n = n.multiply(BigInteger.valueOf(58)).add(BigInteger.valueOf(idx));
    }
    byte[] bytes = n.equals(BigInteger.ZERO) ? new byte[] {0} : n.toByteArray();
    // BigInteger may include sign byte; normalize to unsigned big-endian
    if (bytes[0] == 0) {
      byte[] tmp = new byte[bytes.length - 1];
      System.arraycopy(bytes, 1, tmp, 0, tmp.length);
      bytes = tmp;
    }
    int leading = 0;
    while (leading < s.length() && s.charAt(leading) == '1') leading++;
    byte[] out = new byte[leading + bytes.length];
    System.arraycopy(bytes, 0, out, leading, bytes.length);
    return out;
  }
}

