// Config
const DATA_URL = 'https://raw.githubusercontent.com/dvuzu/monkrus-search/refs/heads/main/scraped_data.json';
const ITEMS_PER_PAGE = 100;
const RECOMMENDED_DOMAINS = ['pb.wtf', 'uztracker.net'];
const DEBOUNCE_DELAY = 200;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// State
let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
let expandedCards = new Set();
let cachedData = null;
let cacheTimestamp = null;
let debounceTimer = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const resultCounter = document.getElementById('resultCounter');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const emptyQuery = document.getElementById('emptyQuery');
const postsList = document.getElementById('postsList');
const pagination = document.getElementById('pagination');
const retryBtn = document.getElementById('retryBtn');
const scrollToTopBtn = document.getElementById('scrollToTop');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  createSkeletons();
  attachEventListeners();
  fetchData();
}

function createSkeletons() {
  const skeletonList = document.querySelector('.skeleton-list');
  for (let i = 0; i < 8; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = '<div class="skeleton-line"></div>';
    skeletonList.appendChild(skeleton);
  }
}

function attachEventListeners() {
  searchInput.addEventListener('input', handleSearch);
  retryBtn.addEventListener('click', fetchData);
  
  // Scroll to top
  window.addEventListener('scroll', handleScroll);
  scrollToTopBtn.addEventListener('click', scrollToTop);
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
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(DATA_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`Network response not ok: ${res.status} ${res.statusText}`);
    }
    
    const json = await res.json();
    
    if (!Array.isArray(json)) {
      throw new Error('Invalid data format: expected array');
    }
    
    // Validate data structure
    allPosts = json.filter(item => 
      item && 
      typeof item.title === 'string' && 
      typeof item.link === 'string' && 
      Array.isArray(item.links)
    );
    
    // Cache
    cachedData = allPosts;
    cacheTimestamp = Date.now();
    
    filteredPosts = allPosts;
    showPosts();
    
  } catch (error) {
    showError(error.name === 'AbortError' ? 'Request timeout' : error.message);
  }
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
  } else {
    renderPosts();
    renderPagination();
    postsList.classList.remove('hidden');
    emptyState.classList.add('hidden');
    pagination.classList.toggle('hidden', Math.ceil(filteredPosts.length / ITEMS_PER_PAGE) <= 1);
  }
}

function showLoading() {
  loadingState.classList.remove('hidden');
  errorState.classList.add('hidden');
  emptyState.classList.add('hidden');
  postsList.classList.add('hidden');
  pagination.classList.add('hidden');
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
  pagination.classList.toggle('hidden', Math.ceil(filteredPosts.length / ITEMS_PER_PAGE) <= 1);
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
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page === 'prev') {
        currentPage = Math.max(1, currentPage - 1);
      } else if (page === 'next') {
        currentPage = Math.min(totalPages, currentPage + 1);
      } else {
        currentPage = parseInt(page);
      }
      renderPosts();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
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