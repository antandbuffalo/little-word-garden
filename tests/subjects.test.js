import test from 'node:test';
import assert from 'node:assert/strict';
import { subjects, chapters, lessons, getSubject, getSubjectLessons, getSubjectChapters, getChapterLessons } from '../src/data/lessons.js';
import { subjectsScreen, subjectScreen } from '../src/screens/subjects.js';

test('all five subjects are available and collections belong to valid subjects', () => {
  assert.deepEqual(subjects.map(subject => subject.title), ['English', 'Maths', 'Science', 'Computer', 'French']);
  const scienceIds = getSubjectLessons('science').map(lesson => lesson.id);
  assert.ok(scienceIds.includes('school-hard-words'));
  assert.ok(scienceIds.includes('energy-hard-words'));
  for (const lesson of lessons) {
    const chapter = chapters.find(item => item.id === lesson.chapterId);
    assert.ok(chapter, `${lesson.id} must belong to a chapter`);
    assert.ok(getSubject(chapter.subjectId), `${chapter.id} must belong to a subject`);
    assert.ok(getSubjectLessons(chapter.subjectId).includes(lesson));
  }
});

test('subject selection links to every subject and counts words across chapters', () => {
  const sampleChapters = [
    { id: 'first', subjectId: 'science' },
    { id: 'second', subjectId: 'science' },
    { id: 'english-chapter', subjectId: 'english' },
  ];
  const sampleLessons = [
    { chapterId: 'first', words: [{ word: 'cat' }, { word: 'dog' }] },
    { chapterId: 'second', words: [{ word: 'sun' }] },
    { chapterId: 'english-chapter', words: [{ word: 'guardian' }] },
  ];
  const html = subjectsScreen({ subjects, chapters: sampleChapters, lessons: sampleLessons });
  for (const subject of subjects) {
    assert.ok(html.includes(`href="#subject/${subject.id}"`));
    assert.ok(html.includes(subject.title));
  }
  assert.ok(html.includes('3 words to discover'));
  assert.ok(html.includes('1 words to discover'));
  assert.equal((html.match(/Words coming soon/g) || []).length, 3);
});

test('empty subjects offer navigation without starting an empty game', () => {
  const html = subjectScreen({ subject: getSubject('french'), chapters: [], lessons: [] });
  assert.ok(html.includes('French'));
  assert.ok(html.includes('New words will grow here soon.'));
  assert.ok(html.includes('href="#subjects"'));
  assert.ok(html.includes('href="#subject/science"'));
  assert.ok(!html.includes('id="start"'));
});

test('Science lists Living Things and Energy before showing their words', () => {
  const subjectChapters = getSubjectChapters('science');
  assert.equal(subjectChapters.length, 2);
  assert.equal(subjectChapters[0].title, 'Living Things');
  const html = subjectScreen({ subject: getSubject('science'), chapters: subjectChapters, lessons });
  assert.ok(html.includes('Choose a chapter to explore.'));
  assert.ok(html.includes('href="#chapter/living-things"'));
  assert.ok(html.includes('href="#chapter/energy"'));
  assert.ok(html.includes('10 words to discover'));
  assert.ok(!html.includes('id="start"'));
  assert.equal(getChapterLessons('living-things')[0].id, 'school-hard-words');
  assert.equal(getChapterLessons('living-things')[0].words.length, 10);
  assert.deepEqual(getChapterLessons('energy')[0].words.map(item => item.word), [
    'breathe', 'electrical energy', 'environment', 'consumer', 'producer',
    'herbivores', 'carnivores', 'omnivores', 'predators', 'prey',
  ]);
});
