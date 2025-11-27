import { state, cacheDOMElements } from './state.js';
import { fetchData } from './dataService.js';
import { loadFromLocalStorage } from './storage.js';
import { applyFilters, applySorting } from './filterSort.js';
import { renderInitialItems } from './renderer.js';
import { attachEventListeners } from './events.js';
import { showLoading, hideLoading, showError } from './utils.js';
import { elements } from './state.js';

export async function loadData() {
  try {
    showLoading(elements);
    
    // Use progressive loading callback
    const data = await fetchData((dataChunk) => {
      // Immediately process and render the data
      state.allItems = dataChunk;
      processData();
    });
    
    // Final update if needed
    if (data && data !== state.allItems) {
      state.allItems = data;
      processData();
    }

  } catch (error) {
    console.error('Failed to load data:', error);
    showError(elements);
  }
}

function processData() {
  applyFilters();
  applySorting();
  renderInitialItems();
  hideLoading(elements);
}

function init() {
  cacheDOMElements();
  loadFromLocalStorage();
  attachEventListeners();
  loadData();
}

// Start application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
