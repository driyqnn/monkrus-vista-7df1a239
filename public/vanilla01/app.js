// Config
const DATA_URL = 'https://raw.githubusercontent.com/dvuzu/monkrus-search/refs/heads/main/scraped_data.json';
const ITEMS_PER_PAGE = 100;
const RECOMMENDED_DOMAINS = ['pb.wtf', 'uztracker.net'];
const DEBOUNCE_DELAY = 200;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const TIP_INTERVAL = 5000; // 5 seconds per tip

// User Tips
const USER_TIPS = [
  'Press <kbd>/</kbd> to quickly focus the search bar',
  'Use <kbd>←</kbd> and <kbd>→</kbd> arrow keys to navigate pages',
  'Press <kbd>Home</kbd> or <kbd>End</kbd> to jump to first/last page',
  'Click "Quick Access" for the best recommended mirror',
  'Green highlighted mirrors are recommended for faster downloads',
  'Press <kbd>?</kbd> anytime to see all keyboard shortcuts',
  'Your search results are cached for 5 minutes',
  'Press <kbd>Ctrl</kbd>+<kbd>↑</kbd> to scroll to top instantly',
  'Click the expand button to see all available mirrors',
  'Results show X of Y — total matches out of all posts',
  'The page indicator shows your current position in results',
  'Mirrors with pb.wtf and uztracker.net are recommended',
  'Press <kbd>Esc</kbd> to unfocus the search input',
  'Each page shows up to 100 results for faster loading',
  'Data loads progressively — watch the progress bar!',
];

// State
let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
let expandedCards = new Set();
let cachedData = null;
let cacheTimestamp = null;
let debounceTimer = null;
let currentTipIndex = 0;
let tipInterval = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const resultCounter = document.getElementById('resultCounter');
const loadingState = document.getElementById('loadingState');
const loadingProgress = document.getElementById('loadingProgress');
const loadedCount = document.getElementById('loadedCount');
const totalCount = document.getElementById('totalCount');
const progressFill = document.getElementById('progressFill');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const emptyQuery = document.getElementById('emptyQuery');
const postsList = document.getElementById('postsList');
const pagination = document.getElementById('pagination');
const retryBtn = document.getElementById('retryBtn');
const scrollToTopBtn = document.getElementById('scrollToTop');
const pageIndicator = document.getElementById('pageIndicator');
const currentPageNum = document.getElementById('currentPageNum');
const totalPagesNum = document.getElementById('totalPagesNum');
const showingFrom = document.getElementById('showingFrom');
const showingTo = document.getElementById('showingTo');

// DOM - Tips
const userTips = document.getElementById('userTips');
const tipText = document.getElementById('tipText');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  createSkeletons();
  createKeyboardHint();
  attachEventListeners();
  initTips();
  fetchData();
}

// Tips System
function initTips() {
  // Show first tip
  showTip(currentTipIndex);
  
  // Start rotation
  tipInterval = setInterval(() => {
    rotateTip();
  }, TIP_INTERVAL);
}

function showTip(index) {
  tipText.innerHTML = USER_TIPS[index];
  tipText.classList.remove('fade-out');
}

function rotateTip() {
  // Fade out current tip
  tipText.classList.add('fade-out');
  
  // After fade out, show next tip
  setTimeout(() => {
    currentTipIndex = (currentTipIndex + 1) % USER_TIPS.length;
    showTip(currentTipIndex);
  }, 400);
}

function createKeyboardHint() {
  const hint = document.createElement('div');
  hint.className = 'keyboard-hint';
  hint.id = 'keyboardHint';
  hint.innerHTML = `
    Press <kbd>/</kbd> to search · <kbd>←</kbd><kbd>→</kbd> to navigate pages · <kbd>↑</kbd> scroll to top
  `;
  document.body.appendChild(hint);
}

function createSkeletons() {
  const skeletonList = document.querySelector('.skeleton-list');
  for (let i = 0; i < 8; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton-content">
        <div class="skeleton-line title"></div>
        <div class="skeleton-line short"></div>
      </div>
    `;
    skeletonList.appendChild(skeleton);
  }
}

function attachEventListeners() {
  searchInput.addEventListener('input', handleSearch);
  retryBtn.addEventListener('click', fetchData);
  
  // Scroll to top
  window.addEventListener('scroll', handleScroll);
  scrollToTopBtn.addEventListener('click', scrollToTop);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
  
  // Show keyboard hint on first visit
  if (!localStorage.getItem('keyboardHintShown')) {
    setTimeout(() => {
      showKeyboardHint();
      localStorage.setItem('keyboardHintShown', 'true');
    }, 2000);
  }
}

function handleKeyboard(e) {
  // Ignore if typing in input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    if (e.key === 'Escape') {
      e.target.blur();
    }
    return;
  }
  
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  
  switch (e.key) {
    case '/':
      e.preventDefault();
      searchInput.focus();
      break;
    case 'ArrowLeft':
      if (currentPage > 1) {
        navigateToPage(currentPage - 1);
      }
      break;
    case 'ArrowRight':
      if (currentPage < totalPages) {
        navigateToPage(currentPage + 1);
      }
      break;
    case 'ArrowUp':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        scrollToTop();
      }
      break;
    case 'Home':
      e.preventDefault();
      if (currentPage !== 1) navigateToPage(1);
      break;
    case 'End':
      e.preventDefault();
      if (currentPage !== totalPages && totalPages > 0) navigateToPage(totalPages);
      break;
    case '?':
      showKeyboardHint();
      break;
  }
}

function navigateToPage(page) {
  currentPage = page;
  
  // Add transition effect
  postsList.classList.add('transitioning');
  
  setTimeout(() => {
    renderPosts();
    renderPagination();
    updatePageIndicator();
    postsList.classList.remove('transitioning');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 150);
}

function showKeyboardHint() {
  const hint = document.getElementById('keyboardHint');
  if (hint) {
    hint.classList.add('visible');
    setTimeout(() => {
      hint.classList.remove('visible');
    }, 4000);
  }
}

function handleScroll() {
  if (window.scrollY > 300) {
    scrollToTopBtn.classList.add('visible');
  } else {
    scrollToTopBtn.classList.remove('visible');
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleSearch(e) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const query = e.target.value;
    filterPosts(query);
  }, DEBOUNCE_DELAY);
}

async function fetchData() {
  // Check cache
  if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    allPosts = cachedData;
    filteredPosts = allPosts;
    showPosts();
    return;
  }

  showLoading();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const res = await fetch(DATA_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`Network response not ok: ${res.status} ${res.statusText}`);
    }
    
    // Get content length for progress
    const contentLength = res.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    // Show progress bar
    loadingProgress.classList.remove('hidden');
    
    if (total > 0) {
      // Stream the response for progress tracking
      const reader = res.body.getReader();
      const chunks = [];
      let receivedLength = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        // Update progress
        const percent = Math.round((receivedLength / total) * 100);
        updateProgress(receivedLength, total, percent);
      }
      
      // Combine chunks into single array
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }
      
      // Decode and parse
      const text = new TextDecoder('utf-8').decode(chunksAll);
      var json = JSON.parse(text);
    } else {
      // Fallback if no content-length
      var json = await res.clone().json();
      updateProgress(100, 100, 100);
    }
    
    if (!Array.isArray(json)) {
      throw new Error('Invalid data format: expected array');
    }
    
    // Validate data structure with progress
    const validItems = [];
    const totalItems = json.length;
    
    for (let i = 0; i < json.length; i++) {
      const item = json[i];
      if (item && typeof item.title === 'string' && typeof item.link === 'string' && Array.isArray(item.links)) {
        validItems.push(item);
      }
      
      // Update processing progress
      if (i % 100 === 0 || i === json.length - 1) {
        updateProcessingProgress(i + 1, totalItems);
        await new Promise(r => setTimeout(r, 0)); // Allow UI update
      }
    }
    
    allPosts = validItems;
    
    // Cache
    cachedData = allPosts;
    cacheTimestamp = Date.now();
    
    filteredPosts = allPosts;
    
    // Small delay before showing posts for smooth transition
    await new Promise(r => setTimeout(r, 200));
    loadingProgress.classList.add('hidden');
    showPosts();
    
  } catch (error) {
    loadingProgress.classList.add('hidden');
    showError(error.name === 'AbortError' ? 'Request timeout' : error.message);
  }
}

function updateProgress(received, total, percent) {
  const kb = (received / 1024).toFixed(0);
  const totalKb = (total / 1024).toFixed(0);
  loadedCount.textContent = `${kb}KB`;
  totalCount.textContent = `${totalKb}KB`;
  progressFill.style.width = `${percent}%`;
  document.querySelector('.progress-text').textContent = 'Downloading...';
}

function updateProcessingProgress(current, total) {
  loadedCount.textContent = current.toLocaleString();
  totalCount.textContent = total.toLocaleString();
  progressFill.style.width = `${Math.round((current / total) * 100)}%`;
  document.querySelector('.progress-text').textContent = 'Processing items...';
}

function filterPosts(query) {
  currentPage = 1;
  expandedCards.clear();
  
  if (!query.trim()) {
    filteredPosts = allPosts;
  } else {
    const lowerQuery = query.toLowerCase().trim();
    filteredPosts = allPosts.filter(post => 
      post.title.toLowerCase().includes(lowerQuery)
    );
  }
  
  updateResultCounter();
  
  if (filteredPosts.length === 0 && query.trim()) {
    showEmpty(query);
    pageIndicator.classList.add('hidden');
  } else {
    renderPosts();
    renderPagination();
    updatePageIndicator();
    postsList.classList.remove('hidden');
    emptyState.classList.add('hidden');
    const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
    pagination.classList.toggle('hidden', totalPages <= 1);
    pageIndicator.classList.toggle('hidden', totalPages <= 1);
  }
}

function showLoading() {
  loadingState.classList.remove('hidden');
  errorState.classList.add('hidden');
  emptyState.classList.add('hidden');
  postsList.classList.add('hidden');
  pagination.classList.add('hidden');
  pageIndicator.classList.add('hidden');
}

function showError(message) {
  loadingState.classList.add('hidden');
  errorState.classList.remove('hidden');
  emptyState.classList.add('hidden');
  postsList.classList.add('hidden');
  pagination.classList.add('hidden');
  errorMessage.textContent = message;
}

function showEmpty(query) {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  emptyState.classList.remove('hidden');
  postsList.classList.add('hidden');
  pagination.classList.add('hidden');
  emptyQuery.textContent = query;
}

function showPosts() {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  emptyState.classList.add('hidden');
  postsList.classList.remove('hidden');
  
  updateResultCounter();
  renderPosts();
  renderPagination();
  updatePageIndicator();
  
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  pagination.classList.toggle('hidden', totalPages <= 1);
  pageIndicator.classList.toggle('hidden', totalPages <= 1);
}

function updatePageIndicator() {
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredPosts.length);
  
  currentPageNum.textContent = currentPage;
  totalPagesNum.textContent = totalPages;
  showingFrom.textContent = startIndex;
  showingTo.textContent = endIndex;
}

function updateResultCounter() {
  const countEl = resultCounter.querySelector('.result-count');
  countEl.textContent = filteredPosts.length;
  resultCounter.innerHTML = `<span class="result-count">${filteredPosts.length}</span> of ${allPosts.length} results`;
}

function renderPosts() {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filteredPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  postsList.innerHTML = '';
  
  paginated.forEach((post, index) => {
    const card = createPostCard(post, startIndex + index);
    // Stagger animation delay
    card.style.animationDelay = `${index * 20}ms`;
    postsList.appendChild(card);
  });
}

function createPostCard(post, index) {
  const article = document.createElement('article');
  article.className = 'post-card';
  const cardId = `card-${index}`;
  const listId = `mirrors-${cardId}`;
  const isExpanded = expandedCards.has(cardId);
  
  const bestMirror = post.links.find(isRecommendedMirror) || post.links[0];
  
  article.innerHTML = `
    <div class="post-header">
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <div class="post-actions">
        ${bestMirror ? `
          <button class="quick-access-btn" data-mirror="${escapeHtml(bestMirror)}" aria-label="Open best mirror">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
            </svg>
            <span class="btn-text">Quick Access</span>
          </button>
        ` : ''}
        ${post.links.length > 1 ? `
          <button class="expand-btn" aria-expanded="${isExpanded}" aria-controls="${listId}" aria-label="${isExpanded ? 'Collapse' : 'Expand'} all mirrors">
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${isExpanded ? '90deg' : '0deg'})">
              <path d="m9 18 6-6-6-6"/>
            </svg>
            <span class="expand-count">${post.links.length}</span>
          </button>
        ` : ''}
      </div>
    </div>
    ${post.links.length > 1 ? `
      <div id="${listId}" class="mirror-list-wrapper ${isExpanded ? '' : 'hidden'}">
        ${renderMirrorList(post)}
      </div>
    ` : ''}
  `;
  
  // Event listeners
  const quickAccessBtn = article.querySelector('.quick-access-btn');
  if (quickAccessBtn) {
    quickAccessBtn.addEventListener('click', () => {
      window.open(bestMirror, '_blank', 'noopener,noreferrer');
    });
  }
  
  const expandBtn = article.querySelector('.expand-btn');
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      const mirrorWrapper = article.querySelector('.mirror-list-wrapper');
      const chevron = expandBtn.querySelector('.chevron-icon');
      const isCurrentlyExpanded = !mirrorWrapper.classList.contains('hidden');
      
      if (isCurrentlyExpanded) {
        mirrorWrapper.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
        expandBtn.setAttribute('aria-expanded', 'false');
        expandedCards.delete(cardId);
      } else {
        mirrorWrapper.classList.remove('hidden');
        chevron.style.transform = 'rotate(90deg)';
        expandBtn.setAttribute('aria-expanded', 'true');
        expandedCards.add(cardId);
      }
    });
  }
  
  return article;
}

function renderMirrorList(post) {
  return `
    <div class="mirror-header">
      <span class="mirror-count">${post.links.length} mirrors available</span>
      <a href="${escapeHtml(post.link)}" target="_blank" rel="noopener noreferrer" class="original-link">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        Original Post
      </a>
    </div>
    <ul class="mirror-list" role="list">
      ${post.links.map(mirror => {
        const isRecommended = isRecommendedMirror(mirror);
        const domain = getDomainFromUrl(mirror);
        return `
          <li class="mirror-item ${isRecommended ? 'recommended' : ''}">
            <a href="${escapeHtml(mirror)}" target="_blank" rel="noopener noreferrer">
              <svg class="mirror-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h6v6"/>
                <path d="M10 14 21 3"/>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              </svg>
              <span class="mirror-domain">${escapeHtml(domain)}</span>
              ${isRecommended ? '<span class="recommended-badge">best</span>' : ''}
            </a>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

function renderPagination() {
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginationContent = pagination.querySelector('.pagination-content');
  
  if (totalPages <= 1) {
    pagination.classList.add('hidden');
    return;
  }
  
  let html = '';
  
  // Previous
  html += `
    <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="prev">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 18-6-6 6-6"/>
      </svg>
      <span>Previous</span>
    </button>
  `;
  
  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      html += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<span class="page-ellipsis">...</span>';
    }
  }
  
  // Next
  html += `
    <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="next">
      <span>Next</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 18 6-6-6-6"/>
      </svg>
    </button>
  `;
  
  paginationContent.innerHTML = html;
  
  // Event listeners
  paginationContent.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Add ripple effect
      addRipple(e, btn);
      
      const page = btn.dataset.page;
      let newPage = currentPage;
      
      if (page === 'prev') {
        newPage = Math.max(1, currentPage - 1);
      } else if (page === 'next') {
        newPage = Math.min(totalPages, currentPage + 1);
      } else {
        newPage = parseInt(page);
      }
      
      if (newPage !== currentPage) {
        navigateToPage(newPage);
      }
    });
  });
}

function addRipple(e, element) {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top = `${e.clientY - rect.top}px`;
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// Utilities
function isRecommendedMirror(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return RECOMMENDED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}