import z from 'zod'
import { responseSchema } from '@server/helpers/schema'
import { routerSchema } from '@taicode/common-server'

// ==================== 基础数据模型 ====================

// 步骤状态枚举
export const StepStatusEnum = z.enum(['completed', 'failed', 'cancelled', 'processing']).describe('步骤状态：完成、失败、取消、处理中')

// 步骤 Schema
export const StepSchema = z.object({
  id: z.string().min(1).describe('步骤唯一标识'),
  title: z.string().min(1).describe('步骤简介'),
  status: StepStatusEnum.describe('步骤状态'),
  createdAt: z.string().optional().describe('创建时间'),
  updatedAt: z.string().optional().describe('更新时间')
})

// 任务 Schema
export const TaskSchema = z.object({
  id: z.string().min(1).describe('任务唯一标识'),
  title: z.string().min(1).describe('任务简介'),
  steps: z.array(StepSchema).describe('步骤列表'),
  createdAt: z.string().optional().describe('创建时间'),
  updatedAt: z.string().optional().describe('更新时间')
})

// 创建步骤输入 Schema
export const CreateStepInputSchema = z.object({
  title: z.string().min(1).describe('步骤简介'),
})

// 创建任务输入 Schema
export const CreateTaskInputSchema = z.object({
  title: z.string().min(1).describe('任务简介'),
  steps: z.array(CreateStepInputSchema).describe('步骤列表'),
})

// 更新任务输入 Schema
export const UpdateTaskInputSchema = z.object({
  title: z.string().min(1).optional().describe('任务简介'),
  steps: z.array(CreateStepInputSchema).optional().describe('步骤列表'),
})

// TypeScript 类型导出
export type StepStatus = z.infer<typeof StepStatusEnum>
export type Step = z.infer<typeof StepSchema>
export type Task = z.infer<typeof TaskSchema>
export type CreateStepInput = z.infer<typeof CreateStepInputSchema>
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>

// ==================== API Schema 定义 ====================

// 创建任务
const createTaskDescription = `
创建新的任务计划

**功能说明：**
- 创建一个新的结构化任务，包含任务标题和详细步骤列表
- 所有步骤初始状态为“处理中”（processing）
- 自动生成唯一任务 ID 和所有步骤的 ID
- 记录创建和更新时间戳信息

**任务结构：**
- 任务标题：简洁清晰的任务描述
- 步骤列表：包含具体的执行步骤和操作指导
- 状态跟踪：每个步骤都有独立的执行状态

**步骤状态类型：**
- **processing**: 处理中，正在执行或等待执行
- **completed**: 已完成，成功完成该步骤的所有操作
- **failed**: 已失败，执行过程中遇到错误或问题
- **cancelled**: 已取消，被用户或系统主动取消

**使用场景：**
- 复杂任务的结构化管理和跟踪
- AI Agent 执行多步骤操作的进度监控
- 用户任务计划和执行的可视化管理
- 任务执行历史和状态记录
`

export const CreateTaskSchema = routerSchema({
  operationId: 'createTask',
  summary: '创建任务',
  tags: ['任务管理'],
  description: createTaskDescription,
  body: CreateTaskInputSchema,
  response: responseSchema(TaskSchema),
})

// 获取任务列表
const listTasksDescription = `
获取任务列表和统计信息

**功能说明：**
- 支持分页查询系统中的所有任务记录
- 返回任务的基本信息、步骤数量和执行状态
- 提供任务总数和当前页的数据结果
- 按创建时间倒序排列，最新的任务在前

**分页参数：**
- **page**: 页码，从 1 开始，默认为第 1 页
- **pageSize**: 每页数量，范围 1-100，默认 10 条

**返回数据结构：**
- **list**: 当前页的任务列表，包含完整的任务和步骤信息
- **total**: 系统中的任务总数，用于计算分页信息

**使用场景：**
- 任务管理界面的主列表显示
- 任务执行历史的查看和统计
- 批量操作和状态监控
- 任务进度的概览和管理
`

export const ListTasksSchema = routerSchema({
  operationId: 'listTasks',
  summary: '获取任务列表',
  tags: ['任务管理'],
  description: listTasksDescription,
  body: z.object({
    page: z.number().min(1).optional().default(1).describe('页码'),
    pageSize: z.number().min(1).max(100).optional().default(10).describe('每页数量'),
  }).optional(),
  response: responseSchema(z.object({
    list: z.array(TaskSchema),
    total: z.number(),
  })),
})

// 获取单个任务
const getTaskDescription = `
获取指定任务的详细信息

**功能说明：**
- 根据任务 ID 获取任务的完整详细信息
- 包括任务的所有步骤、状态和时间信息
- 如果任务不存在则返回 null
- 提供实时的任务执行状态和进度信息

**返回的详细信息：**
- 任务基本信息：标题、ID、创建时间等
- 所有步骤的完整列表和当前状态
- 每个步骤的执行时间和状态变更历史
- 任务的整体进度和完成情况

**状态统计信息：**
- 已完成步骤数量和总步骤数
- 失败和取消的步骤统计
- 当前正在处理的步骤信息

**使用场景：**
- 任务详情页面的数据显示
- 实时监控任务执行进度
- 任务故障排查和问题诊断
- 任务执行结果的分析和审查
`

export const GetTaskSchema = routerSchema({
  operationId: 'getTask',
  summary: '获取任务详情',
  tags: ['任务管理'],
  description: getTaskDescription,
  body: z.object({
    id: z.string().min(1).describe('任务ID'),
  }),
  response: responseSchema(TaskSchema.nullable()),
})

// 更新任务
const updateTaskDescription = `
更新任务信息和配置

**功能说明：**
- 修改已存在任务的标题和步骤配置
- 支持部分字段更新，未提供的字段保持不变
- 自动更新任务的最后修改时间戳
- 保留原有步骤的执行状态和历史记录

**可更新的字段：**
- **title**: 任务的显示标题和简要描述
- **steps**: 任务的步骤列表和执行计划

**步骤更新逻辑：**
- 新增步骤：自动生成 ID 和设置为“处理中”状态
- 修改步骤：更新步骤标题，保留原有状态
- 删除步骤：移除不再需要的步骤和相关数据

**注意事项：**
- 步骤更新不会影响已完成或失败的步骤状态
- 建议在任务执行前进行更新，避免影响正在运行的流程
- 更新后需要重新加载任务配置才能生效

**使用场景：**
- 修正任务计划和步骤安排
- 根据实际情况调整任务范围
- 添加或删除任务步骤
- 优化任务执行效率和流程
`

export const UpdateTaskSchema = routerSchema({
  operationId: 'updateTask',
  summary: '更新任务',
  tags: ['任务管理'],
  description: updateTaskDescription,
  body: z.object({
    id: z.string().min(1).describe('任务ID'),
  }).merge(UpdateTaskInputSchema),
  response: responseSchema(TaskSchema),
})

// 删除任务
const deleteTaskDescription = `
删除指定的任务和所有相关数据

**功能说明：**
- 根据任务 ID 从系统中永久删除指定任务
- 同时删除任务下的所有步骤和执行记录
- 删除后无法恢复，需要重新创建类似任务
- 如果任务正在执行中，将自动停止相关进程

**删除前的安全检查：**
- 验证任务 ID 的存在性和有效性
- 检查任务当前的执行状态
- 确保没有其他进程正在依赖该任务

**删除后的效果：**
- 任务不再出现在任何列表中
- 所有相关的步骤和状态信息被清除
- 任务相关的资源和进程被释放

**注意事项：**
- 请在删除前确保已保存重要的任务结果
- 建议先停止正在执行的任务再进行删除
- 考虑使用“取消”状态代替直接删除

**使用场景：**
- 清理已完成或失败的历史任务
- 系统维护和存储空间管理
- 移除错误创建或不再需要的任务
- 批量清理和数据归档
`

export const DeleteTaskSchema = routerSchema({
  operationId: 'deleteTask',
  summary: '删除任务',
  tags: ['任务管理'],
  description: deleteTaskDescription,
  body: z.object({
    id: z.string().min(1).describe('任务ID'),
  }),
  response: responseSchema(z.null()),
})

// 更新步骤状态
const updateStepStatusDescription = `
更新任务中指定步骤的执行状态

**功能说明：**
- 更新指定任务中指定步骤的当前执行状态
- 支持四种步骤状态的灵活切换和管理
- 自动更新步骤和任务的最后修改时间戳
- 返回更新后的完整任务信息和所有步骤状态

**支持的状态类型：**
- **processing**: 处理中 - 步骤正在执行或等待开始
- **completed**: 已完成 - 步骤成功完成所有要求的操作
- **failed**: 已失败 - 步骤执行过程中遇到错误或问题
- **cancelled**: 已取消 - 步骤被用户或系统主动停止

**状态变更规则：**
- 从 processing 可以变更到任何其他状态
- completed/failed/cancelled 状态一般为终态，但支持重置
- 状态变更会影响任务的整体进度计算

**自动影响：**
- 更新步骤和任务的时间戳信息
- 重新计算任务的整体完成状态和进度
- 触发相关的状态外化和通知机制

**使用场景：**
- AI Agent 执行任务时实时更新步骤进度
- 用户手动标记步骤的完成或失败状态
- 任务执行过程中的错误处理和恢复
- 任务流程控制和状态跟踪管理
`

export const UpdateStepStatusSchema = routerSchema({
  operationId: 'updateStepStatus',
  summary: '更新步骤状态',
  tags: ['任务管理'],
  description: updateStepStatusDescription,
  body: z.object({
    taskId: z.string().min(1).describe('任务ID'),
    stepId: z.string().min(1).describe('步骤ID'),
    status: StepStatusEnum.describe('新的步骤状态'),
  }),
  response: responseSchema(TaskSchema),
})
