// ============================================
// LDSS CLIENT SDK — Local version
// Inclus directement dans le repo Nexus OS
// Les appels réseau (dashboard) échouent
// silencieusement — stockage IndexedDB only
// ============================================

class LDSS {
  constructor(config) {
    if (!config.token) {
      throw new Error('LDSS: token required');
    }
    if (!config.projectName) {
      throw new Error('LDSS: projectName required');
    }
    
    this.token = config.token;
    this.projectName = config.projectName;
    this.projectUrl = config.projectUrl || window.location.href;
    this.apiUrl = config.apiUrl || 'http://localhost:3000';
    
    this.hub = null;
    this.workers = new Map();
    this.initialized = false;
    
    this.init();
  }

  // ========== INITIALISATION ==========
  async init() {
    console.log(`🌌 [LDSS] Initializing for project: ${this.projectName}`);
    
    try {
      await this.registerProject();
      await this.createHub();
      await this.createWorkers();
      this.startMonitoring();
      
      this.initialized = true;
      console.log('✅ [LDSS] Initialization complete');
      
    } catch (error) {
      console.error('❌ [LDSS] Initialization failed:', error);
      throw error;
    }
  }

  async registerProject() {
    try {
      const response = await fetch(`${this.apiUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: this.projectName,
          projectUrl: this.projectUrl,
          token: this.token
        })
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      
      console.log('✅ [LDSS] Project registered with dashboard');
    } catch (error) {
      // Mode offline — continue sans dashboard
      console.warn('⚠️ [LDSS] Dashboard unavailable, running offline');
    }
  }

  async createHub() {
    console.log('🧠 [LDSS] Creating Hub Central...');
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`ldss_${this.projectName}_hub`, 1);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('routing')) {
          db.createObjectStore('routing', { keyPath: 'dataType' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
      
      request.onsuccess = () => {
        this.hub = request.result;
        console.log('✅ [LDSS] Hub Central created');
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async createWorkers() {
    console.log('⚙️ [LDSS] Creating Workers...');
    
    const workerConfigs = [
      { name: 'primary',   role: 'routing', stores: ['routing'] },
      { name: 'userdata',  role: 'user',    stores: ['profiles', 'settings'] },
      { name: 'media',     role: 'files',   stores: ['images', 'videos', 'documents'] },
      { name: 'analytics', role: 'logs',    stores: ['logs', 'events'] },
      { name: 'cache',     role: 'cache',   stores: ['cache'] },
    ];
    
    for (const config of workerConfigs) {
      await this.createWorker(config);
    }
    
    console.log(`✅ [LDSS] Created ${this.workers.size} workers`);
  }

  async createWorker(config) {
    return new Promise((resolve, reject) => {
      const dbName = `ldss_${this.projectName}_${config.name}`;
      const request = indexedDB.open(dbName, 1);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        config.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          }
        });
      };
      
      request.onsuccess = () => {
        this.workers.set(config.name, {
          db: request.result,
          config,
          usedBytes: 0,
          operations: 0
        });
        console.log(`   ✓ Worker ${config.name} created`);
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ========== API PUBLIQUE ==========

  async store(collection, data) {
    if (!this.initialized) {
      throw new Error('LDSS not initialized');
    }
    
    const workerName = this.routeToWorker(collection);
    const worker = this.workers.get(workerName);
    
    if (!worker) {
      throw new Error(`No worker found for collection: ${collection}`);
    }
    
    return new Promise((resolve, reject) => {
      const tx = worker.db.transaction([collection], 'readwrite');
      const store = tx.objectStore(collection);
      const request = store.add(data);
      
      request.onsuccess = () => {
        worker.operations++;
        resolve({ id: request.result });
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(collection) {
    const workerName = this.routeToWorker(collection);
    const worker = this.workers.get(workerName);
    
    if (!worker) {
      throw new Error(`No worker found for collection: ${collection}`);
    }
    
    return new Promise((resolve, reject) => {
      const tx = worker.db.transaction([collection], 'readonly');
      const store = tx.objectStore(collection);
      const request = store.getAll();
      
      request.onsuccess = () => {
        worker.operations++;
        resolve(request.result);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async get(collection, id) {
    const workerName = this.routeToWorker(collection);
    const worker = this.workers.get(workerName);
    
    if (!worker) {
      throw new Error(`No worker found for collection: ${collection}`);
    }
    
    return new Promise((resolve, reject) => {
      const tx = worker.db.transaction([collection], 'readonly');
      const store = tx.objectStore(collection);
      const request = store.get(id);
      
      request.onsuccess = () => {
        worker.operations++;
        resolve(request.result);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async delete(collection, id) {
    const workerName = this.routeToWorker(collection);
    const worker = this.workers.get(workerName);
    
    if (!worker) {
      throw new Error(`No worker found for collection: ${collection}`);
    }
    
    return new Promise((resolve, reject) => {
      const tx = worker.db.transaction([collection], 'readwrite');
      const store = tx.objectStore(collection);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        worker.operations++;
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ========== ROUTING ==========
  routeToWorker(collection) {
    const routes = {
      'profiles':    'userdata',
      'settings':    'userdata',
      'preferences': 'userdata',
      'images':      'media',
      'videos':      'media',
      'documents':   'media',
      'files':       'media',
      'logs':        'analytics',
      'events':      'analytics',
      'metrics':     'analytics',
      'cache':       'cache'
    };
    
    return routes[collection] || 'primary';
  }

  // ========== MONITORING ==========
  startMonitoring() {
    // Métriques toutes les 5s — échoue silencieusement si dashboard offline
    setInterval(() => {
      this.sendMetrics();
    }, 5000);
  }

  async sendMetrics() {
    try {
      const estimate = await navigator.storage.estimate();
      const usedBytes = estimate.usage || 0;
      const collections = await this.getCollectionsInfo();
      
      await fetch(`${this.apiUrl}/api/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: this.projectName,
          token: this.token,
          metrics: {
            usedBytes,
            collections,
            workers: Array.from(this.workers.entries()).map(([name, worker]) => ({
              name: `${this.projectName}-${name}`,
              usedMB: (worker.usedBytes / (1024 * 1024)).toFixed(2),
              operations: worker.operations
            }))
          }
        })
      });
    } catch (error) {
      // Dashboard offline — ignore silencieusement
    }
  }

  async getCollectionsInfo() {
    const collections = [];
    
    for (const [workerName, worker] of this.workers) {
      for (const storeName of worker.config.stores) {
        try {
          const count = await this.countItems(worker.db, storeName);
          collections.push({ name: storeName, count, worker: workerName });
        } catch (error) {
          // ignore
        }
      }
    }
    
    return collections;
  }

  async countItems(db, storeName) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.LDSS = LDSS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LDSS;
}