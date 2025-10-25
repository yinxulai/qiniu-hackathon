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
获取当前 AI Agent 配置信息

**功能说明：**
- 获取当前激活的 AI Agent 的完整配置信息
- 包括模型连接参数、API 配置和系统提示词
- 如果未配置则返回 null，需要先初始化配置

**返回信息包括：**
- id: 配置唯一标识
- apiKey: OpenAI 兼容的 API 密钥
- baseUrl: 模型服务的基础 URL 地址
- modelId: 具体使用的模型标识符
- systemPrompt: 系统提示词（定义 Agent 行为和角色）

**使用场景：**
- 设置界面显示当前配置状态
- 验证 Agent 是否正确配置
- 获取配置信息进行修改或调试
`

export const GetAgentConfigSchema = routerSchema({
  operationId: 'getAgentConfig',
  summary: '获取 Agent 配置',
  tags: ['Auto Agent 管理'],
  description: getAgentConfigDescription,
  response: responseSchema(AgentConfigSchema.nullable()),
})

const updateAgentConfigDescription = `
更新 AI Agent 配置信息

**功能说明：**
- 修改 AI Agent 的模型连接和行为配置
- 支持部分字段更新，未提供的字段保持不变
- 自动生成新的配置 ID 和更新时间戳
- 配置更新后立即生效，影响后续对话

**可更新的配置项：**
- **apiKey**: OpenAI 兼容的 API 密钥
- **baseUrl**: 模型服务的 API 地址（支持自定义部署）
- **modelId**: 模型标识符（如 gpt-4, claude-3.5, 等）
- **systemPrompt**: 系统提示词，定义 Agent 的角色和行为模式

**注意事项：**
- API Key 将被安全存储，不会在日志中显示
- 更改 baseUrl 时请确保新地址的兼容性
- systemPrompt 更改会直接影响 Agent 的对话风格和能力

**使用场景：**
- 初始化设置 AI Agent 的模型连接
- 切换不同的 AI 模型或服务提供商
- 调整 Agent 的行为特征和专业领域
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
与 AI Agent 进行对话交互

**功能说明：**
- 发送对话消息给 AI Agent 并获取完整的智能响应
- Agent 可以调用已启用的 MCP 服务器提供的工具和功能
- 支持多轮对话，保持上下文连贯性
- 返回 Agent 生成的最终响应内容

**消息格式：**
- **user**: 用户输入的消息内容
- **assistant**: AI Agent 的响应内容
- **system**: 系统级别的指令和上下文信息

**Agent 能力范围：**
- 浏览器自动化操作（通过 playwright MCP）
- 桌面系统操作（通过 desktop-commander MCP）
- 自身 API 反射调用（通过 self-server MCP）
- 文本生成、分析和推理能力

**使用场景：**
- Siwe的智能对话功能
- 自动化任务执行和管理
- 复杂查询和多步骤操作处理
- 智能问答和决策支持
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

// 清除 Agent 缓存
const clearAgentCacheDescription = `
清除 AI Agent 缓存

**功能说明：**
- 强制清除已缓存的 AI Agent 实例
- 下次调用时将重新创建 Agent
- 主要用于调试或配置更新后的强制刷新
`

export const ClearAgentCacheSchema = routerSchema({
  operationId: 'clearAgentCache',
  summary: '清除 Agent 缓存',
  tags: ['Auto Agent 管理'],
  description: clearAgentCacheDescription,
  response: responseSchema(z.object({
    success: z.boolean().describe('是否成功清除缓存'),
    message: z.string().describe('操作结果消息'),
  })),
})
