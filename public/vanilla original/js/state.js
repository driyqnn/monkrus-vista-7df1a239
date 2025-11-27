export const state = {
  allItems: [],
  filteredItems: [],
  displayedItems: [],
  searchQuery: '',
  activeFilter: 'all',
  sortBy: 'name-asc',
  currentPage: 1,
  totalPages: 0,
  expandedCards: new Set(),
  favorites: new Set(),
  recentlyViewed: [],
  mirrorTests: new Map(),
  isLoadingChunk: false,
};

export const elements = {};

export function cacheDOMElements() {
  elements.searchInput = document.getElementById('searchInput');
  elements.clearSearch = document.getElementById('clearSearch');
  elements.filterChips = document.querySelectorAll('.filter-chip');
  elements.sortSelect = document.getElementById('sortSelect');
  elements.resultsCount = document.getElementById('resultsCount');
  elements.itemsList = document.getElementById('itemsList');
  elements.paginationContainer = document.getElementById('paginationContainer');
  elements.pageNumbers = document.getElementById('pageNumbers');
  elements.prevPage = document.getElementById('prevPage');
  elements.nextPage = document.getElementById('nextPage');
  elements.loadingState = document.getElementById('loadingState');
  elements.errorState = document.getElementById('errorState');
  elements.emptyState = document.getElementById('emptyState');
  elements.retryButton = document.getElementById('retryButton');
  elements.sidebar = document.getElementById('sidebar');
  elements.sidebarToggle = document.getElementById('sidebarToggle');
  elements.sidebarClose = document.getElementById('sidebarClose');
  elements.sidebarOverlay = document.getElementById('sidebarOverlay');
  elements.favoritesList = document.getElementById('favoritesList');
  elements.favoritesCount = document.getElementById('favoritesCount');
  elements.recentList = document.getElementById('recentList');
  elements.recentCount = document.getElementById('recentCount');
  elements.scrollToTop = document.getElementById('scrollToTop');
  elements.cardTemplate = document.getElementById('cardTemplate');
  elements.mirrorTemplate = document.getElementById('mirrorTemplate');
}
