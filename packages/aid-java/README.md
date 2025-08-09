# AID Java

Minimal Java library for parsing Agent Interface Discovery (AID) TXT records and using generated spec constants.

## Usage

```java
import org.agentcommunity.aid.Parser;
import org.agentcommunity.aid.AidRecord;

AidRecord rec = Parser.parse("v=aid1;uri=https://api.example.com/mcp;proto=mcp;auth=pat;desc=Example");
System.out.println(rec.uri);  // https://api.example.com/mcp
```

### Errors

`Parser.parse` throws `AidError` with fields:

- `errorCode` (e.g. `ERR_INVALID_TXT`)
- `code` (numeric, e.g. `1001`)

```java
try {
  Parser.parse("v=aid1;uri=http://x;proto=mcp");
} catch (AidError e) {
  System.out.println(e.errorCode + " (" + e.code + ")");
}
```

## Development

- Generate constants from `protocol/constants.yml`:
  - `pnpm gen` (writes `packages/aid-java/src/main/java/org/agentcommunity/aid/Constants.java` if the folder exists)
- Build & test:
  - `./gradlew :aid-java:build :aid-java:test`

No external runtime dependencies; tests use JUnit 5 via Gradle.
