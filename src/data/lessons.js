import catalog from './catalog.js';

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
