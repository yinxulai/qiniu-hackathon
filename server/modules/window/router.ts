import { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { createSuccessResponse } from '../../helpers/response'
import {
  ShowWindowSchema,
  HideWindowSchema,
  ToggleWindowSchema,
  ReloadWindowSchema,
  QuitAppSchema,
  OpenWindowSchema,
  CloseWindowSchema,
  ActivateVoiceInputSchema,
} from './schema'
import { WindowService } from './service'

export interface WindowRouterOptions {
  windowService: WindowService
}

export function createWindowRouter(options: WindowRouterOptions): FastifyPluginAsync {
  return async (app) => {
    const typedApp = app.withTypeProvider<ZodTypeProvider>()
    const { windowService } = options

    typedApp.post('/window/show', { schema: ShowWindowSchema }, async () => {
      const result = windowService.showMainWindow()
      return createSuccessResponse(result)
    })

    typedApp.post('/window/hide', { schema: HideWindowSchema }, async () => {
      const result = windowService.hideMainWindow()
      return createSuccessResponse(result)
    })

    typedApp.post('/window/toggle', { schema: ToggleWindowSchema }, async () => {
      const result = windowService.toggleMainWindow()
      return createSuccessResponse(result)
    })

    typedApp.post('/window/reload', { schema: ReloadWindowSchema }, async () => {
      const result = windowService.reloadMainWindow()
      return createSuccessResponse(result)
    })

    typedApp.post('/window/quit', { schema: QuitAppSchema }, async () => {
      windowService.quit()
      return createSuccessResponse(true)
    })

    // ==================== 新的通用窗口操作 API ====================

    typedApp.post('/window/open', { schema: OpenWindowSchema }, async (req) => {
      const { type } = req.body
      const result = windowService.openWindow(type)
      return createSuccessResponse(result)
    })

    typedApp.post('/window/close', { schema: CloseWindowSchema }, async (req) => {
      const { type } = req.body
      const result = windowService.closeWindow(type)
      return createSuccessResponse(result)
    })

    // ==================== 语音交互 API ====================

    typedApp.post('/window/voice/activate', { schema: ActivateVoiceInputSchema }, async () => {
      const result = windowService.activateVoiceInput()
      return createSuccessResponse(result)
    })
  }
}
