import { CONFIG } from './config.js';
import { state, elements } from './state.js';
import { getDomain, highlightText, copyToClipboard } from './utils.js';
import { updateMirrorStatus } from './dataService.js';

export function createMirrorItem(mirror, item) {
  const mirrorEl = elements.mirrorTemplate.content.cloneNode(true);
  const li = mirrorEl.querySelector('.mirror-item');
  const link = mirrorEl.querySelector('.mirror-link');

  if (!li || !link) {
    console.error('Mirror template elements not found');
    return document.createDocumentFragment();
  }

  // Set the href - THIS IS THE KEY!
  link.href = mirror;

  // Check if recommended
  const domain = getDomain(mirror);
  const isRecommended = CONFIG.preferredMirrors.some(pref => 
    domain.includes(pref)
  );

  if (isRecommended) {
    li.classList.add('recommended');
    link.classList.add('recommended');
  }

  // Domain
  const domainEl = li.querySelector('.mirror-domain');
  if (domainEl) {
    domainEl.textContent = domain;
    if (state.searchQuery) {
      highlightText(domainEl, state.searchQuery);
    }
  }

  // Add recommended badge if applicable
  if (isRecommended) {
    const badge = document.createElement('span');
    badge.className = 'recommended-badge';
    badge.textContent = 'recommended';
    link.appendChild(badge);
  }

  // Status
  const statusEl = li.querySelector('.mirror-status');
  const timeEl = li.querySelector('.mirror-time');

  // Check cached test
  const tests = state.mirrorTests.get(item.link);
  if (tests && tests[mirror]) {
    updateMirrorStatus(statusEl, timeEl, tests[mirror]);
  }

  // Store mirror URL for testing
  li.dataset.mirror = mirror;

  return mirrorEl;
}

export function renderMirrors(mirrorsList, item) {
  if (!item.links || item.links.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();
  
  item.links.forEach(mirror => {
    const mirrorItem = createMirrorItem(mirror, item);
    fragment.appendChild(mirrorItem);
  });

  mirrorsList.appendChild(fragment);
}
