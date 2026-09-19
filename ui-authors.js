import { USERS } from './config.js';
import { overallBookRating, tierForPercent } from './rating.js';

let onOpenBook = () => {};

export function initAuthorsPanel(openBookCallback) {
  onOpenBook = openBookCallback || (() => {});
}

function avg(nums) { return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null; }

export function renderAuthors(books) {
  const host = document.getElementById('authorGrid');
  if (!host) return;

  if (books.length === 0) {
    host.innerHTML = '<p class="empty-note" style="text-align:center;">Dodajcie pierwszą książkę, żeby zobaczyć autorów.</p>';
    return;
  }

  // grupowanie po autorze (bez rozróżniania wielkości liter/spacji na brzegach)
  const groups = new Map();
  books.forEach(b => {
    const key = (b.author || 'Autor nieznany').trim();
    const lower = key.toLowerCase();
    if (!groups.has(lower)) groups.set(lower, { name: key, books: [] });
    groups.get(lower).books.push(b);
  });

  const rows = [...groups.values()].map(g => {
    const overalls = g.books.map(overallBookRating).filter(Boolean);
    const combinedAvg = avg(overalls.map(o => o.percent));
    const perUserAvg = USERS.map(u => ({
      user: u,
      value: avg(g.books.map(b => b.ratings?.[u.id]?.percent).filter(v => typeof v === 'number')),
    }));
    return { author: g.name, books: g.books, combinedAvg, perUserAvg };
  });

  // najpierw autorki/autorzy z oceną (od najwyższej), potem reszta alfabetycznie
  rows.sort((a, b) => {
    if (a.combinedAvg !== null && b.combinedAvg !== null) return b.combinedAvg - a.combinedAvg;
    if (a.combinedAvg !== null) return -1;
    if (b.combinedAvg !== null) return 1;
    return a.author.localeCompare(b.author, 'pl');
  });

  host.innerHTML = '';
  rows.forEach(r => {
    const tier = r.combinedAvg !== null ? tierForPercent(r.combinedAvg) : null;
    const card = document.createElement('div');
    card.className = 'card author-card';
    card.innerHTML = `
      <div class="author-head">
        <div>
          <h3>${escapeHtml(r.author)}</h3>
          <div class="author-count">${r.books.length} ${r.books.length === 1 ? 'książka' : 'książki'}</div>
        </div>
        ${tier ? `
          <div class="author-score" style="background:${tier.color};color:${tier.textColor};">
            ${r.combinedAvg}%
          </div>
        ` : '<div class="author-score author-score-none">bez oceny</div>'}
      </div>
      <div class="author-peruser">
        ${r.perUserAvg.map(p => `<span>${p.user.emoji} ${p.value !== null ? p.value + '%' : '—'}</span>`).join('')}
      </div>
      <div class="author-books" id="authorBooks-${cssId(r.author)}"></div>
    `;
    const box = card.querySelector(`#authorBooks-${cssId(r.author)}`);
    r.books.forEach(b => {
      const overall = overallBookRating(b);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'saga-book-pill';
      pill.innerHTML = `${overall ? `<span class="tier-dot" style="background:${overall.tier.color};"></span>` : ''}${escapeHtml(b.title)}`;
      pill.addEventListener('click', () => onOpenBook(b));
      box.appendChild(pill);
    });
    host.appendChild(card);
  });
}

function cssId(s) { return s.replace(/[^a-z0-9]/gi, '-').toLowerCase(); }
function escapeHtml(s = '') { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
