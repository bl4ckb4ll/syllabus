# common crawl results pertinent to universities

Store only Common Crawl material that is relevant to university/course discovery: bounded index result sets, WARC record pointers, fetched WARC segments when practical, and machine outputs that make the searched scope replayable.

A statement such as “checked Common Crawl” is meaningless without a declared boundary. For every run, preserve in `crawling log/`:

- collection/snapshot identifiers;
- hosts/domains and URL/path filters;
- MIME/status/date/language filters;
- enumerated pages/partitions/ranges;
- result/byte caps;
- counts at each stage;
- exact parser/query commits;
- whether coverage was exhaustive-within-scope, systematic-but-incomplete, targeted, sampled, exploratory, or failed-before-search.

Negative results only support the declared scope. WARC replay is the preferred long-term oracle: once bytes have been captured, parser validation should be offline and deterministic.
