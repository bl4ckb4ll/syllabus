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
# October 19 bounded source recovery

The retained live workflow now captures one original document per USF discipline
and uploads raw HTML, vendor metadata, derived candidates and failure receipts.
It no longer treats 464 as an accepted acquired population or automatically
commits its output. Observed vendor metadata totals remain discovery counts.
The existing parser is foreign `.py` migration debt, executed on the pinned
native runtime; it does not supply checked-Ithon frontend acceptance.

The first real hosted attempt fetched PHM 6267 section 901, Fall 2026, then
failed when the Grease Python 2 `PYTHONHOME` reached Ithon (`argparse` could not
be imported). The parser and receipt-check invocations now remove that foreign
environment locally, preserving Grease's own runtime environment. Source bytes
and partial evidence are retained even when a later stage fails. Inspect the
actual original before promoting a candidate title to an assigned reading.
