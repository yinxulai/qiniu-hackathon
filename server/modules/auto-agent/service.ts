import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import { createAgent } from 'langchain'
import { ChatOpenAI } from '@langchain/openai'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { AgentConfig, Message, UpdateAgentConfigInput } from './schema'
import { createMcpServerService } from '../mcp-server/service'
import type { TaskManageService } from './task-manage/service'

const store = new Store<{ config: AgentConfig | null }>({
  name: 'auto-agent-config',
  defaults: { config: null },
})

export function createAutoAgentService(taskService: TaskManageService) {
  const mcpService = createMcpServerService()
  
  // Agent 缓存
  let cachedAgent: any = null
  let cachedConfigHash: string = ''

  // 加载默认系统提示词
  function loadDefaultSystemPrompt(): string {
    try {
      const systemPromptPath = join(process.cwd(), 'static', 'system.prompt.md')
      return readFileSync(systemPromptPath, 'utf-8')
    } catch (error) {
      console.warn('[AUTO-AGENT] Failed to load default system prompt:', error)
      return ''
    }
  }

  function getConfig(): AgentConfig {
    const defaultSystemPrompt = loadDefaultSystemPrompt()
    const storedConfig = store.get('config')
    
    return storedConfig || {
      id: 'default',
      apiKey: 'sk-your-api-key',
      baseUrl: 'https://openai.qiniu.com/v1',
      modelId: 'claude-3.7-sonnet',
      systemPrompt: defaultSystemPrompt,
    }
  }

  function updateConfig(updates: UpdateAgentConfigInput): AgentConfig {
    const current = getConfig()
    const defaultSystemPrompt = loadDefaultSystemPrompt()

    const updated: AgentConfig = {
      id: current?.id || uuidv4(),
      apiKey: updates.apiKey ?? current?.apiKey ?? '',
      baseUrl: updates.baseUrl ?? current?.baseUrl ?? '',
      modelId: updates.modelId ?? current?.modelId ?? '',
      systemPrompt: updates.systemPrompt ?? current?.systemPrompt ?? defaultSystemPrompt,
    }

    store.set('config', updated)
    
    // 配置更新后清除缓存的 agent
    cachedAgent = null
    cachedConfigHash = ''
    console.log('[AUTO-AGENT] Configuration updated, clearing agent cache')
    
    return updated
  }

  // 生成配置和工具的哈希值用于缓存判断
  function generateConfigHash(config: AgentConfig, mcpTools: any[]): string {
    const configString = JSON.stringify({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      modelId: config.modelId,
      systemPrompt: config.systemPrompt,
    })
    const toolsString = JSON.stringify(mcpTools.map(t => ({ name: t.name, description: t.description })))
    return Buffer.from(configString + toolsString).toString('base64').slice(0, 32)
  }

  // 获取或创建缓存的 agent
  async function getOrCreateAgent(): Promise<any> {
    const config = getConfig()
    if (!config || !config.apiKey || !config.baseUrl || !config.modelId) {
      throw new Error('Agent configuration is incomplete')
    }

    // 获取启用的 MCP 服务器配置
    const mcpServers = mcpService.listEnabledMcp()
    const mcpConfig: Record<string, any> = {}

    mcpServers.forEach((server) => {
      mcpConfig[server.name] = {
        transport: server.transport,
        ...server.config,
      }
    })

    // 初始化 MCP 客户端并获取工具
    let mcpTools: any[] = []
    if (Object.keys(mcpConfig).length > 0) {
      try {
        mcpTools = await new MultiServerMCPClient(mcpConfig).getTools()
        console.log('[AUTO-AGENT] Loaded', mcpTools.length, 'MCP tools')
      } catch (error) {
        console.error('[AUTO-AGENT] Failed to load MCP tools:', error)
      }
    }

    // 生成当前配置的哈希值
    const currentConfigHash = generateConfigHash(config, mcpTools)

    // 如果缓存的 agent 存在且配置未变化，直接返回
    if (cachedAgent && cachedConfigHash === currentConfigHash) {
      console.log('[AUTO-AGENT] Using cached agent')
      return cachedAgent
    }

    console.log('[AUTO-AGENT] Creating new agent (cache miss or configuration changed)')

    // 获取内置工具
    const allTools = taskService.asAgentTools()
    console.log('[AUTO-AGENT] Loaded', allTools.length, 'built-in tools')

    // 合并内置工具和 MCP 工具
    const tools = [...allTools, ...mcpTools]
    console.log('[AUTO-AGENT] Total tools available:', tools.length)

    // 创建模型实例
    const model = new ChatOpenAI({
      apiKey: config.apiKey,
      modelName: config.modelId,
      configuration: {
        baseURL: config.baseUrl,
      },
    })

    console.log('[AUTO-AGENT] Creating agent with tools:', tools.map(t => t.name))

    // 创建 Agent
    const agent = createAgent({
      model: model,
      tools,
      systemPrompt: config.systemPrompt || '',
    })

    // 缓存 agent 和配置哈希
    cachedAgent = agent
    cachedConfigHash = currentConfigHash
    console.log('[AUTO-AGENT] Agent created and cached')

    return agent
  }

  async function chat(messages: Message[]): Promise<BaseMessage[]> {
    try {
      console.log('[AUTO-AGENT] Starting chat request with', messages.length, 'messages')
      console.log('[AUTO-AGENT] Complete input messages:', JSON.stringify(messages, null, 2))

      // 获取或创建缓存的 agent
      const agent = await getOrCreateAgent()

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
      console.log('[AUTO-AGENT] Invoking cached agent...')

      // 调用 Agent
      const startTime = Date.now()
      const response = await agent.invoke({
        messages: langchainMessages,
      }, { recursionLimit: 200 })
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

  // 清除 agent 缓存（用于调试或强制重新创建）
  function clearAgentCache(): void {
    cachedAgent = null
    cachedConfigHash = ''
    console.log('[AUTO-AGENT] Agent cache cleared manually')
  }

  return {
    chat,
    getConfig,
    updateConfig,
    clearAgentCache,
  }
}
