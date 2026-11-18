import { shuffle } from './spelling.js?v=1794964464226';

export function createLetterBank(word, gaps, random = Math.random) {
  const required = gaps.map(index => word[index]);
  const extraCount = 3 + Math.floor(random() * 2);
  const extras = shuffle([...'abcdefghijklmnopqrstuvwxyz'].filter(letter => !required.includes(letter)), random)
    .slice(0, extraCount);
  // Separate tokens preserve duplicates, such as the two o's in g__d.
  return shuffle([...required, ...extras], random).map((letter, id) => ({ id, letter }));
}

export function availableTiles(bank, placements) {
  const used = new Set(Object.values(placements));
  return bank.filter(tile => !used.has(tile.id));
}

export function placeTile(bank, placements, gap, tileId) {
  if (!availableTiles(bank, placements).some(tile => tile.id === tileId)) return placements;
  // Replacing a gap releases its previous token back into the bank.
  return { ...placements, [gap]: tileId };
}

export function lettersForPlacements(bank, placements) {
  return Object.fromEntries(Object.entries(placements).map(([gap, tileId]) =>
    [gap, bank.find(tile => tile.id === tileId).letter]
  ));
}
