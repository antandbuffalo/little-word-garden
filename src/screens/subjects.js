import { escapeHTML } from './html.js?v=1794964801440';
export function subjectsScreen({ subjects, chapters, lessons }) {
  return `
    <section class="subjects-page">
      <div class="eyebrow">FIVE LITTLE GARDENS TO EXPLORE</div>
      <h1>What shall we<br><em>grow today?</em></h1>
      <p class="intro">Pick a subject. Let’s learn a little together.</p>
      <nav class="subject-list" aria-label="Choose a subject">
        ${subjects.map(subject => {
          const chapterIds = chapters.filter(chapter => chapter.subjectId === subject.id).map(chapter => chapter.id);
          const wordCount = lessons.filter(lesson => chapterIds.includes(lesson.chapterId))
            .reduce((total, lesson) => total + lesson.words.length, 0);
          return `
            <a class="subject-card subject-${subject.id}" href="#subject/${subject.id}">
              <span class="subject-icon" aria-hidden="true">${subject.icon}</span>
              <span class="subject-copy">
                <span class="subject-title">${subject.title}</span>
                <span class="subject-description">${wordCount ? `${wordCount} words to discover` : 'Words coming soon'}</span>
              </span>
              <span class="subject-arrow" aria-hidden="true">→</span>
            </a>`;
        }).join('')}
      </nav>
      <p class="round-note">A little practice. A new discovery. Every day. ✿</p>
    </section>`;
}

export function subjectNavigation(subject) {
  return `<nav class="subject-navigation" aria-label="Subject navigation">
    <a href="#subjects">← All subjects</a>
    <span><span aria-hidden="true">${subject.icon}</span> ${subject.title}</span>
  </nav>`;
}

export function subjectScreen({ subject, chapters, lessons }) {
  return `${subjectNavigation(subject)}
    <section class="subject-detail">
      <div class="subject-detail-icon" aria-hidden="true">${subject.icon}</div>
      <span class="badge">${chapters.length ? 'LET’S KEEP GROWING' : 'A LITTLE GARDEN IN THE MAKING'}</span>
      <h1>${subject.title}</h1>
      ${chapters.length ? `
        <p class="intro">Choose a chapter to explore.</p>
        <nav class="subject-list" aria-label="Choose a chapter">
          ${chapters.map(chapter => {
            const count = lessons.filter(lesson => lesson.chapterId === chapter.id)
              .reduce((total, lesson) => total + lesson.words.length, 0);
            return `<a class="subject-card" href="#chapter/${escapeHTML(chapter.id)}">
            <span class="subject-icon" aria-hidden="true">${escapeHTML(chapter.icon)}</span>
            <span class="subject-copy"><span class="subject-title">${escapeHTML(chapter.title)}</span>
            <span class="subject-description">${count ? `${count} words to discover` : 'Words coming soon'}</span></span>
            <span class="subject-arrow" aria-hidden="true">→</span>
          </a>`; }).join('')}
        </nav>` : `
        <p class="intro">New words will grow here soon.<br>Try Science for a little spelling adventure!</p>
        <a class="primary subject-action" href="#subject/science">Explore Science <span>→</span></a>
        <a class="text-button" href="#subjects">Choose another subject</a>`}
    </section>`;
}
