import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { resolve, relative } from 'node:path';

const bin = process.env.GRAPHIFY_BIN || 'graphify';
execFileSync(bin, ['extract', '.', '--code-only', '--max-workers', '2'], { stdio: 'inherit' });
const graph = JSON.parse(readFileSync('graphify-out/graph.json', 'utf8'));
const nodes = graph.nodes, edges = graph.links ?? graph.edges;
assert.ok(nodes.length && edges.length, 'The navigation graph must not be empty.');
const ids = new Set(nodes.map(n => n.id));
assert.ok(edges.every(e => ids.has(e.source) && ids.has(e.target)), 'Every relationship needs two known nodes.');
const files = {};
for (const n of nodes) {
  if (!n.source_file) continue;
  const file = relative(process.cwd(), resolve(n.source_file));
  if (file.startsWith('..') || !existsSync(file) || files[file]) continue;
  files[file] = createHash('sha256').update(readFileSync(file)).digest('hex');
}
assert.ok(files['lib/workflow.ts'] && files['lib/http.ts'], 'The graph must include the workflow and HTTP boundary.');
const provenance = { generatedAt: new Date().toISOString(), head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), files };
writeFileSync('graphify-out/provenance.json', JSON.stringify(provenance, null, 2) + '\n');
writeFileSync('graphify-out/GRAPH_REPORT.md', `# Portal code graph\n\nGenerated ${provenance.generatedAt} from the current working files.\n\n${nodes.length} nodes, ${edges.length} relationships, ${Object.keys(files).length} represented source files. See provenance.json for exact source hashes; the working files may differ from the recorded Git HEAD.\n\nLocal AST extraction only. Read docs/how-it-works.md for the human explanation. SQL strings, dynamic calls and the SQL migration are not fully represented; the optional SQL parser is not installed. Graph edges do not prove permissions or test success.\n\nStart with lib/http.ts, lib/session.ts, lib/brief.ts and lib/workflow.ts. Query a named function, then inspect its callers and tests.\n`);
execFileSync(bin, ['export', 'html'], { stdio: 'inherit' });
console.log(`Verified graph endpoints and recorded ${Object.keys(files).length} source hashes.`);
