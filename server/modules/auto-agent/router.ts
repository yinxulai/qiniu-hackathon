import { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { createSuccessResponse } from '../../helpers/response'

interface ModelOptions {}

export function createAutoAgentRouter(options: ModelOptions): FastifyPluginAsync {

  return async (app) => {
    const typedApp = app.withTypeProvider<ZodTypeProvider>()

    typedApp.post('/chat', async () => {})
    typedApp.post('/chat/stream', async () => {})
  }
}
