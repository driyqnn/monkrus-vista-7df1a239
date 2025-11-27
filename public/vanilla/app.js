// ========================================
// MONKRUS MIRROR VIEWER - VANILLA JS
// ========================================

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    dataUrl: 'https://raw.githubusercontent.com/dvuzu/monkrus-search/refs/heads/main/scraped_data.json',
    pageSize: 50,
    preferredMirrors: ['pb.wtf', 'uztracker.net'],
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    pingTimeout: 5000,
    maxRecentItems: 10,
  };

  // State
  const state = {
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

  // DOM Elements
  const elements = {
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

  // ========================================
  // Initialization
  // ========================================

  function init() {
    cacheDOMElements();
    loadFromLocalStorage();
    attachEventListeners();
    loadData();
  }

  function cacheDOMElements() {
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

  // ========================================
  // Data Fetching & Caching
  // ========================================

  async function loadData() {
    try {
      showLoading();
      
      // Check cache first
      const cachedData = getCachedData();
      if (cachedData) {
        state.allItems = cachedData;
        processData();
        return;
      }

      // Fetch fresh data
      const response = await fetch(CONFIG.dataUrl);
      if (!response.ok) throw new Error('Network response failed');
      
      const data = await response.json();
      
      if (!Array.isArray(data)) throw new Error('Invalid data format');
      
      state.allItems = data.filter(item => 
        item && 
        typeof item.title === 'string' && 
        typeof item.link === 'string' && 
        Array.isArray(item.links)
      );

      // Cache the data
      cacheData(state.allItems);
      processData();

    } catch (error) {
      console.error('Failed to load data:', error);
      showError();
    }
  }

  function getCachedData() {
    try {
      const cached = localStorage.getItem('monkrus_data');
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < CONFIG.cacheDuration) {
        return data;
      }

      // Cache expired
      localStorage.removeItem('monkrus_data');
      return null;
    } catch (error) {
      return null;
    }
  }

  function cacheData(data) {
    try {
      const cacheObject = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem('monkrus_data', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  function processData() {
    applyFilters();
    applySorting();
    renderInitialItems();
    hideLoading();
  }

  // ========================================
  // Filtering & Sorting
  // ========================================

  function applyFilters() {
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
      case 'fastest':
        // Sort by cached test results
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

  // ========================================
  // Rendering
  // ========================================

  function renderInitialItems() {
    state.currentPage = 0;
    state.displayedItems = [];
    elements.itemsList.innerHTML = '';
    loadMoreItems();
  }

  function loadMoreItems() {
    const start = state.currentPage * CONFIG.pageSize;
    const end = start + CONFIG.pageSize;
    const newItems = state.filteredItems.slice(start, end);

    if (newItems.length === 0) {
      if (state.displayedItems.length === 0) {
        showEmpty();
      } else {
        elements.loadMoreContainer.style.display = 'none';
      }
      return;
    }

    state.displayedItems.push(...newItems);
    state.currentPage++;

    // Render items
    const fragment = document.createDocumentFragment();
    newItems.forEach(item => {
      const card = createCard(item);
      fragment.appendChild(card);
    });

    elements.itemsList.appendChild(fragment);

    // Show/hide load more button
    if (end >= state.filteredItems.length) {
      elements.loadMoreContainer.style.display = 'none';
    } else {
      elements.loadMoreContainer.style.display = 'block';
    }

    elements.emptyState.style.display = 'none';
  }

  function createCard(item) {
    const card = elements.cardTemplate.content.cloneNode(true);
    const article = card.querySelector('.card');
    
    // Set data attribute
    article.dataset.link = item.link;

    // Title
    const title = card.querySelector('.card-title');
    title.textContent = item.title;
    if (state.searchQuery) {
      highlightText(title, state.searchQuery);
    }

    // Category
    const category = getCategory(item.title);
    const categoryTag = card.querySelector('.category-tag');
    categoryTag.textContent = category;

    // Source link
    const sourceLink = card.querySelector('.source-link');
    sourceLink.href = item.link;

    // Mirror count
    const mirrorCount = card.querySelector('.mirror-count');
    mirrorCount.textContent = `${item.links.length} mirrors`;

    // Favorite button
    const favoriteBtn = card.querySelector('.favorite-button');
    if (state.favorites.has(item.link)) {
      favoriteBtn.classList.add('active');
    }
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(item);
    });

    // Best mirror button
    const bestMirrorBtn = card.querySelector('.best-mirror-button');
    if (item.links.length === 0) {
      bestMirrorBtn.disabled = true;
    } else {
      bestMirrorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openBestMirror(item);
      });
    }

    // Expand button
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
      // Collapse
      content.style.display = 'none';
      expandBtn.classList.remove('expanded');
      state.expandedCards.delete(item.link);
    } else {
      // Expand
      content.style.display = 'block';
      expandBtn.classList.add('expanded');
      state.expandedCards.add(item.link);

      // Render mirrors if not already rendered
      const mirrorsList = content.querySelector('.mirrors-list');
      if (mirrorsList.children.length === 0) {
        renderMirrors(mirrorsList, item);
      }

      // Add to recently viewed
      addToRecentlyViewed(item);

      // Setup test all button
      const testAllBtn = content.querySelector('.test-all-button');
      testAllBtn.addEventListener('click', () => testAllMirrors(item, mirrorsList));
    }
  }

  function renderMirrors(mirrorsList, item) {
    const fragment = document.createDocumentFragment();
    
    item.links.forEach(mirror => {
      const mirrorItem = createMirrorItem(mirror, item);
      fragment.appendChild(mirrorItem);
    });

    mirrorsList.appendChild(fragment);
  }

  function createMirrorItem(mirror, item) {
    const mirrorEl = elements.mirrorTemplate.content.cloneNode(true);
    const li = mirrorEl.querySelector('.mirror-item');

    // Check if recommended
    const domain = getDomain(mirror);
    const isRecommended = CONFIG.preferredMirrors.some(pref => 
      domain.includes(pref)
    );

    if (isRecommended) {
      li.classList.add('recommended');
    }

    // Domain
    const domainEl = li.querySelector('.mirror-domain');
    domainEl.textContent = domain;
    if (state.searchQuery) {
      highlightText(domainEl, state.searchQuery);
    }

    // Status
    const statusEl = li.querySelector('.mirror-status');
    const timeEl = li.querySelector('.mirror-time');

    // Check cached test
    const tests = state.mirrorTests.get(item.link);
    if (tests && tests[mirror]) {
      updateMirrorStatus(statusEl, timeEl, tests[mirror]);
    }

    // Copy button
    const copyBtn = li.querySelector('.copy-button');
    copyBtn.addEventListener('click', () => copyToClipboard(mirror, copyBtn));

    // Download button
    const downloadBtn = li.querySelector('.download-button');
    downloadBtn.href = mirror;

    // Store mirror URL for testing
    li.dataset.mirror = mirror;

    return mirrorEl;
  }

  async function testAllMirrors(item, mirrorsList) {
    const testBtn = mirrorsList.parentElement.querySelector('.test-all-button');
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';

    const mirrors = Array.from(mirrorsList.querySelectorAll('.mirror-item'));
    const tests = {};

    // Test all mirrors
    await Promise.all(
      mirrors.map(async (mirrorEl) => {
        const mirror = mirrorEl.dataset.mirror;
        const statusEl = mirrorEl.querySelector('.mirror-status');
        const timeEl = mirrorEl.querySelector('.mirror-time');

        statusEl.classList.add('testing');

        const result = await testMirror(mirror);
        tests[mirror] = result;

        updateMirrorStatus(statusEl, timeEl, result);
        statusEl.classList.remove('testing');
      })
    );

    // Cache results
    state.mirrorTests.set(item.link, tests);

    testBtn.disabled = false;
    testBtn.textContent = 'Test All';
  }

  async function testMirror(url) {
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CONFIG.pingTimeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors', // Avoid CORS issues for basic connectivity test
      });

      clearTimeout(timeout);

      const endTime = performance.now();
      const time = Math.round(endTime - startTime);

      return {
        online: true,
        time,
        status: time < 1000 ? 'fast' : time < 3000 ? 'normal' : 'slow',
      };
    } catch (error) {
      return {
        online: false,
        time: null,
        status: 'offline',
      };
    }
  }

  function updateMirrorStatus(statusEl, timeEl, result) {
    statusEl.className = 'mirror-status';
    
    if (result.online) {
      statusEl.classList.add('online');
      if (result.status === 'slow') {
        statusEl.classList.remove('online');
        statusEl.classList.add('slow');
      }
      timeEl.textContent = `${result.time}ms`;
    } else {
      statusEl.classList.add('offline');
      timeEl.textContent = 'Offline';
    }
  }

  function openBestMirror(item) {
    if (item.links.length === 0) return;

    // Check if we have test results
    const tests = state.mirrorTests.get(item.link);
    let bestMirror = null;

    if (tests) {
      // Find fastest preferred mirror
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
        // Find fastest among all
        const onlineMirrors = item.links.filter(m => tests[m]?.online);
        if (onlineMirrors.length > 0) {
          bestMirror = onlineMirrors.reduce((best, current) => {
            return tests[current].time < tests[best].time ? current : best;
          });
        }
      }
    }

    // If no tests or no online mirrors, use first preferred or just first
    if (!bestMirror) {
      const preferredMirrors = item.links.filter(mirror => {
        const domain = getDomain(mirror);
        return CONFIG.preferredMirrors.some(pref => domain.includes(pref));
      });
      bestMirror = preferredMirrors.length > 0 ? preferredMirrors[0] : item.links[0];
    }

    window.open(bestMirror, '_blank', 'noopener,noreferrer');
  }

  // ========================================
  // Event Handlers
  // ========================================

  function attachEventListeners() {
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

  // ========================================
  // Sidebar
  // ========================================

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
    // Favorites
    elements.favoritesCount.textContent = state.favorites.size;
    elements.favoritesList.innerHTML = '';

    if (state.favorites.size === 0) {
      elements.favoritesList.innerHTML = '<p class="empty-message">No favorites yet</p>';
    } else {
      const favoriteItems = state.allItems.filter(item => 
        state.favorites.has(item.link)
      );

      favoriteItems.forEach(item => {
        const sidebarItem = createSidebarItem(item);
        elements.favoritesList.appendChild(sidebarItem);
      });
    }

    // Recently viewed
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
      scrollToItem(item);
    });

    return div;
  }

  function scrollToItem(item) {
    const card = document.querySelector(`[data-link="${item.link}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.animation = 'none';
      setTimeout(() => {
        card.style.animation = 'pulse 0.5s ease-in-out';
      }, 10);
    }
  }

  // ========================================
  // Favorites & Recently Viewed
  // ========================================

  function toggleFavorite(item) {
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

  function addToRecentlyViewed(item) {
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

  // ========================================
  // Local Storage
  // ========================================

  function loadFromLocalStorage() {
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

  // ========================================
  // Utilities
  // ========================================

  function getCategory(title) {
    const lower = title.toLowerCase();
    if (lower.includes('adobe')) return 'Adobe';
    if (lower.includes('autodesk')) return 'Autodesk';
    if (lower.includes('microsoft')) return 'Microsoft';
    return 'Other';
  }

  function getDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
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

  async function copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      button.classList.add('copied');
      setTimeout(() => {
        button.classList.remove('copied');
      }, 2000);
    } catch (error) {
      console.warn('Failed to copy:', error);
    }
  }

  function showLoading() {
    elements.loadingState.style.display = 'block';
    elements.errorState.style.display = 'none';
    elements.emptyState.style.display = 'none';
    elements.itemsList.innerHTML = '';
    elements.loadMoreContainer.style.display = 'none';
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
    elements.loadMoreContainer.style.display = 'none';
  }

  // ========================================
  // Start Application
  // ========================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
