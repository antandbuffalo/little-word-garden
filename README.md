# Little Word Garden

A mobile spelling game built with plain HTML, CSS, and JavaScript modules. No framework, dependencies, or build step is needed to run it.

For future coding agents, [AGENTS.md](AGENTS.md) documents the product context, implementation map, interaction rules, level progression, storage compatibility, and verification workflow.

Answers check automatically when every gap is filled. Correct words get a short confetti celebration; incorrect letters stay visible with a red wobble and can be replaced directly. Reduced-motion preferences disable the animations.

Each word has a shuffled letter bank containing its missing letters plus 3–4 extras. Duplicate letters have separate tiles. Using a letter hides its tile; tapping a filled gap returns it to the bank. Replacing an incorrect letter also returns the previous tile. Physical keyboard input uses the same available letters, and Backspace returns a tile. “Show word” clears the gaps and restores the full bank when you try again.

The app opens with English, Maths, Science, Computer, and French. English has General (“guardian”) and Going Places (colombia, canyon, nervous, splash, arid, granite, meadow, horizon, rabin, desert). Science has two chapters: Living Things (the original ten words) and Energy (ten words, including “electrical energy”). The other subjects show a friendly empty page until chapters are added. Phrases keep their word spacing, with each word on its own row during play; only letters become gaps.

Going Places also has a separate **Words & Meanings** collection: skipped off (to move quickly or secretly), arid (dry), parched (dried out due to heat), and leap over (to move with a large jump). Its Learn view shows every full word and meaning. Practice shows a full word or phrase with three large meaning choices. Wrong answers allow gentle retries; a correct choice clears the wrong-answer highlights, shows the pair together, and waits for Next. The summary offers practice again or Back to Learn. There are no spelling gaps or levels in this activity.

Meaning progress is saved separately from spelling. A correct answer without retries marks a meaning learned; later retries never remove that achievement. The collection keeps its original `going-places-synonyms` ID and link. Existing spelling history stays saved but does not count as meaning mastery. Collections use `activity: "meanings"` to select this format; `word` stores the full word or phrase and `clue` stores its meaning.

Each spelling collection has four levels: one, two, three, then roughly half its letters missing. Short words always keep a visible letter, and Level 4 never hides fewer letters than Level 3. Finish all words in a collection without help at the current level to unlock the next. Rounds contain up to five words, favouring unattempted words before returning to tricky ones. Mistakes or hints require another independent attempt; they never remove earned mastery. Earlier levels remain replayable. Existing wins and round counts are preserved, while the new level tracking starts at Level 1 because old results did not record levels.

## Run

From this directory, run `npm run dev` and open http://localhost:5173. Python 3 runs the static server; npm is just a shortcut. You can also use any static HTTP server. JavaScript modules require HTTP rather than opening the HTML file directly.

To try it on a phone connected to the same Wi-Fi, open `http://<your-computer-LAN-IP>:5173`. Your computer must allow incoming connections to this port.

## Project structure

```text
index.html              Shared page shell and entry point
admin.html              Parent-only content entry and GitHub publishing page
assets/styles.css       Responsive styles
assets/admin.css        Admin form and review layouts
src/
  app.js                Screen navigation, game state, and event handling
  admin/                Word entry, GitHub API client, and saved token handling
  data/lessons.js        Fixed subjects and catalog lookup helpers
  data/catalog.js        Editable chapters, word collections, and clues
  game/spelling.js      Gap selection, difficulty, and round selection
  game/letter-bank.js   Shuffled letter choices and token availability
  game/levels.js        Level mastery, unlocking, and five-word round selection
  screens/
    subjects.js         Subject selection and empty/collection pages
    chapters.js         Chapter navigation and collection pages
    home.js             Welcome and lesson overview
    levels.js           Level selection and progress
    play.js             Missing-letter game
    reveal.js           Show the word and try again
    summary.js          Round results and tricky-word practice
  storage/progress.js   Device-local progress, separated by lesson
tests/                  Game and storage checks
scripts/package.mjs     Optional copy step for static hosting
```

## Add lessons, subjects, or screens

Subjects are fixed in `src/data/lessons.js`. Use the admin page below to add chapters and words, or edit `src/data/catalog.js` directly. That module must retain its header and `export default` followed by a JSON object and a semicolon; the admin reads it as data without executing downloaded code. Chapters have a stable `id`, `subjectId`, `title`, and `icon`. Word collections in `lessons` reference their chapter with `chapterId` and have a stable `id`, `title`, and `words`. Each word has `word`, `clue`, and an optional `icon`. Use lowercase alphabetic words or space-separated phrases with at least two letters for this game. Keep IDs stable so saved progress stays attached to the same collection.

The subject picker reads this catalog automatically. Every subject opens its chapter list, even when there is only one chapter. A chapter with one nonempty word collection opens its spelling overview; several collections show a collection picker. Subjects without chapters and chapters without words show empty states. Adding content requires no changes to the game logic.

Add screen markup in `src/screens/` and connect its navigation/events in `src/app.js`. Navigation uses hash URLs (`#subjects`, `#subject/science`, `#chapter/living-things`, `#lesson/school-hard-words`) so reloads, links, and browser Back work on static hosting. The original lesson link remains supported. Game rounds stay within their chapter view. No framework is required for this structure.

The default lesson retains progress saved by the original app. Other lesson IDs receive separate storage keys. Progress belongs to the current browser and device; the game needs no account.

## Checks and hosting

The repository is hosted on GitHub at `antandbuffalo/little-word-garden`, and the live app is already deployed using GitHub Pages (confirmed by the owner). Content publishing commits through the GitHub API for the existing automatic Pages deployment. The owner has asked to use the existing hosting setup without re-verifying it. Do not switch hosting providers.

Run `npm test` for game and storage checks. Node.js is needed for tests and the optional hosting copy step, not for the browser app itself.

Run `npm run package` to copy `index.html`, `admin.html`, `assets/`, and `src/` into `dist/` for static hosting. This does not compile or bundle anything. Edit source files at the project root, never the generated `dist/` folder. The optional Sites manifest points to that deployment folder.

Typography uses Google Fonts with local fallbacks.

## Admin page

Open `admin.html` or the **Add words · for grown-ups** footer link. No server or GitHub sign-in integration is needed; repository write access is authenticated by the token you enter.

1. Create a fine-grained GitHub personal access token restricted to this repository, with **Contents: Read and write**, and enter it in the admin page. **Connect & save token** saves it in localStorage under `little-word-garden-admin-token` and loads the latest content from the repository's default branch. After reopening the page, connect again to load content using the saved token.
2. Choose a subject and select or create a chapter. Existing collections are preserved; if a chapter has several collections, select one. New or empty chapters receive a default word collection.
3. Enter the clue and word in the two separate fields in a word card. Use **Add another word** for more cards, or **Remove word** to discard an extra card. Each card requires both fields; words and phrases are supported. No icons are requested or added for words. Existing icons remain intact.
4. **Review words** validates words and phrases, rejects duplicate entries, and previews the additions. **Publish words** commits only `src/data/catalog.js` through GitHub's Contents API. It uses the loaded file SHA to avoid overwriting concurrent edits. The success message links to the commit; Pages updates after the existing deployment finishes. On a conflict or uncertain network result, reconnect and review again; the typed draft is kept.

The token stays in this browser until **Clear token** is used. Clearing it also disconnects the admin without changing spelling progress. If browser storage is blocked, the page can still publish using the in-memory token and explains that it could not save it. Use a personal device: scripts on the same origin can access localStorage. Never embed tokens in source or commits. Editing and deleting existing content are outside this version's scope.
