import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import type { Task, Step, CreateTaskInput, UpdateTaskInput, StepStatus } from './schema'

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

  return {
    createTask,
    listTasks,
    getTask,
    updateTask,
    deleteTask,
    updateStepStatus,
    getTasksByStatus,
  }
}
