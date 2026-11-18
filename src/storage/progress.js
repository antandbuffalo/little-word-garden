import { DEFAULT_LESSON_ID } from '../data/lessons.js?v=1794964464226';

// Preserve the first version's progress; new lessons get their own storage key.
export function createProgressStore(lessonId, storage) {
  const key = lessonId === DEFAULT_LESSON_ID
    ? 'little-word-garden-v1'
    : `little-word-garden-v1:${lessonId}`;
  const getStorage = () => storage ?? globalThis.localStorage;

  return {
    load() {
      try {
        const saved = JSON.parse(getStorage().getItem(key) || '{}');
        return {
          progress: saved?.progress && typeof saved.progress === 'object' && !Array.isArray(saved.progress)
            ? saved.progress : {},
          rounds: Number.isInteger(saved?.rounds) && saved.rounds >= 0 ? saved.rounds : 0,
        };
      } catch {
        return { progress: {}, rounds: 0 };
      }
    },
    save(state) {
      try {
        getStorage().setItem(key, JSON.stringify(state));
        return true;
      } catch {
        return false;
      }
    },
  };
}
