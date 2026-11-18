import { LEVELS, levelStatus, unlockedLevel } from '../game/levels.js?v=1794964464226';

export function levelPicker({ words, progress, currentLevel }) {
  const unlocked = unlockedLevel(words, progress);
  return `<div class="level-picker" role="group" aria-label="Choose a spelling level">
    ${LEVELS.map(level => {
      const status = levelStatus(words, progress, level.id);
      const locked = level.id > unlocked;
      return `<button class="level-card ${level.id === currentLevel ? 'chosen' : ''}" data-level="${level.id}"
        aria-pressed="${level.id === currentLevel}" ${locked ? 'disabled' : ''}>
        <span class="level-card-title">Level ${level.id} <span aria-hidden="true">${locked ? '🔒' : status.complete ? '✿' : '🌱'}</span></span>
        <span class="level-description">${level.description}</span>
        <span class="level-progress">${locked ? `Finish Level ${level.id - 1} to unlock` : `${status.mastered} / ${status.total} words grown`}</span>
      </button>`;
    }).join('')}
  </div>`;
}
