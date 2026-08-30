# syllabi

What do colleges teach in the liberal arts?

The answer should be browsable from the books outward.

## Scope

This repository is for liberal-arts teaching: humanities, arts, social sciences,
mathematics and statistics, natural sciences taught as part of a liberal-arts
curriculum, and interdisciplinary liberal studies.

Professional-school material is out of scope merely because a university
publishes it. Nursing, medicine, allied health, engineering, business/professional
training, and similar curricula are excluded unless a particular course is
being treated as part of a liberal-arts program.

`books/` is the primary collection. A book record says what the book is, which
edition/ISBN a course asked for, where it can be found or borrowed, what a used
copy cost when we checked, and which courses actually assigned it.

Syllabi are evidence, not the product. We keep a small provenance record for a
public syllabus instead of mirroring every PDF. Instructor, department, course,
institution, and term trees are views over those records and over the books they
point to. Where a filesystem view would duplicate an object, use a symbolic
link rather than another copy.

Price observations are dated. A changing market price is never treated as an
intrinsic property of a book. Used-book observations come from the `abe used`
path in `isomorphisms/az`, which asks AbeBooks for the cheapest delivered used
listing to the configured destination and records the observation.

A missing syllabus, missing book, missing Internet Archive copy, or failed price
lookup must remain explicit. Absence from one search is not evidence that the
thing does not exist.
