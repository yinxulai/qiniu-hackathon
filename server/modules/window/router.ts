import { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { createSuccessResponse } from '../../helpers/response'
import {
  CreateWindowSchema,
  ShowWindowSchema,
  HideWindowSchema,
  ToggleWindowSchema,
  ReloadWindowSchema,
  QuitAppSchema,
  NavigateSchema,
  WindowType,
} from './schema'

export interface WindowRouterOptions {
  windowService: {
    createPanelWindow: () => void
    createDebugWindow: () => void
    createSettingWindow: () => void
    showMainWindow: () => boolean
    hideMainWindow: () => boolean
    toggleMainWindow: () => boolean
    reloadMainWindow: () => boolean
    navigate: (route: string) => boolean
    quit: () => void
  }
}

export function createWindowRouter(options: WindowRouterOptions): FastifyPluginAsync {
  return async (app) => {
    const typedApp = app.withTypeProvider<ZodTypeProvider>()
    const { windowService } = options

    typedApp.post('/window/create', { schema: CreateWindowSchema }, async (request) => {
      const { type } = request.body

      const windowTypeMap: Record<WindowType, () => void> = {
        panel: windowService.createPanelWindow,
        debug: windowService.createDebugWindow,
        setting: windowService.createSettingWindow,
      }

      const createFn = windowTypeMap[type]
      if (createFn) {
        createFn()
        return createSuccessResponse(true)
      }

      return createSuccessResponse(false)
    })

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

    typedApp.post('/window/navigate', { schema: NavigateSchema }, async (request) => {
      const { route } = request.body
      const result = windowService.navigate(route)
      return createSuccessResponse(result)
    })
  }
}
