const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class DaemonManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.repoRoot = options.repoRoot || path.resolve(__dirname, '..', '..');
    this.dataDir = options.dataDir || path.join(this.repoRoot, 'patient_data');
    this.exePath = options.exePath || path.join(this.repoRoot, 'dr_backend.exe');

    this.proc = null;
    this.isReady = false;
    this.state = 'STOPPED'; // STOPPED, BOOTING, READY, CRASHED
    this.lineBuffer = '';

    this.queue = [];
    this.activeRequest = null;
    this.pendingMap = new Map();
    this.requestTimeoutMs = 120000; // 2 minutes watchdog

    this.restartAttempts = 0;
    this.maxRestarts = 2;
  }

  start() {
    if (this.proc) return;

    this.state = 'BOOTING';
    this.isReady = false;
    this.emit('status', { state: 'BOOTING', message: 'Starting MATLAB AI Engine...' });

    // Detect execution mode: compiled .exe vs matlab -batch (dev fallback)
    let cmd = '';
    let args = [];

    if (fs.existsSync(this.exePath)) {
      cmd = this.exePath;
      args = [];
    } else {
      // Fallback in development: launch MATLAB directly if installed
      cmd = 'matlab';
      const scriptPath = path.join(this.repoRoot, 'models', 'pipelineServer.m').replace(/\\/g, '/');
      args = ['-batch', `run('${scriptPath}');`];
    }

    try {
      this.proc = spawn(cmd, args, {
        cwd: this.repoRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } catch (err) {
      this.state = 'CRASHED';
      this.emit('status', { state: 'CRASHED', message: `Failed to spawn: ${err.message}` });
      return;
    }

    this.proc.stdout.on('data', (chunk) => {
      this.handleStdout(chunk);
    });

    this.proc.stderr.on('data', (chunk) => {
      const errText = chunk.toString().trim();
      if (errText) {
        console.error('[MATLAB stderr]:', errText);
        this.emit('stderr', errText);
      }
    });

    this.proc.on('exit', (code, signal) => {
      console.warn(`[MATLAB daemon] exited with code ${code}, signal ${signal}`);
      this.handleProcessExit(code, signal);
    });

    this.proc.on('error', (err) => {
      console.error('[MATLAB daemon error]:', err);
      this.handleProcessExit(-1, err.message);
    });
  }

  handleStdout(chunk) {
    this.lineBuffer += chunk.toString();
    const lines = this.lineBuffer.split('\n');
    this.lineBuffer = lines.pop(); // keep remainder

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      let msg = null;
      try {
        msg = JSON.parse(line);
      } catch {
        // Plain stdout message / logging
        console.log('[MATLAB stdout log]:', line);
        continue;
      }

      this.dispatchMessage(msg);
    }
  }

  dispatchMessage(msg) {
    const eventType = msg.event;

    if (eventType === 'status') {
      this.emit('status', msg);
    } else if (eventType === 'ready') {
      this.isReady = true;
      this.state = 'READY';
      this.restartAttempts = 0;
      this.emit('status', { state: 'READY', ...msg });

      // Automatically configure dataDir
      this.send({ action: 'set_config', dataDir: this.dataDir }).catch(console.error);

      // Process any requests that arrived during boot
      this.processQueue();
    } else if (eventType === 'progress') {
      this.emit('progress', msg);
    } else if (eventType === 'analysis_complete' || eventType === 'saved' || eventType === 'pong' || eventType === 'config_ack') {
      const reqId = msg.id;
      if (reqId && this.pendingMap.has(reqId)) {
        const item = this.pendingMap.get(reqId);
        clearTimeout(item.timer);
        this.pendingMap.delete(reqId);
        item.resolve(msg);
      }
      this.activeRequest = null;
      this.processQueue();
    } else if (eventType === 'error') {
      const reqId = msg.id;
      if (reqId && this.pendingMap.has(reqId)) {
        const item = this.pendingMap.get(reqId);
        clearTimeout(item.timer);
        this.pendingMap.delete(reqId);
        item.reject(new Error(msg.message || 'MATLAB Daemon Error', { cause: msg }));
      }
      this.emit('error', msg);
      this.activeRequest = null;
      this.processQueue();
    }
  }

  send(request) {
    return new Promise((resolve, reject) => {
      const id = request.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const payload = { ...request, id };

      this.queue.push({ payload, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    if (!this.isReady || this.activeRequest || this.queue.length === 0) {
      return;
    }

    const { payload, resolve, reject } = this.queue.shift();
    this.activeRequest = payload;

    const timer = setTimeout(() => {
      if (this.pendingMap.has(payload.id)) {
        this.pendingMap.delete(payload.id);
        reject(new Error(`Request ${payload.id} timed out after ${this.requestTimeoutMs / 1000}s`));
        this.activeRequest = null;
        this.processQueue();
      }
    }, this.requestTimeoutMs);

    this.pendingMap.set(payload.id, { resolve, reject, timer });

    try {
      const jsonLine = JSON.stringify(payload) + '\n';
      this.proc.stdin.write(jsonLine);
    } catch (err) {
      clearTimeout(timer);
      this.pendingMap.delete(payload.id);
      reject(err);
      this.activeRequest = null;
      this.processQueue();
    }
  }

  handleProcessExit(code, signal) {
    this.proc = null;
    this.isReady = false;
    this.state = 'CRASHED';

    // Clear all pending requests with error
    for (const [id, item] of this.pendingMap.entries()) {
      clearTimeout(item.timer);
      item.reject(new Error(`AI Engine exited unexpectedly (code ${code}, signal ${signal})`));
    }
    this.pendingMap.clear();
    this.activeRequest = null;

    this.emit('status', {
      state: 'CRASHED',
      code,
      signal,
      message: 'MATLAB AI Engine stopped. Restarting...',
    });

    // Auto-restart with backoff if within maxRestarts
    if (this.restartAttempts < this.maxRestarts) {
      this.restartAttempts++;
      const delay = this.restartAttempts * 2000;
      setTimeout(() => {
        this.start();
      }, delay);
    } else {
      this.emit('status', {
        state: 'CRASHED',
        code,
        signal,
        message: 'Engine failed repeatedly. Click "Restart AI Engine" to retry.',
        canManualRestart: true,
      });
    }
  }

  restart() {
    this.stop();
    this.restartAttempts = 0;
    this.start();
  }

  stop() {
    if (this.proc) {
      try {
        this.proc.stdin.write(JSON.stringify({ action: 'exit' }) + '\n');
      } catch {}
      this.proc.kill();
      this.proc = null;
    }
    this.isReady = false;
    this.state = 'STOPPED';
  }
}

module.exports = DaemonManager;
