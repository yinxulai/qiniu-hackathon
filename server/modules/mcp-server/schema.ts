import { responseSchema } from '@server/helpers/schema'
import { listResultSchema, routerSchema } from '@taicode/common-server'
import { z } from 'zod'

// ==================== 基础数据模型 ====================

export const StdioConfigSchema = z.object({
  command: z.string().min(1).describe('可执行文件路径或命令名称'),
  args: z.array(z.string()).describe('命令行参数列表'),
})

export const SseConfigSchema = z.object({
  url: z.string().url().describe('SSE 服务器 URL 地址'),
})

export const McpServerSchema = z.object({
  id: z.string().min(1).describe('MCP 服务器唯一标识'),
  name: z.string().min(1).describe('MCP 服务器名称'),
  transport: z.enum(['stdio', 'sse']).describe('传输协议类型：stdio (标准输入输出) 或 sse (服务器推送事件)'),
  enabled: z.boolean().default(true).describe('是否启用该服务器'),
  config: z.union([StdioConfigSchema, SseConfigSchema]).describe('服务器配置信息'),
})

export type McpServer = z.infer<typeof McpServerSchema>
export type SseConfig = z.infer<typeof SseConfigSchema>
export type StdioConfig = z.infer<typeof StdioConfigSchema>

// ==================== API Schema 定义 ====================

const listMcpServerDescription = `
获取所有 MCP 服务器列表

**功能说明：**
- 返回系统中配置的所有 MCP 服务器
- 包含已启用和已禁用的服务器
`

export const ListMcpServerSchema = routerSchema({
  operationId: 'listMcpServer',
  summary: '获取 MCP 服务器列表',
  tags: ['MCP 服务器管理'],
  description: listMcpServerDescription,
  response: responseSchema(listResultSchema(McpServerSchema)),
})

const listEnabledMcpServerDescription = `
获取已启用的 MCP 服务器列表

**功能说明：**
- 仅返回启用状态的 MCP 服务器
- 用于获取当前可用的服务器配置
`

export const ListEnabledMcpServerSchema = routerSchema({
  operationId: 'listEnabledMcpServer',
  summary: '获取已启用的 MCP 服务器列表',
  tags: ['MCP 服务器管理'],
  description: listEnabledMcpServerDescription,
  response: responseSchema(listResultSchema(McpServerSchema)),
})

const createMcpServerDescription = `
创建新的 MCP 服务器配置

**功能说明：**
- 添加新的 MCP 服务器到系统配置
- 自动生成唯一标识符
- 支持 stdio 和 sse 两种传输协议
`

export const CreateMcpServerSchema = routerSchema({
  operationId: 'createMcpServer',
  summary: '创建 MCP 服务器',
  tags: ['MCP 服务器管理'],
  description: createMcpServerDescription,
  body: McpServerSchema.omit({ id: true }),
  response: responseSchema(McpServerSchema),
})

const updateMcpServerDescription = `
更新指定的 MCP 服务器配置

**功能说明：**
- 修改已存在的 MCP 服务器配置信息
- 支持部分字段更新
- 不允许修改服务器 ID
`

export const UpdateMcpServerSchema = routerSchema({
  operationId: 'updateMcpServer',
  summary: '更新 MCP 服务器配置',
  tags: ['MCP 服务器管理'],
  description: updateMcpServerDescription,
  body: z.object({
    id: z.string().min(1).describe('MCP 服务器 ID'),
    name: z.string().min(1).optional().describe('MCP 服务器名称'),
    transport: z.enum(['stdio', 'sse']).optional().describe('传输协议类型'),
    enabled: z.boolean().optional().describe('是否启用'),
    config: z.union([StdioConfigSchema, SseConfigSchema]).optional().describe('服务器配置'),
  }),
  response: responseSchema(McpServerSchema),
})

export type UpdateMcpServerInput = z.infer<typeof UpdateMcpServerSchema.body>

const enableMcpServerDescription = `
启用指定的 MCP 服务器

**功能说明：**
- 将 MCP 服务器状态设置为启用
- 启用后的服务器将在系统中可用
`

export const EnableMcpServerSchema = routerSchema({
  operationId: 'enableMcpServer',
  summary: '启用 MCP 服务器',
  tags: ['MCP 服务器管理'],
  description: enableMcpServerDescription,
  body: z.object({
    id: z.string().min(1).describe('MCP 服务器 ID'),
  }),
  response: responseSchema(z.boolean()),
})

const disableMcpServerDescription = `
禁用指定的 MCP 服务器

**功能说明：**
- 将 MCP 服务器状态设置为禁用
- 禁用后的服务器将不在系统中使用
`

export const DisableMcpServerSchema = routerSchema({
  operationId: 'disableMcpServer',
  summary: '禁用 MCP 服务器',
  tags: ['MCP 服务器管理'],
  description: disableMcpServerDescription,
  body: z.object({
    id: z.string().min(1).describe('MCP 服务器 ID'),
  }),
  response: responseSchema(z.boolean()),
})

const deleteMcpServerDescription = `
删除指定的 MCP 服务器配置

**功能说明：**
- 从系统中永久删除 MCP 服务器配置
- 删除后无法恢复
`

export const DeleteMcpServerSchema = routerSchema({
  operationId: 'deleteMcpServer',
  summary: '删除 MCP 服务器',
  tags: ['MCP 服务器管理'],
  description: deleteMcpServerDescription,
  body: z.object({
    id: z.string().min(1).describe('MCP 服务器 ID'),
  }),
  response: responseSchema(z.boolean()),
})
