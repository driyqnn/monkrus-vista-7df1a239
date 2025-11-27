import { CONFIG } from './config.js';
import { state, elements } from './state.js';
import { createCard, createSkeletonCard } from './cardComponent.js';
import { showEmpty } from './utils.js';

export function renderInitialItems() {
  state.currentPage = 1;
  state.totalPages = Math.ceil(state.filteredItems.length / CONFIG.pageSize);
  elements.itemsList.innerHTML = '';
  
  // Show skeleton cards immediately
  if (state.isLoadingChunk) {
    renderSkeletonCards();
  } else {
    renderCurrentPage();
  }
}

export function renderSkeletonCards() {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < Math.min(CONFIG.pageSize, 6); i++) {
    fragment.appendChild(createSkeletonCard());
  }
  elements.itemsList.appendChild(fragment);
}

export function renderCurrentPage() {
  const start = (state.currentPage - 1) * CONFIG.pageSize;
  const end = start + CONFIG.pageSize;
  const pageItems = state.filteredItems.slice(start, end);

  if (pageItems.length === 0 && state.currentPage === 1) {
    showEmpty(elements);
    elements.paginationContainer.style.display = 'none';
    return;
  }

  // Render items with staggered animation
  elements.itemsList.innerHTML = '';
  const fragment = document.createDocumentFragment();
  
  pageItems.forEach((item, index) => {
    const card = createCard(item);
    const article = card.querySelector('.card');
    article.style.animationDelay = `${index * 0.05}s`;
    article.classList.add('fade-in');
    fragment.appendChild(card);
  });

  elements.itemsList.appendChild(fragment);
  elements.emptyState.style.display = 'none';
  
  updatePagination();
  smoothScrollToTop();
}

function updatePagination() {
  if (state.totalPages <= 1) {
    elements.paginationContainer.style.display = 'none';
    return;
  }

  elements.paginationContainer.style.display = 'flex';
  
  // Update buttons
  elements.prevPage.disabled = state.currentPage === 1;
  elements.nextPage.disabled = state.currentPage === state.totalPages;
  
  // Generate page numbers
  renderPageNumbers();
}

function renderPageNumbers() {
  elements.pageNumbers.innerHTML = '';
  const maxVisible = 7;
  let startPage = Math.max(1, state.currentPage - 3);
  let endPage = Math.min(state.totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // First page
  if (startPage > 1) {
    createPageButton(1);
    if (startPage > 2) {
      createEllipsis();
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    createPageButton(i);
  }

  // Last page
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
  
  button.addEventListener('click', () => goToPage(pageNum));
  elements.pageNumbers.appendChild(button);
}

function createEllipsis() {
  const ellipsis = document.createElement('span');
  ellipsis.className = 'page-ellipsis';
  ellipsis.textContent = '...';
  elements.pageNumbers.appendChild(ellipsis);
}

export function goToPage(pageNum) {
  if (pageNum < 1 || pageNum > state.totalPages || pageNum === state.currentPage) {
    return;
  }
  
  state.currentPage = pageNum;
  renderCurrentPage();
}

export function nextPage() {
  if (state.currentPage < state.totalPages) {
    goToPage(state.currentPage + 1);
  }
}

export function prevPage() {
  if (state.currentPage > 1) {
    goToPage(state.currentPage - 1);
  }
}

function smoothScrollToTop() {
  const header = document.querySelector('.header');
  if (header) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
