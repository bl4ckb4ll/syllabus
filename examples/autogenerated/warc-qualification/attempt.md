# Checked WARC replay repair

The requested program is the existing Ithon reader, not a new implementation in
another language. Its previous native invocation accepted assignment arrows but
never invoked the static frontend. The last CI command failed because the
required check receipt was absent even though the synthetic tests printed PASS.

## Types and effects

CDX input is an untrusted JSON object. Source fields cross explicit string and
canonical-number checks. Headers become a byte start line, a text mapping, and
remaining bytes. Replay has the signature
`extract : CDX × compressed bytes × size bound → (entity bytes, receipt)` and
raises a stage-labelled failure. Filesystem publication and subprocess tests are
effects; hashing, framing and source comparisons are separate from acquisition.
Typed foreign boundaries cover JSON, regular expressions, gzip/zlib, hashes,
paths and subprocess results. JSON remains required by the external CDX format.

The checked pin lacks inferred method results, tuple assignment targets,
attribute assignment, generator expressions, and some comparison forms. The
reader now uses explicit result types, simple bindings, checked text/number
boundaries and ordinary loops. A built-in exception's argument tuple carries the
stage instead of unchecked instance attributes. No `.pi` source is lowered or
executed outside Ithon's whole-module frontend.

The small JavaScript file is strictly GitHub's required Node action interface.
It invokes the native built Ithon launcher, refuses a host-interpreter fallback,
verifies the real source hash in four frontend receipts, and proves an untyped
module fails without a receipt. It is not a WARC parser or a source-acquisition
fallback. The inherited Ithon configure/make bootstrap is unchanged; this change
does not claim new compiler/toolchain qualification.

## Executed boundary

Pinned Ithon: `d6e83969f82512e920fb17b44326cb54f31d015c`.
Locally, the actual checked **host** entrypoint passed the repaired reader's
positive replay, 35 staged replay rejection controls, seven malformed CDX
controls, stale-output retry and input-path protection. This is frontend plus
host-substrate execution, not native-runtime qualification. Hosted execution
must independently produce its current-head runtime and source-check receipts.

Unsupported transfer/content encodings fail explicitly. One bounded gzip member
is accepted; truncated streams, extra members and trailing compressed bytes
fail. Neither a synthetic pass nor this record supplies a genuine Common Crawl
capture, ICU 206/Content-Range witness, warcio/jwarc differential result, recovered
syllabus, independent AICI acceptance or collection completion.

Next executable requirement: run the exact-head hosted native job, then feed an
authentic ICU-acquired range and its CDX record into this same reader and compare
the recovered bytes with the independent WARC oracle. No fixture may be promoted
to an observed university course.
