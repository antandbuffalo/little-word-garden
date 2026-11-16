# Little Word Garden: agent context

Read this file and [README.md](README.md) before making changes. This file describes the current product decisions and implementation; adapt them when the user requests a change.

## Purpose and audience

A spelling practice web app for the user's seven-year-old daughter, used independently on a mobile phone. The user supplies hard words from school lessons. Keep interactions simple, touch targets large, instructions short, and feedback encouraging.

Spelling collections use missing letters supported by a clue. Collections with `activity: "meanings"` show full word–meaning pairs in a Learn view followed by choosing the meaning. Audio dictation was deliberately left out of this version. There are no timers, lives, leaderboards, accounts, or server-side storage.

## Repository and stack

- The Git repository is this `little-word-garden/` directory; the enclosing workspace is named `word-game/`.
- Plain HTML, CSS, and browser JavaScript modules; no React, framework, or npm dependencies.
- Run source files directly through HTTP. No build or dependency installation is required for development.
- `npm run dev`: Python 3 static server at port 5173, bound to all interfaces for phone testing on the same Wi-Fi.
- `npm test`: Node's built-in test runner.
- `npm run package`: copies website source to ignored `dist/` for hosting. It does not compile or bundle code.
- Edit source, never generated `dist/`. Keep `.gitignore` exclusions for output, dependencies, local secrets, and logs.

## Where changes belong

- `src/data/lessons.js`: fixed subjects, re-exported catalog arrays, and lookup helpers.
- `src/data/catalog.js`: editable chapters and word collections. Keep its exact header and JSON-after-`export default` format for the admin parser; never evaluate source loaded from GitHub. Preserve IDs and existing words when editing.
- `admin.html`, `src/admin/`, `assets/admin.css`: parent content entry, card validation, GitHub API publishing, and saved token controls.
- `src/app.js`: navigation, active spelling state, DOM events, and saving progress.
- `src/meanings.js`, `src/game/meanings.js`, `src/screens/meanings.js`: meaning activity state/events, choices/mastery, and Learn/practice/summary rendering.
- `src/game/spelling.js`: gap generation, shuffling, round selection, and answer checking.
- `src/game/letter-bank.js`: bank generation and tracking individual letter tokens.
- `src/game/levels.js`: mastery, level unlocking, and selecting pending words.
- `src/screens/`: rendering functions that return HTML. `levels.js` renders the level picker; `home.js` renders a chapter collection overview.
- `src/storage/progress.js`: localStorage access and graceful storage failure handling.
- `assets/styles.css`: shared mobile layouts, feedback animations, and reduced-motion support.
- `tests/`: game, token inventory, level progression, storage compatibility, and screen rendering checks.

## Content and navigation

The hierarchy is **subject → chapter → word collection → level → spelling round**. A chapter with one collection opens its overview directly; the chapter step is always shown after selecting a subject.

Subjects: English, Maths, Science, Computer, French. English and Science currently have content:

- **General** (English), chapter ID `general`, collection ID `general-words`: guardian.
- **Going Places** (English), chapter ID `going-places`, collection ID `going-places-words`: colombia, canyon, nervous, splash, arid, granite, meadow, horizon, rabin, desert.
- The same **Going Places** chapter also has **Words & Meanings**, stable collection ID `going-places-synonyms`, `activity: "meanings"`: skipped off, arid, parched, leap over. `word` is shown in full and `clue` stores its meaning. Opening this chapter shows both collections.
- **Living Things**, chapter ID `living-things`, collection ID `school-hard-words`: skeleton, muscles, organs, contracts, locust, dolphin, lizard, diseases, germs, medicines.
- **Energy**, chapter ID `energy`, collection ID `energy-hard-words`: breathe, electrical energy, environment, consumer, producer, herbivores, carnivores, omnivores, predators, prey.

Other subjects show friendly empty states. Do not invent school content just to fill them.

Subjects have stable `id` values; chapters reference `subjectId`; collections reference `chapterId`. Word entries contain lowercase `word`, `clue`, and an optional `icon`. Existing icons are retained; admin additions do not require icons. Render entered clues and chapter titles as escaped text. Phrases are supported: only alphabetic positions become gaps, spaces stay intact, and each word in a phrase has its own tile row. The current input bank supports English a–z; adding actual French vocabulary with accents will require extending character handling and tests.

Navigation uses static-host-friendly hashes: `#subjects`, `#subject/science`, `#chapter/living-things`, `#chapter/energy`, and `#lesson/<collection-id>`. Preserve reloads, deep links, and browser Back behavior when changing navigation.

## Interaction rules

- Use a small shuffled bank containing all required missing letters, including duplicates, plus 3–4 extra letters. Do not restore a full on-screen keyboard unless requested.
- Each letter tile has its own ID. Using it hides that token; tapping a filled gap returns it. Replacing a letter also releases the previous token. A used token cannot fill two gaps.
- Physical keyboard input draws from the same available bank. Backspace returns a token.
- Check automatically only when every gap is filled. There is no manual check button.
- Correct answers show confetti and a Next button; wait for the child to advance.
- Incorrect letters stay visible with red wobble feedback; retain correct letters and allow gentle retries.
- Show word reveals the answer; trying again clears the gaps and restores the bank. Using help or making a mistake marks that attempt as helped.
- Respect reduced-motion preferences and keep controls and feedback accessible.

## Levels and saved progress

Words & Meanings has no spelling gaps or levels. Learn lists every pair; practice shuffles all pairs with the correct meaning plus up to two distinct meanings from the same collection as alternatives. Wrong choices are disabled with gentle retry feedback. A correct choice clears wrong-answer highlights, shows the full pair, and waits for Next. The summary lists all pairs and offers practice again or Back to Learn.

Each spelling collection has four levels: 1, 2, and 3 missing letters, then roughly half the letters. Always leave at least one visible letter; Level 4 must not become easier than Level 3 for short words.

Rounds contain up to five words. At an incomplete level, unattempted words come before attempted but unmastered words; mastered words are excluded. Thus a ten-word collection is covered in two rounds, with extra practice for tricky words. A correct attempt without help masters that word at that level. All words must be mastered to unlock the next level. Earlier levels remain replayable, and later mistakes must never remove earned mastery. No Level 5 exists.

Progress is local to the browser/device and stored separately per collection:

- Original collection: `little-word-garden-v1`.
- Other collections: `little-word-garden-v1:<collection-id>`.
- Stored object: `{ progress, rounds }`.
- `progress[word]` may contain legacy `wins`, previous `gaps`, and `levels[level]` with `{ attempted, mastered }`.
- Meaning collections store `progress[word].meaning` with `{ attempted, mastered }`. An independent correct choice masters the meaning; retries never remove mastery. Legacy spelling records are retained but do not count as meaning mastery. The collection ID and storage key stay unchanged; `rounds` increments on completed meaning rounds. Storage failure does not block practice and is reported in Learn/summary.

Keep collection IDs and word keys stable to preserve saved progress. Old wins and round counts remain intact, but old wins do not imply mastery at a new explicit level. Storage failure should not prevent play. On reopening a collection, select its highest unlocked level.

## Verification and handoff

Run `npm test` for behavior changes and `npm run package` when changing website source or packaging. Verify the affected navigation and interaction flow; pay particular attention to duplicate tokens, phrases, retries, level unlocking, replay, and persistence when applicable. Check mobile layout in a browser when available; rendering tests alone do not verify visual appearance. Report any verification limits honestly.

The repository is on GitHub at `antandbuffalo/little-word-garden`; the owner confirmed the live app is already deployed on GitHub Pages. Content publishing commits via the GitHub API for the existing automatic Pages deployment. Use that setup without re-verifying hosting, as requested by the owner. Do not switch hosting providers.

The optional Sites manifest is `.openai/hosting.json`. It points to `dist/` and is not the confirmed live hosting provider. Previous Sites publishing and browser-preview attempts were blocked by the execution environment; a manifest or successful packaging command is not evidence of a live deployment. Keep hosting identity intact and consult the applicable Sites workflow if Sites publishing is requested.

## Admin page

`admin.html` is linked from the game footer. Subjects are fixed. The owner can select or create a chapter, select an existing collection when needed, and add several words using cards with separate clue and word fields (clue first). **Add another word** appends a card and focuses its clue; **Remove word** removes extra cards while keeping at least one. Both fields are required. Adding/removing cards invalidates the review, and successful publishing resets the form to one empty card. No word icon field is required. New/empty chapters get a default collection. Review validates additions and rejects duplicate spellings in the selected collection. Existing content, IDs, and game progress remain intact. Editing/deleting existing content is outside this version's scope.

The owner explicitly requested saving a manually entered GitHub personal access token in localStorage. Store it under `little-word-garden-admin-token`, restore the masked input on reopening, and provide **Clear token** to delete it and disconnect. Do not clear game progress. If storage fails, fall back to memory and report the limitation. Never embed tokens in source, commits, URLs, logs, or errors. Explain in the UI that the token is saved on this device.

Use a fine-grained token restricted to this repository with Contents read/write permission. Connect loads the latest catalog and file SHA from the repository default branch. Publish writes only `src/data/catalog.js` through GitHub's Contents API using that SHA; conflicts and uncertain outcomes require reconnecting and reviewing again while retaining the typed draft. Preview invalidates when the form changes. Success links to the commit and explains that Pages deployment takes time; it does not claim deployment was observed. Packaging includes `admin.html`.

Update this file and the README when product behavior, commands, content organization, or storage contracts change. Commit or push when the user asks; do not assume a code-change request also requests a commit or push.
