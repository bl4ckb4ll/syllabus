# temporary USF Philosophy capture

This directory is scratch material used to extract the durable book/index records.
It is expected to be deleted once the extracted books, course links, instructors,
and provenance records have been checked.

Raw capture comes first.  Do not treat the presence or absence of a file here as
the final corpus model.

## Committed parser fixture

`simple-syllabus/html/sppml7syc.html` is a small verbatim HTML capture of the
assigned-material components from the public USF Simple Syllabus document
`sppml7syc`.  It is committed because the parser receipt must exercise real
vendor markup without depending on a live request.  `manifest.tsv` records the
course, instructor, term, public source, capture time, and fixture path.

The fixture is evidence for parser behavior, not a normalized book record.  In
particular, the parser keeps the citation wording supplied by the instructor and
does not infer a canonical author, title, edition, ISBN, or catalog identifier.
The public page and its displayed course metadata were rechecked when the
fixture was captured on 2026-09-01.

The fetcher is intentionally polite to USF and Simple Syllabus:

- one request at a time;
- no parallel downloads;
- default five-second wait after every network request;
- skips files already present so an interrupted run resumes instead of fetching them again;
- records failures rather than retrying in a tight loop;
- no attempt to bypass authentication or retrieve non-public syllabi.
