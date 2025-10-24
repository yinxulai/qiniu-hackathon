import path from 'node:path'
import Fastify from 'fastify'
import { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut, ipcMain } from 'electron'
import started from 'electron-squirrel-startup'

import { createOpenapi } from '@server/plugins/openapi'
import { createResponseHandler } from '@server/plugins/response'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { createMcpServerRouter } from './modules/mcp-server/router'
import { createAutoAgentRouter } from './modules/auto-agent/router'

import { config } from './config'

// 声明 Vite 环境变量
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string

if (started) {
  app.quit()
}

let tray: Tray | null = null

function registerGlobalShortcuts(mainWindow: BrowserWindow) {
  // 注册全局快捷键
  globalShortcut.register('CommandOrControl+Shift+V', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // 注册语音激活快捷键
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    mainWindow.show()
    mainWindow.focus()
    // 向渲染进程发送语音激活信号
    mainWindow.webContents.send('voice-activation')
  })
}

function registerIpcHandlers(mainWindow: BrowserWindow) {
  // 处理窗口隐藏请求
  ipcMain.on('hide-window', () => {
    mainWindow.hide()
  })

  // 处理窗口显示请求
  ipcMain.on('show-window', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // 处理应用退出请求
  ipcMain.on('quit-app', () => {
    app.quit()
  })

  // 处理创建调试窗口请求
  ipcMain.on('create-debug-window', () => {
    createDebugWindow()
  })

  // 处理创建设置窗口请求
  ipcMain.on('create-setting-window', () => {
    createSettingWindow()
  })

  // 处理导航到设置页面
  ipcMain.on('navigate-to-settings', () => {
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('navigate', '/setting')
  })

  // 处理导航到关于页面
  ipcMain.on('navigate-to-about', () => {
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('navigate', '/setting#about')
  })
}

function createTray(mainWindow: BrowserWindow) {
  // 使用确认可用的图标路径
  const iconPath = path.join(process.cwd(), 'static/icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏主窗口',
      accelerator: 'CommandOrControl+Shift+V',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
        }
      }
    },
    {
      label: '语音激活',
      accelerator: 'CommandOrControl+Shift+Space',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('voice-activation')
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
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('navigate', '/setting')
      }
    },
    {
      label: '关于',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('navigate', '/setting?tab=about')
      }
    },
    {
      type: 'separator'
    },
    {
      label: '重新加载',
      click: () => {
        mainWindow.reload()
      }
    },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Voice Assistant - 语音助手')
  tray.setContextMenu(contextMenu)

  // 点击托盘图标显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

async function createServer() {
  const fastify = Fastify({ logger: false })

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  fastify.register(createOpenapi())
  fastify.register(createResponseHandler())
  fastify.register(createMcpServerRouter({}))
  fastify.register(createAutoAgentRouter({}))

  await fastify.ready()
  fastify.listen({ port: config.port })
    .then(() => console.log(`Server is running at http://localhost:${config.port}`))
    .catch((err) => console.error('Error starting server:', err))
}

function createDebugWindow() {
  // 获取屏幕尺寸
  const { screen } = require('electron')
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

  // 在开发模式下打开开发者工具
  // if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
  //   debugWindow.webContents.openDevTools()
  // }

  return debugWindow
}

function createPanelWindow() {
  if (BrowserWindow.getAllWindows().length >= 1) {
    return
  }

  // 获取屏幕尺寸
  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  // 窗口尺寸配置
  const windowWidth = 320
  const windowHeight = screenHeight
  const windowX = screenWidth - windowWidth // 右侧对齐

  const mainWindow = new BrowserWindow({
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
    // 移除 titleBarStyle 配置，frame: false 已经足够
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
    mainWindow.show()
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
      mainWindow.hide()
    }
  })

  // 注册全局快捷键
  registerGlobalShortcuts(mainWindow)

  // 注册 IPC 处理器
  registerIpcHandlers(mainWindow)

  // 添加系统托盘支持
  createTray(mainWindow)

  // 只在开发模式下打开 DevTools
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools()
  }
}

function createSettingWindow() {
  // 获取屏幕尺寸
  const { screen } = require('electron')
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

  return settingWindow
}


createServer()
  .then(() => {
    console.log('Electron app is starting...')
  })

app.on('ready', createPanelWindow)
app.on('activate', createPanelWindow)

// 窗口关闭处理 - 开发模式下允许应用退出
app.on('window-all-closed', () => {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // 开发模式下允许正常退出
    app.quit()
  } else {
    // 生产模式下，在 macOS 上保持应用运行
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }
})

// 应用退出时清理
app.on('will-quit', () => {
  // 注销所有全局快捷键
  globalShortcut.unregisterAll()
})

// 处理应用激活
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createPanelWindow()
  } else {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach(window => {
      if (!window.isVisible()) {
        window.show()
      }
    })
  }
})
