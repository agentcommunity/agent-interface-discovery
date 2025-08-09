# feat/aid-dotnet report

Scope: Add .NET AID library with parser, generated constants, and tests. No DNS discovery.

## Implemented
- packages/aid-dotnet
  - AidDiscovery.sln, `src/AidDiscovery.csproj` (net8.0)
  - `src/Constants.g.cs` (generated from protocol/constants.yml schema)
  - `src/Record.cs` (immutable `AidRecord`)
  - `src/Errors.cs` (`AidError : Exception` with `Code` and `ErrorCode`)
  - `src/Parser.cs` (`Aid.Parse(string)` -> `AidRecord`), mirrors TS/Py/Go rules
  - tests project with:
    - `ParityTests.cs` using `test-fixtures/golden.json`
    - `ErrorTests.cs` for invalid cases and error-code mapping
  - README with usage and dev commands

## Generation
- `pnpm gen` writes `packages/aid-dotnet/src/Constants.g.cs` when folder exists. For this run, constants file added; subsequent gen should be a no-op.

## Acceptance
- dotnet build/test green:
  - `dotnet build packages/aid-dotnet/AidDiscovery.sln` OK
  - `dotnet test packages/aid-dotnet/AidDiscovery.sln` OK (8 tests)
- pnpm gen leaves no diff: pending run in CI, local manual gen path implemented.
- Documentation added.

## Notes
- No external dependencies at runtime; test project uses xUnit defaults.
- DNS discovery intentionally omitted.