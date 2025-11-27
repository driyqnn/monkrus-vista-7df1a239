// ============= CONFIGURATION =============
const CONFIG = {
  dataUrl: 'https://raw.githubusercontent.com/dvuzu/monkrus-search/refs/heads/main/scraped_data.json',
  pageSize: 50,
  preferredMirrors: ['pb.wtf', 'uztracker.net'],
  cacheDuration: 5 * 60 * 1000,
  pingTimeout: 5000,
  maxRecentItems: 10,
};

// ============= STATE =============
const state = {
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

// ============= DOM ELEMENTS =============
const elements = {};

function cacheDOMElements() {
  console.log('📍 Caching DOM elements...');
  elements.searchInput = document.getElementById('searchInput');
  elements.clearSearch = document.getElementById('clearSearch');
  elements.filterChips = document.querySelectorAll('.filter-chip');
  elements.sortSelect = document.getElementById('sortSelect');
  elements.itemsList = document.getElementById('itemsList');
  elements.loadingState = document.getElementById('loadingState');
  elements.errorState = document.getElementById('errorState');
  elements.emptyState = document.getElementById('emptyState');
  elements.resultsCount = document.getElementById('resultsCount');
  elements.prevPage = document.getElementById('prevPage');
  elements.nextPage = document.getElementById('nextPage');
  elements.pageNumbers = document.getElementById('pageNumbers');
  elements.paginationContainer = document.getElementById('paginationContainer');
  elements.scrollToTop = document.getElementById('scrollToTop');
  elements.sidebar = document.getElementById('sidebar');
  elements.sidebarToggle = document.getElementById('sidebarToggle');
  elements.sidebarClose = document.getElementById('sidebarClose');
  elements.sidebarOverlay = document.getElementById('sidebarOverlay');
  elements.favoritesList = document.getElementById('favoritesList');
  elements.recentList = document.getElementById('recentList');
  elements.favoritesCount = document.getElementById('favoritesCount');
  elements.recentCount = document.getElementById('recentCount');
  elements.retryButton = document.getElementById('retryButton');
  elements.cardTemplate = document.getElementById('cardTemplate');
  elements.mirrorTemplate = document.getElementById('mirrorTemplate');
  
  console.log('✓ DOM elements cached');
}

// ============= DATA LOADING =============
async function fetchData() {
  console.log('🚀 Fetching data from:', CONFIG.dataUrl);
  
  try {
    const response = await fetch(CONFIG.dataUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✓ Data fetched:', data.length, 'items');
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format');
    }
    
    return data;
  } catch (error) {
    console.error('✗ Fetch failed:', error);
    throw error;
  }
}

async function loadData() {
  console.log('📥 Starting data load...');
  
  try {
    state.isLoadingChunk = true;
    showLoading();
    
    const data = await fetchData();
    
    state.allItems = data;
    state.isLoadingChunk = false;
    
    console.log('✓ Processing', data.length, 'items');
    
    applyFilters();
    applySorting();
    renderInitialItems();
    hideLoading();
    
    console.log('✓ Data loaded successfully');
  } catch (error) {
    console.error('✗ Load failed:', error.message);
    state.isLoadingChunk = false;
    showError();
  }
}

// ============= UTILITIES =============
function getCategory(title) {
  const lower = title.toLowerCase();
  if (lower.includes('adobe')) return 'Adobe';
  if (lower.includes('autodesk')) return 'Autodesk';
  if (lower.includes('microsoft')) return 'Microsoft';
  return 'Other';
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function showLoading() {
  elements.loadingState.style.display = 'block';
  elements.errorState.style.display = 'none';
  elements.emptyState.style.display = 'none';
  elements.itemsList.innerHTML = '';
}

function hideLoading() {
  elements.loadingState.style.display = 'none';
}

function showError() {
  elements.loadingState.style.display = 'none';
  elements.errorState.style.display = 'block';
  elements.emptyState.style.display = 'none';
}

function showEmpty() {
  elements.emptyState.style.display = 'block';
  elements.paginationContainer.style.display = 'none';
}

// ============= FILTERS & SORTING =============
function applyFilters() {
  let filtered = state.allItems;

  if (state.activeFilter !== 'all') {
    filtered = filtered.filter(item => {
      const title = item.title.toLowerCase();
      return title.includes(state.activeFilter);
    });
  }

  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(item => {
      return item.title.toLowerCase().includes(query) ||
             item.links.some(link => link.toLowerCase().includes(query));
    });
  }

  state.filteredItems = filtered;
  updateResultsCount();
}

function applySorting() {
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
  }

  state.filteredItems = items;
}

function updateResultsCount() {
  const count = state.filteredItems.length;
  const total = state.allItems.length;
  elements.resultsCount.textContent = `Showing ${count} of ${total} items`;
}

// ============= RENDERING =============
function renderInitialItems() {
  state.currentPage = 1;
  state.totalPages = Math.ceil(state.filteredItems.length / CONFIG.pageSize);
  renderCurrentPage();
}

function renderCurrentPage() {
  const start = (state.currentPage - 1) * CONFIG.pageSize;
  const end = start + CONFIG.pageSize;
  const pageItems = state.filteredItems.slice(start, end);

  if (pageItems.length === 0 && state.currentPage === 1) {
    showEmpty();
    return;
  }

  elements.itemsList.innerHTML = '';
  elements.emptyState.style.display = 'none';
  
  pageItems.forEach(item => {
    const card = createCard(item);
    elements.itemsList.appendChild(card);
  });
  
  updatePagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createCard(item) {
  const card = elements.cardTemplate.content.cloneNode(true);
  const article = card.querySelector('.card');
  
  article.dataset.link = item.link;

  const title = card.querySelector('.card-title');
  title.textContent = item.title;

  const categoryTag = card.querySelector('.category-tag');
  categoryTag.textContent = getCategory(item.title);

  const sourceLink = card.querySelector('.source-link');
  sourceLink.href = item.link;

  const mirrorCount = card.querySelector('.mirror-count');
  mirrorCount.textContent = `${item.links.length} mirrors`;

  const favoriteBtn = card.querySelector('.favorite-button');
  if (state.favorites.has(item.link)) {
    favoriteBtn.classList.add('active');
  }

  const bestMirrorBtn = card.querySelector('.best-mirror-button');
  if (item.links.length === 0) {
    bestMirrorBtn.disabled = true;
  } else {
    bestMirrorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(item.links[0], '_blank');
    });
  }

  const expandBtn = card.querySelector('.expand-button');
  if (item.links.length === 0) {
    expandBtn.style.display = 'none';
  } else {
    expandBtn.addEventListener('click', () => toggleCard(article, item));
  }

  return card;
}

function toggleCard(article, item) {
  const content = article.querySelector('.card-content');
  const expandBtn = article.querySelector('.expand-button');
  const isExpanded = state.expandedCards.has(item.link);

  if (isExpanded) {
    content.style.display = 'none';
    expandBtn.classList.remove('expanded');
    state.expandedCards.delete(item.link);
  } else {
    content.style.display = 'block';
    expandBtn.classList.add('expanded');
    state.expandedCards.add(item.link);

    const mirrorsList = content.querySelector('.mirrors-list');
    if (mirrorsList.children.length === 0) {
      renderMirrors(mirrorsList, item);
    }
  }
}

function renderMirrors(mirrorsList, item) {
  item.links.forEach(mirror => {
    const mirrorItem = createMirrorItem(mirror, item);
    mirrorsList.appendChild(mirrorItem);
  });
}

function createMirrorItem(mirror, item) {
  const mirrorEl = elements.mirrorTemplate.content.cloneNode(true);
  const li = mirrorEl.querySelector('.mirror-item');

  const domain = getDomain(mirror);
  const isRecommended = CONFIG.preferredMirrors.some(pref => domain.includes(pref));

  if (isRecommended) {
    li.classList.add('recommended');
  }

  const domainEl = li.querySelector('.mirror-domain');
  domainEl.textContent = domain;

  const downloadBtn = li.querySelector('.download-button');
  downloadBtn.href = mirror;

  const copyBtn = li.querySelector('.copy-button');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mirror);
      copyBtn.classList.add('copied');
      setTimeout(() => copyBtn.classList.remove('copied'), 2000);
    } catch (error) {
      console.warn('Copy failed:', error);
    }
  });

  li.dataset.mirror = mirror;

  return mirrorEl;
}

function updatePagination() {
  if (state.totalPages <= 1) {
    elements.paginationContainer.style.display = 'none';
    return;
  }

  elements.paginationContainer.style.display = 'flex';
  elements.prevPage.disabled = state.currentPage === 1;
  elements.nextPage.disabled = state.currentPage === state.totalPages;
}

// ============= EVENT HANDLERS =============
function attachEventListeners() {
  console.log('🔗 Attaching event listeners...');

  // Search
  elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    elements.clearSearch.style.display = state.searchQuery ? 'block' : 'none';
    applyFilters();
    applySorting();
    renderInitialItems();
  });

  elements.clearSearch.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchQuery = '';
    elements.clearSearch.style.display = 'none';
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

  // Sort
  elements.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    applySorting();
    renderInitialItems();
  });

  // Pagination
  elements.prevPage.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderCurrentPage();
    }
  });

  elements.nextPage.addEventListener('click', () => {
    if (state.currentPage < state.totalPages) {
      state.currentPage++;
      renderCurrentPage();
    }
  });

  // Retry button
  elements.retryButton.addEventListener('click', () => {
    loadData();
  });

  console.log('✓ Event listeners attached');
}

// ============= INITIALIZATION =============
function init() {
  console.log('🎬 Initializing app...');
  cacheDOMElements();
  attachEventListeners();
  loadData();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
