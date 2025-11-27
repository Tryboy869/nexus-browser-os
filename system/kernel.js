// system/linux-kernel.js - NEXUS Browser OS Linux Kernel
// Compatible avec l'architecture existante

import { StateManager } from './state.js';
import { WindowManager } from './window-manager.js';
import { CPUManager } from './cpu-manager.js';
import { FileSystem } from './filesystem.js';
import { Storage } from './storage.js';
import { IPC } from './ipc.js';
import { NotificationManager } from './notifications.js';

/**
 * LINUX KERNEL - Browser OS Port
 * Implements Linux kernel algorithms: syscalls, process management, VFS, scheduler
 */
export class LinuxKernel {
  constructor() {
    this.version = 'v0.1.0-linux';
    this.bootTime = null;
    this.uptime = 0;
    
    // Subsystems
    this.state = new StateManager();
    this.windowManager = new WindowManager();
    this.cpuManager = new CPUManager(navigator.hardwareConcurrency || 4);
    this.filesystem = new FileSystem();
    this.storage = new Storage();
    this.ipc = new IPC();
    this.notifications = new NotificationManager();
    
    // Process management
    this.processes = new Map();
    this.nextPid = 1;
    this.initProcess = null;
    
    // Scheduler (CFS-inspired)
    this.scheduler = {
      runQueue: [],
      quantum: 100,
      lastSchedule: Date.now()
    };
    
    // VFS (Virtual Filesystem)
    this.vfs = {
      mount_points: new Map(),
      open_files: new Map(),
      next_fd: 3
    };
    
    // System call table
    this.syscallTable = {
      SYS_FORK: 0x01,
      SYS_EXEC: 0x02,
      SYS_EXIT: 0x03,
      SYS_KILL: 0x05,
      SYS_OPEN: 0x10,
      SYS_READ: 0x11,
      SYS_WRITE: 0x12,
      SYS_GETPID: 0x40,
      SYS_UNAME: 0x42
    };
    
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
    
    console.log('[LinuxKernel] Initialized');
  }
  
  async boot() {
    console.log('[LinuxKernel] Booting NEXUS OS...');
    this.bootTime = Date.now();
    
    try {
      // Initialize subsystems
      await this.filesystem.init();
      await this.storage.init();
      await this.cpuManager.init();
      
      // Create init process (PID 1)
      this.initProcess = this.createInitProcess();
      
      // Mount virtual filesystems
      this.mountVirtualFilesystems();
      
      // Load desktop
      this.loadDesktopIcons();
      this.loadStartMenu();
      
      // Register handlers
      this.registerShortcuts();
      this.registerIPCHandlers();
      
      // Start scheduler
      this.startScheduler();
      
      const bootDuration = Date.now() - this.bootTime;
      console.log(`[LinuxKernel] Boot completed in ${bootDuration}ms`);
      
      this.notifications.show('NEXUS OS démarré', 'success');
      
      return true;
    } catch (error) {
      console.error('[LinuxKernel] KERNEL PANIC:', error);
      this.notifications.show('KERNEL PANIC: Échec du démarrage', 'error');
      return false;
    }
  }
  
  createInitProcess() {
    const initProc = {
      pid: 1,
      ppid: 0,
      name: 'init',
      state: 'running',
      priority: 0,
      startTime: Date.now(),
      cpuTime: 0,
      children: [],
      ownedResources: new Set()
    };
    
    this.processes.set(1, initProc);
    console.log('[LinuxKernel] Init process created (PID 1)');
    
    return initProc;
  }
  
  mountVirtualFilesystems() {
    this.vfs.mount_points.set('/', { type: 'root', fs: this.filesystem });
    this.vfs.mount_points.set('/proc', { type: 'proc', fs: null });
    this.vfs.mount_points.set('/sys', { type: 'sysfs', fs: null });
    this.vfs.mount_points.set('/dev', { type: 'devfs', fs: null });
    
    console.log('[LinuxKernel] Virtual filesystems mounted');
  }
  
  startScheduler() {
    setInterval(() => {
      this.schedulerTick();
    }, this.scheduler.quantum);
  }
  
  schedulerTick() {
    const now = Date.now();
    const elapsed = now - this.scheduler.lastSchedule;
    this.scheduler.lastSchedule = now;
    
    this.uptime = now - this.bootTime;
    
    // Update running processes CPU time
    this.processes.forEach(proc => {
      if (proc.state === 'running') {
        proc.cpuTime += elapsed;
      }
    });
  }
  
  // System call interface
  syscall(callNumber, ...args) {
    try {
      switch (callNumber) {
        case this.syscallTable.SYS_EXEC:
          return this.sys_exec(args[0], args[1]);
        case this.syscallTable.SYS_EXIT:
          return this.sys_exit(args[0]);
        case this.syscallTable.SYS_KILL:
          return this.sys_kill(args[0], args[1]);
        case this.syscallTable.SYS_GETPID:
          return this.sys_getpid();
        case this.syscallTable.SYS_UNAME:
          return this.sys_uname();
        default:
          throw new Error(`Unknown syscall: 0x${callNumber.toString(16)}`);
      }
    } catch (error) {
      console.error('[LinuxKernel] Syscall failed:', error);
      return { error: error.message, errno: -1 };
    }
  }
  
  sys_exec(pid, appId) {
    const process = this.processes.get(pid);
    if (!process) return { error: 'Process not found', errno: -1 };
    
    const app = this.apps.find(a => a.id === appId);
    if (!app) return { error: 'App not found', errno: -1 };
    
    process.name = app.name;
    process.appId = appId;
    process.state = 'running';
    
    return { success: true };
  }
  
  sys_exit(pid) {
    const process = this.processes.get(pid);
    if (!process) return { error: 'Process not found', errno: -1 };
    
    // Reparent children to init
    process.children.forEach(childPid => {
      const child = this.processes.get(childPid);
      if (child) {
        child.ppid = 1;
        this.initProcess.children.push(childPid);
      }
    });
    
    this.releaseProcessResources(pid);
    process.state = 'zombie';
    
    return { success: true };
  }
  
  sys_kill(pid, signal) {
    const process = this.processes.get(pid);
    if (!process) return { error: 'Process not found', errno: -1 };
    
    if (signal === 9) { // SIGKILL
      process.state = 'killed';
      this.killProcess(pid);
    }
    
    return { success: true };
  }
  
  sys_getpid() {
    return { pid: this.nextPid - 1 };
  }
  
  sys_uname() {
    return {
      sysname: 'NEXUS',
      release: this.version,
      machine: navigator.platform
    };
  }
  
  // High-level process management (compatible avec ancien kernel)
  async openApp(appId, args = {}) {
    const app = this.apps.find(a => a.id === appId);
    if (!app) {
      console.error('[LinuxKernel] App not found:', appId);
      return null;
    }
    
    // Check singleton
    if (app.singleton) {
      const existing = Array.from(this.processes.values())
        .find(p => p.appId === appId && p.state === 'running');
      
      if (existing) {
        this.windowManager.focus(existing.windowId);
        return existing.pid;
      }
    }
    
    // Create process
    const pid = this.nextPid++;
    
    const process = {
      pid,
      ppid: 1,
      appId,
      name: app.name,
      state: 'starting',
      priority: 10,
      startTime: Date.now(),
      cpuTime: 0,
      children: [],
      ownedResources: new Set(),
      windowId: null,
      args
    };
    
    this.processes.set(pid, process);
    this.initProcess.children.push(pid);
    
    console.log(`[LinuxKernel] Process ${pid} created for app ${appId}`);
    
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
      process.ownedResources.add({ type: 'window', id: windowId });
      
      this.addToTaskbar(pid, app);
      this.ipc.emit('process:started', { pid, appId });
      
      return pid;
      
    } catch (error) {
      console.error('[LinuxKernel] Failed to start app:', error);
      this.processes.delete(pid);
      this.notifications.show(`Impossible de démarrer ${app.name}`, 'error');
      return null;
    }
  }
  
  killProcess(pid) {
    const process = this.processes.get(pid);
    if (!process) return false;
    
    console.log('[LinuxKernel] Killing process', pid);
    
    if (process.windowId) {
      this.windowManager.closeWindow(process.windowId);
    }
    
    this.removeFromTaskbar(pid);
    this.processes.delete(pid);
    this.ipc.emit('process:killed', { pid });
    
    return true;
  }
  
  releaseProcessResources(pid) {
    const process = this.processes.get(pid);
    if (!process) return;
    
    process.ownedResources.forEach(resource => {
      if (resource.type === 'window' && resource.id) {
        this.windowManager.closeWindow(resource.id);
      }
    });
    
    this.removeFromTaskbar(pid);
  }
  
  // Desktop & UI
  loadDesktopIcons() {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    
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
    if (!startMenuApps) return;
    
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
        const startMenu = document.getElementById('start-menu');
        if (startMenu) startMenu.classList.remove('active');
      });
      
      startMenuApps.appendChild(appEl);
    });
  }
  
  addToTaskbar(pid, app) {
    const taskbarApps = document.getElementById('taskbar-apps');
    if (!taskbarApps) return;
    
    const taskbarApp = document.createElement('div');
    taskbarApp.className = 'taskbar-app active';
    taskbarApp.dataset.pid = pid;
    taskbarApp.innerHTML = `
      <sl-icon name="${app.icon}" style="font-size: 16px;"></sl-icon>
      <span>${app.name}</span>
    `;
    
    taskbarApp.addEventListener('click', () => {
      const process = this.processes.get(pid);
      if (process?.windowId) {
        this.windowManager.focus(process.windowId);
      }
    });
    
    taskbarApps.appendChild(taskbarApp);
  }
  
  removeFromTaskbar(pid) {
    const taskbarApp = document.querySelector(`[data-pid="${pid}"]`);
    if (taskbarApp) taskbarApp.remove();
  }
  
  registerShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.key === 't') {
        e.preventDefault();
        this.openApp('terminal');
      }
      
      if (e.ctrlKey && e.altKey && e.key === 'Delete') {
        e.preventDefault();
        this.openApp('task-manager');
      }
      
      if (e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        const startMenu = document.getElementById('start-menu');
        if (startMenu) startMenu.classList.toggle('active');
      }
    });
  }
  
  registerIPCHandlers() {
    this.ipc.on('cpu:execute', async (data) => {
      try {
        const result = await this.cpuManager.execute(data.task);
        this.ipc.emit('cpu:result', { taskId: data.taskId, result });
      } catch (error) {
        this.ipc.emit('cpu:error', { taskId: data.taskId, error: error.message });
      }
    });
    
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
    
    this.ipc.on('notification:show', (data) => {
      this.notifications.show(data.message, data.type || 'info');
    });
  }
  
  getSystemInfo() {
    return {
      version: this.version,
      uptime: this.uptime,
      bootTime: this.bootTime,
      processes: {
        total: this.processes.size,
        running: Array.from(this.processes.values()).filter(p => p.state === 'running').length
      },
      cpu: {
        cores: this.cpuManager.numCores
      },
      apps: {
        total: this.apps.length
      }
    };
  }
  
  getProcessList() {
    return Array.from(this.processes.values()).map(p => ({
      pid: p.pid,
      ppid: p.ppid,
      name: p.name,
      state: p.state,
      cpuTime: p.cpuTime,
      startTime: p.startTime
    }));
  }
  
  refreshDesktop() {
    this.loadDesktopIcons();
    this.loadStartMenu();
    this.notifications.show('Bureau actualisé', 'success');
  }
  
  async saveState() {
    try {
      const state = {
        version: this.version,
        bootTime: this.bootTime,
        processes: Array.from(this.processes.entries()).map(([pid, proc]) => ({
          pid,
          appId: proc.appId,
          state: proc.state
        }))
      };
      
      await this.storage.set('kernel_state', JSON.stringify(state));
      console.log('[LinuxKernel] State saved');
      return true;
    } catch (error) {
      console.error('[LinuxKernel] Failed to save state:', error);
      return false;
    }
  }
  
  async restoreState() {
    try {
      const stateJson = await this.storage.get('kernel_state');
      if (!stateJson) return false;
      
      const state = JSON.parse(stateJson);
      
      for (const procState of state.processes) {
        if (procState.pid === 1) continue;
        if (procState.appId && procState.state === 'running') {
          await this.openApp(procState.appId);
        }
      }
      
      console.log('[LinuxKernel] State restored');
      return true;
    } catch (error) {
      console.error('[LinuxKernel] Failed to restore state:', error);
      return false;
    }
  }
  
  async shutdown() {
    console.log('[LinuxKernel] Shutting down...');
    await this.saveState();
    
    const processesToKill = Array.from(this.processes.keys()).filter(pid => pid !== 1);
    for (const pid of processesToKill) {
      this.killProcess(pid);
    }
    
    this.notifications.show('Système arrêté', 'info');
  }
}

// Export aussi comme "Kernel" pour compatibilité
export { LinuxKernel as Kernel };

// Export syscalls
export const SYSCALL = {
  FORK: 0x01,
  EXEC: 0x02,
  EXIT: 0x03,
  KILL: 0x05,
  OPEN: 0x10,
  READ: 0x11,
  WRITE: 0x12,
  GETPID: 0x40,
  UNAME: 0x42
};

window.LinuxKernel = LinuxKernel;