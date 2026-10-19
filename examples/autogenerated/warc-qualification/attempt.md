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

## Historical development boundary (superseded by native acceptance below)

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

## Executed authentic/native acceptance, 2026-10-19

The historical next step above has run. Exact replay head `d52ce603c8c116f5827a8939441b50f96bbddb3e` passed native Ithon, 39 replay rejection controls, authentic ICU-acquired compressed bytes, warcio 1.7.5 and jwarc 0.37.0 byte equality, and independent AICI `c9cd9bb0e8e1ad91af5ad45cf1ae8e5df376b9e5`, including killed-after-publication retry. Run: https://github.com/bl4ckb4ll/syllabus/actions/runs/39335695601. The artifact retains exact-source frontend receipts, native executable/source hashes, independent stdout and both oracle hashes. The integrated source campaign must produce its own acceptance. No Reed assignment is inferred from its homepage.
