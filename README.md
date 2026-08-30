# syllabi

What do colleges actually make you read?

The repository root is still the bookshelf: each book gets its own top-level directory. Five reserved top-level work areas keep acquisition and parsing separate so every book/course claim can be traced back to bytes and replayed.

- `syllabi/` — captured university HTML and PDF evidence.
- `parsers/` — Grease/shell/Ithon parsers, replay programs, and toolchain pins.
- `course information/` — machine-oriented parser output. It is allowed to be messy.
- `common crawl results pertinent to universities/` — Common Crawl result sets, WARC pointers, and bounded search outputs relevant to universities.
- `crawling log/` — append-only receipts describing every acquisition/parse/replay run.

The intended evidence chain is:

`URL or Common Crawl record -> captured bytes/WARC -> receipt -> pinned parser -> course information -> book record`

A derived fact is not complete unless its record names the direct input, the input SHA-256, the parser path/blob, and the repository/tool commits used to produce it. Offline replay from the captured WARC/bytes is the validation path; a CI replay must not need the live university site.

## Tool policy

There is no silent fallback between implementations.

- HTTP acquisition uses ICU, pinned in `parsers/toolchain.lock.json`. If ICU cannot do a required operation, the run fails or explicitly records `SKIP`; it does not silently call curl.
- Shell-side orchestration is Grease where practical, pinned in the same lock file.
- Python-compatible parser programs are executed by the pinned Ithon build. CI builds that Ithon source and invokes its native executable as `ithon`; it does not substitute the runner's stock Python.

The current ICU streams final response bodies but does not expose the final response status/headers to the caller. Receipts therefore record `http_status: null` rather than inventing one. That is sufficient for body capture plus content validation, but a full HTTP-response WARC receipt remains a known ICU boundary.

## GitHub storage boundary

Keeping HTML/PDF here is fine for now, but raw evidence is sharded by university/term/subject instead of collected in one directory. GitHub warns for ordinary Git files over 50 MiB and blocks files over 100 MiB. Its repository guidance recommends no more than 3,000 entries in one directory and an on-disk repository size no larger than 10 GB. If captures approach those boundaries, move large raw bodies to WARC/LFS/object storage while retaining checksums and replay metadata here.

Book directory names and records remain human-readable. The naming contract lives at `parsers/book-filename.grease`. Missing evidence stays missing; the acquisition/parsing machinery must not manufacture it.
