import { USERS } from './config.js';
import { updateBook } from './store.js';

let onRateNow = () => {};
export function initTbrPanel(rateNowCallback) { onRateNow = rateNowCallback; }

export function renderTBR(books) {
  const cols = { karolina: [], wspolna: [], ola: [] };

  books.forEach(b => {
    const rs = b.readStatus || {};
    const w = b.wantToRead || {};
    const kPending = rs.karolina === 'tbr';
    const oPending = rs.ola === 'tbr';
    const shared = kPending && oPending && w.karolina === true && w.ola === true;
    if (shared) { cols.wspolna.push(b); return; }
    if (kPending && w.karolina !== false) cols.karolina.push(b);
    if (oPending && w.ola !== false) cols.ola.push(b);
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
  const rs = book.readStatus || {};
  const pendingUsers = USERS.filter(u => rs[u.id] === 'tbr');
  el.innerHTML = `
    <div class="tb-head">
      <img class="tb-cover" src="${book.coverUrl || ''}" alt="" onerror="this.style.visibility='hidden'" />
      <div>
        <div class="tb-title">${escapeHtml(book.title)}</div>
        <div class="tb-author">${escapeHtml(book.author)}</div>
        ${(book.genres || []).length ? `<div class="tb-genres">${book.genres.map(escapeHtml).join(', ')}</div>` : ''}
      </div>
    </div>
    <div class="tb-actions" id="tbActions-${book.id}"></div>
  `;
  const actions = el.querySelector(`#tbActions-${book.id}`);
  pendingUsers.forEach(u => {
    const uid = u.id;
    const wantBtn = document.createElement('button');
    wantBtn.type = 'button'; wantBtn.className = 'chip btn-sm want-toggle';
    wantBtn.textContent = `${u.emoji} chcę`;
    wantBtn.classList.toggle('active', w[uid] === true);
    wantBtn.addEventListener('click', async () => {
      const next = { ...(book.wantToRead || {}), [uid]: w[uid] === true ? null : true };
      await updateBook(book.id, { wantToRead: next });
    });
    const noBtn = document.createElement('button');
    noBtn.type = 'button'; noBtn.className = 'chip btn-sm no-toggle';
    noBtn.textContent = `${u.emoji} nie chcę`;
    noBtn.classList.toggle('active', w[uid] === false);
    noBtn.addEventListener('click', async () => {
      const next = { ...(book.wantToRead || {}), [uid]: w[uid] === false ? null : false };
      await updateBook(book.id, { wantToRead: next });
    });
    actions.appendChild(wantBtn);
    actions.appendChild(noBtn);
  });
  const rateBtn = document.createElement('button');
  rateBtn.type = 'button'; rateBtn.className = 'chip btn-sm rate-now';
  rateBtn.textContent = 'przeczytana → oceń';
  rateBtn.addEventListener('click', () => onRateNow(book));
  actions.appendChild(rateBtn);
  return el;
}

function escapeHtml(s = '') { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
