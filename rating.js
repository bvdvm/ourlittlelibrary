import { UNIVERSAL_CRITERIA, bonusGroupsForGenres } from './criteria-data.js';

// Zakładki (poziomy oceny) — kolory i progi dokładnie wg zasad Karoliny.
// Kolory dobrane tak, żeby żadne dwa sąsiednie poziomy nie zlewały się ze sobą
// (drewniana jest teraz wyraźnie brązowa, nie żółtawa jak złota).
export const BOOKMARK_TIERS = [
  { min: 0, max: 29, id: 'paper', label: 'papierowa zakładka', color: '#d33b2e', textColor: '#fdece9' },
  { min: 30, max: 49, id: 'cardboard', label: 'kartonowa zakładka', color: '#e8791f', textColor: '#2b1400' },
  { min: 50, max: 69, id: 'wood', label: 'drewniana zakładka', color: '#6b4226', textColor: '#f5e6d3' },
  { min: 70, max: 89, id: 'silver', label: 'srebrna zakładka', color: '#2fa84f', textColor: '#eafdf0' },
  { min: 90, max: 100, id: 'gold', label: 'złota zakładka', color: '#ffcc00', textColor: '#2b1a00' },
];

// Przelicznik procent -> gwiazdki, dokładnie wg tabeli z notatek
const STAR_BANDS = [
  { min: 0, max: 19, stars: 1 }, { min: 20, max: 29, stars: 1.5 },
  { min: 30, max: 39, stars: 2 }, { min: 40, max: 49, stars: 2.5 },
  { min: 50, max: 59, stars: 3 }, { min: 60, max: 69, stars: 3.5 },
  { min: 70, max: 79, stars: 4 }, { min: 80, max: 89, stars: 4.5 },
  { min: 90, max: 100, stars: 5 },
];

export function criteriaForGenres(genres = []) {
  const bonus = bonusGroupsForGenres(genres).map(g => g.criterion);
  return [...UNIVERSAL_CRITERIA, ...bonus];
}

// Uwaga: procenty bywają ułamkowe (np. 89.2), więc dopasowanie musi działać na
// progach "od" (>= min), a nie na sztywnych przedziałach z lukami między liczbami całkowitymi.
export function percentToStars(percent) {
  for (let i = STAR_BANDS.length - 1; i >= 0; i--) {
    if (percent >= STAR_BANDS[i].min) return STAR_BANDS[i].stars;
  }
  return STAR_BANDS[0].stars;
}

export function tierForPercent(percent) {
  for (let i = BOOKMARK_TIERS.length - 1; i >= 0; i--) {
    if (percent >= BOOKMARK_TIERS[i].min) return BOOKMARK_TIERS[i];
  }
  return BOOKMARK_TIERS[0];
}

// scores: { [criterionId]: 1-5 }, genres: string[]
export function calcRating(scores, genres = []) {
  const criteria = criteriaForGenres(genres);
  const scored = criteria.filter(c => typeof scores[c.id] === 'number');
  if (scored.length === 0) return null;
  const total = scored.reduce((sum, c) => sum + scores[c.id], 0);
  const max = scored.length * 5;
  const percent = Math.round((total / max) * 1000) / 10; // 1 miejsce po przecinku
  return {
    percent,
    stars: percentToStars(percent),
    tier: tierForPercent(percent),
    scoredCount: scored.length,
    totalCriteria: criteria.length,
  };
}

export function starsToString(stars) {
  const full = Math.floor(stars);
  const half = stars % 1 !== 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

// Ogólny wynik książki do pokazania w Rankingu/Autorach/Losowaniu/TBR:
// jeśli obie oceniły — średnia z obu, inaczej wynik tej, która już oceniła.
export function overallBookRating(book) {
  const r = book?.ratings || {};
  const hasBoth = r.karolina && r.ola;
  if (hasBoth) {
    const percent = Math.round(((r.karolina.percent + r.ola.percent) / 2) * 10) / 10;
    return { percent, stars: percentToStars(percent), tier: tierForPercent(percent), both: true, karolina: r.karolina.percent, ola: r.ola.percent };
  }
  const single = r.karolina || r.ola;
  if (single) return { percent: single.percent, stars: single.stars, tier: tierForPercent(single.percent), both: false };
  return null;
}
