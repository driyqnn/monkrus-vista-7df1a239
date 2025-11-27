import { CONFIG } from './config.js';
import { state, elements } from './state.js';
import { createCard } from './cardComponent.js';
import { showEmpty } from './utils.js';

export function renderInitialItems() {
  state.currentPage = 0;
  state.displayedItems = [];
  elements.itemsList.innerHTML = '';
  loadMoreItems();
}

export function loadMoreItems() {
  const start = state.currentPage * CONFIG.pageSize;
  const end = start + CONFIG.pageSize;
  const newItems = state.filteredItems.slice(start, end);

  if (newItems.length === 0) {
    if (state.displayedItems.length === 0) {
      showEmpty(elements);
    } else {
      elements.loadMoreContainer.style.display = 'none';
    }
    return;
  }

  state.displayedItems.push(...newItems);
  state.currentPage++;

  // Render items
  const fragment = document.createDocumentFragment();
  newItems.forEach(item => {
    const card = createCard(item);
    fragment.appendChild(card);
  });

  elements.itemsList.appendChild(fragment);

  // Show/hide load more button
  if (end >= state.filteredItems.length) {
    elements.loadMoreContainer.style.display = 'none';
  } else {
    elements.loadMoreContainer.style.display = 'block';
  }

  elements.emptyState.style.display = 'none';
}
