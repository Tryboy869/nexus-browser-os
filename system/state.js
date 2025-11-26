// system/state.js - State Management (Zustand-like)

export class StateManager {
  constructor() {
    this.state = {
      theme: 'dark',
      wallpaper: 'default',
      processes: [],
      windows: [],
      notifications: [],
      user: {
        name: 'User',
        preferences: {}
      }
    };
    
    this.listeners = new Set();
    this.loadState();
    
    console.log('[State] Initialized');
  }
  
  // Get current state
  getState() {
    return { ...this.state };
  }
  
  // Set state and notify listeners
  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Save to localStorage
    this.saveState();
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      listener(this.state, prevState);
    });
    
    return this.state;
  }
  
  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  // Get specific value from state
  get(key) {
    return this.state[key];
  }
  
  // Set specific value in state
  set(key, value) {
    this.setState({ [key]: value });
  }
  
  // Update nested state
  update(key, updater) {
    const currentValue = this.state[key];
    const newValue = typeof updater === 'function' 
      ? updater(currentValue) 
      : updater;
    
    this.setState({ [key]: newValue });
  }
  
  // Save state to localStorage
  saveState() {
    try {
      const serialized = JSON.stringify({
        theme: this.state.theme,
        wallpaper: this.state.wallpaper,
        user: this.state.user
      });
      
      localStorage.setItem('nexus_os_state', serialized);
    } catch (error) {
      console.error('[State] Failed to save state:', error);
    }
  }
  
  // Load state from localStorage
  loadState() {
    try {
      const serialized = localStorage.getItem('nexus_os_state');
      
      if (serialized) {
        const saved = JSON.parse(serialized);
        this.state = { ...this.state, ...saved };
        console.log('[State] Loaded from localStorage');
      }
    } catch (error) {
      console.error('[State] Failed to load state:', error);
    }
  }
  
  // Reset state to defaults
  reset() {
    localStorage.removeItem('nexus_os_state');
    
    this.state = {
      theme: 'dark',
      wallpaper: 'default',
      processes: [],
      windows: [],
      notifications: [],
      user: {
        name: 'User',
        preferences: {}
      }
    };
    
    this.listeners.forEach(listener => {
      listener(this.state, {});
    });
    
    console.log('[State] Reset to defaults');
  }
  
  // Export state as JSON
  export() {
    return JSON.stringify(this.state, null, 2);
  }
  
  // Import state from JSON
  import(json) {
    try {
      const imported = JSON.parse(json);
      this.setState(imported);
      console.log('[State] Imported successfully');
      return true;
    } catch (error) {
      console.error('[State] Import failed:', error);
      return false;
    }
  }
}