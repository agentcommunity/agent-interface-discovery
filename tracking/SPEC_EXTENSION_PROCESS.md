# Spec extension process (for current and future proposals)

When expanding the spec (new tokens/fields/rules), follow this process to stay contract-first and multi-language consistent. This ensures all language implementations (TypeScript, Python, Go, Rust, .NET, Java) remain synchronized and the ecosystem stays secure and maintainable.

## **General Principles for Any Spec Extension**

Regardless of the specific changes being made, all spec extensions must:
- **Maintain Backward Compatibility**: Existing valid records must continue to work
- **Follow Security-First Approach**: Any change with security implications requires formal review
- **Ensure Multi-Language Consistency**: All SDKs must implement changes identically
- **Preserve DNS-First Architecture**: Core discovery remains DNS-based
- **Document Migration Paths**: Clear upgrade guidance for existing implementations

## 1) Open a proposal issue
- Label: `spec-proposal`
- Include: motivation, examples, security implications, backward compatibility, and migration considerations.
- Tag relevant community maintainers for early feedback
- Consider impact on existing showcase domains and E2E tests

## 2) Draft changes in docs
- Update `packages/docs/specification.md` in a draft PR using normative language and references.
- Clearly mark sections as "Proposed" with version annotations
- Update `packages/docs/versioning.md` with migration guidance if breaking changes are anticipated
- Ensure documentation includes concrete examples and error scenarios

## 3) Security review process
- **Mandatory for any change with security implications**: Conduct comprehensive security review
- **Assess Attack Vectors**: Consider DNS spoofing, injection attacks, authentication bypasses, and protocol-specific threats
- **Cryptography Requirements**: If new crypto features are added, ensure proper key management, algorithm selection, and validation
- **Network Security**: Review TLS requirements, timeout handling, and protection against network-based attacks
- **Backward Compatibility**: Ensure security enhancements don't break existing secure deployments
- **DNSSEC Considerations**: Evaluate impact on DNSSEC validation and opportunistic vs mandatory modes
- **Consult Experts**: For cryptography changes, involve security experts in the review process
- Document all security analysis and mitigations in the proposal issue

## 4) Update canonical constants
- Edit `protocol/constants.yml` to add new constants based on spec changes:
  - **Protocol Tokens**: Add any new protocol identifiers
  - **Authentication Methods**: Add new auth scheme tokens if needed
  - **Error Codes**: Add new error codes with numeric values and descriptions
  - **Validation Constants**: Add any new validation rules, limits, or constraints
  - **Metadata Fields**: Add constants for new optional fields
- **Generation Requirements**: Consider what helper functions or types may be needed:
  - Validation helpers for new field types
  - Parsing functions for new formats
  - Type definitions for complex structures
  - Cryptography-related constants if security features are added
- Run `pnpm gen` to regenerate constants across all language SDKs:
  - TypeScript: `packages/aid/src/constants.ts`
  - Python: `packages/aid-py/aid_py/constants.py`
  - Go: `packages/aid-go/constants_gen.go`
  - Web UI: `packages/web/src/generated/spec.ts`
  - Rust: `packages/aid-rs/src/constants_gen.rs` (if present)
  - .NET: `packages/aid-dotnet/src/Constants.g.cs` (if present)
  - Java: `packages/aid-java/src/main/java/org/agentcommunity/aid/Constants.java` (if present)
- **Post-Generation Validation**: Verify all languages can import and use new constants without compilation errors

## 5) Multi-language implementation
- **TypeScript First (Reference Implementation)**:
  - Implement new parsing/validation logic for any new fields or tokens
  - Add cryptographic operations if security features are introduced
  - Implement new network protocols or fallback mechanisms if needed
  - Update client algorithm to handle new discovery patterns
  - Ensure backward compatibility with existing record formats
- **Python Implementation**:
  - Mirror TypeScript logic using appropriate Python libraries
  - Handle cryptography requirements with `cryptography` or similar libraries
  - Implement network operations with `requests`/`httpx` for any new HTTP features
  - Maintain compatibility with supported Python versions
- **Go Implementation**:
  - Use standard library crypto packages for any cryptographic needs
  - Implement network operations with `net/http` for new protocols
  - Ensure FIPS compliance for enterprise deployments
  - Follow Go idioms and error handling patterns
- **Cross-Language Requirements**:
  - All implementations must handle new field types consistently
  - Consistent error handling and error code mapping
  - Identical validation rules and parsing behavior
  - Support for any new encoding/decoding requirements
  - Maintain performance characteristics across languages
- Update `test-fixtures/golden.json` with examples of new features
- Add comprehensive test cases for new functionality
- Ensure parity tests validate identical behavior across all languages

## 6) CI/CD validation
- **Multi-language CI jobs**: Ensure all language-specific build and test jobs pass:
  - TypeScript/JavaScript (core + web)
  - Python (pytest)
  - Go (native tests)
  - Rust (cargo test)
  - .NET (dotnet test)
  - Java (gradle test)
- **Parity suite**: Run `pnpm test:parity` to verify TS/Py/Go implementations behave identically
- **E2E tests**: Update and verify against live showcase domains
- **SBOM generation**: Ensure CycloneDX SBOM is generated and uploaded
- **Security scanning**: All security checks must pass

## 7) Breaking change impact analysis
- If breaking: provide opt-in flags or transitional behavior until v2
- Analyze impact across all language implementations
- Update migration documentation with concrete code examples
- Consider deprecation warnings in client libraries
- Plan rollback procedures if deployment issues occur

## 8) Community coordination
- Coordinate with community maintainers for each language implementation
- Ensure all language packages receive the same version bump
- Update language-specific documentation and examples
- Consider impact on third-party integrations and client applications

## 9) Alternative discovery mechanisms (if needed)
- **When to Consider**: If adding fallback discovery methods beyond DNS
- **Security-First Approach**:
  - Implement comprehensive security guards (TLS validation, timeout limits, size caps)
  - Block private IPs and localhost to prevent SSRF attacks
  - Enforce strict content-type validation
  - Validate response format matches expected structure
- **Web UI Implementation**:
  - Add fallback logic to discovery engine
  - Update UI to indicate discovery source in results
  - Use feature flags for gradual rollout
  - Provide user feedback during fallback attempts
- **Cross-Language Consistency**:
  - Identical fallback behavior across all SDKs
  - Consistent error handling and user messaging
  - Same security constraints and validation rules
  - Clear precedence rules (DNS first, fallbacks secondary)

## 10) Versioning & migration notes
- **Determine Version Bump**:
  - **Major (X.0.0)**: Breaking changes to existing record formats or protocols
  - **Minor (x.X.0)**: New features that are backward compatible
  - **Patch (x.x.X)**: Bug fixes, security patches, or internal improvements
- **README Updates Required**:
  - Update main README.md with new features and examples
  - Update each package README with compatibility notes
  - Document any new dependencies or system requirements
  - Update architecture documentation with new flow diagrams
- **Migration Documentation**:
  - Document backward compatibility guarantees
  - Provide migration examples and code samples
  - Explain new features and when to use them
  - Update `packages/docs/versioning.md` with migration guide

## 11) Release & communicate
- **Release Coordination**:
  - Merge all implementation PRs together for atomic release
  - Publish packages in dependency order (core packages first)
  - Enable any new feature flags in production environments
- **Web UI Updates**:
  - Update workbench to support new features in the UI
  - Add visual indicators for new functionality
  - Update examples to demonstrate new capabilities
  - Ensure backward compatibility in user workflows
- **Documentation Updates**:
  - Update public website with feature announcements
  - Add security documentation for new features
  - Include configuration guides for new functionality
  - Update API documentation with any new fields or methods
- **Community Communication**:
  - Announce new features in GitHub Discussions and community channels
  - Highlight security enhancements and new capabilities
  - Provide migration guides and compatibility information
  - Monitor feedback and address any issues promptly

## 12) Post-release monitoring
- Monitor DNS health checks for showcase domains
- Watch for issues reported on community channels
- Be prepared to execute rollback procedures if critical issues emerge
- Update tracking documentation with lessons learned

## Rollback procedures (emergency response)

If a spec change causes issues after release:

1. **Immediate rollback**: Create emergency PR reverting the YAML changes
2. **Version bump**: Use patch version for rollback (e.g., v1.0.1)
3. **Communication**: Notify community of rollback with timeline for fix
4. **Investigation**: Analyze root cause before re-attempting the change
5. **DNS updates**: If showcase records are affected, update Terraform configs

## Checklist for any spec-change PR
- [ ] Proposal issue with rationale, examples, and security analysis
- [ ] `protocol/constants.yml` updated and `pnpm gen` executed
- [ ] All generated constants committed (TS, Py, Go, Web, Rust/.NET/Java if present)
- [ ] Security review completed for changes with security implications
- [ ] Multi-language implementations updated (TS first, then Py/Go mirrors)
- [ ] All language test suites pass (including parity tests)
- [ ] E2E tests pass against live showcase domains
- [ ] Documentation updated (`packages/docs/specification.md`, `versioning.md`)
- [ ] Breaking change analysis completed with migration path
- [ ] Changeset added with appropriate semver bumps for all affected packages
- [ ] CI green across all language jobs (TS/JS, Python, Go, Rust, .NET, Java)
- [ ] SBOM generated and security scans pass
- [ ] Community coordination completed for multi-language implementations
- [ ] Rollback procedures documented and tested
- [ ] Post-release monitoring plan in place
