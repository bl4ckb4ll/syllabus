# Try the work of a college course

From the syllabus checkout, run `node reading-room/study/serve.mjs` with Node 20 or later. Open [Open courses](http://127.0.0.1:8000/#open). A reader can browse, open a lecture or passage, ask about it, and decide whether to try one session. The page for a book on the original shelf also links to its guide and study plan.

For example, open Homer’s *Iliad*. Read the quarrel in book I and try the Open University activity. A reader who finishes the passage may still want to stop. Someone who reads a few lines may want another evening with it. They can record both answers and what they would want to ask in a classroom. Opening a page, reading a summary, elapsed time and missed reminders never create a completion mark.

## Catalogue coverage on November 25, 2026

| Publication | Individually indexed | Scope |
| --- | ---: | --- |
| The Open University, OpenLearn | 952 | All nine subjects. The 53 full-catalogue pages yielded 945 distinct course destinations after excluding a maintenance page. The subject catalogues supplied seven more. The paginated views displayed totals of 952 or 953. |
| Open Yale Courses | 40 | Every offering in the published course table. Both years of Robert Shiller’s *Financial Markets* have separate entries. |
| Yale courses moved to Coursera | 2 | Both moves identified by Yale, with the destination offering linked. |
| HarvardX on edX | 32 | The offerings displayed on the partner page. CS50 also has a direct Harvard study route. |
| NPTEL, India | 1,054 | Rows 12–1,065 of the published Main sheet for July–December 2026. Each row links to the semester preview and the continuing NPTEL course page supplied in the sheet. |
| MIT OpenCourseWare | 1 | Arthur Bahr’s *Homer to Dante*, joined to the existing shelf and its reading and writing assignments. |
| The Open University on FutureLearn | 1 | The platform offering of *Start Writing Fiction*. OpenLearn has its own entry and access terms. |

The [course table](../web/data/open-courses.tsv) and [NPTEL table](../web/data/open-courses-nptel.tsv) contain 2,082 offerings. The [provider index](../web/data/open-providers.tsv) links to wider catalogues, including Class Central, SWAYAM and France Université Numérique. Search results link to a wider search on Class Central. A reader can add any other course or book URL to a private plan. Worldwide coverage is open-ended.

The index records published offerings and their source locations. Check the individual provider page for enrollment, availability of particular readings, costs and the length of a free audit. [Dated access observations](../web/data/open-access.tsv) cover the edX sale, Harvard Online, a directly published Harvard course and two Yale migrations. Comparing teaching quality across twenty years would require a matched set of old and current lectures and assignments, plus an explicit basis for judging them.

## Inspect or correct a listing

Each course row points to its provider listing. The OpenLearn [page ledger](../web/data/openlearn-pages.tsv) gives the displayed total, row count and maintenance-row count for each full-catalogue page. The seven additional entries point directly to their subject catalogue pages. Compare destinations across adjacent pages when a provider changes its list during a review. A title or translation can occur on more than one platform.

Preserve a course ID when correcting a title or access route. Private journals refer to that ID. A newly observed run can have its own ID. Add a dated record when a course moves or its public materials change. Describe exactly what a visitor can open, including whether an account is needed to read, watch, attempt an exercise or get feedback. The course index records source locators reviewed on public pages. Admission of assigned readings from original bytes continues through the acquisition and replay stages described in [the syllabus parser documentation](../../parsers/README.md).

To regenerate the India semester table, export the Main sheet as tab-separated values from [NPTEL’s published course list](https://docs.google.com/spreadsheets/d/e/2PACX-1vT0VPb0_8Klf6b_vmnf2xeMF0eb79YX3rmIuZjuxxlkGA7Kadg_WLLatyIM1c9QQ1PZQPZvSjL3FKhB/pubhtml?gid=0). NPTEL links to it under [Current Semester Details](https://nptel.ac.in/localchapter). The importer checks the named columns and refuses duplicate offering codes.

```text
node reading-room/source/import-nptel.mjs MAIN_SHEET.tsv 'July–December 2026' 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0VPb0_8Klf6b_vmnf2xeMF0eb79YX3rmIuZjuxxlkGA7Kadg_WLLatyIM1c9QQ1PZQPZvSjL3FKhB/pubhtml?gid=0'
```

## Reader profiles and reminders

Create a profile with a name or nickname. Keep the private reader key to reopen it on a browser connected to the same service. A name can belong to several people. Only the key opens the journal. Browser positions and the old local reading log use a separate browser storage key for each signed-in profile. Earlier device-only entries are still available when signed out. The study journal is shared between the browser and the plain-text interface.

The service binds to loopback. An operator can set `STUDY_HOME` to a private directory. The default is `~/.local/state/blackball-study`. Each reader has a directory named by the digest of their key, a name file and a series of numbered TSV files. A record contains the incoming message ID, timestamp, action, item, value and note. A tab or newline inside a note is escaped. A new journal entry is written in full and admitted with an exclusive hard link. Simultaneous writers that choose the same sequence number reload and retry. The filesystem must support hard links. Back up the profile directory to preserve the journal.

The input adapter follows the [SMS Book Reader’s plain-text POST interface](https://github.com/Ashtray-Archer/sms-book-reader/blob/3ef8aa7896fec64c0e29572ae8f325219df2bb64/README.md). For study commands, POST the command body to `/jog/PROFILE_ID`, with `Authorization: Bearer READER_KEY` and an `Idempotency-Key` containing the gateway’s original message ID. The profile ID is returned with the profile in the service response. The gateway keeps the correspondence between phone numbers and profiles. The web service also checks that a browser edit belongs to its active profile.

| Text command | Result |
| --- | --- |
| `FIND Dante` | Up to three matching titles with IDs. |
| `ABOUT book-inferno` or `ASK book-inferno Who is speaking?` | Background with a source. |
| `PLAN book-inferno Read canto I` | Save the chosen task. |
| `CHECK book-inferno part I reached Virgil` | Record what happened. The other report values are `unread` and `done`. |
| `CONTINUE book-inferno Read canto II` | Name the next task. An earlier report stays in the history for its own task. |
| `PAUSE book-inferno` or `STOP book-inferno` | Record the decision and cancel its pending reminder. |
| `REMIND book-inferno 2027-01-15T19:00:00-05:00` | Request one check-in. The browser accepts local date and time. A new reminder replaces the previous one. |
| `CLEAR book-inferno` | Cancel the reminder. |
| `ADD https://example.org/seminar A seminar` | Save a private outside link and return its plan ID. |
| `STATUS` | See chosen tasks, reports, decisions and reminders. |

Run `node reading-room/study/serve.mjs due` to list due reminders. An operator with an SMS transport can run `node reading-room/study/serve.mjs deliver /absolute/path/to/sender` periodically. The sender receives the profile ID and reminder ID as arguments, and the message on standard input. It must acknowledge with exit code zero after accepting a message and deduplicate by **profile ID and reminder ID** on retry. A failed handoff stays pending. A new check-in clears the old reminder. No carrier account, phone number or delivery schedule is configured by this repository.

## Questions and source summaries

A topic question can lead to several readings. Questions about a particular work use its course references, [short guides](../web/data/study-guides.tsv) and the reader’s selected section when an edition is available. The guide identifies an excerpt when a section exceeds 5,200 characters. The reader can open every source and set a different passage. Related reading links are editorial suggestions. The existing assignment tables establish which works the instructor assigned.

The default returns labeled source notes. For generated answers set `STUDY_MODEL_URL` to a chat-completions endpoint and `STUDY_MODEL` to that server’s model name. `STUDY_MODEL_KEY` is optional. The service sends the question, up to two earlier questions about that item, and numbered public source passages. Profile keys, journals and reminder records stay on the study server. A model failure or an answer without valid source numbers falls back to source notes. Citation numbers link back to evidence. They do not certify that a model interpreted it correctly.

Run `node --test reading-room/source/check-open-study.mjs` for the catalogue, private journals, text interface, transport retry and model response boundary. Run `node reading-room/source/check-shelf.mjs` for the original shelf.
