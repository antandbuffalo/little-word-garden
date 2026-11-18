import { subjects } from '../data/lessons.js?v=1794964464226';
import { validateWords, addWords } from './content.js?v=1794964464226';
import { createGitHubClient } from './github.js?v=1794964464226';
import { tokenStore } from './token.js?v=1794964464226';

const $ = selector => document.querySelector(selector);
const tokens = tokenStore();
let snapshot = null, client = null, pending = null;
let nextCardId = 0;

function numberCards() {
  const cards = [...$('#word-cards').children];
  cards.forEach((card, index) => {
    card.querySelector('.word-number').textContent = index + 1;
    const remove = card.querySelector('.remove-word');
    remove.hidden = cards.length === 1;
    remove.setAttribute('aria-label', `Remove word ${index + 1}`);
  });
}
function addCard(focus = false) {
  const card = $('#word-card-template').content.firstElementChild.cloneNode(true);
  const id = nextCardId++;
  for (const field of ['clue', 'word']) {
    const input = card.querySelector(`[data-field="${field}"]`);
    input.id = `${field}-${id}`;
    card.querySelector(`[data-label="${field}"]`).htmlFor = input.id;
  }
  card.querySelector('.remove-word').addEventListener('click', () => {
    const target = card.nextElementSibling || card.previousElementSibling;
    card.remove();
    numberCards();
    invalidate();
    status('#publish-status', '');
    target.querySelector('[data-field="clue"]').focus();
  });
  $('#word-cards').append(card);
  numberCards();
  if (focus) card.querySelector('[data-field="clue"]').focus();
}
addCard();
$('#add-word').addEventListener('click', () => {
  addCard(true);
  invalidate();
  status('#publish-status', '');
});

function status(selector, message, error = false) {
  const element = $(selector);
  element.textContent = message;
  element.classList.toggle('error', error);
}
function options(select, entries, selected) {
  select.replaceChildren(...entries.map(({ id, title }) => new Option(title, id)));
  if (entries.some(entry => entry.id === selected)) select.value = selected;
}
function invalidate() { pending = null; $('#preview').hidden = true; }
function collections() {
  const items = snapshot.catalog.lessons.filter(item => item.chapterId === $('#chapter').value);
  options($('#collection'), items, $('#collection').value);
  $('#collection-field').hidden = items.length < 2;
  const isNew = $('#chapter').value === '__new__';
  $('#new-chapter').hidden = !isNew;
  $('#chapter-title').required = isNew;
  invalidate();
}
function chapters(selected = $('#chapter').value) {
  const items = snapshot.catalog.chapters.filter(item => item.subjectId === $('#subject').value);
  options($('#chapter'), [...items, { id: '__new__', title: '+ Create a new chapter' }], selected);
  collections();
}
function busy(value) {
  $('#token-fields').disabled = value;
  $('#editor-fields').disabled = value || !snapshot;
}

$('#token').value = tokens.load();
status('#connection-status', $('#token').value ? 'A token is saved on this device. Connect to load the latest content.' : 'Connect to start adding words.');

$('#token-form').addEventListener('submit', async event => {
  event.preventDefault();
  const token = $('#token').value.trim();
  if (!token) return;
  invalidate();
  snapshot = null;
  client = createGitHubClient(token);
  const saved = tokens.save(token);
  busy(true);
  status('#connection-status', 'Loading the latest content from GitHub…');
  try {
    snapshot = await client.load();
    options($('#subject'), subjects, $('#subject').value);
    chapters();
    status('#connection-status', `Connected to ${snapshot.branch}. ${saved ? 'Token saved on this device.' : 'Browser storage is unavailable; the token is only available until this page closes.'}`);
  } catch (error) { status('#connection-status', error.message, true); }
  finally { busy(false); }
});

$('#clear-token').addEventListener('click', () => {
  const cleared = tokens.clear();
  $('#token').value = '';
  client = null;
  snapshot = null;
  invalidate();
  busy(false);
  status('#connection-status', cleared ? 'Token cleared. Connect again when you want to publish.' : 'Token removed from this page, but browser storage could not be cleared. Remove this site’s stored data in your browser settings.', !cleared);
  status('#publish-status', '');
});

$('#subject').addEventListener('change', () => chapters());
$('#chapter').addEventListener('change', collections);
$('#words-form').addEventListener('input', () => { invalidate(); status('#publish-status', ''); });
$('#words-form').addEventListener('change', invalidate);
$('#words-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!snapshot) return;
  invalidate();
  status('#publish-status', '');
  try {
    const words = validateWords([...$('#word-cards').children].map(card => ({
      clue: card.querySelector('[data-field="clue"]').value,
      word: card.querySelector('[data-field="word"]').value,
    })));
    pending = addWords(snapshot.catalog, {
      subjectId: $('#subject').value,
      chapterId: $('#chapter').value,
      chapterTitle: $('#chapter-title').value,
      lessonId: $('#collection').value,
      words,
    }, subjects);
    $('#preview-summary').textContent = `${pending.added} new ${pending.added === 1 ? 'word' : 'words'} for ${pending.chapter.title} → ${pending.lesson.title}.`;
    $('#preview-rows').replaceChildren(...words.map(item => {
      const row = document.createElement('tr');
      for (const value of [item.clue, item.word]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      return row;
    }));
    $('#preview').hidden = false;
    $('#preview-heading').focus();
  } catch (error) { status('#publish-status', error.message, true); }
});

$('#publish').addEventListener('click', async () => {
  if (!pending || !snapshot || !client) return;
  const update = pending;
  busy(true);
  status('#publish-status', 'Publishing to GitHub…');
  try {
    const result = await client.publish(snapshot, update.catalog, update.added);
    snapshot = { ...snapshot, catalog: update.catalog, sha: result.sha };
    $('#chapter-title').value = '';
    $('#word-cards').replaceChildren();
    addCard();
    chapters(update.chapter.id);
    status('#publish-status', `${update.added} ${update.added === 1 ? 'word committed' : 'words committed'}! GitHub Pages will update after deployment finishes. `);
    const link = document.createElement('a');
    link.href = result.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'View commit ↗';
    $('#publish-status').append(link);
  } catch (error) {
    // Force a fresh read after any uncertain outcome; preserve the typed draft.
    snapshot = null;
    invalidate();
    status('#publish-status', error.message, true);
    status('#connection-status', 'Reconnect to load the latest content before publishing again.');
  } finally { busy(false); }
});
