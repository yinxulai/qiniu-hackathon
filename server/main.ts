import path from 'node:path'
import Fastify from 'fastify'
import { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut, ipcMain } from 'electron'
import started from 'electron-squirrel-startup'

import { createOpenapi } from '@server/plugins/openapi'
import { createResponseHandler } from '@server/plugins/response'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { config } from './config'

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
}

function createTray(mainWindow: BrowserWindow) {
  // 创建系统托盘图标 - 使用一个简单的麦克风图标
  const iconDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(`
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C13.1046 2 14 2.89543 14 4V12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12V4C10 2.89543 10.8954 2 12 2Z" fill="black"/>
      <path d="M17 10V12C17 15.3137 14.3137 18 11 18H10V20H14V22H10V22H10C6.68629 22 4 19.3137 4 16V10H6V12C6 14.2091 7.79086 16 10 16H14C16.2091 16 18 14.2091 18 12V10H17Z" fill="black"/>
    </svg>
  `).toString('base64')
  
  const icon = nativeImage.createFromDataURL(iconDataUrl)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
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
      label: '重新加载',
      click: () => {
        mainWindow.reload()
      }
    },
    {
      type: 'separator'
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

  await fastify.ready()
  fastify.listen({ port: config.port })
    .then(() => console.log(`Server is running at http://localhost:${config.port}`))
    .catch((err) => console.error('Error starting server:', err))
}


function createWindow() {
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

  createServer()
  
  // 只在开发模式下打开 DevTools
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools()
  }
}

app.on('ready', createWindow)
app.on('activate', createWindow)

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
    createWindow()
  } else {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach(window => {
      if (!window.isVisible()) {
        window.show()
      }
    })
  }
})
