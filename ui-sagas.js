import { USERS } from './config.js';

function avg(nums) { return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null; }

export function renderSagas(books) {
  const grid = document.getElementById('sagaGrid');
  const sagaMap = new Map();
  books.filter(b => b.saga).forEach(b => {
    if (!sagaMap.has(b.saga)) sagaMap.set(b.saga, []);
    sagaMap.get(b.saga).push(b);
  });

  if (sagaMap.size === 0) {
    grid.innerHTML = '<p class="empty-note">Żadna książka nie ma jeszcze przypisanej sagi. Dodaj sagę przy ocenianiu książki.</p>';
    return;
  }

  grid.innerHTML = '';
  [...sagaMap.entries()].forEach(([saga, sagaBooks]) => {
    const perUserAvg = USERS.map(u => ({
      user: u,
      value: avg(sagaBooks.map(b => b.ratings?.[u.id]?.percent).filter(v => typeof v === 'number')),
    }));
    const card = document.createElement('div');
    card.className = 'card saga-card';
    card.innerHTML = `
      <h3>${escapeHtml(saga)}</h3>
      <div class="saga-avg-row">
        ${perUserAvg.map(p => `<span>${p.user.emoji} ${p.value !== null ? p.value + '%' : '—'}</span>`).join('')}
      </div>
      <div class="saga-books">
        ${sagaBooks.map(b => `<span class="saga-book-pill">${escapeHtml(b.title)}</span>`).join('')}
      </div>
    `;
    grid.appendChild(card);
  });
}

function escapeHtml(s = '') { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
