import { meaningRound, recordMeaningAttempt } from './game/meanings.js?v=1794964464226';
import { meaningLearnScreen, meaningPlayScreen, meaningSummaryScreen } from './screens/meanings.js?v=1794964464226';
import { chapterNavigation } from './screens/chapters.js?v=1794964464226';

export function openMeanings({ main, lesson, chapter, subject, store }) {
  let { progress, rounds } = store.load();
  let round = [], index = 0, wrong = [], solved = false, results = [], storageAvailable = true;
  const navigation = chapterNavigation(subject, chapter) + `<a class="meaning-collections" href="#chapter/${chapter.id}">← Choose a collection</a>`;
  const persist = () => { storageAvailable = store.save({ progress, rounds }); };
  function show(html, focusId) {
    main.innerHTML = navigation + html;
    main.querySelector('#meaning-start')?.addEventListener('click', start);
    main.querySelector('#meaning-learn')?.addEventListener('click', learn);
    if (focusId) main.querySelector(`#${focusId}`)?.focus({ preventScroll: true });
  }
  function learn() {
    show(meaningLearnScreen({ lesson, progress, storageAvailable }));
  }
  function start() {
    round = meaningRound(lesson.words); index = 0; results = []; wrong = []; solved = false;
    play('meaning-word');
  }
  function play(focusId) {
    show(meaningPlayScreen({ question: round[index], index, total: round.length, wrong, solved }), focusId);
    main.querySelectorAll('[data-meaning-choice]').forEach(button => button.addEventListener('click', () => {
      const choice = Number(button.dataset.meaningChoice);
      if (solved || wrong.includes(choice)) return;
      const question = round[index];
      if (question.choices[choice] !== question.item.clue) {
        wrong.push(choice);
        progress = recordMeaningAttempt(progress, question.item.word, true); persist();
        play();
        main.querySelector('[data-meaning-choice]:not(:disabled)')?.focus({ preventScroll: true });
        return;
      }
      solved = true;
      progress = recordMeaningAttempt(progress, question.item.word, wrong.length > 0);
      results.push({ ...question.item, helped: wrong.length > 0 }); persist();
      play('meaning-next');
    }));
    main.querySelector('#meaning-next')?.addEventListener('click', () => {
      index++;
      if (index === round.length) {
        rounds++; persist();
        show(meaningSummaryScreen({ results, storageAvailable }), 'meaning-start');
      } else { wrong = []; solved = false; play('meaning-word'); }
    });
  }
  learn();
}
