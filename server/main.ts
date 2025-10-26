import Fastify from 'fastify'
import { app, BrowserWindow } from 'electron'
import started from 'electron-squirrel-startup'
import path from 'path'

import { createOpenapi } from '@server/plugins/openapi'
import { createResponseHandler } from '@server/plugins/response'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { createMcpServerRouter } from './modules/mcp-server/router'
import { createAutoAgentRouter } from './modules/auto-agent/router'
import { createWindowService, createWindowRouter } from './modules/window'
import { createTaskRouter, createTaskService } from './modules/auto-agent/task-manage'
import { createASRConfigRouter, ASRConfigService } from './modules/asr-config'
import { VoiceWakeupService } from './modules/voice-wakeup/service'

import { config } from './config'
import { createCors } from './plugins/cors'

// 声明 Vite 环境变量
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string

if (started) {
  app.quit()
}

// 创建窗口服务
const windowService = createWindowService({
  onQuit: () => app.quit()
})

const taskManageService = createTaskService()
const asrConfigService = new ASRConfigService()

// 语音唤醒服务（在应用启动后初始化）
let voiceWakeupService: VoiceWakeupService | null = null

async function createServer() {
  const fastify = Fastify({ logger: false })

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  fastify.register(createCors())
  fastify.register(createOpenapi())
  fastify.register(createResponseHandler())
  fastify.register(createMcpServerRouter({}))
  fastify.register(createTaskRouter({ taskService: taskManageService }))
  fastify.register(createWindowRouter({ windowService }))
  fastify.register(createAutoAgentRouter({ taskManageService }))
  fastify.register(createASRConfigRouter({}))

  await fastify.ready()
  fastify.listen({ port: config.port, host: '127.0.0.1' })
    .then(() => console.log(`Server is running at http://localhost:${config.port}`))
    .catch((err) => console.error('Error starting server:', err))
}

/**
 * 获取平台特定的唤醒词文件路径
 */
function getPlatformKeywordPath(): string {
  const platform = process.platform
  const arch = process.arch

  console.log(`[VoiceWakeup] Detecting platform: ${platform}, architecture: ${arch}`)
  
  // 根据平台和架构选择文件
  let filename: string
  
  if (platform === 'win32') {
    // Windows
    filename = 'windows_arm64.ppn'
  } else if (platform === 'darwin') {
    // macOS
    filename = 'mac_arm64.ppn'
  } else {
    // Linux 和其他平台
    filename = 'web.ppn' // 使用通用的web文件作为后备
  }
  
  const keywordPath = path.join(process.cwd(), 'static/porcupine', filename)
  console.log(`[VoiceWakeup] Platform: ${platform}, Arch: ${arch}, Using keyword file: ${filename}`)
  
  return keywordPath
}

/**
 * 初始化语音唤醒服务
 */
async function initializeVoiceWakeup(): Promise<void> {
  try {
    console.log('[VoiceWakeup] Starting initialization...')
    
    // 获取 ASR 配置
    const asrConfig = await asrConfigService.getConfig()
    if (!asrConfig?.accessKey || !asrConfig.accessKey.trim()) {
      console.log('[VoiceWakeup] No accessKey found in ASR config. Voice wakeup disabled.')
      return
    }

    // 获取平台特定的唤醒词文件路径
    const keywordPath = getPlatformKeywordPath()
    const modelPath = path.join(process.cwd(), 'static/porcupine/porcupine_params_zh.pv')
    
    console.log(`[VoiceWakeup] Using keyword file: ${keywordPath}`)
    console.log(`[VoiceWakeup] Using Chinese model file: ${modelPath}`)

    // 检查文件是否存在
    const fs = require('fs')
    if (!fs.existsSync(keywordPath)) {
      console.error(`[VoiceWakeup] Keyword file not found: ${keywordPath}`)
      console.log('[VoiceWakeup] Available files in porcupine directory:')
      try {
        const porcupineDir = path.join(process.cwd(), 'static/porcupine')
        const files = fs.readdirSync(porcupineDir)
        files.forEach((file: string) => console.log(`  - ${file}`))
      } catch (e) {
        console.log('  Could not read porcupine directory')
      }
      return
    }
    if (!fs.existsSync(modelPath)) {
      console.error(`[VoiceWakeup] Model file not found: ${modelPath}`)
      return
    }

    // 创建语音唤醒服务
    const wakeupEvents = {
      onWakewordDetected: (keywordIndex: number, keyword: string) => {
        console.log(`[VoiceWakeup] Wake word detected: ${keyword}`)
        // 通知面板进入语音输入模式
        notifyPanelVoiceMode()
      },
      onError: (error: Error) => {
        console.error('[VoiceWakeup] Error:', error.message)
      },
      onStart: () => {
        console.log('[VoiceWakeup] Service started')
      },
      onStop: () => {
        console.log('[VoiceWakeup] Service stopped')
      }
    }

    voiceWakeupService = new VoiceWakeupService({
      accessKey: asrConfig.accessKey,
      keywordPath: keywordPath,
      modelPath: modelPath  // 添加中文模型支持
    }, wakeupEvents)

    // 初始化并开始监听
    await voiceWakeupService.initialize()
    await voiceWakeupService.startListening()
    
    console.log('[VoiceWakeup] Voice wakeup service started successfully')
  } catch (error) {
    console.error('[VoiceWakeup] Failed to initialize voice wakeup:', error)
  }
}

/**
 * 通知面板进入语音输入模式
 */
function notifyPanelVoiceMode(): void {
  try {
    const success = windowService.activateVoiceInput()
    
    if (success) {
      console.log('[VoiceWakeup] Notified panel to enter voice input mode')
    } else {
      console.warn('[VoiceWakeup] Main window not available')
    }
  } catch (error) {
    console.error('[VoiceWakeup] Error notifying panel:', error)
  }
}


createServer()
  .then(() => {
    console.log('Electron app is starting...')
    // 在服务器启动后初始化语音唤醒
    return initializeVoiceWakeup()
  })
  .catch((err) => {
    console.error('Error during app initialization:', err)
  })

app.on('ready', () => windowService.createPanelWindow())
app.on('activate', () => windowService.createPanelWindow())

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
  windowService.cleanup()
  // 清理语音唤醒服务
  if (voiceWakeupService) {
    voiceWakeupService.dispose()
    voiceWakeupService = null
  }
})

// 处理应用激活
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    windowService.createPanelWindow()
  } else {
    windowService.showAllWindows()
  }
})

/* 
// 语音唤醒服务集成示例（需要 Picovoice Access Key）
// 1. 在 https://console.picovoice.ai/ 注册并获取免费的 Access Key
// 2. 取消下面代码的注释并填入你的 Access Key

import { createVoiceWakeupService } from './modules/voice-wakeup'

let voiceWakeupService: any = null

async function initializeVoiceWakeup() {
  try {
    voiceWakeupService = createVoiceWakeupService({
      accessKey: 'YOUR_PICOVOICE_ACCESS_KEY_HERE', // 替换为你的 Access Key
      onWakeup: () => {
        console.log('Voice wakeup detected! Showing main window...')
        windowService.showPanelWindow()
      },
      onError: (error) => {
        console.error('Voice wakeup error:', error)
      }
    })

    await voiceWakeupService.initialize()
    await voiceWakeupService.startListening()
    
    console.log('Voice wakeup service started successfully')
  } catch (error) {
    console.error('Failed to initialize voice wakeup:', error)
  }
}

// 在应用准备好后启动语音唤醒
app.whenReady().then(() => {
  // initializeVoiceWakeup() // 取消注释以启用语音唤醒
})
*/
