import { searchBooks } from './books-api.js';
import { ALL_GENRES, FORMATS } from './criteria-data.js';
import { criteriaForGenres, calcRating, starsToString } from './rating.js';
import { USERS } from './config.js';
import { addBook, updateBook } from './store.js';

let getBooks = () => [];
let draft = null;        // książka w trakcie edycji
let draftScores = {};    // { karolina: {critId: pts}, ola: {critId: pts} }
let activeUser = USERS[0].id;

function blankDraft() {
  return {
    id: null, title: '', author: '', coverUrl: '', googleBooksId: '', isbn: '',
    genres: [], format: null, saga: null, status: 'tbr', addedBy: USERS[0].id,
    wantToRead: {}, ratings: { [USERS[0].id]: null, [USERS[1].id]: null },
  };
}

export function initRatePanel(booksGetter) {
  getBooks = booksGetter;
  const searchInput = document.getElementById('bookSearch');
  const resultsBox = document.getElementById('searchResults');
  const manualBtn = document.getElementById('manualAddBtn');

  let debounceTimer = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = searchInput.value.trim();
    if (!q) { resultsBox.innerHTML = ''; return; }
    debounceTimer = setTimeout(async () => {
      resultsBox.innerHTML = '<p class="empty-note">Szukam…</p>';
      try {
        const results = await searchBooks(q);
        renderSearchResults(results, resultsBox);
      } catch (err) {
        resultsBox.innerHTML = '<p class="empty-note">Nie udało się połączyć z Google Books. Możesz dodać książkę ręcznie.</p>';
      }
    }, 380);
  });

  manualBtn.addEventListener('click', () => {
    resultsBox.innerHTML = '';
    searchInput.value = '';
    startDraft(blankDraft());
  });

  refreshTbrShortcut();
}

export function refreshTbrShortcut() {
  const host = document.getElementById('tbrShortcut');
  if (!host) return;
  const tbrBooks = getBooks().filter(b => b.status === 'tbr' || b.status === 'w trakcie');
  if (tbrBooks.length === 0 || draft) { host.innerHTML = ''; return; }
  host.innerHTML = `<div class="card" style="margin-bottom:20px;"><label>Masz w TBR — oceń teraz</label><div class="chip-row" style="margin-top:8px;"></div></div>`;
  const row = host.querySelector('.chip-row');
  tbrBooks.forEach(b => {
    const chip = document.createElement('button');
    chip.className = 'chip'; chip.type = 'button'; chip.textContent = b.title;
    chip.addEventListener('click', () => startDraft(JSON.parse(JSON.stringify(b))));
    row.appendChild(chip);
  });
}

function renderSearchResults(results, box) {
  if (results.length === 0) { box.innerHTML = '<p class="empty-note">Brak wyników.</p>'; return; }
  box.innerHTML = '';
  results.forEach(r => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'search-result';
    el.innerHTML = `
      <img src="${r.coverUrl || ''}" alt="" onerror="this.style.visibility='hidden'" />
      <div class="meta"><div class="t">${escapeHtml(r.title)}</div><div class="a">${escapeHtml(r.author)}${r.publishedYear ? ' · ' + r.publishedYear : ''}</div></div>
    `;
    el.addEventListener('click', () => {
      const d = blankDraft();
      Object.assign(d, { title: r.title, author: r.author, coverUrl: r.coverUrl, googleBooksId: r.googleBooksId, isbn: r.isbn });
      box.innerHTML = '';
      document.getElementById('bookSearch').value = '';
      startDraft(d);
    });
    box.appendChild(el);
  });
}

function startDraft(book) {
  draft = book;
  draftScores = {
    [USERS[0].id]: draft.ratings?.[USERS[0].id]?.scores ? { ...draft.ratings[USERS[0].id].scores } : {},
    [USERS[1].id]: draft.ratings?.[USERS[1].id]?.scores ? { ...draft.ratings[USERS[1].id].scores } : {},
  };
  activeUser = USERS[0].id;
  renderForm();
}

function renderForm() {
  const container = document.getElementById('bookFormContainer');
  if (!draft) { container.innerHTML = ''; return; }
  const existingSagas = [...new Set(getBooks().map(b => b.saga).filter(Boolean))];

  container.innerHTML = `
    <div class="book-form card">
      <div class="book-form-head">
        <img class="cover-preview" src="${draft.coverUrl || ''}" alt="" onerror="this.style.visibility='hidden'" />
        <div class="fields">
          <input type="text" id="f-title" placeholder="Tytuł" value="${escapeAttr(draft.title)}" />
          <input type="text" id="f-author" placeholder="Autor" value="${escapeAttr(draft.author)}" />
        </div>
      </div>

      <div class="two-col">
        <div class="field-row">
          <label>Status</label>
          <div class="status-toggle">
            <button type="button" class="chip status-chip" data-status="tbr">do przeczytania</button>
            <button type="button" class="chip status-chip" data-status="w trakcie">w trakcie</button>
            <button type="button" class="chip status-chip" data-status="przeczytana">przeczytana</button>
          </div>
        </div>
        <div class="field-row saga-field">
          <label for="f-saga">Saga (opcjonalnie)</label>
          <input type="text" id="f-saga" placeholder="np. Imperium Piorunów" value="${escapeAttr(draft.saga || '')}" autocomplete="off" />
          <div class="saga-suggestions" id="sagaSuggestions" hidden></div>
        </div>
      </div>

      <div class="field-row">
        <label>Gatunek</label>
        <div class="chip-row" id="genreChips"></div>
      </div>

      <div class="field-row">
        <label>Format</label>
        <div class="chip-row" id="formatChips"></div>
      </div>

      <div id="raterBlock"></div>

      <div class="form-actions">
        <button class="btn btn-ghost" id="cancelBtn" type="button">Anuluj</button>
        <button class="btn btn-gold" id="saveBtn" type="button">Zapisz książkę</button>
      </div>
    </div>
  `;

  document.getElementById('f-title').addEventListener('input', e => draft.title = e.target.value);
  document.getElementById('f-author').addEventListener('input', e => draft.author = e.target.value);

  // status
  const statusChips = [...container.querySelectorAll('.status-chip')];
  const syncStatus = () => statusChips.forEach(c => c.classList.toggle('active', c.dataset.status === draft.status));
  statusChips.forEach(c => c.addEventListener('click', () => { draft.status = c.dataset.status; syncStatus(); renderRaterBlock(); }));
  syncStatus();

  // saga autocomplete
  const sagaInput = document.getElementById('f-saga');
  const sagaBox = document.getElementById('sagaSuggestions');
  sagaInput.addEventListener('input', () => {
    draft.saga = sagaInput.value || null;
    const q = sagaInput.value.trim().toLowerCase();
    const matches = q ? existingSagas.filter(s => s.toLowerCase().includes(q)) : [];
    if (matches.length === 0) { sagaBox.hidden = true; return; }
    sagaBox.hidden = false;
    sagaBox.innerHTML = matches.map(s => `<button type="button" data-saga="${escapeAttr(s)}">${escapeHtml(s)}</button>`).join('');
    sagaBox.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      sagaInput.value = b.dataset.saga; draft.saga = b.dataset.saga; sagaBox.hidden = true;
    }));
  });

  // genre chips
  const genreBox = document.getElementById('genreChips');
  ALL_GENRES.forEach(g => {
    const chip = document.createElement('button');
    chip.type = 'button'; chip.className = 'chip'; chip.textContent = g;
    chip.classList.toggle('active', draft.genres.includes(g));
    chip.addEventListener('click', () => {
      draft.genres = draft.genres.includes(g) ? draft.genres.filter(x => x !== g) : [...draft.genres, g];
      chip.classList.toggle('active');
      renderRaterBlock();
    });
    genreBox.appendChild(chip);
  });

  // format chips
  const formatBox = document.getElementById('formatChips');
  FORMATS.forEach(f => {
    const chip = document.createElement('button');
    chip.type = 'button'; chip.className = 'chip format'; chip.textContent = `${f.icon} ${f.label}`;
    chip.classList.toggle('active', draft.format === f.id);
    chip.addEventListener('click', () => {
      draft.format = draft.format === f.id ? null : f.id;
      [...formatBox.children].forEach(c => c.classList.remove('active'));
      if (draft.format) chip.classList.add('active');
    });
    formatBox.appendChild(chip);
  });

  document.getElementById('cancelBtn').addEventListener('click', () => { draft = null; renderForm(); refreshTbrShortcut(); });
  document.getElementById('saveBtn').addEventListener('click', saveDraft);

  renderRaterBlock();
}

function renderRaterBlock() {
  const block = document.getElementById('raterBlock');
  if (!block) return;
  if (draft.status !== 'przeczytana') {
    block.innerHTML = `<p class="empty-note" style="margin-top:10px;">Ocenianie odblokuje się, gdy oznaczysz książkę jako przeczytaną.</p>`;
    return;
  }
  const criteria = criteriaForGenres(draft.genres);
  block.innerHTML = `
    <div class="rater-block">
      <div class="rater-user-tabs" id="raterUserTabs"></div>
      <div id="criteriaList"></div>
      <div class="rating-summary" id="ratingSummary"></div>
    </div>
  `;
  const userTabs = document.getElementById('raterUserTabs');
  USERS.forEach(u => {
    const chip = document.createElement('button');
    chip.type = 'button'; chip.className = 'chip';
    chip.textContent = `${u.emoji} ${u.label}`;
    chip.classList.toggle('active', u.id === activeUser);
    chip.addEventListener('click', () => { activeUser = u.id; renderRaterBlock(); });
    userTabs.appendChild(chip);
  });

  const list = document.getElementById('criteriaList');
  criteria.forEach(c => list.appendChild(renderCriterionRow(c)));
  updateSummary(criteria);
}

function renderCriterionRow(crit) {
  const row = document.createElement('div');
  row.className = 'criterion';
  const current = draftScores[activeUser][crit.id];
  row.innerHTML = `
    <div class="c-name">${crit.id}. ${escapeHtml(crit.name)}</div>
    <div class="point-picker" data-crit="${crit.id}"></div>
    <div class="c-question">${escapeHtml(crit.question)}</div>
    <div class="c-level-text">${current ? escapeHtml(crit.levels[current - 1]) : '—'}</div>
  `;
  const picker = row.querySelector('.point-picker');
  for (let p = 1; p <= 5; p++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = String(p);
    btn.classList.toggle('active', current === p);
    btn.addEventListener('click', () => {
      draftScores[activeUser][crit.id] = p;
      row.querySelector('.c-level-text').textContent = crit.levels[p - 1];
      [...picker.children].forEach((b, i) => b.classList.toggle('active', i + 1 === p));
      updateSummary(criteriaForGenres(draft.genres));
    });
    picker.appendChild(btn);
  }
  return row;
}

function updateSummary(criteria) {
  const box = document.getElementById('ratingSummary');
  if (!box) return;
  const result = calcRating(draftScores[activeUser], draft.genres);
  if (!result) {
    box.innerHTML = `<div class="sub">Zacznij oceniać, żeby zobaczyć wynik.</div>`;
    return;
  }
  box.innerHTML = `
    <div>
      <div class="big-percent">${result.percent}%</div>
      <div class="sub">${result.scoredCount}/${result.totalCriteria} kryteriów ocenionych</div>
    </div>
    <div style="text-align:right;">
      <div class="stars" style="font-size:20px;">${starsToString(result.stars)}</div>
      <span class="tier-badge" style="background:${result.tier.color};color:${result.tier.textColor};">
        <span class="dot" style="background:${result.tier.textColor};"></span>${result.tier.label}
      </span>
    </div>
  `;
}

async function saveDraft() {
  if (!draft.title.trim()) { alert('Podaj tytuł książki.'); return; }
  const ratings = { ...draft.ratings };
  USERS.forEach(u => {
    const result = calcRating(draftScores[u.id], draft.genres);
    ratings[u.id] = result ? { scores: draftScores[u.id], percent: result.percent, stars: result.stars, tierId: result.tier.id } : (draft.ratings[u.id] || null);
  });
  const payload = {
    title: draft.title.trim(), author: draft.author.trim() || 'Autor nieznany',
    coverUrl: draft.coverUrl || '', googleBooksId: draft.googleBooksId || '', isbn: draft.isbn || '',
    genres: draft.genres, format: draft.format, saga: draft.saga || null,
    status: draft.status, addedBy: draft.addedBy, wantToRead: draft.wantToRead || {}, ratings,
  };
  if (draft.id) await updateBook(draft.id, payload);
  else await addBook(payload);
  draft = null;
  renderForm();
  refreshTbrShortcut();
}

function escapeHtml(s = '') { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escapeAttr(s = '') { return escapeHtml(s); }

export function openBookForRating(book) {
  startDraft(JSON.parse(JSON.stringify(book)));
}
