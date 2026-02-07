/**
 * SDK discovery snippets per language.
 * Each function takes the domain discovered and returns ready-to-copy code.
 *
 * Reused by both the landing quick-start and the workbench post-discovery panel.
 */

type SnippetLanguage = 'typescript' | 'python' | 'go' | 'rust' | 'java' | 'dotnet';

const INSTALL_COMMANDS: Record<SnippetLanguage, string> = {
  typescript: 'npm install @agentcommunity/aid',
  python: 'pip install aid-discovery',
  go: 'go get github.com/agentcommunity/aid-go',
  rust: 'cargo add aid-rs',
  java: '// Add org.agentcommunity:aid to pom.xml or build.gradle',
  dotnet: 'dotnet add package AidDiscovery',
};

function buildSnippets(domain: string): Record<SnippetLanguage, string> {
  return {
    typescript: `import { discover } from '@agentcommunity/aid'

const { record } = await discover('${domain}')
console.log(record.proto, record.uri)`,
    python: `from aid_py import discover

record = discover('${domain}')
print(record.uri)`,
    go: `import "github.com/agentcommunity/aid-go"

rec, err := aid.Discover("${domain}")
if err != nil { /* handle */ }
fmt.Println(rec.Record.URI)`,
    rust: `use aid_rs::discover;
use std::time::Duration;

let rec = discover("${domain}", Duration::from_secs(5)).await?;
println!("{} {}", rec.proto, rec.uri);`,
    java: `import org.agentcommunity.aid.Discovery;

var result = Discovery.discover("${domain}", new DiscoveryOptions());
System.out.println(result.record.proto + " at " + result.record.uri);`,
    dotnet: `using AidDiscovery;

var result = await Discovery.DiscoverAsync("${domain}");
Console.WriteLine($"{result.Record.Proto} at {result.Record.Uri}");`,
  };
}

const LANGUAGE_LABELS: Record<SnippetLanguage, string> = {
  typescript: 'TypeScript',
  python: 'Python',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  dotnet: '.NET',
};

const LANGUAGES: SnippetLanguage[] = ['typescript', 'python', 'go', 'rust', 'java', 'dotnet'];

export { buildSnippets, INSTALL_COMMANDS, LANGUAGE_LABELS, LANGUAGES };
export type { SnippetLanguage };
