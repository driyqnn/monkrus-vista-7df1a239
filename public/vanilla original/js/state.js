// Application state
export const state = {
  allItems: [],
  filteredItems: [],
  displayedItems: [],
  currentPage: 0,
  searchQuery: '',
  activeFilter: 'all',
  sortBy: 'name-asc',
  favorites: new Set(),
  recentlyViewed: [],
  expandedCards: new Set(),
  mirrorTests: new Map(),
};

// DOM Elements cache
export const elements = {
  searchInput: null,
  clearSearch: null,
  filterChips: null,
  sortSelect: null,
  itemsList: null,
  loadingState: null,
  errorState: null,
  emptyState: null,
  loadMoreContainer: null,
  loadMoreButton: null,
  autoLoadSpinner: null,
  resultsCount: null,
  sidebar: null,
  sidebarOverlay: null,
  sidebarToggle: null,
  sidebarClose: null,
  favoritesList: null,
  favoritesCount: null,
  recentList: null,
  recentCount: null,
  retryButton: null,
  cardTemplate: null,
  mirrorTemplate: null,
};

export function cacheDOMElements() {
  elements.searchInput = document.getElementById('searchInput');
  elements.clearSearch = document.getElementById('clearSearch');
  elements.filterChips = document.querySelectorAll('.filter-chip');
  elements.sortSelect = document.getElementById('sortSelect');
  elements.itemsList = document.getElementById('itemsList');
  elements.loadingState = document.getElementById('loadingState');
  elements.errorState = document.getElementById('errorState');
  elements.emptyState = document.getElementById('emptyState');
  elements.loadMoreContainer = document.getElementById('loadMoreContainer');
  elements.loadMoreButton = document.getElementById('loadMoreButton');
  elements.autoLoadSpinner = document.getElementById('autoLoadSpinner');
  elements.resultsCount = document.getElementById('resultsCount');
  elements.sidebar = document.getElementById('sidebar');
  elements.sidebarOverlay = document.getElementById('sidebarOverlay');
  elements.sidebarToggle = document.getElementById('sidebarToggle');
  elements.sidebarClose = document.getElementById('sidebarClose');
  elements.favoritesList = document.getElementById('favoritesList');
  elements.favoritesCount = document.getElementById('favoritesCount');
  elements.recentList = document.getElementById('recentList');
  elements.recentCount = document.getElementById('recentCount');
  elements.retryButton = document.getElementById('retryButton');
  elements.cardTemplate = document.getElementById('cardTemplate');
  elements.mirrorTemplate = document.getElementById('mirrorTemplate');
}
