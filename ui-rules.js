import { UNIVERSAL_CRITERIA, GENRE_BONUS_GROUPS } from './criteria-data.js';
import { BOOKMARK_TIERS, percentToStars, starsToString } from './rating.js';

export function renderRules() {
  renderTierLegend();
  renderCriteriaList();
}

function renderTierLegend() {
  const host = document.getElementById('rulesTierLegend');
  if (!host) return;
  host.innerHTML = BOOKMARK_TIERS.map(t => {
    const starsLow = starsToString(percentToStars(t.min));
    const starsHigh = starsToString(percentToStars(t.max));
    const starsRange = starsLow === starsHigh ? starsLow : `${starsLow} – ${starsHigh}`;
    return `
      <div class="tier-legend-row" style="background:${t.color};color:${t.textColor};">
        <div class="tlr-range">${t.min}–${t.max}%</div>
        <div class="tlr-label">${t.label}</div>
        <div class="tlr-stars">${starsRange}</div>
      </div>
    `;
  }).join('');
}

function renderCriteriaList() {
  const uniHost = document.getElementById('rulesUniversalList');
  const bonusHost = document.getElementById('rulesBonusList');
  if (uniHost) {
    uniHost.innerHTML = UNIVERSAL_CRITERIA.map(c => `
      <div class="rule-criterion">
        <div class="rc-name">${c.id}. ${escapeHtml(c.name)}</div>
        <div class="rc-question">${escapeHtml(c.question)}</div>
      </div>
    `).join('');
  }
  if (bonusHost) {
    bonusHost.innerHTML = GENRE_BONUS_GROUPS.map(g => `
      <div class="rule-bonus-group">
        <h4>${g.icon} ${escapeHtml(g.label)}</h4>
        <div class="rule-criterion">
          <div class="rc-name">${g.criterion.id}. ${escapeHtml(g.criterion.name)}</div>
          <div class="rc-question">${escapeHtml(g.criterion.question)}</div>
        </div>
      </div>
    `).join('');
  }
}

function escapeHtml(s = '') { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
