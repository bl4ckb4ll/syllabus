# syllabi

Temporary/raw university evidence lives here: public HTML, JSON metadata, and other exact non-PDF bodies obtained during a crawl. Syllabus PDFs remain linked at the university source rather than mirrored.

Organize captures shallowly enough to avoid huge directories, normally:

`syllabi/<university>/<term-or-date>/<subject>/...`

Each network acquisition must have a corresponding record under `crawling log/` containing the original URL, UTC time, output path, byte count, SHA-256, exact acquisition executable/commit, exact script blob, and PASS/FAIL/SKIP result.

Files may remain in ordinary Git while practical. A file over 50 MiB is already in GitHub's warning range; a file over 100 MiB cannot be pushed as an ordinary Git object. Do not split a document merely to evade that limit. Move the capture representation to WARC/LFS/object storage and keep its digest/pointer instead.

These files are evidence and cache, not the final user-facing product.
