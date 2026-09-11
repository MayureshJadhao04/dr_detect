const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const DaemonManager = require('./daemonManager.cjs');

let mainWindow = null;
let daemon = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1200,
    minHeight: 800,
    title: 'DR Screen — AI Diabetic Retinopathy Screening Console',
    backgroundColor: '#0b1329',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for preload path resolution in some electron configs
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function initDaemon() {
  const isPackaged = app.isPackaged;
  const repoRoot = isPackaged ? process.resourcesPath : path.resolve(__dirname, '..', '..');
  const exePath = isPackaged
    ? path.join(process.resourcesPath, 'dr_backend.exe')
    : path.join(repoRoot, 'dr_backend.exe');
  const dataDir = path.join(app.getPath('userData'), 'patient_data');

  daemon = new DaemonManager({
    repoRoot,
    dataDir,
    exePath,
  });

  daemon.on('status', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('engine-status', data);
    }
  });

  daemon.on('progress', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pipeline-progress', data);
    }
  });

  daemon.on('error', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('engine-error', data);
    }
  });

  daemon.start();
}

// IPC Handlers
ipcMain.handle('run-pipeline', async (_event, params) => {
  if (!daemon) throw new Error('Daemon not initialized');
  return daemon.send({
    action: 'analyze',
    leftImgPath: params.leftImgPath,
    rightImgPath: params.rightImgPath,
  });
});

ipcMain.handle('save-visit', async (_event, params) => {
  if (!daemon) throw new Error('Daemon not initialized');
  return daemon.send({
    action: 'save',
    patientInfo: params.patientInfo,
  });
});

ipcMain.handle('restart-engine', async () => {
  if (daemon) {
    daemon.restart();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('stop-pipeline', async () => {
  if (daemon) {
    daemon.restart();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('get-engine-status', async () => {
  if (!daemon) return { state: 'STOPPED', isReady: false };
  return { state: daemon.state, isReady: daemon.isReady };
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Fundus Image',
    filters: [
      { name: 'Retinal Images', extensions: ['png', 'jpg', 'jpeg', 'tif', 'tiff'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('open-path', async (_event, filePath) => {
  if (filePath) {
    await shell.openPath(filePath);
    return true;
  }
  return false;
});

app.whenReady().then(() => {
  protocol.handle('media', (request) => {
    let rawPath = request.url.replace(/^media:\/\//, '');
    let decoded = decodeURIComponent(rawPath);
    if (decoded.startsWith('/') && decoded[2] === ':') {
      decoded = decoded.slice(1);
    }
    return net.fetch(pathToFileURL(decoded).toString());
  });

  createWindow();
  initDaemon();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (daemon) {
    daemon.stop();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
