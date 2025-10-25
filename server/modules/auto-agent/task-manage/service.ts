import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import type { Task, Step, CreateTaskInput, UpdateTaskInput, StepStatus } from './schema'
import {
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
  StepStatusEnum,
  TaskSchema
} from './schema'
import { z } from 'zod'

const store = new Store<{ tasks: Task[] }>({
  name: 'task-manage',
  defaults: { tasks: [] },
})

export function createTaskService() {
  
  function createTask(input: CreateTaskInput): Task {
    const now = new Date()
    const taskId = uuidv4()
    
    // 创建步骤，为每个步骤分配 ID 和默认状态
    const steps: Step[] = input.steps.map((stepInput) => ({
      id: uuidv4(),
      title: stepInput.title,
      status: 'processing' as StepStatus,
      createdAt: now,
      updatedAt: now,
    }))

    const task: Task = {
      id: taskId,
      title: input.title,
      steps,
      createdAt: now,
      updatedAt: now,
    }

    const tasks = store.get('tasks', [])
    tasks.push(task)
    store.set('tasks', tasks)

    return task
  }

  function listTasks(page: number = 1, pageSize: number = 10): { list: Task[], total: number } {
    const tasks = store.get('tasks', [])
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    
    return {
      list: tasks.slice(startIndex, endIndex),
      total: tasks.length,
    }
  }

  function getTask(id: string): Task | null {
    const tasks = store.get('tasks', [])
    return tasks.find(task => task.id === id) || null
  }

  function updateTask(id: string, updates: UpdateTaskInput): Task {
    const tasks = store.get('tasks', [])
    const taskIndex = tasks.findIndex(task => task.id === id)
    
    if (taskIndex === -1) {
      throw new Error('任务不存在')
    }

    const now = new Date()
    const currentTask = tasks[taskIndex]!
    
    // 更新任务基本信息
    if (updates.title) {
      currentTask.title = updates.title
    }
    
    // 更新步骤列表
    if (updates.steps) {
      currentTask.steps = updates.steps.map((stepInput) => {
        // 如果步骤有 ID，尝试保留现有步骤的创建时间
        const existingStep = currentTask.steps.find(s => s.title === stepInput.title)
        return {
          id: existingStep?.id || uuidv4(),
          title: stepInput.title,
          status: existingStep?.status || 'processing' as StepStatus,
          createdAt: existingStep?.createdAt || now,
          updatedAt: now,
        }
      })
    }

    currentTask.updatedAt = now
    tasks[taskIndex] = currentTask
    store.set('tasks', tasks)

    return currentTask
  }

  function deleteTask(id: string): void {
    const tasks = store.get('tasks', [])
    const filteredTasks = tasks.filter(task => task.id !== id)
    
    if (filteredTasks.length === tasks.length) {
      throw new Error('任务不存在')
    }
    
    store.set('tasks', filteredTasks)
  }

  function updateStepStatus(taskId: string, stepId: string, status: StepStatus): Task {
    const tasks = store.get('tasks', [])
    const taskIndex = tasks.findIndex(task => task.id === taskId)
    
    if (taskIndex === -1) {
      throw new Error('任务不存在')
    }

    const task = tasks[taskIndex]!
    const stepIndex = task.steps.findIndex(step => step.id === stepId)
    
    if (stepIndex === -1) {
      throw new Error('步骤不存在')
    }

    const now = new Date()
    task.steps[stepIndex]!.status = status
    task.steps[stepIndex]!.updatedAt = now
    task.updatedAt = now

    tasks[taskIndex] = task
    store.set('tasks', tasks)

    return task
  }

  function getTasksByStatus(stepStatus?: StepStatus): Task[] {
    const tasks = store.get('tasks', [])
    
    if (!stepStatus) {
      return tasks
    }

    return tasks.filter(task => 
      task.steps.some(step => step.status === stepStatus)
    )
  }

  function asAgentTools() {
    return [
      // 创建任务工具
      {
        name: 'createTask',
        description: '创建新任务，包含任务简介和步骤列表。步骤初始状态为"处理中"，自动生成任务ID和时间戳。',
        schema: CreateTaskInputSchema,
        async invoke(input: CreateTaskInput) {
          return createTask(input)
        }
      },

      // 获取任务列表工具
      {
        name: 'listTasks',
        description: '获取任务列表，支持分页查询。返回任务总数和当前页数据。',
        schema: z.object({
          page: z.number().min(1).optional().default(1).describe('页码'),
          pageSize: z.number().min(1).max(100).optional().default(10).describe('每页数量'),
        }).optional(),
        async invoke(input: { page?: number; pageSize?: number } = {}) {
          return listTasks(input.page, input.pageSize)
        }
      },

      // 获取单个任务工具
      {
        name: 'getTask',
        description: '根据任务ID获取任务详细信息，包含所有步骤的状态信息。',
        schema: z.object({
          id: z.string().min(1).describe('任务ID'),
        }),
        async invoke(input: { id: string }) {
          return getTask(input.id)
        }
      },

      // 更新任务工具
      {
        name: 'updateTask',
        description: '更新任务信息，支持部分字段更新。可以更新任务简介和步骤列表，自动更新时间戳。',
        schema: z.object({
          id: z.string().min(1).describe('任务ID'),
        }).merge(UpdateTaskInputSchema),
        async invoke(input: { id: string } & UpdateTaskInput) {
          const { id, ...updates } = input
          return updateTask(id, updates)
        }
      },

      // 删除任务工具
      {
        name: 'deleteTask',
        description: '根据任务ID删除任务。删除后无法恢复。',
        schema: z.object({
          id: z.string().min(1).describe('任务ID'),
        }),
        async invoke(input: { id: string }) {
          deleteTask(input.id)
          return { success: true, message: '任务删除成功' }
        }
      },

      // 更新步骤状态工具
      {
        name: 'updateStepStatus',
        description: '更新指定任务中指定步骤的状态。支持完成、失败、取消、处理中四种状态，自动更新时间戳。',
        schema: z.object({
          taskId: z.string().min(1).describe('任务ID'),
          stepId: z.string().min(1).describe('步骤ID'),
          status: StepStatusEnum.describe('新的步骤状态'),
        }),
        async invoke(input: { taskId: string; stepId: string; status: StepStatus }) {
          return updateStepStatus(input.taskId, input.stepId, input.status)
        }
      },

      // 根据状态获取任务工具
      {
        name: 'getTasksByStatus',
        description: '根据步骤状态筛选任务列表。如果不指定状态，返回所有任务。',
        schema: z.object({
          stepStatus: StepStatusEnum.optional().describe('步骤状态筛选条件'),
        }).optional(),
        async invoke(input: { stepStatus?: StepStatus } = {}) {
          return getTasksByStatus(input.stepStatus)
        }
      },
    ]
  }

  return {
    createTask,
    listTasks,
    getTask,
    updateTask,
    deleteTask,
    updateStepStatus,
    getTasksByStatus,
    asAgentTools,
  }
}

export type TaskManageService = ReturnType<typeof createTaskService>
