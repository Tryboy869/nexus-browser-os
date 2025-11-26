// system/ldss-integration.js - LDSS Integration for Persistence

export class LDSSManager {
  constructor() {
    this.ldss = null;
    this.initialized = false;
    this.projectName = 'NEXUS-BrowserOS';
    
    console.log('[LDSS] Manager initialized');
  }

  async init(token = null) {
    try {
      // Load LDSS SDK if not already loaded
      if (!window.LDSS) {
        await this.loadSDK();
      }

      // Use token from localStorage or parameter
      const savedToken = localStorage.getItem('nexus_ldss_token');
      const useToken = token || savedToken;

      if (!useToken) {
        console.warn('[LDSS] No token provided, using localStorage fallback');
        // Fallback to localStorage if LDSS not available
        this.initialized = false;
        return false;
      }

      // Initialize LDSS
      this.ldss = new window.LDSS({
        token: useToken,
        projectName: this.projectName,
        projectUrl: window.location.origin,
        apiUrl: 'https://ldss-e9kz.onrender.com'
      });

      // Save token
      localStorage.setItem('nexus_ldss_token', useToken);

      this.initialized = true;
      console.log('[LDSS] Initialized successfully');
      
      return true;
    } catch (error) {
      console.error('[LDSS] Initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  async loadSDK() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://ldss-e9kz.onrender.com/ldss-client.js';
      script.onload = () => {
        console.log('[LDSS] SDK loaded');
        resolve();
      };
      script.onerror = () => {
        console.warn('[LDSS] SDK failed to load, using localStorage fallback');
        resolve(); // Don't reject, fallback to localStorage
      };
      document.head.appendChild(script);
    });
  }

  // Save system state
  async saveSystemState(state) {
    try {
      if (this.initialized && this.ldss) {
        await this.ldss.store('system_state', {
          ...state,
          timestamp: Date.now()
        });
        console.log('[LDSS] System state saved');
      } else {
        // Fallback to localStorage
        localStorage.setItem('nexus_system_state', JSON.stringify({
          ...state,
          timestamp: Date.now()
        }));
        console.log('[LDSS] System state saved to localStorage');
      }
      return true;
    } catch (error) {
      console.error('[LDSS] Failed to save system state:', error);
      return false;
    }
  }

  // Load system state
  async loadSystemState() {
    try {
      if (this.initialized && this.ldss) {
        const states = await this.ldss.getAll('system_state');
        const latest = states.sort((a, b) => b.timestamp - a.timestamp)[0];
        console.log('[LDSS] System state loaded');
        return latest || null;
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('nexus_system_state');
        if (saved) {
          console.log('[LDSS] System state loaded from localStorage');
          return JSON.parse(saved);
        }
        return null;
      }
    } catch (error) {
      console.error('[LDSS] Failed to load system state:', error);
      return null;
    }
  }

  // Save user profile
  async saveUserProfile(profile) {
    try {
      if (this.initialized && this.ldss) {
        await this.ldss.store('user_profiles', {
          ...profile,
          updatedAt: Date.now()
        });
      } else {
        localStorage.setItem('nexus_user_profile', JSON.stringify({
          ...profile,
          updatedAt: Date.now()
        }));
      }
      console.log('[LDSS] User profile saved');
      return true;
    } catch (error) {
      console.error('[LDSS] Failed to save user profile:', error);
      return false;
    }
  }

  // Load user profile
  async loadUserProfile() {
    try {
      if (this.initialized && this.ldss) {
        const profiles = await this.ldss.getAll('user_profiles');
        return profiles[profiles.length - 1] || null;
      } else {
        const saved = localStorage.getItem('nexus_user_profile');
        return saved ? JSON.parse(saved) : null;
      }
    } catch (error) {
      console.error('[LDSS] Failed to load user profile:', error);
      return null;
    }
  }

  // Save window state
  async saveWindowState(windows) {
    try {
      if (this.initialized && this.ldss) {
        await this.ldss.store('window_states', {
          windows: windows.map(w => ({
            appId: w.appId,
            x: w.x,
            y: w.y,
            width: w.width,
            height: w.height,
            state: w.state
          })),
          timestamp: Date.now()
        });
      } else {
        localStorage.setItem('nexus_window_states', JSON.stringify({
          windows: windows.map(w => ({
            appId: w.appId,
            x: w.x,
            y: w.y,
            width: w.width,
            height: w.height,
            state: w.state
          })),
          timestamp: Date.now()
        }));
      }
      console.log('[LDSS] Window states saved');
      return true;
    } catch (error) {
      console.error('[LDSS] Failed to save window states:', error);
      return false;
    }
  }

  // Load window state
  async loadWindowState() {
    try {
      if (this.initialized && this.ldss) {
        const states = await this.ldss.getAll('window_states');
        const latest = states.sort((a, b) => b.timestamp - a.timestamp)[0];
        return latest ? latest.windows : [];
      } else {
        const saved = localStorage.getItem('nexus_window_states');
        if (saved) {
          const data = JSON.parse(saved);
          return data.windows || [];
        }
        return [];
      }
    } catch (error) {
      console.error('[LDSS] Failed to load window states:', error);
      return [];
    }
  }

  // Save app data
  async saveAppData(appId, data) {
    try {
      if (this.initialized && this.ldss) {
        await this.ldss.store(`app_${appId}`, {
          ...data,
          appId,
          timestamp: Date.now()
        });
      } else {
        localStorage.setItem(`nexus_app_${appId}`, JSON.stringify({
          ...data,
          timestamp: Date.now()
        }));
      }
      return true;
    } catch (error) {
      console.error('[LDSS] Failed to save app data:', error);
      return false;
    }
  }

  // Load app data
  async loadAppData(appId) {
    try {
      if (this.initialized && this.ldss) {
        const allData = await this.ldss.getAll(`app_${appId}`);
        return allData[allData.length - 1] || null;
      } else {
        const saved = localStorage.getItem(`nexus_app_${appId}`);
        return saved ? JSON.parse(saved) : null;
      }
    } catch (error) {
      console.error('[LDSS] Failed to load app data:', error);
      return null;
    }
  }

  // Clear all data
  async clearAll() {
    try {
      if (this.initialized && this.ldss) {
        // LDSS doesn't have clearAll, so we clear localStorage
        const keys = Object.keys(localStorage).filter(k => k.startsWith('nexus_'));
        keys.forEach(k => localStorage.removeItem(k));
      } else {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('nexus_'));
        keys.forEach(k => localStorage.removeItem(k));
      }
      console.log('[LDSS] All data cleared');
      return true;
    } catch (error) {
      console.error('[LDSS] Failed to clear data:', error);
      return false;
    }
  }

  // Get storage info
  async getStorageInfo() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          total: estimate.quota || 0,
          percentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0,
          available: estimate.quota ? estimate.quota - estimate.usage : 0
        };
      }
      return { used: 0, total: 0, percentage: 0, available: 0 };
    } catch (error) {
      console.error('[LDSS] Failed to get storage info:', error);
      return { used: 0, total: 0, percentage: 0, available: 0 };
    }
  }
}