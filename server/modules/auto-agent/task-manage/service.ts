import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import { tool } from "langchain"
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
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }))

    const task: Task = {
      id: taskId,
      title: input.title,
      steps,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }

    const tasks = store.get('tasks', [])
    tasks.push(task)
    store.set('tasks', tasks)

    return task
  }

  function listTasks(page: number = 1, pageSize: number = 10): { list: Task[], total: number } {
    const tasks = store.get('tasks', [])
    // 按创建时间倒序排列，最新的在前面
    const sortedTasks = tasks.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return timeB - timeA
    })
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    
    return {
      list: sortedTasks.slice(startIndex, endIndex),
      total: sortedTasks.length,
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
          createdAt: existingStep?.createdAt || now.toISOString(),
          updatedAt: now.toISOString(),
        }
      })
    }

    currentTask.updatedAt = now.toISOString()
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
    task.steps[stepIndex]!.updatedAt = now.toISOString()
    task.updatedAt = now.toISOString()

    tasks[taskIndex] = task
    store.set('tasks', tasks)

    return task
  }

  function getTasksByStatus(stepStatus?: StepStatus): Task[] {
    const tasks = store.get('tasks', [])
    // 按创建时间倒序排列，最新的在前面
    const sortedTasks = tasks.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return timeB - timeA
    })
    
    if (!stepStatus) {
      return sortedTasks
    }

    return sortedTasks.filter(task => 
      task.steps.some(step => step.status === stepStatus)
    )
  }

  function asAgentTools() {
    return [
      // 创建任务工具
      tool(
        async (input: string) => {
          try {
            const parsed = JSON.parse(input)
            const result = createTask(parsed)
            return JSON.stringify(result)
          } catch (error) {
            return `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        },
        {
          name: 'createTask',
          description: '创建新任务，包含任务简介和步骤列表。步骤初始状态为"处理中"，自动生成任务ID和时间戳。参数格式：{"title": "任务标题", "steps": [{"title": "步骤标题"}]}'
        }
      ),

      // 获取任务列表工具
      tool(
        async (input: string) => {
          try {
            const parsed = input ? JSON.parse(input) : {}
            const result = listTasks(parsed.page, parsed.pageSize)
            return JSON.stringify(result)
          } catch (error) {
            return `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        },
        {
          name: 'listTasks',
          description: '获取任务列表，支持分页查询。返回任务总数和当前页数据。参数格式：{"page": 1, "pageSize": 10}（可选）'
        }
      ),

      // 获取单个任务工具
      tool(
        async (input: string) => {
          try {
            const parsed = JSON.parse(input)
            const result = getTask(parsed.id)
            return JSON.stringify(result)
          } catch (error) {
            return `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        },
        {
          name: 'getTask',
          description: '根据任务ID获取任务详细信息，包含所有步骤的状态信息。参数格式：{"id": "任务ID"}'
        }
      ),

      // 更新任务工具
      tool(
        async (input: string) => {
          try {
            const parsed = JSON.parse(input)
            const { id, ...updates } = parsed
            const result = updateTask(id, updates)
            return JSON.stringify(result)
          } catch (error) {
            return `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        },
        {
          name: 'updateTask',
          description: '更新任务信息，支持部分字段更新。可以更新任务简介和步骤列表，自动更新时间戳。参数格式：{"id": "任务ID", "title": "新标题", "steps": [{"title": "步骤标题"}]}'
        }
      ),

      // 删除任务工具
      tool(
        async (input: string) => {
          try {
            const parsed = JSON.parse(input)
            deleteTask(parsed.id)
            return JSON.stringify({ success: true, message: '任务删除成功' })
          } catch (error) {
            return `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        },
        {
          name: 'deleteTask',
          description: '根据任务ID删除任务。删除后无法恢复。参数格式：{"id": "任务ID"}'
        }
      ),

      // 更新步骤状态工具
      tool(
        async (input: string) => {
          try {
            const parsed = JSON.parse(input)
            const result = updateStepStatus(parsed.taskId, parsed.stepId, parsed.status)
            return JSON.stringify(result)
          } catch (error) {
            return `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        },
        {
          name: 'updateStepStatus',
          description: '更新指定任务中指定步骤的状态。支持完成、失败、取消、处理中四种状态，自动更新时间戳。参数格式：{"taskId": "任务ID", "stepId": "步骤ID", "status": "completed|failed|cancelled|processing"}'
        }
      ),

      // 根据状态获取任务工具
      tool(
        async (input: string) => {
          try {
            const parsed = input ? JSON.parse(input) : {}
            const result = getTasksByStatus(parsed.stepStatus)
            return JSON.stringify(result)
          } catch (error) {
            return `Error: ${error instanceof Error ? error.message : String(error)}`
          }
        },
        {
          name: 'getTasksByStatus',
          description: '根据步骤状态筛选任务列表。如果不指定状态，返回所有任务。参数格式：{"stepStatus": "completed|failed|cancelled|processing"}（可选）'
        }
      ),
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
