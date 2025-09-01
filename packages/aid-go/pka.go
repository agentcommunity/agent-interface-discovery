package aid

import (
    "crypto/ed25519"
    "encoding/base64"
    "fmt"
    "net/http"
    "net/url"
    "strings"
    "time"
)

// performPKAHandshake performs an RFC 9421 Ed25519 verification against the agent endpoint.
func performPKAHandshake(uri, pka, kid string, timeout time.Duration) error {
    if kid == "" {
        return newAidError("ERR_SECURITY", "Missing kid for PKA")
    }
    u, err := url.Parse(uri)
    if err != nil || u.Host == "" {
        return newAidError("ERR_SECURITY", "Invalid URI for handshake")
    }
    // Prepare GET with challenge and date
    nonce := make([]byte, 32)
    // time-based pseudo randomness is sufficient for challenge uniqueness here
    for i := range nonce { nonce[i] = byte(time.Now().UnixNano() >> (i%8)) }
    challenge := base64.RawURLEncoding.EncodeToString(nonce)
    date := time.Now().UTC().Format("Mon, 02 Jan 2006 15:04:05 GMT")

    req, _ := http.NewRequest("GET", uri, nil)
    req.Header.Set("AID-Challenge", challenge)
    req.Header.Set("Date", date)
    client := *httpClient
    client.Timeout = timeout
    // Do not follow redirects for handshake per security policy
    client.CheckRedirect = func(req *http.Request, via []*http.Request) error { return http.ErrUseLastResponse }
    resp, err := client.Do(req)
    if err != nil {
        return newAidError("ERR_SECURITY", err.Error())
    }
    defer resp.Body.Close()
    if resp.StatusCode != 200 {
        return newAidError("ERR_SECURITY", fmt.Sprintf("Handshake HTTP %d", resp.StatusCode))
    }

    sigInput := resp.Header.Get("Signature-Input")
    if sigInput == "" { sigInput = resp.Header.Get("signature-input") }
    sig := resp.Header.Get("Signature")
    if sig == "" { sig = resp.Header.Get("signature") }
    if sigInput == "" || sig == "" {
        return newAidError("ERR_SECURITY", "Missing signature headers")
    }

    covered, created, keyidRaw, alg, signature, perr := parseSignatureHeaders(sigInput, sig)
    if perr != nil {
        return perr
    }
    now := time.Now().Unix()
    if created < now-300 || created > now+300 {
        return newAidError("ERR_SECURITY", "Signature created timestamp outside acceptance window")
    }
    // strip optional quotes around keyid for comparison
    keyid := keyidRaw
    if len(keyid) >= 2 && keyid[0] == '"' && keyid[len(keyid)-1] == '"' {
        keyid = keyid[1:len(keyid)-1]
    }
    if keyid != kid {
        return newAidError("ERR_SECURITY", "Signature keyid mismatch")
    }
    if strings.ToLower(alg) != "ed25519" {
        return newAidError("ERR_SECURITY", "Unsupported signature algorithm")
    }

    dateHeader := resp.Header.Get("Date")
    // Validate Date header if present (±300s window)
    if dateHeader != "" {
        if t, e := http.ParseTime(dateHeader); e == nil {
            now := time.Now().UTC()
            diff := t.Sub(now)
            if diff < 0 { diff = -diff }
            if diff > 300*time.Second {
                return newAidError("ERR_SECURITY", "HTTP Date header outside acceptance window")
            }
        } else {
            return newAidError("ERR_SECURITY", "Invalid Date header")
        }
    }

    base, berr := buildSignatureBase(covered, created, keyidRaw, alg, "GET", uri, u.Host, chooseDate(date, dateHeader), challenge)
    if berr != nil {
        return berr
    }
    pub, derr := multibaseDecode(pka)
    if derr != nil {
        return derr
    }
    if len(pub) != ed25519.PublicKeySize {
        return newAidError("ERR_SECURITY", "Invalid PKA length")
    }
    if !ed25519.Verify(ed25519.PublicKey(pub), base, signature) {
        return newAidError("ERR_SECURITY", "PKA signature verification failed")
    }
    return nil
}

func parseSignatureHeaders(sigInput, sig string) (covered []string, created int64, keyidRaw, alg string, signature []byte, err error) {
    // sig=("a" "b");created=...;keyid=...;alg="ed25519"
    idx := strings.Index(sigInput, "sig=(")
    if idx < 0 { return nil, 0, "", "", nil, newAidError("ERR_SECURITY", "Invalid Signature-Input") }
    rest := sigInput[idx+5:]
    close := strings.Index(rest, ")")
    if close < 0 { return nil, 0, "", "", nil, newAidError("ERR_SECURITY", "Invalid Signature-Input") }
    inside := rest[:close]
    // Extract quoted tokens
    for len(inside) > 0 {
        start := strings.Index(inside, "\"")
        if start < 0 { break }
        inside = inside[start+1:]
        end := strings.Index(inside, "\"")
        if end < 0 { break }
        covered = append(covered, inside[:end])
        inside = inside[end+1:]
    }
    if len(covered) == 0 { return nil, 0, "", "", nil, newAidError("ERR_SECURITY", "Invalid Signature-Input") }
    // Enforce exact required set
    required := map[string]struct{}{"aid-challenge":{}, "@method":{}, "@target-uri":{}, "host":{}, "date":{}}
    lower := map[string]struct{}{}
    for _, c := range covered { lower[strings.ToLower(c)] = struct{}{} }
    if len(lower) != len(required) {
        return nil, 0, "", "", nil, newAidError("ERR_SECURITY", "Signature-Input must cover required fields")
    }
    for r := range required { if _, ok := lower[r]; !ok { return nil, 0, "", "", nil, newAidError("ERR_SECURITY", "Signature-Input must cover required fields") } }

    // Params
    for _, part := range strings.Split(sigInput, ";") {
        p := strings.TrimSpace(part)
        if strings.HasPrefix(strings.ToLower(p), "created=") {
            var c int64
            _, e := fmt.Sscanf(p[len("created="):], "%d", &c)
            if e == nil { created = c }
        } else if strings.HasPrefix(strings.ToLower(p), "keyid=") {
            keyidRaw = strings.TrimSpace(p[len("keyid="):])
        } else if strings.HasPrefix(strings.ToLower(p), "alg=") {
            alg = strings.Trim(strings.TrimSpace(p[len("alg="):]), "\"")
        }
    }
    if created == 0 || keyidRaw == "" || alg == "" {
        return nil, 0, "", "", nil, newAidError("ERR_SECURITY", "Invalid Signature-Input")
    }

    // Signature header: sig=:base64:
    s := sig
    i := strings.Index(strings.ToLower(s), "sig=")
    if i < 0 { return nil, 0, "", "", nil, newAidError("ERR_SECURITY", "Invalid Signature header") }
    s = s[i+4:]
    if !strings.HasPrefix(s, ":") { return nil, 0, "", "", nil, newAidError("ERR_SECURITY", "Invalid Signature header") }
    s = s[1:]
    end := strings.Index(s, ":")
    if end < 0 { return nil, 0, "", "", nil, newAidError("ERR_SECURITY", "Invalid Signature header") }
    val := s[:end]
    dec, e := base64.StdEncoding.DecodeString(val)
    if e != nil { return nil, 0, "", "", nil, newAidError("ERR_SECURITY", "Invalid Signature header") }
    return covered, created, keyidRaw, alg, dec, nil
}

func chooseDate(requestDate, responseDate string) string {
    if responseDate != "" { return responseDate }
    return requestDate
}

func buildSignatureBase(covered []string, created int64, keyid, alg, method, targetURI, host, date, challenge string) ([]byte, error) {
    lines := make([]string, 0, len(covered)+1)
    for _, item := range covered {
        switch strings.ToLower(item) {
        case "aid-challenge":
            lines = append(lines, "\"AID-Challenge\": "+challenge)
        case "@method":
            lines = append(lines, "\"@method\": "+method)
        case "@target-uri":
            lines = append(lines, "\"@target-uri\": "+targetURI)
        case "host":
            lines = append(lines, "\"host\": "+host)
        case "date":
            lines = append(lines, "\"date\": "+date)
        default:
            return nil, newAidError("ERR_SECURITY", "Unsupported covered field: "+item)
        }
    }
    quoted := make([]string, len(covered))
    for i, c := range covered { quoted[i] = "\""+c+"\"" }
    params := fmt.Sprintf("(%s);created=%d;keyid=%s;alg=\"%s\"", strings.Join(quoted, " "), created, keyid, strings.ToLower(alg))
    lines = append(lines, "\"@signature-params\": "+params)
    return []byte(strings.Join(lines, "\n")), nil
}

func multibaseDecode(s string) ([]byte, error) {
    if s == "" { return nil, newAidError("ERR_SECURITY", "Empty PKA") }
    if s[0] != 'z' { return nil, newAidError("ERR_SECURITY", "Unsupported multibase prefix") }
    out, err := base58Decode(s[1:])
    if err != nil { return nil, err }
    return out, nil
}

func base58Decode(s string) ([]byte, error) {
    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    if s == "" { return []byte{}, nil }
    zeros := 0
    for zeros < len(s) && s[zeros] == '1' { zeros++ }
    size := (len(s)-zeros)*733/1000 + 1 // log(58)/log(256) ≈ 0.733
    b := make([]byte, size)
    for i := zeros; i < len(s); i++ {
        ch := s[i]
        idx := strings.IndexByte(alphabet, ch)
        if idx < 0 { return nil, newAidError("ERR_SECURITY", "Invalid base58 character") }
        carry := idx
        for j := size - 1; j >= 0; j-- {
            carry += 58 * int(b[j])
            b[j] = byte(carry & 0xff)
            carry >>= 8
        }
    }
    // strip leading zeros
    it := 0
    for it < len(b) && b[it] == 0 { it++ }
    out := make([]byte, zeros+len(b)-it)
    for i := 0; i < zeros; i++ { out[i] = 0 }
    copy(out[zeros:], b[it:])
    return out, nil
}
