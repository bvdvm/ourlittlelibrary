import { initStore, subscribeBooks, subscribePickLists, DEMO_MODE } from './store.js';
import { initRatePanel, refreshTbrShortcut, openBookForRating } from './ui-rate.js';
import { renderSagas } from './ui-sagas.js';
import { initRankingPanel, renderRanking } from './ui-ranking.js';
import { initTbrPanel, renderTBR } from './ui-tbr.js';
import { initDrawPanel, renderDraw } from './ui-draw.js';

let books = [];
let pickLists = [];

function switchTab(panelKey) {
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === `panel-${panelKey}`));
  document.querySelectorAll('.bookmark-tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.panel === panelKey)));
  if (panelKey === 'ocen') refreshTbrShortcut();
}

function setupNav() {
  document.querySelectorAll('.bookmark-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.panel));
  });
}

function updateStats() {
  const read = books.filter(b => b.status === 'przeczytana').length;
  const sagas = new Set(books.filter(b => b.saga).map(b => b.saga)).size;
  const shared = books.filter(b => b.ratings?.karolina && b.ratings?.ola);
  const sharedAvg = shared.length
    ? Math.round((shared.reduce((s, b) => s + (b.ratings.karolina.percent + b.ratings.ola.percent) / 2, 0) / shared.length) * 10) / 10
    : null;
  document.getElementById('statStrip').innerHTML = `
    <div class="stat"><b>${read}</b><span>przeczytane</span></div>
    <div class="stat"><b>${sagas}</b><span>sagi</span></div>
    <div class="stat"><b>${sharedAvg !== null ? sharedAvg + '%' : '—'}</b><span>wspólna średnia</span></div>
    <div class="stat"><b>${books.filter(b => b.status === 'tbr').length}</b><span>w TBR</span></div>
  `;
}

function rerenderAll() {
  updateStats();
  renderSagas(books);
  renderRanking(books);
  renderTBR(books);
  renderDraw(books, pickLists);
  refreshTbrShortcut();
}

async function main() {
  setupNav();
  initRankingPanel();
  initDrawPanel();
  initTbrPanel(book => { switchTab('ocen'); openBookForRating(book); });
  initRatePanel(() => books);

  const { demo } = await initStore();
  document.getElementById('demoBanner').hidden = !demo;

  subscribeBooks(list => { books = list; rerenderAll(); });
  subscribePickLists(list => { pickLists = list; renderDraw(books, pickLists); });
}

main();
