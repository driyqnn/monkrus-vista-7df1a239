import { state, elements } from './state.js';

export function applyFilters() {
  let filtered = state.allItems;

  // Apply category filter
  if (state.activeFilter !== 'all') {
    filtered = filtered.filter(item => {
      const title = item.title.toLowerCase();
      return title.includes(state.activeFilter);
    });
  }

  // Apply search
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const mirrorMatch = item.links.some(link => 
        link.toLowerCase().includes(query)
      );
      return titleMatch || mirrorMatch;
    });
  }

  state.filteredItems = filtered;
  updateResultsCount();
}

export function applySorting() {
  const items = [...state.filteredItems];

  switch (state.sortBy) {
    case 'name-asc':
      items.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'name-desc':
      items.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case 'mirrors-desc':
      items.sort((a, b) => b.links.length - a.links.length);
      break;
    case 'fastest':
      items.sort((a, b) => {
        const aFastest = getFastestMirrorTime(a);
        const bFastest = getFastestMirrorTime(b);
        return aFastest - bFastest;
      });
      break;
  }

  state.filteredItems = items;
}

function getFastestMirrorTime(item) {
  const tests = state.mirrorTests.get(item.link);
  if (!tests) return Infinity;

  const times = Object.values(tests)
    .map(t => t.time)
    .filter(t => t !== null);

  return times.length > 0 ? Math.min(...times) : Infinity;
}

function updateResultsCount() {
  const count = state.filteredItems.length;
  const total = state.allItems.length;
  elements.resultsCount.textContent = `Showing ${count} of ${total} items`;
}
