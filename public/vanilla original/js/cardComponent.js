import { CONFIG } from './config.js';
import { state, elements } from './state.js';
import { getCategory, getDomain, highlightText } from './utils.js';
import { renderMirrors } from './mirrorComponent.js';
import { toggleFavorite, addToRecentlyViewed } from './favorites.js';
import { testAllMirrors } from './dataService.js';

export function createSkeletonCard() {
  const skeleton = document.createElement('article');
  skeleton.className = 'card skeleton';
  skeleton.innerHTML = `
    <div class="card-header">
      <div class="card-left">
        <div class="skeleton-icon"></div>
        <div class="card-info">
          <div class="skeleton-title"></div>
          <div class="skeleton-meta"></div>
        </div>
      </div>
      <div class="card-right">
        <div class="skeleton-button"></div>
        <div class="skeleton-button-sm"></div>
      </div>
    </div>
  `;
  return skeleton;
}

export function createCard(item) {
  const card = elements.cardTemplate.content.cloneNode(true);
  const article = card.querySelector('.card');
  
  // Set data attribute
  article.dataset.link = item.link;

  // Title
  const title = card.querySelector('.card-title');
  title.textContent = item.title;
  if (state.searchQuery) {
    highlightText(title, state.searchQuery);
  }

  // Category
  const category = getCategory(item.title);
  const categoryTag = card.querySelector('.category-tag');
  categoryTag.textContent = category;

  // Source link
  const sourceLink = card.querySelector('.source-link');
  sourceLink.href = item.link;

  // Mirror count
  const mirrorCount = card.querySelector('.mirror-count');
  mirrorCount.textContent = `${item.links.length} mirrors`;

  // Favorite button
  const favoriteBtn = card.querySelector('.favorite-button');
  if (state.favorites.has(item.link)) {
    favoriteBtn.classList.add('active');
  }
  favoriteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(item);
  });

  // Best mirror button
  const bestMirrorBtn = card.querySelector('.best-mirror-button');
  if (item.links.length === 0) {
    bestMirrorBtn.disabled = true;
  } else {
    bestMirrorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBestMirror(item);
    });
  }

  // Expand button
  const expandBtn = card.querySelector('.expand-button');
  if (item.links.length === 0) {
    expandBtn.style.display = 'none';
  } else {
    expandBtn.addEventListener('click', () => toggleCard(article, item));
  }

  return card;
}

export function toggleCard(article, item) {
  const content = article.querySelector('.card-content');
  const expandBtn = article.querySelector('.expand-button');
  const isExpanded = state.expandedCards.has(item.link);

  if (isExpanded) {
    // Collapse
    content.style.display = 'none';
    expandBtn.classList.remove('expanded');
    state.expandedCards.delete(item.link);
  } else {
    // Expand
    content.style.display = 'block';
    expandBtn.classList.add('expanded');
    state.expandedCards.add(item.link);

    // Render mirrors if not already rendered
    const mirrorsList = content.querySelector('.mirrors-list');
    if (mirrorsList.children.length === 0) {
      renderMirrors(mirrorsList, item);
    }

    // Add to recently viewed
    addToRecentlyViewed(item);

    // Setup test all button
    const testAllBtn = content.querySelector('.test-all-button');
    testAllBtn.addEventListener('click', () => testAllMirrors(item, mirrorsList));
  }
}

function openBestMirror(item) {
  if (item.links.length === 0) return;

  const tests = state.mirrorTests.get(item.link);
  let bestMirror = null;

  if (tests) {
    // Find fastest preferred mirror
    const preferredMirrors = item.links.filter(mirror => {
      const domain = getDomain(mirror);
      return CONFIG.preferredMirrors.some(pref => domain.includes(pref));
    });

    if (preferredMirrors.length > 0) {
      bestMirror = preferredMirrors.reduce((best, current) => {
        const bestTest = tests[best];
        const currentTest = tests[current];
        
        if (!bestTest) return current;
        if (!currentTest) return best;
        
        if (!bestTest.online) return current;
        if (!currentTest.online) return best;
        
        return currentTest.time < bestTest.time ? current : best;
      });
    } else {
      // Find fastest among all
      const onlineMirrors = item.links.filter(m => tests[m]?.online);
      if (onlineMirrors.length > 0) {
        bestMirror = onlineMirrors.reduce((best, current) => {
          return tests[current].time < tests[best].time ? current : best;
        });
      }
    }
  }

  // If no tests or no online mirrors, use first preferred or just first
  if (!bestMirror) {
    const preferredMirrors = item.links.filter(mirror => {
      const domain = getDomain(mirror);
      return CONFIG.preferredMirrors.some(pref => domain.includes(pref));
    });
    bestMirror = preferredMirrors.length > 0 ? preferredMirrors[0] : item.links[0];
  }

  window.open(bestMirror, '_blank', 'noopener,noreferrer');
}
