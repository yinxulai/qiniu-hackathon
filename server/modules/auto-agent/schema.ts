import { responseSchema } from '@server/helpers/schema'
import { routerSchema } from '@taicode/common-server'
import { z } from 'zod'

// ==================== 基础数据模型 ====================

export const AgentConfigSchema = z.object({
  id: z.string().min(1).describe('配置唯一标识'),
  apiKey: z.string().min(1).describe('API 密钥'),
  baseUrl: z.string().url().describe('API 基础 URL'),
  modelId: z.string().min(1).describe('模型 ID'),
  systemPrompt: z.string().optional().describe('系统提示词，用于定义 Agent 的行为和角色'),
})

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']).describe('消息角色'),
  content: z.string().min(1).describe('消息内容'),
})

export type AgentConfig = z.infer<typeof AgentConfigSchema>
export type Message = z.infer<typeof MessageSchema>

// ==================== API Schema 定义 ====================

const getAgentConfigDescription = `
获取当前 Agent 配置

**功能说明：**
- 获取当前激活的 Agent 配置信息
- 包括 API Key、Base URL 和 Model ID
`

export const GetAgentConfigSchema = routerSchema({
  operationId: 'getAgentConfig',
  summary: '获取 Agent 配置',
  tags: ['Auto Agent 管理'],
  description: getAgentConfigDescription,
  response: responseSchema(AgentConfigSchema.nullable()),
})

const updateAgentConfigDescription = `
更新 Agent 配置

**功能说明：**
- 更新 Agent 的 API 配置信息
- 支持部分字段更新
- 自动更新时间戳
`

export const UpdateAgentConfigSchema = routerSchema({
  operationId: 'updateAgentConfig',
  summary: '更新 Agent 配置',
  tags: ['Auto Agent 管理'],
  description: updateAgentConfigDescription,
  body: z.object({
    apiKey: z.string().min(1).optional().describe('API 密钥'),
    baseUrl: z.string().url().optional().describe('API 基础 URL'),
    modelId: z.string().min(1).optional().describe('模型 ID'),
    systemPrompt: z.string().optional().describe('系统提示词'),
  }),
  response: responseSchema(AgentConfigSchema),
})

export type UpdateAgentConfigInput = z.infer<typeof UpdateAgentConfigSchema.body>

const chatDescription = `
与 Agent 进行对话

**功能说明：**
- 发送消息给 Agent 并获取完整响应
- 返回 Agent 生成的完整内容
`

export const ChatSchema = routerSchema({
  operationId: 'chat',
  summary: 'Agent 对话',
  tags: ['Auto Agent 管理'],
  description: chatDescription,
  body: z.object({
    messages: z.array(MessageSchema).min(1).describe('对话消息列表'),
  }),
  response: responseSchema(z.object({
    content: z.string().describe('Agent 响应内容'),
  })),
})
