# Repository Instructions

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tools** (when available): `codegraph_explore` answers most code questions in one call; `codegraph_node` returns one symbol's source and callers, or reads a whole file with line numbers.
- **Shell** (when available): `codegraph explore "<symbol names or question>"` and `codegraph node <symbol-or-file>` print the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely. Indexing is the user's decision.
<!-- CODEGRAPH_END -->

## Production Readiness

This shop is preparing for a real production launch. Before making launch-related changes or answering whether the shop is ready, read [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) completely.

- Treat every unchecked **P0** item as a launch blocker. Do not describe the shop as production-ready while one remains.
- Update the readiness document when an item is implemented and verified. Record the verification command or manual test evidence.
- Do not mark payment, cancellation, refund, return, or exchange work complete using only mocked tests. Verify the Toss sandbox flow and database/inventory state together.
- Never commit OAuth, Toss, AWS, SMTP, JWT, database, or Redis secrets. Keep them in ignored local files or the deployment platform's secret manager.
- The Google OAuth client secret disclosed during development must be rotated before launch. Never copy the old value into documentation or tracked files.
- Preserve unrelated user changes in the working tree.

