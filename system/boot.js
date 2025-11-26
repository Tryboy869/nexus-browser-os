// system/boot.js - NEXUS OS Boot Sequence

export class BootSequence {
  constructor() {
    this.bootScreen = null;
    this.logs = [];
    this.bootSteps = [
      { name: 'BIOS', duration: 800, logs: ['NEXUS BIOS v1.0.0', 'CPU: Browser Engine', 'RAM: Checking...'] },
      { name: 'Hardware', duration: 600, logs: ['Detecting hardware...', 'CPU Cores: Detected', 'Storage: IndexedDB OK'] },
      { name: 'Kernel', duration: 1000, logs: ['Loading kernel...', 'Initializing subsystems...', 'Kernel loaded'] },
      { name: 'FileSystem', duration: 800, logs: ['Mounting filesystem...', 'Checking disk integrity...', 'Filesystem ready'] },
      { name: 'Storage', duration: 600, logs: ['Initializing LDSS...', 'Connecting to storage workers...', 'Storage ready'] },
      { name: 'Services', duration: 1000, logs: ['Starting system services...', 'IPC Manager: OK', 'Window Manager: OK', 'CPU Manager: OK'] },
      { name: 'Desktop', duration: 500, logs: ['Loading desktop environment...', 'Restoring session...', 'Desktop ready'] }
    ];
  }

  async start() {
    this.createBootScreen();
    
    // Power button
    await this.showPowerButton();
    
    // BIOS Screen
    await this.showBIOS();
    
    // Boot sequence
    for (const step of this.bootSteps) {
      await this.executeStep(step);
    }
    
    // Fade out boot screen
    await this.fadeOut();
    
    return true;
  }

  createBootScreen() {
    this.bootScreen = document.createElement('div');
    this.bootScreen.id = 'boot-screen';
    this.bootScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000;
      color: #0f0;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;
    
    document.body.appendChild(this.bootScreen);
  }

  showPowerButton() {
    return new Promise((resolve) => {
      this.bootScreen.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 80px; margin-bottom: 30px;">⏻</div>
          <div style="font-size: 24px; margin-bottom: 20px;">NEXUS Browser OS</div>
          <button id="power-btn" style="
            padding: 15px 40px;
            font-size: 18px;
            background: #0f0;
            color: #000;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            font-weight: bold;
            animation: pulse 2s infinite;
          ">
            POWER ON
          </button>
          <style>
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          </style>
        </div>
      `;

      document.getElementById('power-btn').addEventListener('click', () => {
        resolve();
      });
    });
  }

  async showBIOS() {
    this.bootScreen.innerHTML = `
      <div style="width: 100%; max-width: 800px; padding: 20px;">
        <div style="border: 2px solid #0f0; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px; font-size: 20px;">
            ╔═══════════════════════════════════════╗
            ║      NEXUS BIOS v1.0.0               ║
            ╚═══════════════════════════════════════╝
          </div>
          <div id="bios-content" style="line-height: 1.6;"></div>
        </div>
      </div>
    `;

    const biosContent = document.getElementById('bios-content');
    
    const biosInfo = [
      'Copyright (C) 2025 NEXUS Technologies',
      '',
      'CPU: Browser Engine Detected',
      `Cores: ${navigator.hardwareConcurrency || 4}`,
      'Memory: Testing... OK',
      'Storage: IndexedDB Available',
      '',
      'Press any key to continue...'
    ];

    for (const line of biosInfo) {
      await this.delay(100);
      const div = document.createElement('div');
      div.textContent = line;
      biosContent.appendChild(div);
    }

    await this.delay(1000);
  }

  async executeStep(step) {
    const logsContainer = document.createElement('div');
    logsContainer.style.cssText = `
      width: 100%;
      max-width: 800px;
      padding: 20px;
    `;
    
    this.bootScreen.innerHTML = '';
    this.bootScreen.appendChild(logsContainer);

    // Step header
    const header = document.createElement('div');
    header.style.cssText = 'font-size: 18px; margin-bottom: 15px; color: #0ff;';
    header.textContent = `[${step.name}] Initializing...`;
    logsContainer.appendChild(header);

    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      width: 100%;
      height: 20px;
      background: #222;
      border: 1px solid #0f0;
      margin-bottom: 15px;
      position: relative;
      overflow: hidden;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.style.cssText = `
      height: 100%;
      background: #0f0;
      width: 0%;
      transition: width 0.1s linear;
    `;
    progressBar.appendChild(progressFill);
    logsContainer.appendChild(progressBar);

    // Logs
    const logsDiv = document.createElement('div');
    logsDiv.style.cssText = 'line-height: 1.8;';
    logsContainer.appendChild(logsDiv);

    // Animate progress and show logs
    const logDelay = step.duration / step.logs.length;
    
    for (let i = 0; i < step.logs.length; i++) {
      await this.delay(logDelay);
      
      const logLine = document.createElement('div');
      logLine.textContent = `[${this.getTimestamp()}] ${step.logs[i]}`;
      logsDiv.appendChild(logLine);
      
      progressFill.style.width = ((i + 1) / step.logs.length * 100) + '%';
    }

    // Complete
    header.textContent = `[${step.name}] ✓ Complete`;
    header.style.color = '#0f0';
    
    await this.delay(200);
  }

  async fadeOut() {
    this.bootScreen.style.transition = 'opacity 0.5s';
    this.bootScreen.style.opacity = '0';
    
    await this.delay(500);
    this.bootScreen.remove();
  }

  getTimestamp() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Shutdown sequence
export class ShutdownSequence {
  async start() {
    const shutdownScreen = document.createElement('div');
    shutdownScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000;
      color: #0f0;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.5s;
    `;
    
    document.body.appendChild(shutdownScreen);
    
    // Fade in
    setTimeout(() => {
      shutdownScreen.style.opacity = '1';
    }, 10);
    
    await this.delay(500);
    
    shutdownScreen.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 20px;">Shutting down...</div>
        <div style="font-size: 80px; animation: fadeOut 2s;">⏻</div>
      </div>
      <style>
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      </style>
    `;
    
    // Save state
    if (window.BrowserOS) {
      await window.BrowserOS.saveState();
    }
    
    await this.delay(2000);
    
    // Reload to simulate shutdown
    window.location.reload();
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}