export function getCategory(title) {
  const lower = title.toLowerCase();
  if (lower.includes('adobe')) return 'Adobe';
  if (lower.includes('autodesk')) return 'Autodesk';
  if (lower.includes('microsoft')) return 'Microsoft';
  return 'Other';
}

export function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
}

export function highlightText(element, query) {
  const text = element.textContent;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const highlighted = text.replace(regex, '<mark>$1</mark>');
  element.innerHTML = highlighted;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function copyToClipboard(text, button) {
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

export function showLoading(elements) {
  elements.loadingState.style.display = 'block';
  elements.errorState.style.display = 'none';
  elements.emptyState.style.display = 'none';
  elements.itemsList.innerHTML = '';
  elements.loadMoreContainer.style.display = 'none';
}

export function hideLoading(elements) {
  elements.loadingState.style.display = 'none';
}

export function showError(elements) {
  elements.loadingState.style.display = 'none';
  elements.errorState.style.display = 'block';
  elements.emptyState.style.display = 'none';
}

export function showEmpty(elements) {
  elements.emptyState.style.display = 'block';
  elements.loadMoreContainer.style.display = 'none';
}
