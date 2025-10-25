import path from 'node:path'
import { BrowserWindow, Tray, Menu, nativeImage, globalShortcut, screen } from 'electron'

// 声明 Vite 环境变量
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string

export interface WindowServiceOptions {
  onQuit?: () => void
}

export function createWindowService(options: WindowServiceOptions = {}) {
  let tray: Tray | null = null
  let mainWindow: BrowserWindow | null = null

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
          createDebugWindow()
        }
      },
      {
        label: '设置窗口',
        click: () => {
          createSettingWindow()
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

    tray.setToolTip('Voice Assistant - 语音助手')
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

  function createDebugWindow(): BrowserWindow {
    // 获取屏幕尺寸
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

    // 窗口尺寸
    const windowWidth = 1200
    const windowHeight = 800

    // 计算居中位置
    const windowX = Math.floor((screenWidth - windowWidth) / 2)
    const windowY = Math.floor((screenHeight - windowHeight) / 2)

    const debugWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: windowX,
      y: windowY,
      minWidth: 800,
      minHeight: 600,
      frame: true,
      transparent: false,
      alwaysOnTop: false,
      resizable: true,
      skipTaskbar: false,
      minimizable: true,
      maximizable: true,
      closable: true,
      focusable: true,
      show: false,
      title: 'Voice Assistant - Debug',
      webPreferences: {
        preload: path.join(__dirname, './preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    // 加载调试页面
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      debugWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + '#/debug')
    } else {
      debugWindow.loadFile(
        path.join(__dirname, `../view/${MAIN_WINDOW_VITE_NAME}/index.html`),
        { hash: '/debug' }
      )
    }

    debugWindow.once('ready-to-show', () => {
      debugWindow.show()
    })

    // 只在开发模式下打开 DevTools
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      debugWindow.webContents.openDevTools()
    }

    return debugWindow
  }

  function createSettingWindow(): BrowserWindow {
    // 获取屏幕尺寸
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

    // 窗口尺寸
    const windowWidth = 800
    const windowHeight = 600

    // 计算居中位置
    const windowX = Math.floor((screenWidth - windowWidth) / 2)
    const windowY = Math.floor((screenHeight - windowHeight) / 2)

    const settingWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: windowX,
      y: windowY,
      minWidth: 600,
      minHeight: 400,
      frame: true,
      transparent: false,
      alwaysOnTop: false,
      resizable: true,
      skipTaskbar: false,
      minimizable: true,
      maximizable: true,
      closable: true,
      focusable: true,
      show: false,
      title: 'Voice Assistant - Settings',
      webPreferences: {
        preload: path.join(__dirname, './preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    // 加载设置页面
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      settingWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + '#/setting')
    } else {
      settingWindow.loadFile(
        path.join(__dirname, `../view/${MAIN_WINDOW_VITE_NAME}/index.html`),
        { hash: '/setting' }
      )
    }

    settingWindow.once('ready-to-show', () => {
      settingWindow.show()
    })

    // 只在开发模式下打开 DevTools
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      settingWindow.webContents.openDevTools()
    }

    return settingWindow
  }

  function createPanelWindow(): BrowserWindow | undefined {
    if (BrowserWindow.getAllWindows().length >= 1) {
      return
    }

    // 获取屏幕尺寸
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

    // 窗口尺寸配置
    const windowWidth = 320
    const windowHeight = screenHeight
    const windowX = screenWidth - windowWidth // 右侧对齐

    mainWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x: windowX,
      y: 0,
      frame: false, // 完全移除窗口边框和按钮
      transparent: true,
      alwaysOnTop: !MAIN_WINDOW_VITE_DEV_SERVER_URL, // 开发模式下不置顶，方便调试
      resizable: false,
      skipTaskbar: false, // 强制显示在 Dock 栏
      minimizable: true, // 开发模式下允许最小化
      maximizable: false,
      closable: true, // 在开发模式下允许关闭
      focusable: true,
      acceptFirstMouse: true,
      show: false, // 初始隐藏，加载完成后显示
      webPreferences: {
        preload: path.join(__dirname, './preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false, // 防止后台时性能降低
        transparent: true, // 渲染进程透明支持
        offscreen: false, // 禁用离屏渲染
      },
    })

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
    } else {
      mainWindow.loadFile(
        path.join(__dirname, `../view/${MAIN_WINDOW_VITE_NAME}/index.html`),
      )
    }

    // 窗口加载完成后显示
    mainWindow.once('ready-to-show', () => {
      mainWindow?.show()
    })

    // 窗口行为优化 - 开发模式下使用普通窗口行为
    if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      // 生产模式下的特殊窗口行为
      mainWindow.setAlwaysOnTop(true, 'floating', 1) // 设置为浮动级别
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }) // 在所有工作区显示
    }

    // 防止窗口获得焦点时影响其他应用
    mainWindow.on('focus', () => {
      // 可以在这里添加焦点获得时的逻辑
    })

    mainWindow.on('blur', () => {
      // 失去焦点时保持显示
    })

    // 窗口关闭处理 - 开发模式下允许正常关闭
    mainWindow.on('close', (event) => {
      if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        // 开发模式下允许正常关闭
        return
      } else {
        // 生产模式下隐藏窗口
        event.preventDefault()
        mainWindow?.hide()
      }
    })

    // 注册全局快捷键
    registerGlobalShortcuts(mainWindow)

    // 添加系统托盘支持
    createTray(mainWindow)

    // 只在开发模式下打开 DevTools
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.webContents.openDevTools()
    }

    return mainWindow
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
    getMainWindow: () => mainWindow,
  }
}
