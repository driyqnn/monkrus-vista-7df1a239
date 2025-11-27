import { state, elements } from './state.js';

export function loadFromLocalStorage() {
  // Favorites
  try {
    const favorites = localStorage.getItem('monkrus_favorites');
    if (favorites) {
      state.favorites = new Set(JSON.parse(favorites));
    }
  } catch (error) {
    console.warn('Failed to load favorites:', error);
  }

  // Recently viewed
  try {
    const recent = localStorage.getItem('monkrus_recent');
    if (recent) {
      state.recentlyViewed = JSON.parse(recent);
    }
  } catch (error) {
    console.warn('Failed to load recent items:', error);
  }

  // Sort preference
  try {
    const sort = localStorage.getItem('monkrus_sort');
    if (sort) {
      state.sortBy = sort;
      elements.sortSelect.value = sort;
    }
  } catch (error) {
    console.warn('Failed to load sort preference:', error);
  }
}

export function saveFavorites() {
  try {
    localStorage.setItem('monkrus_favorites', JSON.stringify([...state.favorites]));
  } catch (error) {
    console.warn('Failed to save favorites:', error);
  }
}

export function saveRecentlyViewed() {
  try {
    localStorage.setItem('monkrus_recent', JSON.stringify(state.recentlyViewed));
  } catch (error) {
    console.warn('Failed to save recent items:', error);
  }
}
