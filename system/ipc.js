// system/ipc.js - Inter-Process Communication (Mitt-like EventBus)

export class IPC {
  constructor() {
    this.events = new Map();
    this.messageId = 0;
    
    console.log('[IPC] Initialized');
  }
  
  // Subscribe to event
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    this.events.get(event).add(handler);
    
    // Return unsubscribe function
    return () => this.off(event, handler);
  }
  
  // Subscribe once
  once(event, handler) {
    const wrapper = (data) => {
      handler(data);
      this.off(event, wrapper);
    };
    
    return this.on(event, wrapper);
  }
  
  // Unsubscribe from event
  off(event, handler) {
    const handlers = this.events.get(event);
    
    if (handlers) {
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }
  
  // Emit event
  emit(event, data) {
    const handlers = this.events.get(event);
    
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[IPC] Error in handler for "${event}":`, error);
        }
      });
    }
    
    // Also emit to wildcard handlers
    const wildcardHandlers = this.events.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler({ event, data });
        } catch (error) {
          console.error(`[IPC] Error in wildcard handler:`, error);
        }
      });
    }
  }
  
  // Request-response pattern
  async request(event, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const messageId = this.messageId++;
      const responseEvent = `${event}:response:${messageId}`;
      
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.off(responseEvent, handleResponse);
        reject(new Error(`IPC request timeout: ${event}`));
      }, timeout);
      
      // Handle response
      const handleResponse = (responseData) => {
        clearTimeout(timeoutId);
        resolve(responseData);
      };
      
      this.once(responseEvent, handleResponse);
      
      // Emit request
      this.emit(event, { ...data, messageId, responseEvent });
    });
  }
  
  // Respond to request
  respond(event, messageId, responseEvent, data) {
    this.emit(responseEvent, data);
  }
  
  // Clear all handlers
  clear() {
    this.events.clear();
    console.log('[IPC] All handlers cleared');
  }
  
  // Get event stats
  getStats() {
    const stats = {};
    
    for (const [event, handlers] of this.events.entries()) {
      stats[event] = handlers.size;
    }
    
    return stats;
  }
  
  // List all registered events
  listEvents() {
    return Array.from(this.events.keys());
  }
  
  // Check if event has handlers
  hasHandlers(event) {
    return this.events.has(event) && this.events.get(event).size > 0;
  }
}