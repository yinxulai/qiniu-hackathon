import path from 'node:path'
import { BrowserWindow, Tray, Menu, nativeImage, globalShortcut, screen } from 'electron'
import type { WindowType, WindowInfo } from './schema'

// 声明 Vite 环境变量
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string

export interface WindowServiceOptions {
  onQuit?: () => void
}

export type WindowService = ReturnType<typeof createWindowService>

export function createWindowService(options: WindowServiceOptions = {}) {
  let tray: Tray | null = null
  let mainWindow: BrowserWindow | null = null
  
  // 窗口管理器
  const windows = new Map<WindowType, BrowserWindow>()
  
  // 窗口配置
  const getWindowConfigs = (): Record<WindowType, {
    width: number
    height: number
    frame: boolean
    transparent: boolean
    alwaysOnTop: boolean
    resizable: boolean
    route: string
    title: string
    minWidth?: number
    minHeight?: number
  }> => ({
    panel: {
      width: 320,
      height: screen.getPrimaryDisplay().workAreaSize.height,
      frame: false,
      transparent: true,
      alwaysOnTop: !MAIN_WINDOW_VITE_DEV_SERVER_URL,
      resizable: false,
      route: '/panel',
      title: 'Siwe - Panel',
    },
    debug: {
      width: 1200,
      height: 800,
      frame: true,
      transparent: false,
      alwaysOnTop: false,
      resizable: true,
      route: '/debug',
      title: 'Siwe - Debug',
      minWidth: 800,
      minHeight: 600,
    },
    setting: {
      width: 800,
      height: 600,
      frame: true,
      transparent: false,
      alwaysOnTop: false,
      resizable: true,
      route: '/setting',
      title: 'Siwe - Settings',
      minWidth: 600,
      minHeight: 400,
    },
  })

  function registerGlobalShortcuts(window: BrowserWindow) {
    // 注册全局快捷键
    globalShortcut.register('CommandOrControl+Shift+V', () => {
      if (window.isVisible()) {
        window.hide()
      } else {
        window.show()
        window.focus()
      }
    })

    // 注册语音激活快捷键
    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      window.show()
      window.focus()
      // 向渲染进程发送语音激活信号
      window.webContents.send('voice-activation')
    })
  }

  // HTTP 接口方法替代 IPC 通信
  function showMainWindow(): boolean {
    if (!mainWindow) {
      createPanelWindow()
      return true
    }
    mainWindow.show()
    mainWindow.focus()
    return true
  }

  function hideMainWindow(): boolean {
    if (!mainWindow) return false
    mainWindow.hide()
    return true
  }

  function toggleMainWindow(): boolean {
    if (!mainWindow) {
      createPanelWindow()
      return true
    }
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
    return true
  }

  function reloadMainWindow(): boolean {
    if (!mainWindow) return false
    mainWindow.reload()
    return true
  }

  function navigate(route: string): boolean {
    if (!mainWindow) return false
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('navigate', route)
    return true
  }

  function quit(): void {
    options.onQuit?.()
  }

  function createTray(window: BrowserWindow) {
    // 使用确认可用的图标路径
    const iconPath = path.join(process.cwd(), 'static/icon.png')
    const icon = nativeImage.createFromPath(iconPath)

    tray = new Tray(icon.resize({ width: 16, height: 16 }))

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示/隐藏主窗口',
        accelerator: 'CommandOrControl+Shift+V',
        click: () => {
          if (window.isVisible()) {
            window.hide()
          } else {
            window.show()
          }
        }
      },
      {
        label: '语音激活',
        accelerator: 'CommandOrControl+Shift+Space',
        click: () => {
          window.show()
          window.focus()
          window.webContents.send('voice-activation')
        }
      },
      {
        type: 'separator'
      },
      {
        label: '调试窗口',
        click: () => {
          openWindow('debug')
        }
      },
      {
        label: '设置窗口',
        click: () => {
          openWindow('setting')
        }
      },
      {
        type: 'separator'
      },
      {
        label: '设置',
        click: () => {
          window.show()
          window.focus()
          window.webContents.send('navigate', '/setting')
        }
      },
      {
        label: '关于',
        click: () => {
          window.show()
          window.focus()
          window.webContents.send('navigate', '/setting?tab=about')
        }
      },
      {
        type: 'separator'
      },
      {
        label: '重新加载',
        click: () => {
          window.reload()
        }
      },
      {
        label: '退出',
        click: () => {
          options.onQuit?.()
        }
      }
    ])

    tray.setToolTip('Siwe - 智能语音助手')
    tray.setContextMenu(contextMenu)

    // 点击托盘图标显示/隐藏窗口
    tray.on('click', () => {
      if (window.isVisible()) {
        window.hide()
      } else {
        window.show()
        window.focus()
      }
    })
  }

  function createPanelWindow(): BrowserWindow | undefined {
    if (BrowserWindow.getAllWindows().length >= 1) {
      return
    }
    return createWindow('panel')
  }

  function createDebugWindow(): BrowserWindow {
    return createWindow('debug')
  }

  function createSettingWindow(): BrowserWindow {
    return createWindow('setting')
  }

  function cleanup() {
    // 注销所有全局快捷键
    globalShortcut.unregisterAll()
    tray?.destroy()
    tray = null
  }

  function showAllWindows() {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach(window => {
      if (!window.isVisible()) {
        window.show()
      }
    })
  }

  // ==================== 新的通用窗口操作方法 ====================

  function createWindow(type: WindowType): BrowserWindow {
    // 如果窗口已存在，直接返回
    const existingWindow = windows.get(type)
    if (existingWindow && !existingWindow.isDestroyed()) {
      return existingWindow
    }

    const config = getWindowConfigs()[type]
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

    let windowX: number, windowY: number
    if (type === 'panel') {
      windowX = screenWidth - config.width
      windowY = 0
    } else {
      windowX = Math.floor((screenWidth - config.width) / 2)
      windowY = Math.floor((screenHeight - config.height) / 2)
    }

    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      width: config.width,
      height: config.height,
      x: windowX,
      y: windowY,
      frame: config.frame,
      transparent: config.transparent,
      alwaysOnTop: config.alwaysOnTop,
      resizable: config.resizable,
      skipTaskbar: type === 'panel',
      minimizable: true,
      maximizable: type !== 'panel',
      closable: true,
      focusable: true,
      acceptFirstMouse: type === 'panel',
      show: false,
      title: config.title,
      webPreferences: {
        preload: path.join(__dirname, './preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
        transparent: config.transparent,
        offscreen: false,
        enableBlinkFeatures: 'MediaDevices'
      },
    }

    if (config.minWidth) windowOptions.minWidth = config.minWidth
    if (config.minHeight) windowOptions.minHeight = config.minHeight

    const window = new BrowserWindow(windowOptions)

    // 加载页面
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + '#' + config.route)
    } else {
      window.loadFile(
        path.join(__dirname, `../view/${MAIN_WINDOW_VITE_NAME}/index.html`),
        { hash: config.route }
      )
    }

    window.once('ready-to-show', () => window.show())

    // 面板窗口特殊处理
    if (type === 'panel') {
      if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        window.setAlwaysOnTop(true, 'floating', 1)
        window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      }
      registerGlobalShortcuts(window)
      createTray(window)
      mainWindow = window
    }

    // 窗口关闭处理
    window.on('close', (event) => {
      if (type === 'panel' && !MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        event.preventDefault()
        window.hide()
      } else {
        windows.delete(type)
        if (type === 'panel') mainWindow = null
      }
    })

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      window.webContents.openDevTools()
    }

    windows.set(type, window)
    return window
  }

  function openWindow(type: WindowType): boolean {
    const window = createWindow(type)
    if (!window.isVisible()) window.show()
    window.focus()
    return true
  }

  function closeWindow(type: WindowType): boolean {
    const window = windows.get(type)
    if (!window || window.isDestroyed()) return false

    if (type === 'panel') {
      window.hide()
    } else {
      window.close()
    }
    return true
  }



  function activateVoiceInput(): boolean {
    // 显示主窗口
    showMainWindow()
    
    // 发送语音激活消息到主窗口
    if (!mainWindow || mainWindow.isDestroyed()) {
      return false
    }
    
    mainWindow.webContents.send('voice-wakeup-detected', {
      timestamp: Date.now(),
      action: 'start-voice-input'
    })
    
    return true
  }

  return {
    cleanup,
    showAllWindows,
    createPanelWindow,
    createDebugWindow,
    createSettingWindow,
    showMainWindow,
    hideMainWindow,
    toggleMainWindow,
    reloadMainWindow,
    navigate,
    quit,
    activateVoiceInput,
    // 简化的窗口操作方法
    openWindow,
    closeWindow,
  }
}
