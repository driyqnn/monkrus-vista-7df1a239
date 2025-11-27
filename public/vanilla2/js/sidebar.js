import { state, elements } from './state.js';

export function openSidebar() {
  elements.sidebar.classList.add('open');
  elements.sidebarOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  renderSidebar();
}

export function closeSidebar() {
  elements.sidebar.classList.remove('open');
  elements.sidebarOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

export function renderSidebar() {
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
