# Blackball Reading Room

The Reading Room opens a work at a place a student was assigned to read. The shelf starts with one text and one listening action. The book detail page holds the rest of the editions, recordings and lecture links. The browser can run the shelf with a static server. Reading and listening positions, notes and manual completion live in the browser.

## Run and edit

From the root of the syllabus checkout, serve `reading-room/web` with `python3 -m http.server 8000 --directory reading-room/web`. Open http://localhost:8000/ in a browser. Run `node reading-room/source/check-shelf.mjs` to check the tables and the digests of the reader texts. The JavaScript and CSS are the code served to the browser. Edit them directly.

- `web/app.js` reads the data, opens work and comparison pages, keeps reading state, and renders the text and audio players.
- `web/paths.js` renders the course chooser. A documented choice between sections uses a radio group. Ordinary lists let the reader select courses independently.
- `web/index.html` and `web/style.css` own the page structure and visual treatment.
- `source/prepare_texts.py` renders public-domain input into section and paragraph records. `source/verify_text_coverage.py` independently checks the selected source bodies.

## How the data reaches the interface

| File under web/data | What a row says |
| --- | --- |
| courses.tsv | One offering by instructor and term, with the source, program context and coverage stated separately. |
| course-context.tsv | Department, review status and optional requirement slot. A listed course can have unknown readings. |
| slots.tsv | The specific rule and dated evidence used to offer a choice of sections. |
| assignments.tsv | An observed work in the scope stated for a course. Keep the actual chapters, pages, assigned edition and source locator. |
| supplements.tsv | An additional assigned work reachable from a parent work. Cohn's Toews introduction is outside the five-title reserve list used in the comparison. |
| works.tsv | Identity of a work across courses and editions. Use the same work ID across offerings. |
| reading-starts.tsv | A course-specific reading link chosen to start at the assigned text. The full inventory is in copies.tsv. |
| copies.tsv | A distinct provider access route with its format, edition, limits and supporting URL. A book sample, a library loan and a lecture are different actions. |
| recordings.tsv, tracks.tsv, recording-mirrors.tsv, recording-cues.tsv | A distinct narrator or production, its ordered tracks, and alternate hosts for that same recording, and checked timestamps used to open directly at assigned text. |
| source-status.tsv | What the acquisition or parser actually established, including pending and blocked stages. |

A comparison joins assignment rows by work ID. The same work can have a different assigned portion or translation in each section. For Grinnell Fall 2022, each side uses seven named schedule items, including every separately listed required book. The shared item is John Arnold’s *History: A Very Short Introduction*. Maynard assigns chapters 1–7 across several sessions. Purcell assigns chapters 4–7.

On a course with an unknown list, the comparison leaves the result indeterminate. Try the official Fall 2014 listing for HIS 100-01, *After the Great War*. A public syllabus with a similar title is from Fall 2020. The term is part of the identity, so that PDF cannot fill the Fall 2014 gap. The Grinnell evidence table gives the two sources.

## Correct an example

Blight’s schedule lists Foner’s *A Short History of Reconstruction*. The related full-length history is a different work. Keep the *Short History* work ID in the assignment and use the session pages for the chapter and page ranges. Add a new copy to that work only after opening its sample or confirming the catalog identifies the same title. A recording of Foner explaining Reconstruction belongs in the interview or lecture routes. Rerun the check and open the two details pages to confirm the reading and audio actions.

To add an offering, keep the syllabus repository’s existing acquisition convention. Original-byte capture through ICU, orchestration through Grease and checked-Ithon extraction are distinct stages. A review of an official page can supply a source locator for the interface while its capture and extraction remain pending. The root-level syllabus bookshelf and its instructor and term links remain the source of record for admitted assignments.

## Reader assets

The built-in texts are generated data in `web/text`, loaded only when opened. The provenance TSV records the exact upstream Git blob, SHA-256, catalog record and scope of the work. Obtain inputs from those pinned sources under the names listed in the table. With Python and lxml installed, run `python3 reading-room/source/rebuild_texts.py INPUT_DIRECTORY reading-room/web/text`. It runs the extractors, checks source and output, and combines their provenance records. Opening, downloading or hearing a copy is independent of the reader’s explicit completion mark.
