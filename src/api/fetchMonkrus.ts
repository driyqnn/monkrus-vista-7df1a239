import type { Post } from '../types';

const DATA_URL = 'https://raw.githubusercontent.com/dvuzu/monkrus-search/refs/heads/main/scraped_data.json';

let cachedData: Post[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchMonkrus(timeout = 10000): Promise<Post[]> {
  // Return cached data if still valid
  if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedData;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(DATA_URL, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!res.ok) {
      throw new Error(`Network response not ok: ${res.status} ${res.statusText}`);
    }
    
    const json = await res.json();
    
    if (!Array.isArray(json)) {
      throw new Error('Invalid data format: expected array');
    }
    
    // Validate data structure
    const validatedData = json.filter(item => 
      item && 
      typeof item.title === 'string' && 
      typeof item.link === 'string' && 
      Array.isArray(item.links)
    );
    
    // Cache the data
    cachedData = validatedData;
    cacheTimestamp = Date.now();
    
    return validatedData;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

export function clearCache(): void {
  cachedData = null;
  cacheTimestamp = null;
}

export function refresh(): Promise<Post[]> {
  clearCache();
  return fetchMonkrus();
}