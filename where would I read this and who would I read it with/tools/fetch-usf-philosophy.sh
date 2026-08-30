#!/usr/bin/env bash
set -euo pipefail

# Temporary raw capture for USF Philosophy.
#
# Be deliberately gentle with the university's servers.  There is no parallel
# fetching here.  Every actual network request is followed by an explicit sleep.

WAIT_SECONDS=${USF_WAIT_SECONDS:-5}
PAGE_SIZE=${USF_PAGE_SIZE:-50}
MAX_PAGES=${USF_MAX_PAGES:-0}     # 0 = no artificial page cap
USER_AGENT=${USF_USER_AGENT:-'syllabi-research/0.1 (+https://github.com/isomorphisms/syllabi; one-request-at-a-time)'}

ROOT='where would I read this and who would I read it with/temporary-raw/usf/philosophy'
SS='https://usf.simplesyllabus.com'
INVENTORY='https://cloud.usf.edu/academic-programs'
PREFIXES='PHI PHH PHM PHP'

mkdir -p "$ROOT" "$ROOT/logs" "$ROOT/simple-syllabus/search" \
  "$ROOT/simple-syllabus/documents" "$ROOT/simple-syllabus/html" \
  "$ROOT/simple-syllabus/pdf" "$ROOT/course-inventory/details"

command -v curl >/dev/null
command -v jq >/dev/null

log() {
  printf '%s\t%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" | tee -a "$ROOT/logs/fetch.log" >&2
}

# One HTTP request.  Successful bodies are cached forever for this temporary
# capture, so rerunning the script does not ask USF for the same object again.
get() {
  url=$1
  out=$2
  mkdir -p "$(dirname "$out")"

  if test -s "$out"; then
    log "SKIP existing $out"
    return 0
  fi

  tmp="$out.part"
  headers="$out.headers.part"
  rm -f "$tmp" "$headers"

  log "GET $url"
  status=$(curl --location --silent --show-error \
    --connect-timeout 20 --max-time 90 \
    --user-agent "$USER_AGENT" \
    --dump-header "$headers" \
    --output "$tmp" \
    --write-out '%{http_code}' \
    "$url" || printf '000')

  # The wait is intentional.  Do not move it outside this function or replace
  # it with concurrent requests just to make the crawl finish faster.
  sleep "$WAIT_SECONDS"

  case "$status" in
    2??)
      mv "$tmp" "$out"
      mv "$headers" "$out.headers"
      log "OK $status $out"
      ;;
    *)
      mv "$tmp" "$out.failed-$status" 2>/dev/null || true
      mv "$headers" "$out.failed-$status.headers" 2>/dev/null || true
      log "FAIL $status $url"
      return 1
      ;;
  esac
}

urlencode() {
  jq -rn --arg value "$1" '$value|@uri'
}

# Preserve the inventory search page itself.  Besides being useful provenance,
# its raw HTML tells us exactly how USF's current search form is wired; we should
# inspect that rather than guessing an undocumented bulk endpoint.
get "$INVENTORY/course-inventory/" "$ROOT/course-inventory/search.html" || true

: > "$ROOT/simple-syllabus/library-items.jsonl.new"

for prefix in $PREFIXES; do
  page=1
  seen=''

  while :; do
    if test "$MAX_PAGES" -gt 0 && test "$page" -gt "$MAX_PAGES"; then
      log "STOP $prefix at configured page cap $MAX_PAGES"
      break
    fi

    encoded=$(urlencode "$prefix")
    out="$ROOT/simple-syllabus/search/$prefix/page-$page.json"
    url="$SS/api2/doc-library-search?search=$encoded&page=$page&page_size=$PAGE_SIZE"

    if ! get "$url" "$out"; then
      log "STOP $prefix because search page $page failed"
      break
    fi

    if ! jq -e . "$out" >/dev/null 2>&1; then
      log "STOP $prefix because $out is not JSON"
      break
    fi

    count=$(jq '(.items // []) | length' "$out")
    log "$prefix page $page returned $count library items"
    test "$count" -gt 0 || break

    # Keep only actual Philosophy subject codes, not arbitrary full-text matches
    # containing the three letters PHI/PHH/PHM/PHP elsewhere.
    jq -c --arg p "$prefix" '
      (.items // [])[]
      | select((.title // "") | test("^\\s*" + $p + "\\s*[0-9]{4}"; "i"))
    ' "$out" >> "$ROOT/simple-syllabus/library-items.jsonl.new"

    # A repeated page is a safer stop condition than looping forever if the
    # vendor changes pagination semantics.
    handles=$(jq -r '(.items // [])[].code // empty' "$out" | sort | tr '\n' ' ')
    if test -n "$seen" && test "$handles" = "$seen"; then
      log "STOP $prefix because page $page repeated the previous handles"
      break
    fi
    seen=$handles

    # A short page is the normal end of pagination.  If it is exactly full,
    # request one more page; that may yield zero items.
    test "$count" -ge "$PAGE_SIZE" || break
    page=$((page + 1))
  done
done

# Deduplicate handles because broad library search can return the same syllabus
# for more than one prefix query.
if test -s "$ROOT/simple-syllabus/library-items.jsonl.new"; then
  jq -s 'sort_by(.code) | unique_by(.code)' \
    "$ROOT/simple-syllabus/library-items.jsonl.new" \
    > "$ROOT/simple-syllabus/library-items.json"
else
  printf '[]\n' > "$ROOT/simple-syllabus/library-items.json"
fi
rm -f "$ROOT/simple-syllabus/library-items.jsonl.new"

printf 'handle\ttitle\tsub_title\tterm\tvisibility\teditors\thtml\tpdf\n' \
  > "$ROOT/manifest.tsv"

jq -c '.[]' "$ROOT/simple-syllabus/library-items.json" | while IFS= read -r item; do
  code=$(printf '%s' "$item" | jq -r '.code // empty')
  title=$(printf '%s' "$item" | jq -r '.title // ""')
  test -n "$code" || continue

  safe_code=$(printf '%s' "$code" | tr -cd 'A-Za-z0-9._-')
  doc="$ROOT/simple-syllabus/documents/$safe_code.json"
  doc_url="$SS/api2/doc-full-page-get?code=$(urlencode "$code")"

  if ! get "$doc_url" "$doc"; then
    printf '%s\t%s\t\t\t\t\t\t\n' "$code" "$title" >> "$ROOT/manifest.tsv"
    continue
  fi

  html="$ROOT/simple-syllabus/html/$safe_code.html"
  if ! test -s "$html"; then
    {
      printf '<!doctype html>\n<meta charset="utf-8">\n'
      printf '<title>%s</title>\n<body>\n' \
        "$(printf '%s' "$title" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')"
      jq -r '
        (.items[0].doc_data.components // [])
        | sort_by(.sort_order // 0)
        | .[]
        | .html // empty
      ' "$doc"
      printf '\n</body>\n'
    } > "$html"
  fi

  pdf=''
  # Download a PDF only when the public document response explicitly gives us a
  # PDF URL.  Do not guess thousands of possible vendor endpoints.
  pdf_url=$(jq -r '
    [.. | strings
      | select(test("^(https?://|/).*[.]pdf([?#].*)?$"; "i"))]
    | unique | .[0] // empty
  ' "$doc")

  if test -n "$pdf_url"; then
    case "$pdf_url" in
      /*) pdf_url="$SS$pdf_url" ;;
    esac
    case "$pdf_url" in
      "$SS"/*)
        candidate="$ROOT/simple-syllabus/pdf/$safe_code.pdf"
        if get "$pdf_url" "$candidate"; then
          content_type=$(awk 'BEGIN{IGNORECASE=1} /^content-type:/ {gsub("\\r",""); print tolower($2); exit}' "$candidate.headers" 2>/dev/null || true)
          if printf '%s' "$content_type" | grep -q 'application/pdf'; then
            pdf=$candidate
          else
            log "DROP non-PDF response saved for $code ($content_type)"
            rm -f "$candidate" "$candidate.headers"
          fi
        fi
        ;;
      *)
        log "SKIP third-party PDF URL for $code: $pdf_url"
        ;;
    esac
  fi

  sub_title=$(printf '%s' "$item" | jq -r '.sub_title // ""' | tr '\t\r\n' '   ')
  term=$(printf '%s' "$item" | jq -r '.term_name // ""' | tr '\t\r\n' '   ')
  visibility=$(printf '%s' "$item" | jq -r '.visibility // ""' | tr '\t\r\n' '   ')
  editors=$(printf '%s' "$item" | jq -r '[.editors[]? | (.name // .full_name // tostring)] | join("; ")' | tr '\t\r\n' '   ')
  clean_title=$(printf '%s' "$title" | tr '\t\r\n' '   ')

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$code" "$clean_title" "$sub_title" "$term" "$visibility" "$editors" "$html" "$pdf" \
    >> "$ROOT/manifest.tsv"

  # Capture the official USF Course Inventory HTML for every course code we can
  # identify from a public syllabus.  This is not yet sufficient to claim that
  # courses with zero public syllabi have been enumerated; the saved search-form
  # HTML is retained so the inventory-side enumeration can be made exact.
  subject=$(printf '%s' "$title" | sed -nE 's/^\s*([A-Za-z]{3})\s*([0-9]{4}).*/\1/p' | tr '[:lower:]' '[:upper:]')
  number=$(printf '%s' "$title" | sed -nE 's/^\s*[A-Za-z]{3}\s*([0-9]{4}).*/\1/p')
  if test -n "$subject" && test -n "$number"; then
    inventory_file="$ROOT/course-inventory/details/${subject}-${number}.html"
    get "$INVENTORY/details/prefix/$subject/code/$number" "$inventory_file" || true
  fi
done

log "DONE public Simple Syllabus handles: $(jq length "$ROOT/simple-syllabus/library-items.json")"
log "DONE manifest rows: $(( $(wc -l < "$ROOT/manifest.tsv") - 1 ))"
