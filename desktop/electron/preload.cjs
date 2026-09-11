const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  runPipeline: (params) => ipcRenderer.invoke('run-pipeline', params),
  savePatientVisit: (params) => ipcRenderer.invoke('save-visit', params),
  restartEngine: () => ipcRenderer.invoke('restart-engine'),
  stopPipeline: () => ipcRenderer.invoke('stop-pipeline'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  getEngineStatus: () => ipcRenderer.invoke('get-engine-status'),
  openPath: (filePath) => ipcRenderer.invoke('open-path', filePath),

  // Push event listeners
  onProgress: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('pipeline-progress', subscription);
    return () => ipcRenderer.removeListener('pipeline-progress', subscription);
  },
  onEngineStatus: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('engine-status', subscription);
    return () => ipcRenderer.removeListener('engine-status', subscription);
  },
  onEngineError: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('engine-error', subscription);
    return () => ipcRenderer.removeListener('engine-error', subscription);
  },
});
