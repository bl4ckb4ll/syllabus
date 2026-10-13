# Starter-school coverage ledger

File: starter-institutions.tsv

One row for each of seven initial institutions × four humanistic fields. Initial inventory as of 2026-10-12. A status in this table is a **knowledge state**, not a rating of a college or its education.

Only Florida State philosophy presently has PARTIAL_READING_EVIDENCE in this inventory: two recovered course instances, PHI 3670 and PHI 3700, cited by main/README.md. This does not establish coverage for a philosophy major. The other 27 cells are UNSEARCHED/NOT YET INVENTORIED here, not known to be empty.

Rules for SUN updates:

1. Make a separate evidence record per institution, course, section, term, instructor and assigned reading. Include the syllabus or reading-schedule URL, content hash, exact source span and whether the item is assigned, recommended or merely mentioned.
2. Keep a source type: catalog, catalog archive, syllabus, assignment/reading schedule, faculty webpage, archived WARC, or other. A course catalog is a discovery lead, not an assigned-reading source.
3. Store each search's exact scope, date, stage counts, query and failure first boundary under crawling log. A failure or blocked fetch is not a negative search result.
4. Use PARTIAL_READING_EVIDENCE only after checking a term-specific instructor/course source. Use COMPLETE_WITHIN_SCOPE only with a concrete bounded course/term denominator, all related source statuses and exclusions stated.
5. Record old material without quietly accepting stale branches or historic green CI as today's execution. FSU/main; book-first-usf; usf-edric-book-parser; convergence/hostile-ingestion-book-first remain distinct source states.
6. Area-studies departments and programs vary by institution. Identify which real programs and cross-listed courses exist; never invent a department to fill the grid.
7. Class analysis of course texts, selection, costs, cultural capital, authority and employment claims requires source spans, an explicit inference chain, and the Blackball training/evaluation gate. Do not turn a book title into a motive claim.

A program can be operationally UNSEARCHED even when unrelated courses at that university have verified readings (such as USF's EDG 7067 education-course fixture on its parser branch). Counts never equate programs, departments, and individual courses.

Additional schools remain in the planning queue; adding a name to the TSV must not increment collection totals.