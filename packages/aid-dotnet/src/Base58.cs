using System.Numerics;

namespace AidDiscovery;

internal static class Base58
{
    private const string Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    public static byte[] Decode(string s)
    {
        if (string.IsNullOrEmpty(s)) return Array.Empty<byte>();
        BigInteger n = BigInteger.Zero;
        foreach (char c in s)
        {
            int idx = Alphabet.IndexOf(c);
            if (idx < 0) throw new AidError(nameof(Constants.ERR_SECURITY), "Invalid base58 character");
            n = n * 58 + idx;
        }
        // Convert BigInteger to big-endian bytes
        var bytes = n == BigInteger.Zero ? new byte[] { 0 } : n.ToByteArray(isBigEndian: true, isUnsigned: true);
        // Add leading zero bytes for each leading '1'
        int leading = 0;
        foreach (char c in s)
        {
            if (c == '1') leading++; else break;
        }
        var result = new byte[leading + bytes.Length];
        Array.Copy(bytes, 0, result, leading, bytes.Length);
        return result;
    }
}

