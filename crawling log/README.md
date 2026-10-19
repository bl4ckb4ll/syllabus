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
