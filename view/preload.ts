// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron'

// 暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 监听语音激活信号
  onVoiceActivation: (callback: () => void) => {
    ipcRenderer.on('voice-activation', callback)
  },
  
  // 移除监听器
  removeVoiceActivationListener: () => {
    ipcRenderer.removeAllListeners('voice-activation')
  },
  
  // 其他可能需要的 API
  platform: process.platform,
  
  // 窗口控制
  hideWindow: () => {
    ipcRenderer.send('hide-window')
  },
  
  showWindow: () => {
    ipcRenderer.send('show-window')
  },

  // 创建新窗口
  createDebugWindow: () => {
    ipcRenderer.send('create-debug-window')
  },

  createSettingWindow: () => {
    ipcRenderer.send('create-setting-window')
  },

  // 应用控制
  quitApp: () => {
    ipcRenderer.send('quit-app')
  },

  // 导航控制
  navigateToSettings: () => {
    ipcRenderer.send('navigate-to-settings')
  },

  navigateToAbout: () => {
    ipcRenderer.send('navigate-to-about')
  },

  // 监听导航事件
  onNavigate: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate', (_, route) => callback(route))
  },

  // 移除导航监听器
  removeNavigateListener: () => {
    ipcRenderer.removeAllListeners('navigate')
  }
})

// 类型声明
declare global {
  interface Window {
    electronAPI: {
      onVoiceActivation: (callback: () => void) => void
      removeVoiceActivationListener: () => void
      platform: string
      hideWindow: () => void
      showWindow: () => void
      createDebugWindow: () => void
      createSettingWindow: () => void
      quitApp: () => void
      navigateToSettings: () => void
      navigateToAbout: () => void
      onNavigate: (callback: (route: string) => void) => void
      removeNavigateListener: () => void
    }
  }
}
