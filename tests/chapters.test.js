import test from 'node:test';
import assert from 'node:assert/strict';
import { getSubject, getChapter, getChapterLessons, getSubjectChapters } from '../src/data/lessons.js';
import { chapterScreen, chapterNavigation } from '../src/screens/chapters.js';
import { homeScreen } from '../src/screens/home.js';

const subject = getSubject('science');
const chapter = getChapter('living-things');

test('chapter overview names Living Things and links back to Science chapters', () => {
  const html = chapterNavigation(subject, chapter) + homeScreen({
    chapter, lesson: getChapterLessons(chapter.id)[0], progress: {}, rounds: 0,
  });
  assert.ok(html.includes('<h1>Living Things</h1>'));
  assert.ok(html.includes('href="#subject/science"'));
  assert.ok(html.includes('Science chapters'));
  assert.ok(html.includes('skeleton'));
  assert.ok(html.includes('id="start"'));
  assert.deepEqual(getSubjectChapters('french'), []);
});

test('chapter with several word collections keeps lesson links within its chapter', () => {
  const lessons = [
    { id: 'animals', title: 'Animals', words: [{ word: 'cat' }] },
    { id: 'body', title: 'Our bodies', words: [{ word: 'bones' }] },
  ];
  const html = chapterScreen({ subject, chapter, lessons });
  assert.ok(html.includes('href="#lesson/animals"'));
  assert.ok(html.includes('href="#lesson/body"'));
});

test('chapter without words has no link to an empty game', () => {
  const html = chapterScreen({ subject, chapter, lessons: [] });
  assert.ok(html.includes('New words will grow here soon.'));
  assert.ok(!html.includes('href="#lesson/'));
  assert.ok(!html.includes('id="start"'));
});
