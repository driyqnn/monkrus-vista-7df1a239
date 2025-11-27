import { CONFIG } from './config.js';
import { state, elements } from './state.js';
import { getDomain, highlightText, copyToClipboard } from './utils.js';
import { updateMirrorStatus } from './dataService.js';

export function createMirrorItem(mirror, item) {
  const mirrorEl = elements.mirrorTemplate.content.cloneNode(true);
  const li = mirrorEl.querySelector('.mirror-item');

  // Check if recommended
  const domain = getDomain(mirror);
  const isRecommended = CONFIG.preferredMirrors.some(pref => 
    domain.includes(pref)
  );

  if (isRecommended) {
    li.classList.add('recommended');
  }

  // Domain
  const domainEl = li.querySelector('.mirror-domain');
  domainEl.textContent = domain;
  if (state.searchQuery) {
    highlightText(domainEl, state.searchQuery);
  }

  // Add recommended badge if applicable
  if (isRecommended) {
    const badge = document.createElement('span');
    badge.className = 'recommended-badge';
    badge.textContent = 'recommended';
    li.appendChild(badge);
  }

  // Status
  const statusEl = li.querySelector('.mirror-status');
  const timeEl = li.querySelector('.mirror-time');

  // Check cached test
  const tests = state.mirrorTests.get(item.link);
  if (tests && tests[mirror]) {
    updateMirrorStatus(statusEl, timeEl, tests[mirror]);
  }

  // Make entire item clickable
  li.addEventListener('click', () => {
    window.open(mirror, '_blank');
  });

  // Store mirror URL for testing
  li.dataset.mirror = mirror;

  return mirrorEl;
}

export function renderMirrors(mirrorsList, item) {
  const fragment = document.createDocumentFragment();
  
  item.links.forEach(mirror => {
    const mirrorItem = createMirrorItem(mirror, item);
    fragment.appendChild(mirrorItem);
  });

  mirrorsList.appendChild(fragment);
}
