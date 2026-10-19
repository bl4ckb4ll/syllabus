# Authentic Common Crawl range, unrelated homepage control

This is source data, not a synthesized WARC. It is the first of four rows returned by the bounded exact-URL search on 2026-10-19:

https://index.commoncrawl.org/CC-MAIN-2026-39-index?url=www.reed.edu%2F&output=json&filter=status%3A200

The 1,844-byte response, status 200, and response metadata are retained. Collection metadata identified CC-MAIN-2026-39 as the September 2026 crawl. This single query does not enumerate university courses.

Range source:
https://data.commoncrawl.org/crawl-data/CC-MAIN-2026-39/segments/1788492699693.82/warc/CC-MAIN-20260906231007-20260907021007-00742.warc.gz

Request: `Range: bytes=843666201-843675567`, through the actual ICU native provider, compiled with ICK and called by compiled Idriç. Observed status 206, `Content-Range: bytes 843666201-843675567/952222438`, identity content encoding, declared and received length 9,367. Exact retained metadata is adjacent. The candidate probe explicitly chooses HTTP/1.1 through Idric-Net. This is a local candidate acquisition witness, not admission of a released public ICU range API.

Compressed SHA-256: `f9652a22cff1d6b5649b6bf9420b9c7c6c7058019348e8d201cb03ed42cf5d58`.

Recovered entity: 49,214 bytes; SHA-256 `1c7f0300f3ed38ba847dace7cb95443c6a865f12396e561f37ba5166a619f894`. CDX and WARC payload SHA-1: `CRUA4JE526YD3EO5RF4CDHNE66MZFXQW`. External warcio 1.7.5 independently checks both digests and extracts those same entity bytes. Native checked-Ithon execution is a separate hosted current-head gate.

The WARC contains repeated `WARC-Protocol` fields (`h2` and `tls/1.3`). The reader now preserves repeated noncritical protocol/concurrency metadata while still rejecting duplicate critical fields. See IIPC WARC-Protocol proposal: https://github.com/iipc/warc-specifications/issues/42 and WARC 1.0 WARC-Concurrent-To definition: https://iipc.github.io/warc-specifications/specifications/warc-format/warc-1.0/.

Classification: Reed College homepage; **not a syllabus**. Zero courses and zero assigned readings are inferred from it. It is retained to test authentic compressed replay and refusal to promote unrelated pages into assignments.
