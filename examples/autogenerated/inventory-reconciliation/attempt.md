# INV-01: count and reconcile source evidence

The result is an inventory of observed source records, not proof of complete college coverage.

## Type sketch before implementation

- A course instance identifies institution, discipline, code, section, instructor and term. Unknown section/year stays `unknown`; two different terms are different instances.
- A source document identifies repository revision, path, Git blob and SHA-256. A SHA-256 of a note or partial fixture is never the hash of its referenced complete syllabus.
- Evidence roles: primary captured fragment, repository source note, synthetic replay, catalog/discovery, receipt template. Only the first two can support a documented reading relation; synthetic replay cannot increase observed-course coverage.
- Assignment relation: course instance → source citation → reading. Required, supplementary and unresolved are distinct. Title/edition normalization preserves disagreement and unavailable mappings.
- `count_data_rows : Text → Number` counts nonempty rows after a header. The first Idriç slice reads a real TSV and reports that number; it does not yet validate the evidence semantics.
- Desired `reconcile : SourceSnapshots → Either InventoryError CourseLedger`; `verify : SourceSnapshots → CourseLedger → Either InventoryError InventoryCounts`.
- File reading, Git object access, SHA-256, symlink resolution and writing TSV/Markdown are effects. Counting/classification are pure. The build/check actions require exact pinned Git snapshots; they make no network requests.
- Invariants: retained source hashes match; synthetic courses never count as observed; unknown term/reading is retained; no absence claim follows failed/unverified acquisition; no complete cell without a declared denominator; quotation-supported rhetoric remains separate from assignments.
- Needed facilities: UTF-8 file I/O, TSV parsing, subprocess Git inspection, SHA-256, filesystem/symlink inspection. Host is the disposable Linux workspace; no device compilation.

## Attempt and fallback evidence

Canonical compiler checkout: isomorphisms/Idric `2734ac5a86610eddfab73b1644d72b4ac85a65ee`. Read its STYLE and intent examples before source.

Attempt source: `count-source-records.idric`. Invoked the actual root `edric --emit-one-step count-source-records.idric -o count-source-records.anf` entrypoint in the pinned checkout. Exit 2: `Idriç one-step emitter: compiler is not bootstrapped; run ./_/edric bootstrap`. No frontend/source verdict, emitted artifact or Idriç runtime result was produced. This is missing local compiler closure, not proof of a language defect. No compiler installation, generated-C/RefC or backend substitution was performed.

The attempted inventory generator/checker is preserved as `inventory.pi`. It did **not** execute: main Ithon `396d8b7af1417a0a61245db940fdb22ef9fbac51` rejected typed varargs and foreign indexing; the retained FP2 host frontend `d6e83969f82512e920fb17b44326cb54f31d015c` still rejects dictionary comprehensions (`cannot infer static type of DictComp`). Corrections before that failure are retained. Native Ithon is absent. No frontend was bypassed, and no direct lowering to a Python oracle was performed.

The narrow fallback `inventory.js` runs using the workspace's already available Node runtime. Its input/output contract is the same Git-snapshot → TSV inventory/check interface. It performs no network acquisition, installs no dependency, and does not count as Idriç or Ithon acceptance. It preserves all original-source identity and synthetic/partial evidence distinctions. This fallback is permitted by the Idriç-first skill only because the actual compiler/frontend blockers were first exposed and preserved.

Next language work: Ithon should infer dictionary/list/set comprehensions from a statically known iterable and bindings, reject undefined comprehension names and incompatible key/value types, and preserve outer scope. Idriç needs its real installed compiler closure before this task can test language features. Do not call either language path successful from fallback results.

Smallest next acceptance: compile the row counter through the pinned canonical frontend, execute on a header-only TSV and a three-row TSV, then qualify Git/file/hash operations before replacing the Ithon inventory path.
