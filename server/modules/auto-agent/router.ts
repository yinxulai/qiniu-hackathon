import { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { createSuccessResponse } from '../../helpers/response'
import { createAutoAgentService } from './service'
import {
  GetAgentConfigSchema,
  UpdateAgentConfigSchema,
  ChatStreamSchema,
  ChatSchema,
} from './schema'
import { AIMessage, isAIMessage } from '@langchain/core/messages'

export function createAutoAgentRouter(options: {}): FastifyPluginAsync {
  return async (app) => {
    const typedApp = app.withTypeProvider<ZodTypeProvider>()
    const service = createAutoAgentService()

    typedApp.post('/autoAgent/getConfig', { schema: GetAgentConfigSchema, }, async () => {
      const config = service.getConfig()
      return createSuccessResponse(config)
    })

    typedApp.post('/autoAgent/updateConfig', { schema: UpdateAgentConfigSchema, }, async (request) => {
      const config = service.updateConfig(request.body)
      return createSuccessResponse(config)
    })

    typedApp.post('/autoAgent/chat', { schema: ChatSchema, }, async (request) => {
      const { messages } = request.body
      const response = await service.chat(messages)
      // 提取最后一个 AI 消息的内容
      const aiMessages = response.filter(msg => AIMessage.isInstance(msg))
      const lastAiMessage = aiMessages[aiMessages.length - 1]
      const content = lastAiMessage ? String(lastAiMessage.content) : ''
      return createSuccessResponse({ content })
    })

    typedApp.post('/autoAgent/chatStream', { schema: ChatStreamSchema, }, async (request, reply) => {
      const { messages } = request.body

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      })

      try {
        for await (const chunk of service.chatStream(messages)) {
          reply.raw.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
        }
        reply.raw.write('data: [DONE]\n\n')
      } catch (error) {
        reply.raw.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`)
      } finally {
        reply.raw.end()
      }
    })
  }
}
