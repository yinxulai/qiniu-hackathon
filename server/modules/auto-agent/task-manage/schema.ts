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
创建新任务

**功能说明：**
- 创建一个新的任务，包含任务简介和步骤列表
- 步骤初始状态为"处理中"
- 自动生成任务ID和时间戳
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
获取任务列表

**功能说明：**
- 支持分页查询任务列表
- 返回任务总数和当前页数据
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
获取单个任务详情

**功能说明：**
- 根据任务ID获取任务详细信息
- 包含所有步骤的状态信息
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
更新任务信息

**功能说明：**
- 支持部分字段更新
- 可以更新任务简介和步骤列表
- 自动更新时间戳
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
删除任务

**功能说明：**
- 根据任务ID删除任务
- 删除后无法恢复
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
更新步骤状态

**功能说明：**
- 更新指定任务中指定步骤的状态
- 支持完成、失败、取消、处理中四种状态
- 自动更新时间戳
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
