import { CONFIG } from './config.js';
import { state } from './state.js';
import { saveFavorites, saveRecentlyViewed } from './storage.js';
import { renderSidebar } from './sidebar.js';

export function toggleFavorite(item) {
  if (state.favorites.has(item.link)) {
    state.favorites.delete(item.link);
  } else {
    state.favorites.add(item.link);
  }

  // Update UI
  const card = document.querySelector(`[data-link="${item.link}"]`);
  if (card) {
    const btn = card.querySelector('.favorite-button');
    btn.classList.toggle('active');
  }

  // Save to localStorage
  saveFavorites();
  renderSidebar();
}

export function addToRecentlyViewed(item) {
  // Remove if already exists
  state.recentlyViewed = state.recentlyViewed.filter(i => i.link !== item.link);
  
  // Add to start
  state.recentlyViewed.unshift(item);
  
  // Limit to max items
  if (state.recentlyViewed.length > CONFIG.maxRecentItems) {
    state.recentlyViewed.pop();
  }

  // Save to localStorage
  saveRecentlyViewed();
  renderSidebar();
}
