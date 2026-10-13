# Blackball Syllabus: course-evidence collection campaign (2026-10-12)

## Purpose

Collect **what colleges actually teach**, not merely advertised degrees or a personal reading canon. Initial disciplines: **history, philosophy, English, area studies** (languages, regional history, literature, religion, philosophy). Preserve the bookshelf-at-root and symlinked course provenance.

**Reporting is not ideologically neutral.** Blackball must recognize the class assumptions colleges transmit: merit and credential claims; class-coded professionalism; unpaid internships and financial risk; prestige and authority; unequal access to knowledge and livelihoods. Cite the actual evidence, and distinguish institutional claims, observed assignments, causal analysis and interpretation. A published education report requires the class-analysis training/acceptance lane below; data acquisition can proceed meanwhile.

## Recovered evidence — plans are not data

| Surface | Verified or described contents | Limitation |
| --- | --- | --- |
| Main syllabus README, FSU philosophy | PHI 3670 Ethical Theory, David McNaughton, Spring/year unresolved; PHI 3700 Philosophy of Religion, David McNaughton, Fall 2006. Partial PHI 3670 assigned-reading mapping. | Two documented course instances, NOT a whole major. |
| Main Common Crawl run history | Template, bounded scope and coverage classes. | Template does not establish a search. |
| Book-first USF, old PR #4 | USF acquisition, parser, bounded uncompressed WARC fixture and replay, receipt checks and pins. | Branch unmerged; no verified complete live USF acquisition. |
| USF Idriç parser, old PR #5 | EDG 7067 Philosophies of Inquiry, Vonzell Agosto, Summer 2026 assigned-reading fixture. | Education course; NOT proof of philosophy-department coverage. |
| Hostile ingestion convergence, old PR #7 | AICI hostile-input receipt and pin. | Begins with input acquisition SKIP; diverged from book-first USF. |
| Syllabus #2, ai-ci #46, computer-science #62 | Open network, HTML and hostile-input boundaries. | Do not report unexecuted stages as zero candidates. |
| Current campaign branch | CDX-indexed gzip WARC extraction attempt in parsers/common_crawl_record.pi, synthetic controls checked after separately lowering arrows for a Python-language oracle. | Actual Ithon frontend, real CC range data, live HTTP retrieval and syllabus extraction NOT VERIFIED. |

Recovered starter schools: Florida State, University of South Florida, Miami University (Ohio), Mississippi Valley State, University of Mississippi (Ole Miss), Reed College, University of Chicago. Earlier planning also named Oberlin, Kansas, Yale, Harvard, Princeton, Howard, Spelman, Morehouse, NC A&T, FAMU, Hampton, Tuskegee, Jackson State, Alcorn and Tougaloo. **Being on this list does not mean searched.**

## Coverage

See coverage/starter-institutions.tsv. It enumerates school × discipline cells. Never turn an unsurveyed cell into a negative finding.

Statuses: UNSEARCHED (no bounded recorded search); LEAD (course/URL/catalog candidate); PARTIAL_READING_EVIDENCE (at least one inspected course with an assigned reading, not full coverage); BLOCKED (failed fetch/parse stage named); VERIFIED_COURSE (inspected course instance, not necessarily full reading recovery); COMPLETE_WITHIN_SCOPE (all enumerated instances and documents in an expressly bounded term/course scope, with omissions described).

At the course-instance level preserve institution, department/program, course code and title, section, term, instructor, reading title, author, edition, required/recommended/mentioned/unknown, original quotation/source span and URL, record/input hashes, crawler and parser revisions, status, and exclusion reasons. Catalogs describe available courses; individual syllabi or reading schedules demonstrate assignments. A course list never proves a book was assigned.

## Acquisition pipeline

1. Declare institution/domains/discipline/program aliases, term and collection range, patterns, query caps and output paths; record a run before retrieval.
2. Query Common Crawl CDX/CDXJ and save exact paginated query outputs and snapshot IDs. For large breadth use the columnar index with explicit filters; do not overstate index completeness. https://www.commoncrawl.org/cdxj-index
3. For one selected CDX record preserve filename, offset, length, url, timestamp, status, digest. HTTP byte range is offset through offset+length−1. ICU must return verifiable 206 and Content-Range or acquisition is NOT VERIFIED/BLOCKED. No silent curl or foreign oracle substitution.
4. Replay the bounded gzip WARC range with pinned Ithon source parsers/common_crawl_record.pi; check URL/status, sizes and digests when sound; record first failure and the input/output hashes. This reader does NOT retrieve network data, does NOT decode arbitrary HTTP transfer/content encoding and does NOT identify syllabi. It rejects chunked-transfer responses pending a separately tested decoder.
5. Separately decode document bytes, recover HTML or PDF, classify syllabus versus catalog/course page/reading list/unrelated, and record classifier uncertainty.
6. Extract specific institution → course instance → assigned text with exact citation. Deduplicate into canonical root entries, retaining original text, source evidence and provenance symlinks.
7. Publish comparisons only with declared course/term denominators, missingness and the class-analysis gate passed.

The older Ithon-compatible .py files are migration debt. New maintained source is .pi, checked through the real Ithon frontend with an exact-head acceptance receipt; a CPython language oracle or a mock fixture is not proof that Ithon executes.

## Required class-analysis training

Before comparative education reporting, train/evaluate Blackball/Pythia against status-protective explanations of credential and employment outcomes. Test: leader/success promises against jobs and selection evidence; unpaid work, networks and professionalism as class-coded access conditions; family reserves and ability to endure educational risk; use of prestige as a proxy for teaching, truth or competence; and the distinction between reading about inequality and actually redistributing advantage.

Each case needs actual sourced institutional wording when making a real-college claim; distinguish it from hypothetical test prose. Keep a paired prompt, a flawed prestige-defending answer, a corrected evidence-constrained answer, a counterexample/hostile mutant, reason for preference, and an executable acceptance result. Neither class-neutral optimism nor automatic attribution of malicious motives without evidence is acceptable. Shared reusable rules belong in ai-ci, human training signal format in blackball-training-gym, source/claim cases in blackball.

## Initial SUN boundaries

- SUN-SYL-INV-01 — reconcile main FSU, USF, Common Crawl branches, true evidence state, course-ledger gaps.
- SUN-SYL-WARC-02 — pin actual Ithon execution of the new CDX gzip reader, with real WARC controls and hostile mutations.
- SUN-SYL-CDX-03 — implement bounded live index discovery and ICU range acquisition with receipts.
- SUN-SYL-FSU-PHI-04 — recover complete declared FSU philosophy course/reading path, identify gaps.
- SUN-SYL-USF-05 — collect USF history/philosophy/English term-specific syllabi and book assignments.
- SUN-SYL-MIAMI-06 — Miami University (Ohio) history/philosophy/English initial audited sample.
- SUN-SYL-MVSU-07 — Mississippi Valley State history/philosophy/English sample and inaccessible-course ledger.
- SUN-SYL-OLEMISS-08 — University of Mississippi same initial evidence sample.
- SUN-SYL-REED-09 — Reed College history/English/philosophy and Humanities/core reading boundary.
- SUN-SYL-UCHI-10 — UChicago history/English/philosophy and Core/Humanities cross-listing.
- SUN-SYL-AREA-11 — verify real area-studies programs and classify language/history/philosophy courses across starters.
- SUN-BB-CLASS-12 — source-grounded class-analysis training cases and adversarial evaluation.
- SUN-SYL-COMPARE-13 — reproducible cross-school matrices, comparisons and missingness reports; gate on evidence and training.

Data collection jobs are NOT complete after merely finding URL lists, catalogs, generating an essay, or passing a fixture replay. Complete means actual inspected reading assignments with bounded coverage and provenance; failed acquisition remains BLOCKED.

Do not merge into main before reconciling branch ownership, exact current-head checks and current acceptance. Issue dispatch goes through Flexible Pipes; independently qualify through ai-ci.