import { escapeHTML } from './html.js';
export function chapterNavigation(subject, chapter) {
  return `<nav class="subject-navigation" aria-label="Chapter navigation">
    <a href="#subject/${subject.id}">← ${subject.title} chapters</a>
    <span><span aria-hidden="true">${escapeHTML(chapter.icon)}</span> ${escapeHTML(chapter.title)}</span>
  </nav>`;
}

export function chapterScreen({ subject, chapter, lessons }) {
  return `${chapterNavigation(subject, chapter)}
    <section class="subject-detail">
      <div class="subject-detail-icon" aria-hidden="true">${escapeHTML(chapter.icon)}</div>
      <span class="badge">${subject.title}</span>
      <h1>${escapeHTML(chapter.title)}</h1>
      <p class="intro">${lessons.length ? 'Choose a word collection to practise.' : 'New words will grow here soon.'}</p>
      <div class="subject-list">
        ${lessons.map(lesson => `<a class="subject-card" href="#lesson/${escapeHTML(lesson.id)}">
          <span class="subject-copy"><span class="subject-title">${escapeHTML(lesson.title)}</span>
          <span class="subject-description">${lesson.words.length} ${lesson.activity === 'meanings' ? 'word–meaning pairs · Learn and practise' : 'words to discover'}</span></span>
          <span class="subject-arrow" aria-hidden="true">→</span>
        </a>`).join('')}
      </div>
    </section>`;
}
