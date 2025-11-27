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

// ============= LOCAL STORAGE =============
function loadFromLocalStorage() {
  try {
    const favorites = localStorage.getItem('monkrus_favorites');
    if (favorites) {
      state.favorites = new Set(JSON.parse(favorites));
    }
  } catch (error) {
    console.warn('Failed to load favorites:', error);
  }

  try {
    const recent = localStorage.getItem('monkrus_recent');
    if (recent) {
      state.recentlyViewed = JSON.parse(recent);
    }
  } catch (error) {
    console.warn('Failed to load recent items:', error);
  }

  try {
    const sort = localStorage.getItem('monkrus_sort');
    if (sort) {
      state.sortBy = sort;
    }
  } catch (error) {
    console.warn('Failed to load sort preference:', error);
  }
}

function saveFavorites() {
  try {
    localStorage.setItem('monkrus_favorites', JSON.stringify([...state.favorites]));
  } catch (error) {
    console.warn('Failed to save favorites:', error);
  }
}

function saveRecentlyViewed() {
  try {
    localStorage.setItem('monkrus_recent', JSON.stringify(state.recentlyViewed));
  } catch (error) {
    console.warn('Failed to save recent items:', error);
  }
}

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

function highlightText(element, query) {
  const text = element.textContent;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const highlighted = text.replace(regex, '<mark>$1</mark>');
  element.innerHTML = highlighted;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  if (state.searchQuery) {
    highlightText(title, state.searchQuery);
  }

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
  favoriteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(item);
  });

  const bestMirrorBtn = card.querySelector('.best-mirror-button');
  if (item.links.length === 0) {
    bestMirrorBtn.disabled = true;
  } else {
    bestMirrorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBestMirror(item);
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

    addToRecentlyViewed(item);
  }
}

function openBestMirror(item) {
  if (item.links.length === 0) return;

  const tests = state.mirrorTests.get(item.link);
  let bestMirror = null;

  if (tests) {
    const preferredMirrors = item.links.filter(mirror => {
      const domain = getDomain(mirror);
      return CONFIG.preferredMirrors.some(pref => domain.includes(pref));
    });

    if (preferredMirrors.length > 0) {
      bestMirror = preferredMirrors.reduce((best, current) => {
        const bestTest = tests[best];
        const currentTest = tests[current];
        
        if (!bestTest) return current;
        if (!currentTest) return best;
        if (!bestTest.online) return current;
        if (!currentTest.online) return best;
        
        return currentTest.time < bestTest.time ? current : best;
      });
    } else {
      const onlineMirrors = item.links.filter(m => tests[m]?.online);
      if (onlineMirrors.length > 0) {
        bestMirror = onlineMirrors.reduce((best, current) => {
          return tests[current].time < tests[best].time ? current : best;
        });
      }
    }
  }

  if (!bestMirror) {
    const preferredMirrors = item.links.filter(mirror => {
      const domain = getDomain(mirror);
      return CONFIG.preferredMirrors.some(pref => domain.includes(pref));
    });
    bestMirror = preferredMirrors.length > 0 ? preferredMirrors[0] : item.links[0];
  }

  window.open(bestMirror, '_blank', 'noopener,noreferrer');
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
  if (state.searchQuery) {
    highlightText(domainEl, state.searchQuery);
  }

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
  renderPageNumbers();
}

function renderPageNumbers() {
  if (!elements.pageNumbers) return;
  
  elements.pageNumbers.innerHTML = '';
  const maxVisible = 7;
  let startPage = Math.max(1, state.currentPage - 3);
  let endPage = Math.min(state.totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    createPageButton(1);
    if (startPage > 2) {
      createEllipsis();
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    createPageButton(i);
  }

  if (endPage < state.totalPages) {
    if (endPage < state.totalPages - 1) {
      createEllipsis();
    }
    createPageButton(state.totalPages);
  }
}

function createPageButton(pageNum) {
  const button = document.createElement('button');
  button.className = 'page-number';
  button.textContent = pageNum;
  
  if (pageNum === state.currentPage) {
    button.classList.add('active');
    button.setAttribute('aria-current', 'page');
  }
  
  button.addEventListener('click', () => {
    if (pageNum !== state.currentPage) {
      state.currentPage = pageNum;
      renderCurrentPage();
    }
  });
  elements.pageNumbers.appendChild(button);
}

function createEllipsis() {
  const ellipsis = document.createElement('span');
  ellipsis.className = 'page-ellipsis';
  ellipsis.textContent = '...';
  elements.pageNumbers.appendChild(ellipsis);
}

// ============= FAVORITES & RECENT =============
function toggleFavorite(item) {
  if (state.favorites.has(item.link)) {
    state.favorites.delete(item.link);
  } else {
    state.favorites.add(item.link);
  }

  const card = document.querySelector(`[data-link="${item.link}"]`);
  if (card) {
    const btn = card.querySelector('.favorite-button');
    btn.classList.toggle('active');
  }

  saveFavorites();
  renderSidebar();
}

function addToRecentlyViewed(item) {
  state.recentlyViewed = state.recentlyViewed.filter(i => i.link !== item.link);
  state.recentlyViewed.unshift(item);
  
  if (state.recentlyViewed.length > CONFIG.maxRecentItems) {
    state.recentlyViewed.pop();
  }

  saveRecentlyViewed();
  renderSidebar();
}

// ============= SIDEBAR =============
function openSidebar() {
  elements.sidebar.classList.add('open');
  elements.sidebarOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  renderSidebar();
}

function closeSidebar() {
  elements.sidebar.classList.remove('open');
  elements.sidebarOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function renderSidebar() {
  if (!elements.favoritesList || !elements.recentList) return;

  elements.favoritesCount.textContent = state.favorites.size;
  elements.favoritesList.innerHTML = '';

  if (state.favorites.size === 0) {
    elements.favoritesList.innerHTML = '<p class="empty-message">No favorites yet</p>';
  } else {
    const favoriteItems = state.allItems.filter(item => state.favorites.has(item.link));
    favoriteItems.forEach(item => {
      const sidebarItem = createSidebarItem(item);
      elements.favoritesList.appendChild(sidebarItem);
    });
  }

  elements.recentCount.textContent = state.recentlyViewed.length;
  elements.recentList.innerHTML = '';

  if (state.recentlyViewed.length === 0) {
    elements.recentList.innerHTML = '<p class="empty-message">No recent items</p>';
  } else {
    state.recentlyViewed.forEach(item => {
      const sidebarItem = createSidebarItem(item);
      elements.recentList.appendChild(sidebarItem);
    });
  }
}

function createSidebarItem(item) {
  const div = document.createElement('div');
  div.className = 'sidebar-item';
  
  const title = document.createElement('div');
  title.className = 'sidebar-item-title';
  title.textContent = item.title;

  const meta = document.createElement('div');
  meta.className = 'sidebar-item-meta';
  meta.textContent = `${item.links.length} mirrors`;

  div.appendChild(title);
  div.appendChild(meta);

  div.addEventListener('click', () => {
    closeSidebar();
    const card = document.querySelector(`[data-link="${item.link}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  return div;
}

// ============= EVENT HANDLERS =============
function attachEventListeners() {
  console.log('🔗 Attaching event listeners...');

  // Search
  let searchTimeout;
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      elements.clearSearch.style.display = state.searchQuery ? 'block' : 'none';
      applyFilters();
      applySorting();
      renderInitialItems();
    }, 300);
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
    localStorage.setItem('monkrus_sort', state.sortBy);
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

  // Scroll to top
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (elements.scrollToTop) {
        elements.scrollToTop.style.display = scrollTop > 300 ? 'flex' : 'none';
      }
    }, 100);
  });

  if (elements.scrollToTop) {
    elements.scrollToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Sidebar
  if (elements.sidebarToggle) {
    elements.sidebarToggle.addEventListener('click', openSidebar);
  }
  if (elements.sidebarClose) {
    elements.sidebarClose.addEventListener('click', closeSidebar);
  }
  if (elements.sidebarOverlay) {
    elements.sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // Retry button
  elements.retryButton.addEventListener('click', () => {
    loadData();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.sidebar && elements.sidebar.classList.contains('open')) {
      closeSidebar();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      elements.searchInput.focus();
    }

    if (e.key === 'ArrowLeft' && state.currentPage > 1) {
      state.currentPage--;
      renderCurrentPage();
    } else if (e.key === 'ArrowRight' && state.currentPage < state.totalPages) {
      state.currentPage++;
      renderCurrentPage();
    }
  });

  console.log('✓ Event listeners attached');
}

// ============= INITIALIZATION =============
function init() {
  console.log('🎬 Initializing app...');
  loadFromLocalStorage();
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