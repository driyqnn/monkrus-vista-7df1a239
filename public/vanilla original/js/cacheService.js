// IndexedDB cache service for faster data loading
const DB_NAME = 'MonkrusCache';
const DB_VERSION = 1;
const STORE_NAME = 'data';

class CacheService {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('IndexedDB not available, falling back to localStorage');
        resolve(null);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  async get(key) {
    await this.initPromise;
    
    if (!this.db) {
      return this.getFromLocalStorage(key);
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result?.value || null);
        };

        request.onerror = () => {
          resolve(this.getFromLocalStorage(key));
        };
      } catch (error) {
        resolve(this.getFromLocalStorage(key));
      }
    });
  }

  async set(key, value) {
    await this.initPromise;

    if (!this.db) {
      return this.setToLocalStorage(key, value);
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ key, value, timestamp: Date.now() });

        request.onsuccess = () => {
          this.setToLocalStorage(key, value); // Backup to localStorage
          resolve(true);
        };

        request.onerror = () => {
          this.setToLocalStorage(key, value);
          resolve(false);
        };
      } catch (error) {
        this.setToLocalStorage(key, value);
        resolve(false);
      }
    });
  }

  getFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(`monkrus_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      return null;
    }
  }

  setToLocalStorage(key, value) {
    try {
      localStorage.setItem(`monkrus_${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('localStorage full or unavailable');
      return false;
    }
  }

  async clear() {
    await this.initPromise;

    if (this.db) {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
    }

    // Clear localStorage backup
    Object.keys(localStorage)
      .filter(key => key.startsWith('monkrus_'))
      .forEach(key => localStorage.removeItem(key));
  }
}

export const cacheService = new CacheService();
