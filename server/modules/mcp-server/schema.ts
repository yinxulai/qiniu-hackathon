import { responseSchema } from '@server/helpers/schema'
import { listResultSchema, routerSchema } from '@taicode/common-server'
import { z } from 'zod'

// ==================== 基础数据模型 ====================

export const StdioConfigSchema = z.object({
  command: z.string().min(1).describe('可执行文件路径或命令名称'),
  args: z.array(z.string()).describe('命令行参数列表'),
  env: z.record(z.string(), z.string()).optional().describe('环境变量，键值对形式'),
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
获取所有 MCP 服务器配置列表

**功能说明：**
- 返回系统中配置的所有 Model Context Protocol 服务器
- 包括已启用和已禁用的服务器配置
- 返回完整的服务器信息：名称、传输协议、配置参数等

**默认服务器：**
- playwright/mcp: 浏览器自动化操作
- desktop-commander: 桌面系统操作
- self-server-mcp: 自身 API 反射调用

**使用场景：**
- 设置界面显示所有可用的 MCP 服务器
- 系统管理和监控已配置的服务器
- 批量管理和操作多个 MCP 服务器
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
- 仅返回当前启用状态的 MCP 服务器配置
- 返回的服务器将被 AI Agent 直接使用
- 优化性能，避免返回无关的禁用服务器信息

**返回数据特点：**
- 只包含 enabled=true 的服务器配置
- 包含完整的连接信息和环境变量
- 按配置时间排序，新配置的服务器在后

**使用场景：**
- AI Agent 初始化时加载可用的 MCP 工具
- 实时获取当前可操作的外部服务列表
- 动态构建工具链和功能集成
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
- 添加新的 Model Context Protocol 服务器到系统配置
- 自动生成唯一标识符和创建时间戳
- 支持 stdio 和 sse 两种传输协议类型
- 默认启用新创建的服务器

**支持的传输协议：**
- **stdio**: 通过标准输入输出与服务器通信，适用于本地可执行文件
- **sse**: 通过服务器推送事件与远程服务器通信

**配置参数：**
- name: 服务器显示名称
- transport: 传输协议类型
- config: 具体的连接配置（命令、参数、环境变量等）

**使用场景：**
- 添加自定义的 MCP 服务器到系统
- 集成第三方工具和服务
- 扩展 AI Agent 的能力边界
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
- 支持部分字段更新，未提供的字段保持不变
- 不允许修改服务器 ID，保证数据一致性
- 自动更新最后修改时间戳

**可更新的字段：**
- name: 服务器显示名称
- transport: 传输协议类型（stdio/sse）
- enabled: 启用/禁用状态
- config: 具体连接配置参数

**注意事项：**
- 更改传输协议时需同时更新相应的 config 配置
- 更新后需要重新连接服务器才能生效

**使用场景：**
- 修改服务器连接参数或环境变量
- 切换服务器的启用/禁用状态
- 更新服务器显示名称和描述
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
- 将指定 MCP 服务器的状态设置为启用（enabled=true）
- 启用后的服务器将被 AI Agent 自动加载和使用
- 支持对已禁用的服务器重新激活
- 自动更新配置修改时间戳

**启用后的效果：**
- 服务器将出现在已启用列表中
- AI Agent 可以调用该服务器提供的工具和功能
- 服务器连接将在下次启动时自动建立

**使用场景：**
- 重新激活暂时禁用的功能模块
- 根据需要动态开启特定的 MCP 服务
- 批量管理多个服务器的状态
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
- 将指定 MCP 服务器的状态设置为禁用（enabled=false）
- 禁用后的服务器将不被 AI Agent 加载和使用
- 保留服务器配置信息，仅更改状态标记
- 自动更新配置修改时间戳

**禁用后的效果：**
- 服务器不会出现在已启用列表中
- AI Agent 无法访问该服务器的工具和功能
- 现有连接将被断开，资源被释放

**使用场景：**
- 暂时关闭不需要的功能模块
- 调试时隔离特定服务器的影响
- 性能优化，减少系统资源占用
- 安全管理，控制对外部服务的访问
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
- 从系统中永久删除指定的 MCP 服务器配置
- 完全清除服务器的所有相关信息和连接
- 删除后无法恢复，需要重新创建类似配置
- 自动断开现有连接并释放资源

**删除后的效果：**
- 服务器不再出现在任何列表中
- 所有相关的连接和资源被完全清理
- AI Agent 无法再访问该服务器的任何功能

**注意事项：**
- 请在删除前确保不再需要该服务器
- 建议先使用禁用功能进行测试
- 删除内置的默认服务器可能影响系统基本功能

**使用场景：**
- 清理不再需要的过时配置
- 系统维护和整理
- 移除有问题或失效的服务器配置
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
