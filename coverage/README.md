# INV-01 evidence inventory — 2026-10-13

This inventory reconciles seven exact Git snapshots. It is a source inventory and course-reading ledger, not a comprehensive college curriculum report or completed acquisition campaign. [The original assignment](https://github.com/bl4ckb4ll/syllabus/issues/23) and [FP authoring envelope](https://github.com/isomorphisms/flexible-pipes/issues/108) fix its scope.

Start with [counts.tsv](counts.tsv), [course-instances.tsv](course-instances.tsv), [assigned-readings.tsv](assigned-readings.tsv) and [summary.tsv](summary.tsv). [source-files.tsv](source-files.tsv) inventories every tracked blob or symlink in the [seven snapshots](snapshots.tsv), including files absent from main. SHA-256 describes the actual named bytes: a note/fragment hash is never a complete syllabus hash. The pinned trees contain 335 observations; shared blobs on different branches are repeated observations, not distinct syllabi.

The main bookshelf contains 102 root book/reading notes. Its 16 symlinks resolve inside the exact main tree: 14 FSU course-reading links and two poetry emotion links. A root note or symlink alone does not prove a new course assignment. All source trees, modes, blobs, lengths and hashes are checked independently through AICI.

## Course and reading evidence

Nine course-level records are normalized: two FSU philosophy instances, one partial USF education fragment, five dated electronic-music instances and one reconstructed original Clemente course. The combined FSU sections 01–02 and Ohio cross-list are each one observed document/teaching record, not two independently observed instances. Eight records are repository attestations/reconstruction; only the USF fragment retains primary course bytes. **No complete original syllabus body is retained among these nine records.** Course-population denominators remain unknown, and all nine records remain partial.

The 29 reading rows cover the core FSU/USF records. They are assignment slots, not 29 distinct books: PHI 3670 has one required anthology, 22 required chapter slots, two supplementary slots and two required Blackboard readings with unknown titles. Twelve required chapter titles have the repository's second-edition mapping evidence; ten remain unresolved. PHI 3700 contributes its anthology, with the entire selection schedule still unrecovered. USF EDG 7067 contributes Howell's book from its required-material fragment; “Canvas or Internet” is not promoted to a book. Music/Clemente source notes are indexed but their complete assignment relations have not been normalized here.

PHI 3670's Spring year remains unknown. The two FSU linked PDF documents were rechecked with a public source reader: one could not be retrieved, and PHI 3700 returned 404. [source-rechecks.tsv](source-rechecks.tsv) preserves those results separately from old source notes. No primary-source byte hash or current syllabus verification is invented, and these probes were not ICU acquisition runs.

The USF fragment lives on the parser branch and explicitly omits page chrome/policies/other material. Its manifest says Summer 2026, EDG 7067, Vonzell Agosto, section 002. This is **education**, despite the older directory name `philosophy`; it contributes no philosophy-department panel coverage. The synthetic PHI 2010 WARC has “Fixture Professor” and is excluded from observed-course counts.

## Retained search evidence and missing coverage

The earlier USF discovery branch contains 12 Common Crawl collections × four course-code prefixes = 48 saved response bodies. All contain a message object rather than a valid capture pointer. Its log labels them PASS and reports zero course URLs, but the implementation only checked JSON syntax, and final HTTP status was unavailable. [discovery-responses.tsv](discovery-responses.tsv) therefore records `MESSAGE_NOT_CAPTURE`, unknown HTTP status and unknown absence, preserving the real attempted search without accepting the old conclusion.

The [starter panel](starter-institutions.tsv) has seven named institutions × four disciplines = 28 **school/discipline cells**, not 28 courses. FSU philosophy has two documented partial instances. USF philosophy has a recorded search attempt with zero reading-bearing course instances recovered from those bytes. The other 26 cells remain unsearched in this bounded inventory; that does not establish absence. No whole degree path has an enumerated course denominator. Earlier additional institution leads remain in the [source campaign plan](https://github.com/bl4ckb4ll/syllabus/blob/c53f4f0908d41b973770081b9ee1a5a4b72123cd/planning/2026-10-12-curriculum-collection.md).

[collections.tsv](collections.tsv) keeps music, poetry/audio, Gresham lectures, original/later Clemente, world-history source maps, family reading and personal mathematics separate from starter-panel coverage. [class-rhetoric.tsv](class-rhetoric.tsv) reserves quote/span/interpretation fields. It is currently header-only because no institutional rhetoric annotation was newly source-checked in this inventory; it does not assert that the syllabi have no class rhetoric. The previously required class-analysis training lane remains mandatory before comparative reporting.

## Branch reconciliation and exact continuation

Main, book-first USF, parser, hostile convergence and collection planning remain separate. The inventory copies no old executable workflow into main and merges none of those branches. [branch-dispositions.tsv](branch-dispositions.tsv) records the ownership and retained boundaries. Common Crawl run-history templates and hostile-input SKIP receipts remain templates/skips; planned Fall 2026 acquisition and its literal 464-document assertion are not actual captured output at the inspected heads.

[next-acquisition.tsv](next-acquisition.tsv) gives exact request arguments, source owners and blocking prerequisites. These are follow-on commands to run only with the named qualified programs; no missing ICU/Grease executable, full HTTP status/range witness, current Ithon WARC execution, or accepted source route is silently substituted.

## Executable evidence

The [attempt record](../examples/autogenerated/inventory-reconciliation/attempt.md) preserves the real Idriç compiler-closure failure and Ithon comprehension failure. The inventory was generated/checked by the narrow documented Node fallback; it makes no Idriç/Ithon generator acceptance claim. The independent AICI verifier uses checked, loop-only Ithon and imports none of the generator. Eleven required assertions each have a [targeted rejection case](aici-cases.tsv); the consumer adds twelve further semantic rejection controls.

[execution.tsv](execution.tsv), [the FP pipeline receipt](execution/receipt.json) and [hosted-evidence.tsv](hosted-evidence.tsv) bind stages, digests and the exact first published head. Its independent push and explicit PR-head runs both passed all source checks and 23 rejection controls. This supersedes the earlier pre-publication PENDING observation; later heads require their own live check. An envelope and a local deterministic FP run are not registered model-stage dispatch, trusted-policy deployment, merge approval or accepted publication. Both candidates remain review-only until the missing control-plane admission and applicable review gates are satisfied.
