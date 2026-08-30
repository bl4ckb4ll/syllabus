# syllabi

What do colleges actually make you read?

The repository root is the bookshelf. Each book gets its own top-level directory.
There is no `books/` wrapper.

For now the corpus is deliberately narrow:

- philosophy
- English
- history

Nothing else is included merely because a university publishes a syllabus for it.

A top-level book record should say what the book is, describe it briefly, identify
the edition or ISBN actually assigned when known, link to Internet Archive/Open
Library discovery, record dated used-book price observations, and point to the
places where we found it being taught.

The only non-book directory is:

`where would I read this and who would I read it with/`

Everything relational or operational belongs there: colleges, departments,
courses, instructors, terms, syllabus evidence, Common Crawl run history, and
other provenance. Those views should use symbolic links back to the canonical
book directories whenever that avoids duplication.

Syllabi are evidence, not the product. We do not need to mirror every PDF.

Price observations are dated. `abe used` in `isomorphisms/az` is the intended
AbeBooks lookup for the cheapest delivered used listing; an old observation is
never presented as a current price.

A missing syllabus, missing book, missing Internet Archive copy, or failed price
lookup stays explicit. Absence from one search is not evidence that the thing
does not exist.
