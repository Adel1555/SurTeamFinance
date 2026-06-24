import { contextBridge } from 'electron';

// Safely expose minor Electron details if needed in the future
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
