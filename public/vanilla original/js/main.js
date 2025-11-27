import { state, cacheDOMElements } from './state.js';
import { fetchData } from './dataService.js';
import { loadFromLocalStorage } from './storage.js';
import { applyFilters, applySorting } from './filterSort.js';
import { renderInitialItems } from './renderer.js';
import { attachEventListeners } from './events.js';
import { showLoading, hideLoading, showError } from './utils.js';
import { elements } from './state.js';
import { loadingProgress } from './loadingProgress.js';

export async function loadData() {
  console.log('🚀 Starting data load...');
  try {
    state.isLoadingChunk = true;
    showLoading(elements);
    loadingProgress.show('Loading data...');
    loadingProgress.update(10, 'Checking cache...');
    
    // Use progressive loading callback
    const data = await fetchData((dataChunk) => {
      console.log('✓ Data chunk received:', dataChunk.length, 'items');
      loadingProgress.update(60, 'Processing data...');
      
      // Immediately process and render the data
      state.allItems = dataChunk;
      state.isLoadingChunk = false;
      processData();
      
      loadingProgress.update(90, 'Rendering...');
    });
    
    // Final update if needed
    if (data && data !== state.allItems) {
      console.log('✓ Final data update:', data.length, 'items');
      state.allItems = data;
      state.isLoadingChunk = false;
      processData();
    }

    loadingProgress.update(100, 'Done!');
    setTimeout(() => loadingProgress.hide(), 500);

  } catch (error) {
    console.error('✗ Failed to load data:', error.message);
    state.isLoadingChunk = false;
    showError(elements);
    loadingProgress.error(error.message);
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
