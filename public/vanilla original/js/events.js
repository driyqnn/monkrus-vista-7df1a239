import { state, elements } from './state.js';
import { applyFilters, applySorting } from './filterSort.js';
import { renderInitialItems, loadMoreItems } from './renderer.js';
import { openSidebar, closeSidebar } from './sidebar.js';
import { loadData } from './main.js';

export function attachEventListeners() {
  // Search
  let searchTimeout;
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      elements.clearSearch.classList.toggle('visible', state.searchQuery.length > 0);
      applyFilters();
      applySorting();
      renderInitialItems();
    }, 300);
  });

  elements.clearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearch.classList.remove('visible');
    applyFilters();
    applySorting();
    renderInitialItems();
  });

  // Filters
  elements.filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      elements.filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeFilter = chip.dataset.filter;
      applyFilters();
      applySorting();
      renderInitialItems();
    });
  });

  // Sorting
  elements.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    localStorage.setItem('monkrus_sort', state.sortBy);
    applySorting();
    renderInitialItems();
  });

  // Load more
  elements.loadMoreButton.addEventListener('click', loadMoreItems);

  // Infinite scroll
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage > 0.8 && elements.loadMoreButton.style.display !== 'none') {
        loadMoreItems();
      }
    }, 100);
  });

  // Sidebar
  elements.sidebarToggle.addEventListener('click', openSidebar);
  elements.sidebarClose.addEventListener('click', closeSidebar);
  elements.sidebarOverlay.addEventListener('click', closeSidebar);

  // Retry
  elements.retryButton.addEventListener('click', loadData);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape to close sidebar
    if (e.key === 'Escape' && elements.sidebar.classList.contains('open')) {
      closeSidebar();
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      elements.searchInput.focus();
    }
  });
}
