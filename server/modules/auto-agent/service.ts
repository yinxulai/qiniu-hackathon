import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import { createAgent } from 'langchain'
import { ChatOpenAI } from '@langchain/openai'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
import type { AgentConfig, Message, UpdateAgentConfigInput } from './schema'
import { createMcpServerService } from '../mcp-server/service'

const store = new Store<{ config: AgentConfig | null }>({
  name: 'auto-agent-config',
  defaults: { config: null },
})

export function createAutoAgentService() {
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
    const tools = Object.keys(mcpConfig).length > 0
      ? await new MultiServerMCPClient(mcpConfig).getTools()
      : []

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

    // 创建模型实例
    const model = new ChatOpenAI({
      apiKey: config.apiKey,
      modelName: config.modelId,
      configuration: {
        baseURL: config.baseUrl,
      },
    })

    // 创建 Agent
    const agent = createAgent({
      model: model,
      tools,
      ...(config.systemPrompt ? { systemPrompt: config.systemPrompt } : {}),
    })

    // 调用 Agent
    const response = await agent.invoke({
      messages: langchainMessages,
    })

    return response.messages
  }

  async function* chatStream(messages: Message[]): AsyncGenerator<string, void, unknown> {
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
    const tools = Object.keys(mcpConfig).length > 0
      ? await new MultiServerMCPClient(mcpConfig).getTools()
      : []

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

    // 构建模型配置字符串
    const model = new ChatOpenAI({
      'apiKey': config.apiKey,
      modelName: config.modelId,
      configuration: {
        baseURL: config.baseUrl,
      },
    })

    // 创建 Agent
    const agent = createAgent({
      tools,
      model: model,
      ...(config.systemPrompt ? { systemPrompt: config.systemPrompt } : {}),
    })

    // 流式调用 Agent
    const stream = await agent.stream({
      messages: langchainMessages,
    })

    for await (const chunk of stream) {
      if (chunk.messages && chunk.messages.length > 0) {
        const lastMessage = chunk.messages[chunk.messages.length - 1]
        if (lastMessage?.content) {
          yield lastMessage.content.toString()
        }
      }
    }
  }

  return {
    chat,
    getConfig,
    chatStream,
    updateConfig,
  }
}
