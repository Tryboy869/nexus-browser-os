// system/storage.js - Key-Value Storage (Dexie.js-like wrapper for IndexedDB)

export class Storage {
  constructor() {
    this.db = null;
    this.dbName = 'nexus_storage';
    this.storeName = 'keyvalue';
    this.initialized = false;
    
    console.log('[Storage] Initialized');
  }
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => {
        console.error('[Storage] Failed to open database');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log('[Storage] Database opened');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
          console.log('[Storage] Object store created');
        }
      };
    });
  }
  
  async set(key, value) {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }
    
    const entry = {
      key,
      value,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.put(entry);
      
      request.onsuccess = () => {
        resolve(value);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  async get(key, defaultValue = null) {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(key);
      
      request.onsuccess = () => {
        const entry = request.result;
        resolve(entry ? entry.value : defaultValue);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  async delete(key) {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(key);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }
  
  async keys() {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAllKeys();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  async values() {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();
      
      request.onsuccess = () => {
        resolve(request.result.map(entry => entry.value));
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  async entries() {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();
      
      request.onsuccess = () => {
        resolve(request.result.map(entry => [entry.key, entry.value]));
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  async clear() {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();
      
      request.onsuccess = () => {
        console.log('[Storage] Cleared all data');
        resolve(true);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  async size() {
    const keys = await this.keys();
    return keys.length;
  }
  
  async export() {
    const entries = await this.entries();
    return JSON.stringify(Object.fromEntries(entries), null, 2);
  }
  
  async import(json) {
    try {
      const data = JSON.parse(json);
      
      for (const [key, value] of Object.entries(data)) {
        await this.set(key, value);
      }
      
      console.log('[Storage] Import successful');
      return true;
    } catch (error) {
      console.error('[Storage] Import failed:', error);
      return false;
    }
  }
}