# Offline Common Crawl CDX-indexed WARC replay

Implementation: parsers/common_crawl_record.pi (new Ithon source; distinct from the older parsers/warc_extract.py fixture extractor).

Common Crawl CDX JSON/CDXJ supplies url, filename, offset, length, timestamp, status, and SHA-1 digest. Per Common Crawl's published example, filename/offset/length identify a compressed WARC record, fetched with Range bytes=offset-(offset+length−1) from data.commoncrawl.org. See https://www.commoncrawl.org/cdxj-index and https://github.com/commoncrawl/whirlwind-python.

Input to the reader:
- One CDX JSON object or CDXJ line saved as index-record.json;
- A local file range-record.warc.gz containing the **exact** selected compressed bytes, not a whole archive.

Intended invocation **after** pinned Ithon frontend checking:

    ithon parsers/common_crawl_record.pi \
      --index-row index-record.json \
      --range-file range-record.warc.gz \
      --output extracted.http-entity \
      --receipt replay-receipt.json

A self-test is available via --self-test, but do not count success until it executes through the pinned Ithon frontend/runtime at the checked revision. A separately lowered Python-syntax oracle passed one positive plus nine negative synthetic controls during development; that proves neither Ithon execution nor a real Common Crawl record.

Positive path checks: selected compressed-byte length, valid gzip, 64 MiB default decompression cap, WARC version/record type/target, WARC Content-Length, absence of trailing nonseparator data, HTTP response/status, and CDX SHA-1 for unencoded identity-transfer payloads. Response content-encoding other than identity is preserved as raw entity bytes and marked NOT_CHECKED_CONTENT_ENCODING; HTTP chunked transfer is rejected rather than mislabeled as decoded content. Receipt distinguishes raw response extraction from source offset verification, discovery coverage and syllabus classification.

The current reader has **no network access**, so it cannot itself prove the selected file range came from the claimed remote offset. This requires a separate ICU HTTP 206 + Content-Range acceptance and exact acquisition receipt. It also cannot prove document character encoding, HTML/PDF recovery, or extracted books. Such stages must remain NOT_VERIFIED, BLOCKED or FAIL, never silently succeed.

WARC-02 hardening candidate on sun/warc-02-replay-hardening:
- Strict ASCII header-name tokens, a 64 KiB header bound, canonical WARC path segments, and typed 32-character base32 CDX SHA-1.
- Rejection controls for duplicate/oversized WARC headers, malformed digests, unsafe paths, and the earlier malformed captures. A subprocess self-test also checks a passing output/receipt pair, stale result removal after a failed retry, and source/output path collision protection.
- The CLI now stages extracted bytes in a unique same-directory temporary file before renaming the body into place. On a normally caught failure it removes prior/staged body bytes, replaces any stale PASS receipt with a FAIL receipt, and records output_sha256 on success. Crash-time publication of the body and receipt is **not** a two-file atomic transaction: consumers must check both PASS and the digest.
- The new unfiltered .github/workflows/warc-replay-ithon.yml checks the exact GitHub commit with pinned Ithon d6e83969f82512e920fb17b44326cb54f31d015c and attempts to execute these controls under that interpreter. Its existence does **not** prove the check ran or passed.

## October 19 checked-entrypoint repair

The previous native-runtime invocation printed passing synthetic tests but bypassed the static frontend, then failed its missing-check-receipt assertion. The reader now has explicit Ithon types and uses the checked launcher for its child processes. Self-test callers must set ITHON_EXECUTABLE to that checked launcher. The GitHub Node action sets it to the pinned checkout's native-backed launcher, refuses a missing native ELF, verifies four exact-source frontend receipts, and rejects an untyped module without adding a receipt. Its artifact retains the native executable hash, source hash, candidate commit and actual stdout/stderr. A host frontend run is recorded separately and cannot satisfy this native gate.

The repaired reader requires CDX SHA-1 and a supported matching WARC SHA-1, rejects non-200 source responses and unsupported transfer/content encodings, validates header tokens/control bytes, rejects duplicate JSON keys and malformed CDXJ prefixes, bounds input reads, and accepts exactly one complete gzip member. Extra gzip members, trailing compressed bytes, duplicate WARC records, truncated inputs and malformed HTTP framing fail at their actual stages. Thirty-five replay controls, seven malformed/error-object CDX controls and CLI retry/path controls use synthetic data. Unsupported encodings receive failure receipts; this is not general gzip/chunked HTTP recovery.

Outstanding WARC-02 acceptance: current-head native job and retained receipts; at least one authentic indexed Common Crawl compressed range; differential comparison with warcio/jwarc; crash-interruption recovery; independent AICI controls. SUN-SYL-CDX-03 still owns ICU acquisition with HTTP 206/Content-Range verification. No network capture or original syllabus document is claimed by this repair. No new maintained .py programs.
