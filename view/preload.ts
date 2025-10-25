// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron'

// 暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 监听语音激活信号
  onVoiceActivation: (callback: () => void) => {
    ipcRenderer.on('voice-activation', callback)
  },
  
  // 监听语音唤醒信号
  onVoiceWakeup: (callback: (data: { timestamp: number; action: string }) => void) => {
    ipcRenderer.on('voice-wakeup-detected', (event, data) => callback(data))
  },
  
  // 移除监听器
  removeVoiceActivationListener: () => {
    ipcRenderer.removeAllListeners('voice-activation')
  },
  
  // 移除语音唤醒监听器
  removeVoiceWakeupListener: () => {
    ipcRenderer.removeAllListeners('voice-wakeup-detected')
  },
  
  // 其他可能需要的 API
  platform: process.platform
})

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      onVoiceActivation: (callback: () => void) => void
      onVoiceWakeup: (callback: (data: { timestamp: number; action: string }) => void) => void
      removeVoiceActivationListener: () => void
      removeVoiceWakeupListener: () => void
      platform: string
    }
  }
}
