# Offline Common Crawl CDX-indexed WARC replay

Current qualification, 2026-10-19: the authentic Reed range, native checked-Ithon replay, warcio/jwarc differential and independent interruption/hostile acceptance passed at head `d52ce603c8c116f5827a8939441b50f96bbddb3e`, run https://github.com/bl4ckb4ll/syllabus/actions/runs/39335695601. The artifact is https://github.com/bl4ckb4ll/syllabus/actions/runs/39335695601/artifacts/12225659462. The original indexed compressed bytes and ICU status/Content-Range metadata are in `parsers/fixtures/common-crawl/reed-20260906235851/`. This is a homepage control, not a syllabus or assigned-reading claim. The integrated campaign head must pass again after its source additions.

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

Positive path checks: selected compressed-byte length, valid single-member gzip, 64 MiB default decompression cap, WARC version/record type/target/content type, WARC Content-Length, exact two-CRLF record terminator, supplied block digest, HTTP response/status, and matching CDX/WARC payload SHA-1. Unsupported content/transfer encodings fail explicitly. Receipt distinguishes replay from remote offset verification, discovery coverage and syllabus classification. Repeated WARC-Protocol and WARC-Concurrent-To metadata is retained; ambiguous critical headers remain rejected.

The current reader has **no network access**, so it cannot itself prove the selected file range came from the claimed remote offset. This requires a separate ICU HTTP 206 + Content-Range acceptance and exact acquisition receipt. It also cannot prove document character encoding, HTML/PDF recovery, or extracted books. Such stages must remain NOT_VERIFIED, BLOCKED or FAIL, never silently succeed.

WARC-02 hardening candidate on sun/warc-02-replay-hardening:
- Strict ASCII header-name tokens, a 64 KiB header bound, canonical WARC path segments, and typed 32-character base32 CDX SHA-1.
- Rejection controls for duplicate/oversized WARC headers, malformed digests, unsafe paths, and the earlier malformed captures. A subprocess self-test also checks a passing output/receipt pair, stale result removal after a failed retry, and source/output path collision protection.
- The CLI now stages extracted bytes in a unique same-directory temporary file before renaming the body into place. On a normally caught failure it removes prior/staged body bytes, replaces any stale PASS receipt with a FAIL receipt, and records output_sha256 on success. Crash-time publication of the body and receipt is **not** a two-file atomic transaction: consumers must check both PASS and the digest.
- The new unfiltered .github/workflows/warc-replay-ithon.yml checks the exact GitHub commit with pinned Ithon d6e83969f82512e920fb17b44326cb54f31d015c and attempts to execute these controls under that interpreter. Its existence does **not** prove the check ran or passed.

## October 19 checked-entrypoint repair

The previous native-runtime invocation printed passing synthetic tests but bypassed the static frontend, then failed its missing-check-receipt assertion. The reader now has explicit Ithon types and uses the checked launcher for its child processes. Self-test callers must set ITHON_EXECUTABLE to that checked launcher. The GitHub Node action sets it to the pinned checkout's native-backed launcher, refuses a missing native ELF, verifies four exact-source frontend receipts, and rejects an untyped module without adding a receipt. Its artifact retains the native executable hash, source hash, candidate commit and actual stdout/stderr. A host frontend run is recorded separately and cannot satisfy this native gate.

The repaired reader requires CDX SHA-1 and a supported matching WARC SHA-1, rejects non-200 source responses and unsupported transfer/content encodings, validates header tokens/control bytes, rejects duplicate JSON keys and malformed CDXJ prefixes, bounds input reads, and accepts exactly one complete gzip member. Extra gzip members, trailing compressed bytes, duplicate WARC records, truncated inputs and malformed HTTP framing fail at their actual stages. Thirty-five replay controls, seven malformed/error-object CDX controls and CLI retry/path controls use synthetic data. Unsupported encodings receive failure receipts; this is not general gzip/chunked HTTP recovery.

WARC-02's previously outstanding native, genuine-capture, differential, interruption and independent acceptance obligations are now satisfied for the retained replay scope. The current native gate runs 39 staged replay rejections, seven malformed/error-object CDX controls, CLI alias/retry controls, and independent AICI authentic-range mutations. A process killed after publishing the body but before its receipt is followed by a failed retry that removes accepted-looking output.

ICU acquisition is a compiled Idriç candidate calling the real provider and choosing HTTP/1.1 through Idric-Net; it verifies status 206, exact Content-Range and compressed lengths. It has also re-fetched the identical bytes from clean published candidate sources. Public `icu get-range` admission, general encoded-content recovery and the legacy USF `.py` extractor migration remain incomplete. Three original USF syllabi and their reading provenance are separate from the unrelated Reed fixture. No new maintained `.py` program is introduced.
