import { escapeHTML } from './html.js';
export function revealScreen({ item }) {
  return `<section class="reveal"><span class="badge">LET’S LEARN IT TOGETHER</span>${item.icon ? `<div class="reveal-icon" aria-hidden="true">${escapeHTML(item.icon)}</div>` : ''}<h1>Take a little look.</h1><p>Look at each letter. Then try it yourself.</p><div class="answer">${item.word}</div><p class="spelling">${item.word.split(' ').map(word => [...word].join(' · ')).join(' / ')}</p><button id="try-again" class="primary">Hide it & try <span>→</span></button><p class="round-note">It’s okay to need a little help.</p></section>`;
}
