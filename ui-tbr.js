import { USERS } from './config.js';
import { updateBook } from './store.js';

let onRateNow = () => {};
export function initTbrPanel(rateNowCallback) { onRateNow = rateNowCallback; }

export function renderTBR(books) {
  const tbrBooks = books.filter(b => b.status === 'tbr');
  const cols = { karolina: [], wspolna: [], ola: [] };

  tbrBooks.forEach(b => {
    const w = b.wantToRead || {};
    const kWants = w.karolina === true;
    const oWants = w.ola === true;
    if (kWants && oWants) cols.wspolna.push(b);
    else if (kWants) cols.karolina.push(b);
    else if (oWants) cols.ola.push(b);
    else cols.karolina.push(b); // nikt jeszcze nie zaznaczył — pokaż u osoby, która dodała
  });

  Object.entries(cols).forEach(([colKey, list]) => {
    const host = document.querySelector(`#tbrCol-${colKey} .tbr-list`);
    if (list.length === 0) { host.innerHTML = '<p class="empty-note">Pusto tutaj.</p>'; return; }
    host.innerHTML = '';
    list.forEach(b => host.appendChild(renderTbrCard(b)));
  });
}

function renderTbrCard(book) {
  const el = document.createElement('div');
  el.className = 'tbr-book';
  const w = book.wantToRead || {};
  el.innerHTML = `
    <div class="tb-title">${escapeHtml(book.title)}</div>
    <div class="tb-author">${escapeHtml(book.author)}</div>
    <div class="tb-actions">
      ${USERS.map(u => `<button type="button" class="chip btn-sm want-toggle" data-user="${u.id}">${u.emoji} ${w[u.id] === true ? 'chce' : 'chce?'}</button>`).join('')}
      <button type="button" class="chip btn-sm rate-now">przeczytana → oceń</button>
    </div>
  `;
  el.querySelectorAll('.want-toggle').forEach((btn, i) => {
    const uid = USERS[i].id;
    btn.classList.toggle('active', w[uid] === true);
    btn.addEventListener('click', async () => {
      const next = { ...(book.wantToRead || {}), [uid]: w[uid] === true ? false : true };
      await updateBook(book.id, { wantToRead: next });
    });
  });
  el.querySelector('.rate-now').addEventListener('click', () => onRateNow(book));
  return el;
}

function escapeHtml(s = '') { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
