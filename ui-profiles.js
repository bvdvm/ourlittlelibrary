import { USERS } from './config.js';
import { BOOKMARK_TIERS, tierForPercent, starsToString } from './rating.js';

let onOpenBook = () => {};

export function initProfilesPanel(openBookCallback) {
  onOpenBook = openBookCallback || (() => {});
}

function avg(nums) { return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null; }

function topByCount(entries) {
  // entries: [ [key, count], ... ] -> zwraca klucz z najwyższym count (pierwszy przy remisie)
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

export function renderProfiles(books) {
  USERS.forEach(u => renderProfile(u, books));
}

function renderProfile(user, books) {
  const host = document.getElementById(`profile-${user.id}`);
  if (!host) return;

  const readBooks = books.filter(b => b.readStatus?.[user.id] === 'przeczytana');
  const inProgress = books.filter(b => b.readStatus?.[user.id] === 'w trakcie').length;
  const tbrCount = books.filter(b => b.readStatus?.[user.id] === 'tbr').length;
  const ratedBooks = readBooks.filter(b => b.ratings?.[user.id]);
  const percents = ratedBooks.map(b => b.ratings[user.id].percent);
  const avgPercent = avg(percents);
  const avgTier = avgPercent !== null ? tierForPercent(avgPercent) : null;

  // ulubiony gatunek — najczęściej występujący wśród przeczytanych książek
  const genreCounts = {};
  readBooks.forEach(b => (b.genres || []).forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; }));
  const favGenre = topByCount(Object.entries(genreCounts));

  // ulubiony autor — najwyżej oceniony średnio (spośród ocenionych przez tę osobę)
  const authorScores = {};
  ratedBooks.forEach(b => {
    const key = (b.author || 'Autor nieznany').trim();
    if (!authorScores[key]) authorScores[key] = [];
    authorScores[key].push(b.ratings[user.id].percent);
  });
  let favAuthor = null, favAuthorAvg = null;
  Object.entries(authorScores).forEach(([author, list]) => {
    const a = avg(list);
    if (favAuthorAvg === null || a > favAuthorAvg) { favAuthor = author; favAuthorAvg = a; }
  });

  // rozkład zakładek
  const tierCounts = {};
  BOOKMARK_TIERS.forEach(t => { tierCounts[t.id] = 0; });
  ratedBooks.forEach(b => { const t = tierForPercent(b.ratings[user.id].percent); tierCounts[t.id]++; });
  const maxTierCount = Math.max(1, ...Object.values(tierCounts));

  // top 3 najwyżej ocenione
  const top = [...ratedBooks].sort((a, b) => b.ratings[user.id].percent - a.ratings[user.id].percent).slice(0, 3);

  host.innerHTML = `
    <div class="profile-card">
      <div class="profile-head">
        <img class="profile-photo" src="${user.photo || ''}" alt="${escapeHtml(user.label)}" onerror="this.style.visibility='hidden'" />
        <div>
          <h3>${user.emoji} ${escapeHtml(user.label)}</h3>
          <div class="profile-sub">${readBooks.length} przeczytanych książek</div>
        </div>
      </div>

      <div class="profile-stats-grid">
        <div class="pstat"><b>${readBooks.length}</b><span>przeczytane</span></div>
        <div class="pstat"><b>${inProgress}</b><span>w trakcie</span></div>
        <div class="pstat"><b>${tbrCount}</b><span>do przeczytania</span></div>
        <div class="pstat"><b>${avgPercent !== null ? avgPercent + '%' : '—'}</b><span>średnia ocena</span></div>
      </div>

      <div class="profile-facts">
        <div class="pfact"><span class="pfact-label">Ulubiony gatunek</span><span class="pfact-value">${favGenre ? escapeHtml(favGenre) : '—'}</span></div>
        <div class="pfact"><span class="pfact-label">Ulubiony autor</span><span class="pfact-value">${favAuthor ? escapeHtml(favAuthor) + (favAuthorAvg !== null ? ` (${favAuthorAvg}%)` : '') : '—'}</span></div>
        <div class="pfact"><span class="pfact-label">Ogólny poziom</span><span class="pfact-value">${avgTier ? `<span class="tier-dot" style="background:${avgTier.color};"></span>${avgTier.label}` : '—'}</span></div>
      </div>

      <div class="profile-tiers">
        <label>Rozkład zakładek</label>
        <div class="tier-bars">
          ${BOOKMARK_TIERS.map(t => `
            <div class="tier-bar-row">
              <span class="tbr-label">${t.label.replace(' zakładka', '')}</span>
              <div class="tbr-track"><div class="tbr-fill" style="width:${(tierCounts[t.id] / maxTierCount) * 100}%;background:${t.color};"></div></div>
              <span class="tbr-count">${tierCounts[t.id]}</span>
            </div>
          `).join('')}
        </div>
      </div>

      ${top.length ? `
        <div class="profile-top">
          <label>Najwyżej ocenione</label>
          <div class="profile-top-list" id="profileTop-${user.id}"></div>
        </div>
      ` : ''}
    </div>
  `;

  const topBox = document.getElementById(`profileTop-${user.id}`);
  if (topBox) {
    top.forEach(b => {
      const r = b.ratings[user.id];
      const tier = tierForPercent(r.percent);
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'profile-top-book';
      el.innerHTML = `
        <img src="${b.coverUrl || ''}" alt="" onerror="this.style.visibility='hidden'" />
        <div>
          <div class="ptb-title">${escapeHtml(b.title)}</div>
          <div class="ptb-rating"><span class="tier-dot" style="background:${tier.color};"></span>${r.percent}% · ${starsToString(r.stars)}</div>
        </div>
      `;
      el.addEventListener('click', () => onOpenBook(b));
      topBox.appendChild(el);
    });
  }
}

function escapeHtml(s = '') { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
