# Little Word Garden

A mobile spelling game built with plain HTML, CSS, and JavaScript modules. No framework, dependencies, or build step is needed to run it.

Answers check automatically when every gap is filled. Correct words get a short confetti celebration; incorrect letters stay visible with a red wobble and can be replaced directly. Reduced-motion preferences disable the animations.

The app opens with English, Maths, Science, Computer, and French. Science has two chapters: Living Things (the original ten words) and Energy (ten words, including “electrical energy”). The other subjects show a friendly empty page until chapters are added. Phrases keep their word spacing, with each word on its own row during play; only letters become gaps.

## Run

From this directory, run `npm run dev` and open http://localhost:5173. Python 3 runs the static server; npm is just a shortcut. You can also use any static HTTP server. JavaScript modules require HTTP rather than opening the HTML file directly.

To try it on a phone connected to the same Wi-Fi, open `http://<your-computer-LAN-IP>:5173`. Your computer must allow incoming connections to this port.

## Project structure

```text
index.html              Shared page shell and entry point
assets/styles.css       Responsive styles
src/
  app.js                Screen navigation, game state, and event handling
  data/lessons.js        Subjects, chapters, word collections, and clues
  game/spelling.js      Gap selection, difficulty, and round selection
  screens/
    subjects.js         Subject selection and empty/collection pages
    chapters.js         Chapter navigation and collection pages
    home.js             Welcome and lesson overview
    play.js             Missing-letter game
    reveal.js           Show the word and try again
    summary.js          Round results and tricky-word practice
  storage/progress.js   Device-local progress, separated by lesson
tests/                  Game and storage checks
scripts/package.mjs     Optional copy step for static hosting
```

## Add lessons, subjects, or screens

Add a subject to `subjects` in `src/data/lessons.js`, then add chapters to `chapters` with a stable `id`, `subjectId`, `title`, and `icon`. Add word collections to `lessons`, referencing their chapter with `chapterId`. Each collection has a stable `id`, `title`, and `words`. Each word has `word`, `clue`, and `icon` fields. Use lowercase alphabetic words or space-separated phrases with at least two letters for this game. Keep IDs stable so saved progress stays attached to the same collection.

The subject picker reads this catalog automatically. Every subject opens its chapter list, even when there is only one chapter. A chapter with one nonempty word collection opens its spelling overview; several collections show a collection picker. Subjects without chapters and chapters without words show empty states. Adding content requires no changes to the game logic.

Add screen markup in `src/screens/` and connect its navigation/events in `src/app.js`. Navigation uses hash URLs (`#subjects`, `#subject/science`, `#chapter/living-things`, `#lesson/school-hard-words`) so reloads, links, and browser Back work on static hosting. The original lesson link remains supported. Game rounds stay within their chapter view. No framework is required for this structure.

The default lesson retains progress saved by the original app. Other lesson IDs receive separate storage keys. Progress belongs to the current browser and device; the game needs no account.

## Checks and hosting

Run `npm test` for game and storage checks. Node.js is needed for tests and the optional hosting copy step, not for the browser app itself.

Run `npm run package` to copy `index.html`, `assets/`, and `src/` into `dist/` for static hosting. This does not compile or bundle anything. Edit source files at the project root, never the generated `dist/` folder. The existing Sites manifest points to that deployment folder.

Typography uses Google Fonts with local fallbacks.
