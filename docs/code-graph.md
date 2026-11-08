# Code graph for maintenance

Author: GPT/Codex. Uses the locally installed [Graphify](https://github.com/Graphify-Labs/graphify) 0.9.33.

The learner guide is [how-it-works.md](how-it-works.md). This supplementary graph indexes function, file and import relationships so a maintainer can find callers before editing code. It is generated from this repository with local AST extraction. It does not upload code or use a paid model.

Run from the project root:

```sh
graphify extract . --code-only --max-workers 2
graphify query "saveRevision mutate existingOperation" --graph graphify-out/graph.json --budget 1200
graphify export html
```

Read `graphify-out/graph.json` for the machine-readable graph and `graphify-out/GRAPH_REPORT.md` for its generated report. HTML is a local interactive aid. The `.graphifyignore` file excludes dependencies, build output, generated graphs and unused starter components. The graph's scope is application code, schema, scripts and tests.

Refresh after structural code changes and before the final review. Check the source when a graph result matters: an AST graph can miss relationships inside SQL strings and dynamic calls. It cannot prove permission checks, transactional behaviour or test success. Use the explicit data-flow guide and executable tests for those claims.

For an unfamiliar change, query the graph, inspect the named code and its callers, then select the relevant test. A graph result is a navigation aid, not evidence that a feature works.
