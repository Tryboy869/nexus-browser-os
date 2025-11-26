// system/cpu-manager.js - CPU & Web Workers Management

export class CPUManager {
  constructor(numCores = 4) {
    this.numCores = numCores;
    this.workers = [];
    this.taskQueue = [];
    this.stats = {
      tasksCompleted: 0,
      totalTime: 0,
      errors: 0
    };
    
    console.log(`[CPUManager] Initialized with ${numCores} cores`);
  }
  
  async init() {
    // Create worker pool
    const workerCode = this.generateWorkerCode();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    for (let i = 0; i < this.numCores; i++) {
      try {
        const worker = new Worker(workerUrl);
        
        this.workers.push({
          id: i,
          worker,
          busy: false,
          tasksCompleted: 0
        });
        
        console.log(`[CPUManager] Core ${i} initialized`);
      } catch (error) {
        console.error(`[CPUManager] Failed to create worker ${i}:`, error);
      }
    }
    
    console.log(`[CPUManager] ${this.workers.length} cores ready`);
  }
  
  generateWorkerCode() {
    return `
      // Web Worker Code
      const operations = {
        // Arithmetic
        add: (a, b) => a + b,
        subtract: (a, b) => a - b,
        multiply: (a, b) => a * b,
        divide: (a, b) => b !== 0 ? a / b : 'Division by zero',
        power: (a, b) => Math.pow(a, b),
        sqrt: (n) => Math.sqrt(n),
        
        // Mathematical
        fibonacci: (n) => {
          if (n <= 1) return n;
          let a = 0, b = 1;
          for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
          }
          return b;
        },
        
        factorial: (n) => {
          if (n <= 1) return 1;
          let result = 1;
          for (let i = 2; i <= n; i++) {
            result *= i;
          }
          return result;
        },
        
        isPrime: (n) => {
          if (n <= 1) return false;
          if (n <= 3) return true;
          if (n % 2 === 0 || n % 3 === 0) return false;
          for (let i = 5; i * i <= n; i += 6) {
            if (n % i === 0 || n % (i + 2) === 0) return false;
          }
          return true;
        },
        
        // Trigonometry
        sin: (x) => Math.sin(x),
        cos: (x) => Math.cos(x),
        tan: (x) => Math.tan(x),
        
        // Arrays
        sum: (arr) => arr.reduce((a, b) => a + b, 0),
        average: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
        max: (arr) => Math.max(...arr),
        min: (arr) => Math.min(...arr),
        sort: (arr) => [...arr].sort((a, b) => a - b),
        
        // Sorting
        bubbleSort: (arr) => {
          const result = [...arr];
          for (let i = 0; i < result.length; i++) {
            for (let j = 0; j < result.length - i - 1; j++) {
              if (result[j] > result[j + 1]) {
                [result[j], result[j + 1]] = [result[j + 1], result[j]];
              }
            }
          }
          return result;
        },
        
        quickSort: (arr) => {
          if (arr.length <= 1) return arr;
          const pivot = arr[Math.floor(arr.length / 2)];
          const left = arr.filter(x => x < pivot);
          const middle = arr.filter(x => x === pivot);
          const right = arr.filter(x => x > pivot);
          return [...operations.quickSort(left), ...middle, ...operations.quickSort(right)];
        },
        
        // Search
        linearSearch: (arr, target) => {
          for (let i = 0; i < arr.length; i++) {
            if (arr[i] === target) return i;
          }
          return -1;
        },
        
        binarySearch: (arr, target) => {
          let left = 0, right = arr.length - 1;
          while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (arr[mid] === target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
          }
          return -1;
        },
        
        // Statistics
        median: (arr) => {
          const sorted = [...arr].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          return sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2 
            : sorted[mid];
        },
        
        variance: (arr) => {
          const mean = operations.average(arr);
          return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
        },
        
        standardDeviation: (arr) => {
          return Math.sqrt(operations.variance(arr));
        },
        
        // Hash
        simpleHash: (str) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
          }
          return Math.abs(hash).toString(16);
        }
      };
      
      self.onmessage = function(e) {
        const { taskId, operation, args } = e.data;
        
        try {
          if (!operations[operation]) {
            throw new Error('Unknown operation: ' + operation);
          }
          
          const startTime = performance.now();
          const result = operations[operation](...args);
          const duration = performance.now() - startTime;
          
          self.postMessage({
            taskId,
            success: true,
            result,
            duration
          });
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            error: error.message
          });
        }
      };
    `;
  }
  
  async execute(operation, ...args) {
    return new Promise((resolve, reject) => {
      const taskId = Date.now() + Math.random();
      const startTime = Date.now();
      
      // Find free worker
      const freeWorker = this.workers.find(w => !w.busy);
      
      if (!freeWorker) {
        // Queue task if no free workers
        this.taskQueue.push({ taskId, operation, args, resolve, reject, startTime });
        return;
      }
      
      // Execute task
      this.executeTask(freeWorker, { taskId, operation, args, resolve, reject, startTime });
    });
  }
  
  executeTask(workerInfo, task) {
    const { taskId, operation, args, resolve, reject, startTime } = task;
    
    workerInfo.busy = true;
    
    const handleMessage = (e) => {
      const { taskId: responseTaskId, success, result, error, duration } = e.data;
      
      if (responseTaskId === taskId) {
        workerInfo.worker.removeEventListener('message', handleMessage);
        workerInfo.busy = false;
        workerInfo.tasksCompleted++;
        
        if (success) {
          this.stats.tasksCompleted++;
          this.stats.totalTime += Date.now() - startTime;
          resolve(result);
        } else {
          this.stats.errors++;
          reject(new Error(error));
        }
        
        // Process next task in queue
        if (this.taskQueue.length > 0) {
          const nextTask = this.taskQueue.shift();
          this.executeTask(workerInfo, nextTask);
        }
      }
    };
    
    workerInfo.worker.addEventListener('message', handleMessage);
    
    workerInfo.worker.postMessage({
      taskId,
      operation,
      args
    });
  }
  
  getStats() {
    return {
      cores: this.numCores,
      tasksCompleted: this.stats.tasksCompleted,
      averageTime: this.stats.tasksCompleted > 0 
        ? this.stats.totalTime / this.stats.tasksCompleted 
        : 0,
      errors: this.stats.errors,
      queueSize: this.taskQueue.length,
      workers: this.workers.map(w => ({
        id: w.id,
        busy: w.busy,
        tasksCompleted: w.tasksCompleted
      }))
    };
  }
  
  getCoreUsage() {
    const busyCores = this.workers.filter(w => w.busy).length;
    return {
      busy: busyCores,
      free: this.numCores - busyCores,
      percentage: (busyCores / this.numCores) * 100
    };
  }
  
  terminate() {
    this.workers.forEach(w => w.worker.terminate());
    this.workers = [];
    console.log('[CPUManager] All workers terminated');
  }
}