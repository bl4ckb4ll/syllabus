# temporary USF Philosophy capture

This directory is scratch material used to extract the durable book/index records.
It is expected to be deleted once the extracted books, course links, instructors,
and provenance records have been checked.

Raw capture comes first.  Do not treat the presence or absence of a file here as
the final corpus model.

The fetcher is intentionally polite to USF and Simple Syllabus:

- one request at a time;
- no parallel downloads;
- default five-second wait after every network request;
- skips files already present so an interrupted run resumes instead of fetching them again;
- records failures rather than retrying in a tight loop;
- no attempt to bypass authentication or retrieve non-public syllabi.
