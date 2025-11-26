// system/window-manager-v2.js - Complete Window Management System

export class WindowManager {
  constructor() {
    this.windows = new Map();
    this.nextWindowId = 1;
    this.zIndexCounter = 1000;
    this.container = null;
    this.minimizedWindows = new Set();
    
    console.log('[WindowManager] Initialized');
  }

  async createWindow(options) {
    const {
      title = 'Window',
      icon = 'window',
      width = 800,
      height = 600,
      url = '',
      appId = '',
      x = null,
      y = null,
      onClose = null,
      onMinimize = null,
      onMaximize = null
    } = options;
    
    const windowId = this.nextWindowId++;
    
    // Create window element
    const windowEl = document.createElement('div');
    windowEl.className = 'nexus-window';
    windowEl.dataset.windowId = windowId;
    windowEl.dataset.appId = appId;
    windowEl.style.cssText = `
      position: absolute;
      width: ${width}px;
      height: ${height}px;
      left: ${x !== null ? x : (window.innerWidth - width) / 2}px;
      top: ${y !== null ? y : (window.innerHeight - height - 60) / 2}px;
      background: rgba(20, 20, 30, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      z-index: ${this.zIndexCounter++};
      pointer-events: all;
      transition: transform 0.3s ease, opacity 0.3s ease;
    `;
    
    // Window header
    const header = document.createElement('div');
    header.className = 'nexus-window-header';
    header.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      cursor: move;
      user-select: none;
      border-radius: 12px 12px 0 0;
    `;
    
    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 14px;
      color: #e8e8f0;
    `;
    titleEl.innerHTML = `
      <sl-icon name="${icon}" style="font-size: 16px;"></sl-icon>
      <span>${title}</span>
    `;
    
    const controls = document.createElement('div');
    controls.className = 'nexus-window-controls';
    controls.style.cssText = `
      display: flex;
      gap: 8px;
    `;
    
    // Create control buttons with proper event handlers
    const minimizeBtn = this.createControlButton('#ffbd2e', 'Minimize', () => {
      this.minimize(windowId);
      if (onMinimize) onMinimize();
    });
    
    const maximizeBtn = this.createControlButton('#27c93f', 'Maximize/Restore', () => {
      this.toggleMaximize(windowId);
      if (onMaximize) onMaximize();
    });
    
    const closeBtn = this.createControlButton('#ff5f56', 'Close', () => {
      this.closeWindow(windowId);
      if (onClose) onClose();
    });
    
    controls.appendChild(minimizeBtn);
    controls.appendChild(maximizeBtn);
    controls.appendChild(closeBtn);
    
    header.appendChild(titleEl);
    header.appendChild(controls);
    
    // Window content
    const content = document.createElement('div');
    content.className = 'nexus-window-content';
    content.style.cssText = `
      flex: 1;
      overflow: auto;
      position: relative;
    `;
    
    // Load app content via iframe for isolation
    if (url) {
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        background: transparent;
      `;
      
      // Setup communication with iframe
      iframe.onload = () => {
        console.log(`[WindowManager] App loaded in window ${windowId}`);
      };
      
      content.appendChild(iframe);
    }
    
    windowEl.appendChild(header);
    windowEl.appendChild(content);
    
    // Add to container
    if (!this.container) {
      this.container = document.getElementById('windows-container');
    }
    this.container.appendChild(windowEl);
    
    // Make draggable
    this.makeDraggable(windowEl, header);
    
    // Make resizable
    this.makeResizable(windowEl);
    
    // Focus on click
    windowEl.addEventListener('mousedown', (e) => {
      // Don't focus if clicking on controls
      if (!e.target.closest('.nexus-window-controls')) {
        this.focus(windowId);
      }
    });
    
    // Double-click header to maximize
    header.addEventListener('dblclick', (e) => {
      if (!e.target.closest('.nexus-window-controls')) {
        this.toggleMaximize(windowId);
      }
    });
    
    // Store window data
    this.windows.set(windowId, {
      id: windowId,
      appId,
      element: windowEl,
      iframe: content.querySelector('iframe'),
      title,
      icon,
      state: 'normal',
      originalBounds: { 
        x: windowEl.offsetLeft, 
        y: windowEl.offsetTop, 
        width, 
        height 
      }
    });
    
    // Animate entrance
    windowEl.style.transform = 'scale(0.9)';
    windowEl.style.opacity = '0';
    
    setTimeout(() => {
      windowEl.style.transform = 'scale(1)';
      windowEl.style.opacity = '1';
    }, 10);
    
    console.log('[WindowManager] Created window', windowId, 'for app', appId);
    
    return windowId;
  }
  
  createControlButton(color, title, onClick) {
    const btn = document.createElement('div');
    btn.title = title;
    btn.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${color};
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    `;
    
    // Hover effect
    btn.addEventListener('mouseenter', () => {
      btn.style.opacity = '0.7';
      btn.style.transform = 'scale(1.1)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.opacity = '1';
      btn.style.transform = 'scale(1)';
    });
    
    // Click handler - IMPORTANT: stopPropagation to prevent drag
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    });
    
    // Prevent mousedown from triggering drag
    btn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    
    return btn;
  }
  
  makeDraggable(windowEl, handle) {
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    
    handle.addEventListener('mousedown', (e) => {
      // Don't drag if clicking on controls
      if (e.target.closest('.nexus-window-controls')) {
        return;
      }
      
      isDragging = true;
      initialX = e.clientX - windowEl.offsetLeft;
      initialY = e.clientY - windowEl.offsetTop;
      
      // Focus window when starting drag
      const windowId = parseInt(windowEl.dataset.windowId);
      this.focus(windowId);
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
      
      e.preventDefault();
    });
    
    const drag = (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      // Keep window in bounds
      const maxX = window.innerWidth - windowEl.offsetWidth;
      const maxY = window.innerHeight - 60 - windowEl.offsetHeight;
      
      currentX = Math.max(0, Math.min(currentX, maxX));
      currentY = Math.max(0, Math.min(currentY, maxY));
      
      windowEl.style.left = currentX + 'px';
      windowEl.style.top = currentY + 'px';
    };
    
    const stopDrag = () => {
      isDragging = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
    };
  }
  
  makeResizable(windowEl) {
    const corners = ['se', 'sw', 'ne', 'nw'];
    const edges = ['s', 'e', 'w', 'n'];
    
    // Create resize handles
    [...corners, ...edges].forEach(position => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-${position}`;
      
      const styles = {
        se: { bottom: 0, right: 0, cursor: 'nwse-resize', width: '20px', height: '20px' },
        sw: { bottom: 0, left: 0, cursor: 'nesw-resize', width: '20px', height: '20px' },
        ne: { top: 0, right: 0, cursor: 'nesw-resize', width: '20px', height: '20px' },
        nw: { top: 0, left: 0, cursor: 'nwse-resize', width: '20px', height: '20px' },
        s: { bottom: 0, left: 0, right: 0, cursor: 'ns-resize', height: '5px' },
        n: { top: 0, left: 0, right: 0, cursor: 'ns-resize', height: '5px' },
        e: { top: 0, right: 0, bottom: 0, cursor: 'ew-resize', width: '5px' },
        w: { top: 0, left: 0, bottom: 0, cursor: 'ew-resize', width: '5px' }
      };
      
      handle.style.cssText = `
        position: absolute;
        ${Object.entries(styles[position]).map(([k, v]) => `${k}: ${v}`).join('; ')};
        z-index: 10;
      `;
      
      let isResizing = false;
      let startX, startY, startWidth, startHeight, startLeft, startTop;
      
      handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = windowEl.offsetWidth;
        startHeight = windowEl.offsetHeight;
        startLeft = windowEl.offsetLeft;
        startTop = windowEl.offsetTop;
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        
        e.preventDefault();
        e.stopPropagation();
      });
      
      const resize = (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;
        
        if (position.includes('e')) {
          newWidth = Math.max(400, startWidth + deltaX);
        }
        if (position.includes('w')) {
          newWidth = Math.max(400, startWidth - deltaX);
          newLeft = startLeft + deltaX;
        }
        if (position.includes('s')) {
          newHeight = Math.max(300, startHeight + deltaY);
        }
        if (position.includes('n')) {
          newHeight = Math.max(300, startHeight - deltaY);
          newTop = startTop + deltaY;
        }
        
        windowEl.style.width = newWidth + 'px';
        windowEl.style.height = newHeight + 'px';
        windowEl.style.left = newLeft + 'px';
        windowEl.style.top = newTop + 'px';
      };
      
      const stopResize = () => {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
      };
      
      windowEl.appendChild(handle);
    });
  }
  
  focus(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.element.style.zIndex = this.zIndexCounter++;
    
    // Update taskbar active state
    document.querySelectorAll('.taskbar-app').forEach(app => {
      if (parseInt(app.dataset.windowId) === windowId) {
        app.classList.add('active');
      } else {
        app.classList.remove('active');
      }
    });
  }
  
  closeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    // Animate exit
    window.element.style.transform = 'scale(0.9)';
    window.element.style.opacity = '0';
    
    setTimeout(() => {
      window.element.remove();
      this.windows.delete(windowId);
      this.minimizedWindows.delete(windowId);
      
      // Remove from taskbar
      const taskbarApp = document.querySelector(`[data-window-id="${windowId}"]`);
      if (taskbarApp) {
        taskbarApp.remove();
      }
      
      console.log('[WindowManager] Closed window', windowId);
    }, 300);
  }
  
  minimize(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    // Animate to taskbar
    const taskbarApp = document.querySelector(`[data-window-id="${windowId}"]`);
    if (taskbarApp) {
      const rect = taskbarApp.getBoundingClientRect();
      const windowRect = window.element.getBoundingClientRect();
      
      window.element.style.transform = `scale(0.1) translate(${rect.left - windowRect.left}px, ${rect.top - windowRect.top}px)`;
      window.element.style.opacity = '0';
    }
    
    setTimeout(() => {
      window.element.style.display = 'none';
      window.state = 'minimized';
      this.minimizedWindows.add(windowId);
      
      console.log('[WindowManager] Minimized window', windowId);
    }, 300);
  }
  
  restore(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.element.style.display = 'flex';
    window.state = 'normal';
    this.minimizedWindows.delete(windowId);
    
    // Reset transform
    setTimeout(() => {
      window.element.style.transform = 'scale(1)';
      window.element.style.opacity = '1';
      this.focus(windowId);
    }, 10);
    
    console.log('[WindowManager] Restored window', windowId);
  }
  
  toggleMaximize(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    if (window.state === 'maximized') {
      // Restore
      const bounds = window.originalBounds;
      window.element.style.left = bounds.x + 'px';
      window.element.style.top = bounds.y + 'px';
      window.element.style.width = bounds.width + 'px';
      window.element.style.height = bounds.height + 'px';
      window.element.style.borderRadius = '12px';
      window.state = 'normal';
    } else {
      // Maximize
      window.originalBounds = {
        x: window.element.offsetLeft,
        y: window.element.offsetTop,
        width: window.element.offsetWidth,
        height: window.element.offsetHeight
      };
      
      window.element.style.left = '0';
      window.element.style.top = '0';
      window.element.style.width = '100%';
      window.element.style.height = 'calc(100vh - 60px)';
      window.element.style.borderRadius = '0';
      window.state = 'maximized';
    }
    
    this.focus(windowId);
  }
  
  getWindow(windowId) {
    return this.windows.get(windowId);
  }
  
  getAllWindows() {
    return Array.from(this.windows.values());
  }
  
  getWindowState() {
    return Array.from(this.windows.values()).map(w => ({
      id: w.id,
      appId: w.appId,
      x: w.element.offsetLeft,
      y: w.element.offsetTop,
      width: w.element.offsetWidth,
      height: w.element.offsetHeight,
      state: w.state
    }));
  }
}