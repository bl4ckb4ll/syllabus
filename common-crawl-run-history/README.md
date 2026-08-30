# Common Crawl run history

Common Crawl is too large for an unqualified statement such as “I checked Common Crawl” to mean much. This directory records what was actually searched, how it was searched, how completely the declared scope was covered, and what conclusions the run can and cannot support.

The goal is reproducibility and bounded claims, not bureaucratic logging.

## One file per run

Name completed run records approximately:

`YYYY-MM-DD_<crawl-or-range>_<short-purpose>.md`

A run record should be written even when it returns no useful syllabi, is interrupted, or fails. A negative result is useful only when its search boundary is preserved.

## Required information

Every run record should say:

- **Question** — what the run was trying to learn or collect.
- **Status** — completed, interrupted, or failed.
- **Data source** — exact Common Crawl collection(s), index/dataset used, and relevant snapshot identifiers.
- **Declared scope** — domains/hosts, URL/path filters, date range, MIME/content types, HTTP-status filters, language filters, partitions/pages/ranges, and any result or byte limits.
- **Exact procedure** — commands, queries, scripts, script commit SHA, important options, and anything done manually.
- **Counts** — records examined, candidate documents, retrieved documents, parse failures, classified syllabi, duplicates, and other useful stage counts when available.
- **Coverage class** — one of the classes below.
- **Confidence notes** — separate coverage, execution, and classification confidence, with reasons.
- **Findings** — what was found, including useful negative findings.
- **Failure boundaries / omissions** — what was not searched or what could have been missed.
- **Next search** — the most useful extension or correction, if there is one.

## Coverage classes

Use the strongest description that is actually justified.

### `exhaustive_within_declared_scope`

Every record in the explicitly declared bounded search space was enumerated and processed, including all pages/partitions/ranges required by the query. This does **not** mean “all of Common Crawl.”

### `systematic_but_incomplete`

The run followed a repeatable broad procedure, but some known part of the declared or intended space was not covered: for example a subset of crawl snapshots, file types, domains, index partitions, or retrieval failures.

### `targeted`

The run deliberately searched a narrow set of likely locations, names, domains, URL patterns, course codes, or document forms. Useful for discovery; weak evidence for absence outside those targets.

### `sampled`

The run examined a sample rather than attempting full enumeration. Record how the sample was selected and its size.

### `exploratory`

Ad hoc probes intended to learn the shape of the data or improve later queries. These runs should not support broad absence claims.

### `failed_before_search`

The intended search did not reach a point where its result set can be interpreted.

## Confidence

Do not collapse confidence into one number.

- **Coverage confidence** — confidence that the declared search space was actually covered as stated.
- **Execution confidence** — confidence that the queries/scripts completed correctly and that truncation, pagination, rate limits, parser failures, or similar problems did not silently invalidate the run.
- **Classification confidence** — confidence that documents labeled as syllabi (or rejected as non-syllabi) were classified correctly.

Use plain descriptions such as `high`, `medium`, or `low` together with the evidence for the judgment. Do not invent numerical probabilities. Numerical confidence/accuracy belongs here only when it comes from a measured or calibrated procedure.

## Negative findings

Prefer statements such as:

> No candidate syllabus URLs were returned for the declared host/path query across all enumerated index pages in CC-MAIN-YYYY-NN.

or:

> The targeted search found no syllabus for COURSE-123, but it checked only URLs matching the listed patterns and cannot rule out differently named or unindexed documents.

Avoid:

> Common Crawl has nothing for this course.

unless a future procedure genuinely establishes a scope broad enough to justify that claim.

See `TEMPLATE.md` for the run-record skeleton.
