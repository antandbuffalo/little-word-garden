// Parse content as data, never execute code loaded from GitHub.
export function parseCatalog(source) {
  const prefix = '// Edited by the admin page. Keep this module as JSON after export default.\nexport default ';
  if (!source.startsWith(prefix) || !source.trimEnd().endsWith(';')) {
    throw new Error('The content file format has changed. Reload the admin page before publishing.');
  }
  const catalog = JSON.parse(source.slice(prefix.length).trimEnd().slice(0, -1));
  if (!Array.isArray(catalog.chapters) || !Array.isArray(catalog.lessons)) {
    throw new Error('The content file does not contain chapters and word collections.');
  }
  return catalog;
}

export function serializeCatalog(catalog) {
  return '// Edited by the admin page. Keep this module as JSON after export default.\nexport default ' +
    JSON.stringify(catalog, null, 2) + ';\n';
}

export function validateWords(entries) {
  const words = [];
  const seen = new Set();
  for (const [index, entry] of entries.entries()) {
    const clue = entry.clue.trim();
    const word = entry.word.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!clue) throw new Error(`Card ${index + 1}: add a clue.`);
    if (!/^[a-z]+(?: [a-z]+)*$/.test(word) || word.replaceAll(' ', '').length < 2) {
      throw new Error(`Card ${index + 1}: use a word or phrase with at least two English letters, without punctuation.`);
    }
    if (seen.has(word)) throw new Error(`Card ${index + 1}: “${word}” appears more than once.`);
    seen.add(word);
    words.push({ word, clue });
  }
  if (!words.length) throw new Error('Add at least one clue and word.');
  return words;
}

function uniqueId(title, entries) {
  const base = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chapter';
  let id = base;
  for (let suffix = 2; entries.some(entry => entry.id === id); suffix++) id = `${base}-${suffix}`;
  return id;
}

export function addWords(catalog, { subjectId, chapterId, chapterTitle, lessonId, words }, subjects) {
  const subject = subjects.find(item => item.id === subjectId);
  if (!subject) throw new Error('Choose a subject.');
  // Validate again when publishing, even if the preview was already generated.
  const additions = validateWords(words);
  const next = structuredClone(catalog);
  let chapter = next.chapters.find(item => item.id === chapterId && item.subjectId === subjectId);
  if (chapterId === '__new__') {
    const title = chapterTitle.trim();
    if (!title) throw new Error('Enter a chapter name.');
    if (next.chapters.some(item => item.subjectId === subjectId && item.title.toLowerCase() === title.toLowerCase())) {
      throw new Error('That chapter already exists. Select it from the list.');
    }
    chapter = { id: uniqueId(title, next.chapters), subjectId, title, icon: subject.icon };
    next.chapters.push(chapter);
  }
  if (!chapter) throw new Error('Choose a chapter.');
  const collections = next.lessons.filter(item => item.chapterId === chapter.id);
  let lesson = collections.find(item => item.id === lessonId);
  if (!collections.length) {
    lesson = { id: uniqueId(`${chapter.id}-words`, next.lessons), chapterId: chapter.id, title: `${chapter.title} word collection`, words: [] };
    next.lessons.push(lesson);
  } else if (!lesson && collections.length === 1) lesson = collections[0];
  if (!lesson) throw new Error('Choose a word collection.');
  for (const item of additions) {
    if (lesson.words.some(existing => existing.word === item.word)) throw new Error(`“${item.word}” is already in this collection.`);
    lesson.words.push(item);
  }
  return { catalog: next, chapter, lesson, added: additions.length };
}
