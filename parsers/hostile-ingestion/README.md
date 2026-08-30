# Shared hostile-input receipt

The canonical corpus lives in `isomorphisms/ai-ci` at the exact revision in
`ai-ci.lock`. This directory does not copy it and does not use the external
oracle as an ingestion fallback.

The checked-in template currently reports the truth: Common Crawl/WARC input
acquisition has not been wired in this repository, so that stage is `SKIP` and
every dependent stage is blocked. The workflow verifies that this cannot be
reported as a successful zero-candidate search.

Once the Idriç syllabi parser is connected, its receipt should replace the
consumer-only template. Candidate counts belong only after acquisition,
network, decompression, decoding, HTML recovery, document construction, and
extraction actually complete. Provenance should retain the corpus revision,
the exact crawl/WARC selection, and the candidate and oracle revisions.
