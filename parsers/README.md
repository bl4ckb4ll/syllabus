# parsers

All acquisition, parsing, normalization, replay, and naming programs live here.

`toolchain.lock.json` pins the external implementations used by receipts and CI. Scripts should record both the repository commit and their own Git blob hash. That distinguishes “same script path” from “same script bytes.”

Rules:

1. ICU is the HTTP implementation. No curl fallback.
2. Grease is preferred for shell-shaped orchestration. Small POSIX/Bash glue is allowed where it makes the boundary clearer.
3. A Python-compatible parser may exist here, but it is run with the pinned Ithon binary. `replay-fixture.sh` refuses to continue if `ithon` is unavailable.
4. Network acquisition writes raw bodies to `syllabi/` and receipts to `crawling log/`.
5. Parsing reads captured bodies or WARC and writes only to `course information/` (or a temporary comparison path in CI).
6. Replay must not touch the network.
7. A missing implementation is FAIL/SKIP, never an implicit switch to an oracle or another client.

The checked fixture deliberately separates WARC extraction from USF interpretation. That lets CI distinguish a broken archive reader from a broken course parser.
