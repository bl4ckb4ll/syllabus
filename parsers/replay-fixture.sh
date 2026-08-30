#!/usr/bin/env bash
set -euo pipefail

ITHON=${ITHON:-ithon}
URI='https://usf.simplesyllabus.com/api2/doc-full-page-get?code=fixture-phi2010'
WARC='parsers/fixtures/usf-course.warc'
EXTRACTED='.replay/usf-course.json'
ACTUAL='.replay/course-information.json'
EXPECTED='parsers/fixtures/expected-course-information.json'

command -v "$ITHON" >/dev/null || {
  printf 'FAIL replay: Ithon executable not found: %s\n' "$ITHON" >&2
  exit 69
}

rm -rf .replay
mkdir -p .replay

"$ITHON" parsers/warc_extract.py \
  --input "$WARC" \
  --uri "$URI" \
  --output "$EXTRACTED" \
  --receipt '.replay/warc-extract-receipt.json'

"$ITHON" parsers/usf_course_information.py \
  --input "$EXTRACTED" \
  --source-uri "$URI" \
  --output "$ACTUAL"

cmp "$EXPECTED" "$ACTUAL"
printf 'PASS WARC extraction\n'
printf 'PASS USF course-information replay\n'
printf 'PASS expected course, instructor, and book-candidate receipt\n'
