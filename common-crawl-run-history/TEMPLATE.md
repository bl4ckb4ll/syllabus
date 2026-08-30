# Common Crawl run: <short title>

- **Date:** YYYY-MM-DD
- **Run ID:** <stable identifier>
- **Status:** completed | interrupted | failed
- **Coverage class:** exhaustive_within_declared_scope | systematic_but_incomplete | targeted | sampled | exploratory | failed_before_search
- **Repository commit:** <commit SHA containing the search code/configuration>
- **Hostile-input corpus revision:** <semantic revision and exact ai-ci commit SHA>
- **Implementation-under-test revision:** <exact commit SHA and executable hash>
- **Oracle revision:** <exact curl/WARC/HTML implementation versions and hashes>
- **Stage receipt artifact:** <stable path or artifact identifier>

## Question

What exactly was this run trying to find out or collect?

## Data source

- **Common Crawl collection(s):**
- **Index/dataset:** CDX index | URL Index | WARC | WET | other
- **Snapshot identifiers / files / partitions:**
- **Access date:**

## Declared scope

- **Hosts/domains:**
- **URL/path patterns:**
- **Date range:**
- **MIME/content types:**
- **HTTP status filters:**
- **Language filters:**
- **Index pages/partitions/ranges:**
- **Record/result/byte limits:** none | <exact limits>
- **Other inclusion rules:**
- **Other exclusion rules:**

## Exact procedure

Record enough detail for another person to repeat the run.

### Queries

```text
<exact queries sent to Common Crawl or generated for the run>
```

### Commands

```sh
<exact commands>
```

### Code and configuration

- **Script/program:**
- **Commit SHA:**
- **Important options:**
- **Dependencies or tool versions that affect results:**
- **Manual steps:** none | <describe>

## Stage counts

Use `unknown` rather than guessing.

| Stage | Count |
| --- | ---: |
| Index records returned | unknown |
| Records examined | unknown |
| Candidate documents | unknown |
| Documents requested | unknown |
| Documents retrieved | unknown |
| Retrieval failures | unknown |
| Parse successes | unknown |
| Parse failures | unknown |
| Syllabi accepted | unknown |
| Non-syllabi rejected | unknown |
| Ambiguous documents | unknown |
| Duplicates | unknown |
| Unique syllabi retained | unknown |

## Checked stage receipt

Use only `PASS`, `FAIL`, or `SKIP`. `SKIP` means the stage did not execute. A
candidate count is meaningful only when every applicable upstream stage passed.

| Stage | Result | Code / evidence owner |
| --- | --- | --- |
| Input acquisition | SKIP | not recorded yet |
| Network / HTTP / TLS | SKIP | not recorded yet |
| Decompression | SKIP | not recorded yet |
| Byte-to-text decoding | SKIP | not recorded yet |
| HTML recovery | SKIP | not recorded yet |
| Document construction | SKIP | not recorded yet |
| Downstream extraction | SKIP | not recorded yet |

- **First real failure:** none | <stage>
- **First incomplete stage:** <stage> | none
- **Oracle fallback:** none

## Findings

State what the run actually established. Distinguish observations from inference.

## Confidence

### Coverage confidence: high | medium | low

Why is this level justified? Was every declared page/partition/range enumerated? Were there caps or known blind spots?

### Execution confidence: high | medium | low

Did every stage complete? Were pagination, rate limits, network failures, parser errors, and silent truncation checked?

### Classification confidence: high | medium | low

How were syllabi distinguished from course pages, catalogs, reading lists, CVs, departmental documents, and other false positives? Was any sample manually checked?

## Failure boundaries and omissions

List anything the result cannot rule out, including:

- crawl snapshots not searched;
- domains or subdomains omitted;
- URL forms not matched;
- document formats not parsed;
- robots/archive gaps or documents absent from Common Crawl;
- failed retrievals;
- classifier uncertainty;
- limits imposed for cost or time;
- anything discovered after the run that would change its interpretation.

## Negative-result wording

If the run found nothing, write the strongest bounded statement the evidence supports. Do not silently turn a targeted or sampled search into a claim about all of Common Crawl.

## Artifacts

- **Raw query/index output:**
- **Candidate list:**
- **Retrieved-document manifest:**
- **Classifier output:**
- **Hashes/checksums:**
- **Logs:**

Use paths, content hashes, or stable external identifiers rather than relying on transient local filenames alone.

## Next search

What would most increase coverage or resolve the main uncertainty left by this run?
