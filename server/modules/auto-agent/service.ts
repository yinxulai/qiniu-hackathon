import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import { createAgent } from 'langchain'
import { ChatOpenAI } from '@langchain/openai'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
import type { AgentConfig, Message, UpdateAgentConfigInput } from './schema'
import { createMcpServerService } from '../mcp-server/service'
import type { TaskManageService } from './task-manage/service'

const store = new Store<{ config: AgentConfig | null }>({
  name: 'auto-agent-config',
  defaults: { config: null },
})

export function createAutoAgentService(taskService: TaskManageService) {
  const mcpService = createMcpServerService()

  function getConfig(): AgentConfig {
    return store.get('config') || {
      id: 'default',
      apiKey: 'sk-cd8ca153d613bcb43042cf6228581e3d840e8782fa653ec87dfdfe980880b0cb',
      baseUrl: 'https://openai.qiniu.com/v1',
      modelId: 'moonshotai/kimi-k2-0905',
      systemPrompt: '',
    }
  }

  function updateConfig(updates: UpdateAgentConfigInput): AgentConfig {
    const current = getConfig()

    const updated: AgentConfig = {
      id: current?.id || uuidv4(),
      apiKey: updates.apiKey ?? current?.apiKey ?? '',
      baseUrl: updates.baseUrl ?? current?.baseUrl ?? '',
      modelId: updates.modelId ?? current?.modelId ?? '',
      systemPrompt: updates.systemPrompt ?? current?.systemPrompt,
    }

    store.set('config', updated)
    return updated
  }

  async function chat(messages: Message[]): Promise<BaseMessage[]> {
    try {
      console.log('[AUTO-AGENT] Starting chat request with', messages.length, 'messages')

      const config = getConfig()
      if (!config || !config.apiKey || !config.baseUrl || !config.modelId) {
        const error = 'Agent configuration is incomplete'
        console.error('[AUTO-AGENT] Configuration error:', {
          hasConfig: !!config,
          hasApiKey: !!config?.apiKey,
          hasBaseUrl: !!config?.baseUrl,
          hasModelId: !!config?.modelId
        })
        throw new Error(error)
      }

      console.log('[AUTO-AGENT] Using config:', {
        modelId: config.modelId,
        baseUrl: config.baseUrl,
        hasSystemPrompt: !!config.systemPrompt
      })

      // 获取启用的 MCP 服务器配置
      const mcpServers = mcpService.listEnabledMcp()
      const mcpConfig: Record<string, any> = {}

      mcpServers.forEach((server) => {
        mcpConfig[server.name] = {
          transport: server.transport,
          ...server.config,
        }
      })

      console.log('[AUTO-AGENT] Found', mcpServers.length, 'enabled MCP servers')

      // 初始化 MCP 客户端并获取工具
      let mcpTools: any[] = []
      if (Object.keys(mcpConfig).length > 0) {
        try {
          mcpTools = await new MultiServerMCPClient(mcpConfig).getTools()
          console.log('[AUTO-AGENT] Loaded', mcpTools.length, 'MCP tools')
        } catch (error) {
          console.error('[AUTO-AGENT] Failed to load MCP tools:', error)
          // 继续执行，不使用 MCP 工具
        }
      }

      // 获取内置工具
      const allTools = taskService.asAgentTools()
      console.log('[AUTO-AGENT] Loaded', allTools.length, 'built-in tools')

      // 合并内置工具和 MCP 工具
      const tools = [...allTools, ...mcpTools]
      console.log('[AUTO-AGENT] Total tools available:', tools.length)

      // 转换消息格式
      const langchainMessages = messages.map((msg) => {
        switch (msg.role) {
          case 'user':
            return new HumanMessage(msg.content)
          case 'assistant':
            return new AIMessage(msg.content)
          case 'system':
            return new SystemMessage(msg.content)
          default:
            return new HumanMessage(msg.content)
        }
      })

      console.log('[AUTO-AGENT] Converted', langchainMessages.length, 'messages to LangChain format')

      // 创建模型实例
      const model = new ChatOpenAI({
        apiKey: config.apiKey,
        modelName: config.modelId,
        configuration: {
          baseURL: config.baseUrl,
        },
      })

      console.log('[AUTO-AGENT] Created ChatOpenAI model instance')

      console.log('[AUTO-AGENT] Creating agent with tools:', tools.map(t => t.name))

      // 创建 Agent
      const agent = createAgent({
        model: model,
        tools,
        systemPrompt: config.systemPrompt || '',
      })

      console.log('[AUTO-AGENT] Created agent, invoking...')

      // 调用 Agent
      const startTime = Date.now()
      const response = await agent.invoke({
        messages: langchainMessages,
      }, { recursionLimit: 100 })
      const duration = Date.now() - startTime

      console.log('[AUTO-AGENT] Agent response received in', duration, 'ms, message count:', response.messages?.length || 0)

      // 详细分析 ReAct 过程
      if (response.messages && response.messages.length > 0) {
        console.log('[REACT-DETAIL] ===== ReAct Process Analysis =====')
        response.messages.forEach((message, index) => {
          console.log(`[REACT-DETAIL] Message ${index + 1}:`, {
            type: message._getType(),
            content: typeof message.content === 'string'
              ? message.content.substring(0, 300) + (message.content.length > 300 ? '...' : '')
              : JSON.stringify(message.content).substring(0, 300),
            additionalKwargs: message.additional_kwargs,
            timestamp: new Date().toISOString()
          })

          // 分析工具调用（安全检查）
          const messageAny = message as any
          if (messageAny.tool_calls && Array.isArray(messageAny.tool_calls) && messageAny.tool_calls.length > 0) {
            messageAny.tool_calls.forEach((toolCall: any, toolIndex: number) => {
              console.log(`[REACT-DETAIL] 🔧 Tool Call ${toolIndex + 1}:`, {
                id: toolCall.id,
                name: toolCall.name,
                args: toolCall.args,
                timestamp: new Date().toISOString()
              })
            })
          }

          // 分析思考过程（如果消息包含推理过程）
          if (typeof message.content === 'string') {
            const content = message.content
            if (content.includes('Thought:') || content.includes('Action:') || content.includes('Observation:')) {
              console.log(`[REACT-DETAIL] 🧠 ReAct Reasoning detected in message ${index + 1}`)
              const lines = content.split('\n')
              lines.forEach((line, lineIndex) => {
                if (line.trim().startsWith('Thought:') ||
                  line.trim().startsWith('Action:') ||
                  line.trim().startsWith('Observation:') ||
                  line.trim().startsWith('Final Answer:')) {
                  console.log(`[REACT-DETAIL] 📝 ${line.trim()}`)
                }
              })
            }
          }
        })
        console.log('[REACT-DETAIL] ===== End ReAct Analysis =====')
      }

      return response.messages
    } catch (error) {
      console.error('[AUTO-AGENT] Chat error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        messagesCount: messages.length
      })
      throw error
    }
  }

  async function* chatStream(messages: Message[]): AsyncGenerator<string, void, unknown> {
    try {
      console.log('[AUTO-AGENT] Starting chat stream request with', messages.length, 'messages')

      const config = getConfig()
      if (!config || !config.apiKey || !config.baseUrl || !config.modelId) {
        const error = 'Agent configuration is incomplete'
        console.error('[AUTO-AGENT] Stream configuration error:', {
          hasConfig: !!config,
          hasApiKey: !!config?.apiKey,
          hasBaseUrl: !!config?.baseUrl,
          hasModelId: !!config?.modelId
        })
        throw new Error(error)
      }

      console.log('[AUTO-AGENT] Stream using config:', {
        modelId: config.modelId,
        baseUrl: config.baseUrl,
        hasSystemPrompt: !!config.systemPrompt
      })

      // 获取启用的 MCP 服务器配置
      const mcpServers = mcpService.listEnabledMcp()
      const mcpConfig: Record<string, any> = {}

      mcpServers.forEach((server) => {
        mcpConfig[server.name] = {
          transport: server.transport,
          ...server.config,
        }
      })

      console.log('[AUTO-AGENT] Stream found', mcpServers.length, 'enabled MCP servers')

      // 初始化 MCP 客户端并获取工具
      let mcpTools: any[] = []
      if (Object.keys(mcpConfig).length > 0) {
        try {
          mcpTools = await new MultiServerMCPClient(mcpConfig).getTools()
          console.log('[AUTO-AGENT] Stream loaded', mcpTools.length, 'MCP tools')
        } catch (error) {
          console.error('[AUTO-AGENT] Stream failed to load MCP tools:', error)
          // 继续执行，不使用 MCP 工具
        }
      }

      // 获取内置工具
      const allTools = taskService.asAgentTools()
      console.log('[AUTO-AGENT] Stream loaded', allTools.length, 'built-in tools')

      // 合并内置工具和 MCP 工具
      const tools = [...allTools, ...mcpTools]
      console.log('[AUTO-AGENT] Stream total tools available:', tools.length)

      // 转换消息格式
      const langchainMessages = messages.map((msg) => {
        switch (msg.role) {
          case 'user':
            return new HumanMessage(msg.content)
          case 'assistant':
            return new AIMessage(msg.content)
          case 'system':
            return new SystemMessage(msg.content)
          default:
            return new HumanMessage(msg.content)
        }
      })

      console.log('[AUTO-AGENT] Stream converted', langchainMessages.length, 'messages to LangChain format')

      // 创建模型实例
      const model = new ChatOpenAI({
        apiKey: config.apiKey,
        modelName: config.modelId,
        configuration: {
          baseURL: config.baseUrl,
        },
      })

      console.log('[AUTO-AGENT] Stream created ChatOpenAI model instance')

      // 创建 Agent
      const agent = createAgent({
        tools,
        model: model,
        ...(config.systemPrompt ? { systemPrompt: config.systemPrompt } : {}),
      })

      console.log('[AUTO-AGENT] Stream created agent, starting stream...')

      // 流式调用 Agent
      const startTime = Date.now()
      const stream = await agent.stream({
        messages: langchainMessages,
      }, { recursionLimit: 100 })

      console.log('[AUTO-AGENT] Stream started, yielding chunks...')
      let chunkCount = 0
      let totalContent = ''
      let allMessages: any[] = []

      for await (const chunk of stream) {
        try {
          // 收集所有消息用于后续分析
          if (chunk.messages && chunk.messages.length > 0) {
            allMessages.push(...chunk.messages)

            const lastMessage = chunk.messages[chunk.messages.length - 1]
            if (lastMessage?.content) {
              const content = lastMessage.content.toString()
              totalContent += content
              chunkCount++

              // 分析当前 chunk 是否包含 ReAct 推理过程
              const messageAny = lastMessage as any
              console.log(`[REACT-STREAM-DETAIL] Chunk ${chunkCount}:`, {
                messageType: lastMessage._getType(),
                contentLength: content.length,
                hasToolCalls: !!(messageAny.tool_calls && Array.isArray(messageAny.tool_calls) && messageAny.tool_calls.length > 0),
                timestamp: new Date().toISOString()
              })

              // 检查是否包含 ReAct 关键词
              if (content.includes('Thought:') || content.includes('Action:') || content.includes('Observation:')) {
                console.log('[REACT-STREAM-DETAIL] 🧠 ReAct reasoning detected in chunk:', content.substring(0, 200))
              }

              // 检查工具调用
              if (messageAny.tool_calls && Array.isArray(messageAny.tool_calls) && messageAny.tool_calls.length > 0) {
                messageAny.tool_calls.forEach((toolCall: any, index: number) => {
                  console.log(`[REACT-STREAM-DETAIL] 🔧 Tool Call ${index + 1}:`, {
                    name: toolCall.name,
                    args: JSON.stringify(toolCall.args).substring(0, 100),
                    timestamp: new Date().toISOString()
                  })
                })
              }

              yield content
            }
          }
        } catch (chunkError) {
          console.error('[AUTO-AGENT] Error processing stream chunk:', {
            error: chunkError instanceof Error ? chunkError.message : String(chunkError),
            chunkNumber: chunkCount
          })
          // 继续处理下一个 chunk
        }
      }

      const duration = Date.now() - startTime
      console.log('[AUTO-AGENT] Stream completed:', {
        duration: duration + 'ms',
        chunkCount,
        totalContentLength: totalContent.length,
        totalMessages: allMessages.length
      })

      // 流结束后分析完整的 ReAct 过程
      if (allMessages.length > 0) {
        console.log('[REACT-STREAM-DETAIL] ===== Complete ReAct Process Analysis =====')
        const uniqueMessages = allMessages.filter((msg, index, self) =>
          index === self.findIndex(m => JSON.stringify(m.content) === JSON.stringify(msg.content))
        )

        uniqueMessages.forEach((message, index) => {
          const messageAny = message as any
          console.log(`[REACT-STREAM-DETAIL] Final Message ${index + 1}:`, {
            type: message._getType(),
            contentPreview: typeof message.content === 'string'
              ? message.content.substring(0, 200) + (message.content.length > 200 ? '...' : '')
              : 'Complex content',
            hasToolCalls: !!(messageAny.tool_calls && Array.isArray(messageAny.tool_calls) && messageAny.tool_calls.length > 0),
            timestamp: new Date().toISOString()
          })
        })
        console.log('[REACT-STREAM-DETAIL] ===== End Complete ReAct Analysis =====')
      }
    } catch (error) {
      console.error('[AUTO-AGENT] Chat stream error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        messagesCount: messages.length
      })
      throw error
    }
  }

  return {
    chat,
    getConfig,
    chatStream,
    updateConfig,
  }
}
