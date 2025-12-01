import { CONFIG } from './config.js';
import { state, elements } from './state.js';
import { getDomain, highlightText, copyToClipboard } from './utils.js';
import { updateMirrorStatus } from './dataService.js';

export function createMirrorItem(mirror, item) {
  const mirrorEl = elements.mirrorTemplate.content.cloneNode(true);
  const li = mirrorEl.querySelector('.mirror-item');

  if (!li) {
    console.error('Mirror template not found');
    return document.createDocumentFragment();
  }

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

  // Store mirror URL for testing
  li.dataset.mirror = mirror;
  li.dataset.url = mirror;

  // Make entire item clickable - attach before returning
  li.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(mirror, '_blank', 'noopener,noreferrer');
  });

  return mirrorEl;
}

export function renderMirrors(mirrorsList, item) {
  console.log('renderMirrors called:', {
    item: item.title,
    linksCount: item.links?.length,
    links: item.links,
    mirrorsListElement: mirrorsList
  });

  if (!item.links || item.links.length === 0) {
    console.warn('No mirrors to render for item:', item.title);
    return;
  }

  const fragment = document.createDocumentFragment();
  
  item.links.forEach((mirror, index) => {
    console.log(`Creating mirror ${index + 1}/${item.links.length}:`, mirror);
    const mirrorItem = createMirrorItem(mirror, item);
    fragment.appendChild(mirrorItem);
  });

  console.log('Appending', item.links.length, 'mirrors to list');
  mirrorsList.appendChild(fragment);
  
  console.log('Mirrors rendered. List children count:', mirrorsList.children.length);
}
