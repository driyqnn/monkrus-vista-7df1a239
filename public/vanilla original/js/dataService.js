import { CONFIG } from './config.js';
import { state } from './state.js';

export function getCachedData() {
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

export function cacheData(data) {
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

export async function fetchData(onDataChunk) {
  // Check cache first
  const cachedData = getCachedData();
  if (cachedData) {
    // Return cached data immediately
    if (onDataChunk) {
      onDataChunk(cachedData);
    }
    return cachedData;
  }

  // Fetch fresh data
  const response = await fetch(CONFIG.dataUrl);
  if (!response.ok) throw new Error('Network response failed');
  
  const data = await response.json();
  
  if (!Array.isArray(data)) throw new Error('Invalid data format');
  
  const validatedData = data.filter(item => 
    item && 
    typeof item.title === 'string' && 
    typeof item.link === 'string' && 
    Array.isArray(item.links)
  );

  // Cache the data
  cacheData(validatedData);
  
  // Call chunk callback for progressive rendering
  if (onDataChunk) {
    onDataChunk(validatedData);
  }
  
  return validatedData;
}

export async function testMirror(url) {
  const startTime = performance.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.pingTimeout);

    await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors',
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

export async function testAllMirrors(item, mirrorsList) {
  const testBtn = mirrorsList.parentElement.querySelector('.test-all-button');
  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';

  const mirrors = Array.from(mirrorsList.querySelectorAll('.mirror-item'));
  const tests = {};

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

  state.mirrorTests.set(item.link, tests);

  testBtn.disabled = false;
  testBtn.textContent = 'Test All';
}

export function updateMirrorStatus(statusEl, timeEl, result) {
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
