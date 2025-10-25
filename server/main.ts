import Fastify from 'fastify'
import { app, BrowserWindow } from 'electron'
import started from 'electron-squirrel-startup'

import { createOpenapi } from '@server/plugins/openapi'
import { createResponseHandler } from '@server/plugins/response'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { createMcpServerRouter } from './modules/mcp-server/router'
import { createAutoAgentRouter } from './modules/auto-agent/router'
import { createWindowService, createWindowRouter } from './modules/window'
import { createTaskRouter } from './modules/task-manage/router'

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

async function createServer() {
  const fastify = Fastify({ logger: false })

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  fastify.register(createCors())
  fastify.register(createOpenapi())
  fastify.register(createResponseHandler())
  fastify.register(createMcpServerRouter({}))
  fastify.register(createAutoAgentRouter({}))
  fastify.register(createWindowRouter({ windowService }))
  fastify.register(createTaskRouter({}))

  await fastify.ready()
  fastify.listen({ port: config.port, host: '127.0.0.1' })
    .then(() => console.log(`Server is running at http://localhost:${config.port}`))
    .catch((err) => console.error('Error starting server:', err))
}


createServer()
  .then(() => {
    console.log('Electron app is starting...')
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
})

// 处理应用激活
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    windowService.createPanelWindow()
  } else {
    windowService.showAllWindows()
  }
})
