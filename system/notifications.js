// system/notifications.js - Notification System (Notyf-like)

export class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.nextId = 1;
    this.createContainer();
    
    console.log('[Notifications] Initialized');
  }
  
  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    
    document.body.appendChild(this.container);
  }
  
  show(message, type = 'info', duration = 3000) {
    const id = this.nextId++;
    
    const notification = {
      id,
      message,
      type,
      timestamp: Date.now()
    };
    
    this.notifications.push(notification);
    
    const el = this.createNotificationElement(notification);
    this.container.appendChild(el);
    
    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
    
    return id;
  }
  
  createNotificationElement(notification) {
    const el = document.createElement('div');
    el.dataset.notificationId = notification.id;
    
    const colors = {
      success: '#27c93f',
      error: '#ff5f56',
      warning: '#ffbd2e',
      info: '#667eea'
    };
    
    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'alert-triangle',
      info: 'info'
    };
    
    el.style.cssText = `
      min-width: 300px;
      max-width: 400px;
      padding: 16px 20px;
      background: rgba(20, 20, 30, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 8px;
      border-left: 4px solid ${colors[notification.type] || colors.info};
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      gap: 12px;
      color: #e8e8f0;
      font-size: 14px;
      animation: slideIn 0.3s ease;
      pointer-events: all;
      cursor: pointer;
    `;
    
    el.innerHTML = `
      <sl-icon 
        name="${icons[notification.type] || icons.info}" 
        style="font-size: 20px; color: ${colors[notification.type] || colors.info}; flex-shrink: 0;"
      ></sl-icon>
      <div style="flex: 1;">${this.escapeHtml(notification.message)}</div>
      <sl-icon 
        name="x" 
        style="font-size: 16px; opacity: 0.5; cursor: pointer; flex-shrink: 0;"
        class="notification-close"
      ></sl-icon>
    `;
    
    // Close on click
    el.querySelector('.notification-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismiss(notification.id);
    });
    
    // Close notification on click (anywhere)
    el.addEventListener('click', () => {
      this.dismiss(notification.id);
    });
    
    // Add animation styles
    if (!document.getElementById('notification-animations')) {
      const style = document.createElement('style');
      style.id = 'notification-animations';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return el;
  }
  
  dismiss(id) {
    const el = this.container.querySelector(`[data-notification-id="${id}"]`);
    
    if (el) {
      el.style.animation = 'slideOut 0.3s ease';
      
      setTimeout(() => {
        el.remove();
        
        // Remove from array
        this.notifications = this.notifications.filter(n => n.id !== id);
      }, 300);
    }
  }
  
  dismissAll() {
    this.notifications.forEach(n => this.dismiss(n.id));
  }
  
  success(message, duration) {
    return this.show(message, 'success', duration);
  }
  
  error(message, duration) {
    return this.show(message, 'error', duration);
  }
  
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }
  
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  getAll() {
    return [...this.notifications];
  }
  
  clear() {
    this.dismissAll();
  }
}