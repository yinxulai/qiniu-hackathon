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
      console.log('[AUTO-AGENT] Complete input messages:', JSON.stringify(messages, null, 2))

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

      console.log('[AUTO-AGENT] Complete with systemPrompt:', config.systemPrompt)

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



  return {
    chat,
    getConfig,
    updateConfig,
  }
}
