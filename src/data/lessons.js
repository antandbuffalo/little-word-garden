import fallbackCatalog from './catalog.js?v=1795702967401';
import { loadCatalog } from './fresh-catalog.js?v=1795702967401';

// Admin publishes only catalog.js, so fetch it fresh independently of releases.
// Tests use the local module; a network failure in the browser keeps its fallback.
const catalog = typeof window === 'undefined' ? fallbackCatalog
  : await loadCatalog(fallbackCatalog, new URL('./catalog.js', import.meta.url));
export const catalogSnapshot = JSON.stringify(catalog);

// Keep stable IDs: progress is saved separately for each lesson.
export const subjects = [
  { id: 'english', title: 'English', icon: '📚' },
  { id: 'maths', title: 'Maths', icon: '🔢' },
  { id: 'science', title: 'Science', icon: '🔬' },
  { id: 'computer', title: 'Computer', icon: '💻' },
  { id: 'french', title: 'French', icon: '🇫🇷' },
];

export const chapters = catalog.chapters;
export const lessons = catalog.lessons;

export const DEFAULT_LESSON_ID = 'school-hard-words';
export function getLesson(id = DEFAULT_LESSON_ID) {
  return lessons.find(lesson => lesson.id === id);
}
export function getSubjectLessons(subjectId) {
  return lessons.filter(lesson => getChapter(lesson.chapterId)?.subjectId === subjectId);
}

export function getSubject(id) {
  return subjects.find(subject => subject.id === id);
}

export function getChapter(id) {
  return chapters.find(chapter => chapter.id === id);
}

export function getSubjectChapters(subjectId) {
  return chapters.filter(chapter => chapter.subjectId === subjectId);
}

export function getChapterLessons(chapterId) {
  return lessons.filter(lesson => lesson.chapterId === chapterId);
}
