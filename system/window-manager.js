// system/window-manager.js - Window Management System

export class WindowManager {
  constructor() {
    this.windows = new Map();
    this.nextWindowId = 1;
    this.zIndexCounter = 1000;
    this.container = null;
    
    console.log('[WindowManager] Initialized');
  }
  
  async createWindow(options) {
    const {
      title = 'Window',
      icon = 'window',
      width = 800,
      height = 600,
      url = '',
      x = null,
      y = null,
      onClose = null
    } = options;
    
    const windowId = this.nextWindowId++;
    
    // Create window element
    const windowEl = document.createElement('div');
    windowEl.className = 'nexus-window';
    windowEl.dataset.windowId = windowId;
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
    controls.style.cssText = `
      display: flex;
      gap: 8px;
    `;
    
    // Window controls
    const minimizeBtn = this.createControlButton('#ffbd2e', () => this.minimize(windowId));
    const maximizeBtn = this.createControlButton('#27c93f', () => this.toggleMaximize(windowId));
    const closeBtn = this.createControlButton('#ff5f56', () => {
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
    windowEl.addEventListener('mousedown', () => this.focus(windowId));
    
    // Store window data
    this.windows.set(windowId, {
      id: windowId,
      element: windowEl,
      title,
      icon,
      state: 'normal',
      originalBounds: { x: windowEl.offsetLeft, y: windowEl.offsetTop, width, height }
    });
    
    console.log('[WindowManager] Created window', windowId);
    
    return windowId;
  }
  
  createControlButton(color, onClick) {
    const btn = document.createElement('div');
    btn.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${color};
      cursor: pointer;
      transition: opacity 0.2s;
    `;
    
    btn.addEventListener('mouseenter', () => btn.style.opacity = '0.7');
    btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
    btn.addEventListener('click', onClick);
    
    return btn;
  }
  
  makeDraggable(windowEl, handle) {
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    
    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('.nexus-window-controls')) return;
      
      isDragging = true;
      initialX = e.clientX - windowEl.offsetLeft;
      initialY = e.clientY - windowEl.offsetTop;
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
    });
    
    function drag(e) {
      if (!isDragging) return;
      
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      // Keep window in bounds
      currentX = Math.max(0, Math.min(currentX, window.innerWidth - windowEl.offsetWidth));
      currentY = Math.max(0, Math.min(currentY, window.innerHeight - 60 - windowEl.offsetHeight));
      
      windowEl.style.left = currentX + 'px';
      windowEl.style.top = currentY + 'px';
    }
    
    function stopDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
    }
  }
  
  makeResizable(windowEl) {
    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: nwse-resize;
      z-index: 10;
    `;
    
    windowEl.appendChild(resizeHandle);
    
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = windowEl.offsetWidth;
      startHeight = windowEl.offsetHeight;
      
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      
      e.preventDefault();
    });
    
    function resize(e) {
      if (!isResizing) return;
      
      const width = startWidth + (e.clientX - startX);
      const height = startHeight + (e.clientY - startY);
      
      windowEl.style.width = Math.max(400, width) + 'px';
      windowEl.style.height = Math.max(300, height) + 'px';
    }
    
    function stopResize() {
      isResizing = false;
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    }
  }
  
  focus(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.element.style.zIndex = this.zIndexCounter++;
  }
  
  closeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.element.remove();
    this.windows.delete(windowId);
    
    console.log('[WindowManager] Closed window', windowId);
  }
  
  minimize(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.element.style.display = 'none';
    window.state = 'minimized';
    
    console.log('[WindowManager] Minimized window', windowId);
  }
  
  restore(windowId) {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.element.style.display = 'flex';
    window.state = 'normal';
    this.focus(windowId);
    
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
}