import { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { createMcpServerService } from './service'
import {
  ListMcpServerSchema,
  ListEnabledMcpServerSchema,
  CreateMcpServerSchema,
  UpdateMcpServerSchema,
  EnableMcpServerSchema,
  DisableMcpServerSchema,
  DeleteMcpServerSchema,
} from './schema'
import { createSuccessResponse } from '@server/helpers/response'
import { UserError } from '@taicode/common-base'

export function createMcpServerRouter(options: {}): FastifyPluginAsync {

  return async (app) => {
    const typedApp = app.withTypeProvider<ZodTypeProvider>()
    const service = createMcpServerService()

    typedApp.post('/mcpServer/list', { schema: ListMcpServerSchema, }, async () => {
      const servers = service.listMcp()
      return createSuccessResponse({
        list: servers,
        total: servers.length,
      })
    })

    typedApp.post('/mcpServer/listEnabled', { schema: ListEnabledMcpServerSchema, }, async () => {
      const servers = service.listEnabledMcp()
      return createSuccessResponse({
        list: servers,
        total: servers.length,
      })
    })

    typedApp.post('/mcpServer/create', { schema: CreateMcpServerSchema, }, async (request) => {
      const server = service.addMcp(request.body)
      return createSuccessResponse(server)
    })

    typedApp.post('/mcpServer/update', { schema: UpdateMcpServerSchema, }, async (request) => {
      const { id, ...updates } = request.body
      const server = service.updateMcp(id, updates)
      return createSuccessResponse(server)
    })

    typedApp.post('/mcpServer/enable', { schema: EnableMcpServerSchema, }, async (request) => {
      const { id } = request.body
      const success = service.enableMcp(id)
      return createSuccessResponse(success)
    })

    typedApp.post('/mcpServer/disable', { schema: DisableMcpServerSchema, }, async (request) => {
      const { id } = request.body
      const success = service.disableMcp(id)
      return createSuccessResponse(success)
    })

    typedApp.post('/mcpServer/delete', { schema: DeleteMcpServerSchema }, async (request) => {
      const { id } = request.body
      const success = service.deleteMcp(id)
      return createSuccessResponse(success)
    })
  }
}
