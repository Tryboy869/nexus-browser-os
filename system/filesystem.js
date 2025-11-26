// system/filesystem.js - Virtual Filesystem (IndexedDB + OPFS fallback)

export class FileSystem {
  constructor() {
    this.db = null;
    this.dbName = 'nexus_filesystem';
    this.storeName = 'files';
    this.initialized = false;
    
    console.log('[FileSystem] Initialized');
  }
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => {
        console.error('[FileSystem] Failed to open database');
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log('[FileSystem] Database opened');
        
        // Create default directories
        this.createDefaultStructure().then(resolve);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'path' });
          objectStore.createIndex('type', 'type', { unique: false });
          objectStore.createIndex('parent', 'parent', { unique: false });
          console.log('[FileSystem] Object store created');
        }
      };
    });
  }
  
  async createDefaultStructure() {
    const defaultDirs = [
      '/Documents',
      '/Downloads',
      '/Pictures',
      '/Desktop',
      '/System'
    ];
    
    for (const dir of defaultDirs) {
      try {
        await this.mkdir(dir);
      } catch (error) {
        // Directory might already exist
      }
    }
    
    // Create welcome file
    try {
      await this.writeFile('/Desktop/welcome.txt', 
        'Bienvenue sur NEXUS Browser OS!\n\nCe système de fichiers est entièrement virtuel et stocké dans votre navigateur.');
    } catch (error) {
      console.error('[FileSystem] Failed to create welcome file:', error);
    }
  }
  
  parsePath(path) {
    const parts = path.split('/').filter(p => p.length > 0);
    const filename = parts[parts.length - 1] || '';
    const parent = '/' + parts.slice(0, -1).join('/');
    
    return { parts, filename, parent: parent === '/' ? '/' : parent };
  }
  
  async writeFile(path, content, metadata = {}) {
    if (!this.initialized) {
      throw new Error('Filesystem not initialized');
    }
    
    const { filename, parent } = this.parsePath(path);
    
    const file = {
      path,
      name: filename,
      parent,
      type: 'file',
      content,
      size: new Blob([content]).size,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      ...metadata
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.put(file);
      
      request.onsuccess = () => {
        console.log('[FileSystem] File written:', path);
        resolve(file);
      };
      
      request.onerror = () => {
        console.error('[FileSystem] Failed to write file:', path);
        reject(request.error);
      };
    });
  }
  
  async readFile(path) {
    if (!this.initialized) {
      throw new Error('Filesystem not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(path);
      
      request.onsuccess = () => {
        const file = request.result;
        
        if (!file) {
          reject(new Error('File not found: ' + path));
          return;
        }
        
        if (file.type !== 'file') {
          reject(new Error('Not a file: ' + path));
          return;
        }
        
        resolve(file.content);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  async readdir(path) {
    if (!this.initialized) {
      throw new Error('Filesystem not initialized');
    }
    
    // Normalize path
    path = path === '/' ? '/' : path;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('parent');
      const request = index.getAll(path);
      
      request.onsuccess = () => {
        const entries = request.result.map(entry => ({
          name: entry.name,
          path: entry.path,
          type: entry.type,
          size: entry.size || 0,
          created: entry.created,
          modified: entry.modified
        }));
        
        resolve(entries);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  async mkdir(path) {
    if (!this.initialized) {
      throw new Error('Filesystem not initialized');
    }
    
    const { filename, parent } = this.parsePath(path);
    
    const dir = {
      path,
      name: filename,
      parent,
      type: 'directory',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.add(dir);
      
      request.onsuccess = () => {
        console.log('[FileSystem] Directory created:', path);
        resolve(dir);
      };
      
      request.onerror = () => {
        // Directory might already exist
        if (request.error.name === 'ConstraintError') {
          resolve(null);
        } else {
          reject(request.error);
        }
      };
    });
  }
  
  async unlink(path) {
    if (!this.initialized) {
      throw new Error('Filesystem not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(path);
      
      request.onsuccess = () => {
        console.log('[FileSystem] File deleted:', path);
        resolve(true);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  async rmdir(path) {
    // Check if directory is empty first
    const entries = await this.readdir(path);
    
    if (entries.length > 0) {
      throw new Error('Directory not empty: ' + path);
    }
    
    return this.unlink(path);
  }
  
  async stat(path) {
    if (!this.initialized) {
      throw new Error('Filesystem not initialized');
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(path);
      
      request.onsuccess = () => {
        const entry = request.result;
        
        if (!entry) {
          reject(new Error('File not found: ' + path));
          return;
        }
        
        resolve({
          path: entry.path,
          name: entry.name,
          type: entry.type,
          size: entry.size || 0,
          created: entry.created,
          modified: entry.modified
        });
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  async exists(path) {
    try {
      await this.stat(path);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async rename(oldPath, newPath) {
    // Read old file
    const transaction1 = this.db.transaction([this.storeName], 'readonly');
    const objectStore1 = transaction1.objectStore(this.storeName);
    const getRequest = objectStore1.get(oldPath);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        
        if (!entry) {
          reject(new Error('File not found: ' + oldPath));
          return;
        }
        
        // Update path and name
        const { filename, parent } = this.parsePath(newPath);
        entry.path = newPath;
        entry.name = filename;
        entry.parent = parent;
        entry.modified = new Date().toISOString();
        
        // Write to new path and delete old
        const transaction2 = this.db.transaction([this.storeName], 'readwrite');
        const objectStore2 = transaction2.objectStore(this.storeName);
        
        objectStore2.put(entry);
        objectStore2.delete(oldPath);
        
        transaction2.oncomplete = () => {
          console.log('[FileSystem] File renamed:', oldPath, '->', newPath);
          resolve(true);
        };
        
        transaction2.onerror = () => {
          reject(transaction2.error);
        };
      };
      
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }
  
  async getQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        total: estimate.quota || 0,
        percentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
      };
    }
    
    return { used: 0, total: 0, percentage: 0 };
  }
}