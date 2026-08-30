# crawling log

Append-only provenance receipts for acquisition, parsing, and replay.

Use one NDJSON file per run. A run record is useful even when it fails or returns nothing. The log is intended to answer, mechanically:

- What question/run was this?
- What URL or WARC record was read?
- When did it happen?
- Which exact ICU/Grease/Ithon/repository commits were used?
- Which exact parser blob ran?
- What files were produced?
- What are their SHA-256 digests and byte counts?
- What stage PASSed, FAILed, or was explicitly SKIPped?
- Can the parse be replayed without the network?

The schema is `schema-v1.json`. `parsers/validate_receipts.py`, executed under Ithon, applies the required invariants that are cheap to check without a third-party JSON-Schema package.

For live acquisition, log the real result that can be observed. In particular, current ICU does not expose final HTTP response status/headers, so receipts use `http_status: null` rather than claiming a status code that was never observed.

## Hostile-input sidecars

A real Common Crawl/WARC run should place its seven-stage hostile-input receipt
beside the NDJSON record as `crawling log/<run-id>.hostile-ingestion.tsv`. The
NDJSON record or sidecar must identify:

- the corpus semantic revision and exact `isomorphisms/ai-ci` commit;
- the implementation-under-test revision and executable hash;
- the external oracle revision, kept outside the candidate path;
- the first failed stage and the first incomplete stage; and
- whether any fallback was used (`none` is required for the candidate path).

Until that path is wired, `parsers/hostile-ingestion/run.receipt.template.tsv`
records `SKIP` at input acquisition and at every dependent stage. It must not
be interpreted as a successful search with zero candidates.
