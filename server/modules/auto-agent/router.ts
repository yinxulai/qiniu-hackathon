import { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { createSuccessResponse } from '../../helpers/response'
import { createAutoAgentService } from './service'
import {
  GetAgentConfigSchema,
  UpdateAgentConfigSchema,
  ChatSchema,
} from './schema'
import { AIMessage, isAIMessage } from '@langchain/core/messages'
import type { TaskManageService } from './task-manage/service'

export function createAutoAgentRouter(options: { taskManageService: TaskManageService }): FastifyPluginAsync {
  return async (app) => {
    const typedApp = app.withTypeProvider<ZodTypeProvider>()
    const service = createAutoAgentService(options.taskManageService)

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
  }
}
