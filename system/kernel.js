// system/kernel.js - NEXUS Browser OS Kernel

import { StateManager } from './state.js';
import { WindowManager } from './window-manager.js';
import { CPUManager } from './cpu-manager.js';
import { FileSystem } from './filesystem.js';
import { Storage } from './storage.js';
import { IPC } from './ipc.js';
import { NotificationManager } from './notifications.js';

export class Kernel {
  constructor() {
    this.version = '1.0.0';
    this.bootTime = null;
    this.state = new StateManager();
    this.windowManager = new WindowManager();
    this.cpuManager = new CPUManager(navigator.hardwareConcurrency || 4);
    this.filesystem = new FileSystem();
    this.storage = new Storage();
    this.ipc = new IPC();
    this.notifications = new NotificationManager();
    
    this.processes = new Map();
    this.nextProcessId = 1;
    
    // Apps registry
    this.apps = [
      {
        id: 'calculator',
        name: 'Calculatrice',
        icon: 'calculator',
        path: 'apps/calculator/app.html',
        singleton: false
      },
      {
        id: 'notepad',
        name: 'Bloc-notes',
        icon: 'file-text',
        path: 'apps/notepad/app.html',
        singleton: false
      },
      {
        id: 'terminal',
        name: 'Terminal',
        icon: 'terminal',
        path: 'apps/terminal/app.html',
        singleton: true
      },
      {
        id: 'file-manager',
        name: 'Fichiers',
        icon: 'folder',
        path: 'apps/file-manager/app.html',
        singleton: true
      },
      {
        id: 'task-manager',
        name: 'Gestionnaire de tâches',
        icon: 'activity',
        path: 'apps/task-manager/app.html',
        singleton: true
      },
      {
        id: 'code-editor',
        name: 'Éditeur de code',
        icon: 'code',
        path: 'apps/code-editor/app.html',
        singleton: false
      },
      {
        id: 'settings',
        name: 'Paramètres',
        icon: 'settings',
        path: 'apps/settings/app.html',
        singleton: true
      }
    ];
    
    console.log('[Kernel] Initialized');
  }
  
  async boot() {
    console.log('[Kernel] Booting NEXUS OS...');
    this.bootTime = Date.now();
    
    try {
      // Initialize subsystems
      await this.filesystem.init();
      await this.storage.init();
      await this.cpuManager.init();
      
      // Load desktop icons
      this.loadDesktopIcons();
      
      // Load start menu
      this.loadStartMenu();
      
      // Register global shortcuts
      this.registerShortcuts();
      
      // Register IPC handlers
      this.registerIPCHandlers();
      
      console.log('[Kernel] Boot completed in', Date.now() - this.bootTime, 'ms');
      
      this.notifications.show('Bienvenue sur NEXUS OS', 'success');
      
      return true;
    } catch (error) {
      console.error('[Kernel] Boot failed:', error);
      this.notifications.show('Échec du démarrage du système', 'error');
      return false;
    }
  }
  
  loadDesktopIcons() {
    const desktop = document.getElementById('desktop');
    desktop.innerHTML = '';
    
    this.apps.forEach(app => {
      const icon = document.createElement('div');
      icon.className = 'app-icon';
      icon.innerHTML = `
        <div class="app-icon-image">
          <sl-icon name="${app.icon}" style="font-size: 24px;"></sl-icon>
        </div>
        <div class="app-icon-label">${app.name}</div>
      `;
      
      icon.addEventListener('dblclick', () => this.openApp(app.id));
      desktop.appendChild(icon);
    });
  }
  
  loadStartMenu() {
    const startMenuApps = document.getElementById('start-menu-apps');
    startMenuApps.innerHTML = '';
    
    this.apps.forEach(app => {
      const appEl = document.createElement('div');
      appEl.className = 'start-menu-app';
      appEl.dataset.name = app.name;
      appEl.innerHTML = `
        <div class="app-icon-image" style="width: 40px; height: 40px;">
          <sl-icon name="${app.icon}" style="font-size: 20px;"></sl-icon>
        </div>
        <div style="font-size: 12px;">${app.name}</div>
      `;
      
      appEl.addEventListener('click', () => {
        this.openApp(app.id);
        document.getElementById('start-menu').classList.remove('active');
      });
      
      startMenuApps.appendChild(appEl);
    });
  }
  
  async openApp(appId, args = {}) {
    const app = this.apps.find(a => a.id === appId);
    if (!app) {
      console.error('[Kernel] App not found:', appId);
      return null;
    }
    
    // Check if singleton and already running
    if (app.singleton) {
      const existingProcess = Array.from(this.processes.values())
        .find(p => p.appId === appId);
      
      if (existingProcess) {
        this.windowManager.focus(existingProcess.windowId);
        return existingProcess.pid;
      }
    }
    
    // Create process
    const pid = this.nextProcessId++;
    const process = {
      pid,
      appId,
      name: app.name,
      state: 'starting',
      startTime: Date.now(),
      windowId: null,
      args
    };
    
    this.processes.set(pid, process);
    
    console.log('[Kernel] Starting process', pid, 'for app', appId);
    
    try {
      // Create window
      const windowId = await this.windowManager.createWindow({
        title: app.name,
        icon: app.icon,
        width: 800,
        height: 600,
        url: app.path,
        onClose: () => this.killProcess(pid)
      });
      
      process.windowId = windowId;
      process.state = 'running';
      
      // Add to taskbar
      this.addToTaskbar(pid, app);
      
      // Emit process started event
      this.ipc.emit('process:started', { pid, appId });
      
      return pid;
    } catch (error) {
      console.error('[Kernel] Failed to start app:', error);
      this.processes.delete(pid);
      this.notifications.show(`Impossible de démarrer ${app.name}`, 'error');
      return null;
    }
  }
  
  killProcess(pid) {
    const process = this.processes.get(pid);
    if (!process) {
      console.warn('[Kernel] Process not found:', pid);
      return false;
    }
    
    console.log('[Kernel] Killing process', pid);
    
    // Close window
    if (process.windowId) {
      this.windowManager.closeWindow(process.windowId);
    }
    
    // Remove from taskbar
    this.removeFromTaskbar(pid);
    
    // Remove process
    this.processes.delete(pid);
    
    // Emit process killed event
    this.ipc.emit('process:killed', { pid });
    
    return true;
  }
  
  addToTaskbar(pid, app) {
    const taskbarApps = document.getElementById('taskbar-apps');
    
    const taskbarApp = document.createElement('div');
    taskbarApp.className = 'taskbar-app active';
    taskbarApp.dataset.pid = pid;
    taskbarApp.innerHTML = `
      <sl-icon name="${app.icon}" style="font-size: 16px;"></sl-icon>
      <span>${app.name}</span>
    `;
    
    taskbarApp.addEventListener('click', () => {
      const process = this.processes.get(pid);
      if (process && process.windowId) {
        this.windowManager.focus(process.windowId);
      }
    });
    
    taskbarApps.appendChild(taskbarApp);
  }
  
  removeFromTaskbar(pid) {
    const taskbarApp = document.querySelector(`[data-pid="${pid}"]`);
    if (taskbarApp) {
      taskbarApp.remove();
    }
  }
  
  registerShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Alt+T - Terminal
      if (e.ctrlKey && e.altKey && e.key === 't') {
        e.preventDefault();
        this.openApp('terminal');
      }
      
      // Ctrl+Alt+Delete - Task Manager
      if (e.ctrlKey && e.altKey && e.key === 'Delete') {
        e.preventDefault();
        this.openApp('task-manager');
      }
      
      // Win/Cmd - Start Menu
      if (e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        document.getElementById('start-menu').classList.toggle('active');
      }
    });
  }
  
  registerIPCHandlers() {
    // CPU tasks
    this.ipc.on('cpu:execute', async (data) => {
      try {
        const result = await this.cpuManager.execute(data.task);
        this.ipc.emit('cpu:result', { taskId: data.taskId, result });
      } catch (error) {
        this.ipc.emit('cpu:error', { taskId: data.taskId, error: error.message });
      }
    });
    
    // Filesystem operations
    this.ipc.on('fs:read', async (data) => {
      try {
        const content = await this.filesystem.readFile(data.path);
        this.ipc.emit('fs:read:result', { path: data.path, content });
      } catch (error) {
        this.ipc.emit('fs:read:error', { path: data.path, error: error.message });
      }
    });
    
    this.ipc.on('fs:write', async (data) => {
      try {
        await this.filesystem.writeFile(data.path, data.content);
        this.ipc.emit('fs:write:result', { path: data.path });
      } catch (error) {
        this.ipc.emit('fs:write:error', { path: data.path, error: error.message });
      }
    });
    
    // Notifications
    this.ipc.on('notification:show', (data) => {
      this.notifications.show(data.message, data.type || 'info');
    });
  }
  
  getSystemInfo() {
    return {
      version: this.version,
      uptime: Date.now() - this.bootTime,
      processes: this.processes.size,
      cpuCores: this.cpuManager.numCores,
      apps: this.apps.length
    };
  }
  
  refreshDesktop() {
    this.loadDesktopIcons();
    this.notifications.show('Bureau actualisé', 'success');
  }
}

// Make Kernel globally accessible for debugging
window.Kernel = Kernel;