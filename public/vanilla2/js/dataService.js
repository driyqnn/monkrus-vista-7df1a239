import { CONFIG } from './config.js';
import { state } from './state.js';
import { cacheService } from './cacheService.js';

export async function getCachedData() {
  try {
    const cached = await cacheService.get('data');
    if (!cached) return null;

    const { data, timestamp } = cached;
    const age = Date.now() - timestamp;

    if (age < CONFIG.cacheDuration) {
      console.log('✓ Using cached data:', data.length, 'items', `(${Math.round(age / 1000)}s old)`);
      return data;
    }

    console.log('✗ Cache expired, fetching fresh data');
    return null;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

export async function cacheData(data) {
  try {
    const cacheObject = {
      data,
      timestamp: Date.now(),
    };
    await cacheService.set('data', cacheObject);
    console.log('✓ Data cached successfully');
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}

export async function fetchData(onDataChunk) {
  // Check cache first for instant load
  const cachedData = await getCachedData();
  if (cachedData) {
    if (onDataChunk) {
      onDataChunk(cachedData);
    }
    return cachedData;
  }

  // Fetch fresh data with retry logic
  console.log('⟳ Fetching data from:', CONFIG.dataUrl);
  
  let retries = 3;
  while (retries > 0) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(CONFIG.dataUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✓ Data fetched:', data.length, 'items');
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: expected array');
      }
      
      const validatedData = data.filter(item => 
        item && 
        typeof item.title === 'string' && 
        typeof item.link === 'string' && 
        Array.isArray(item.links)
      );
      
      if (validatedData.length === 0) {
        throw new Error('No valid data items found');
      }

      console.log('✓ Validated data:', validatedData.length, 'items');

      // Cache the data for next visit
      await cacheData(validatedData);
      
      // Progressive rendering
      if (onDataChunk) {
        onDataChunk(validatedData);
      }
      
      return validatedData;
    } catch (error) {
      retries--;
      console.error(`Fetch attempt failed (${3 - retries}/3):`, error.message);
      
      if (retries === 0) {
        throw new Error(`Failed to load data after 3 attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
    }
  }
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
