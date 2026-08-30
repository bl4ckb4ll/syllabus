# books

One directory per book/work.  Keep the human-readable title at this layer.
Edition-specific facts live below it because an ISBN identifies an edition or
package, not the abstract work.

Suggested shape:

```text
books/
  bates-guide-to-physical-examination-and-history-taking/
    README.md
    editions/
      9781975210878.md
    prices/
      2026-08-29.tsv
```

A work record should contain:

- title and authors;
- a short description sufficient to answer "what would I be reading?";
- Internet Archive and/or Open Library discovery links when available;
- every edition/ISBN actually named by a syllabus;
- links to the syllabus-evidence records that assigned it.

An edition record should contain publisher, date, edition number, ISBNs, and any
course-material constraint that affects buying it (for example a required
single-use access code).  Do not silently substitute a cheaper edition for the
one the syllabus names.

A price observation is append-only and dated.  For used books the intended
measurement is the cheapest *delivered* AbeBooks used listing for the configured
destination, not merely the lowest sticker price.  `isomorphisms/az` records the
source, method, product identity, amount, currency, timestamp, and purchase URL.

If no used listing is returned, record that result and its timestamp rather than
turning it into a zero price.
