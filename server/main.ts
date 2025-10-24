import path from 'node:path'
import Fastify from 'fastify'
import { app, BrowserWindow } from 'electron'
import started from 'electron-squirrel-startup'

import { createOpenapi } from '@server/plugins/openapi'
import { createResponseHandler } from '@server/plugins/response'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { config } from './config'

if (started) {
  app.quit()
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

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../view/${MAIN_WINDOW_VITE_NAME}/index.html`),
    )
  }

  createServer()
  
  // 只在开发模式下打开 DevTools
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools()
  }
}

app.on('ready', createWindow)
app.on('activate', createWindow)
