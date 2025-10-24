import { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { createSuccessResponse } from '../../helpers/response'
import {
  ShowWindowSchema,
  HideWindowSchema,
  ToggleWindowSchema,
  ReloadWindowSchema,
  QuitAppSchema,
} from './schema'

export interface WindowRouterOptions {
  windowService: {
    showMainWindow: () => boolean
    hideMainWindow: () => boolean
    toggleMainWindow: () => boolean
    reloadMainWindow: () => boolean
    quit: () => void
  }
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
  }
}
