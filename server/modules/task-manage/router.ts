import { FastifyPluginAsync } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { createSuccessResponse } from '../../helpers/response'
import { createTaskService } from './service'
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  GetTaskSchema,
  ListTasksSchema,
  DeleteTaskSchema,
  UpdateStepStatusSchema,
} from './schema'

export function createTaskRouter(options: {}): FastifyPluginAsync {
  return async (app) => {
    const typedApp = app.withTypeProvider<ZodTypeProvider>()
    const service = createTaskService()

    // 创建任务
    typedApp.post('/task/create', { schema: CreateTaskSchema, }, async (request) => {
      const task = service.createTask(request.body)
      return createSuccessResponse(task)
    })

    // 获取任务列表
    typedApp.post('/task/list', { schema: ListTasksSchema, }, async (request) => {
      const { page = 1, pageSize = 10 } = request.body || {}
      const result = service.listTasks(page, pageSize)
      return createSuccessResponse(result)
    })

    // 获取单个任务
    typedApp.post('/task/get', { schema: GetTaskSchema, }, async (request) => {
      const { id } = request.body
      const task = service.getTask(id)
      return createSuccessResponse(task)
    })

    // 更新任务
    typedApp.post('/task/update', { schema: UpdateTaskSchema, }, async (request) => {
      const { id, ...updates } = request.body
      const task = service.updateTask(id, updates)
      return createSuccessResponse(task)
    })

    // 删除任务
    typedApp.post('/task/delete', { schema: DeleteTaskSchema, }, async (request) => {
      const { id } = request.body
      service.deleteTask(id)
      return createSuccessResponse(null)
    })

    // 更新步骤状态
    typedApp.post('/task/updateStepStatus', { schema: UpdateStepStatusSchema, }, async (request) => {
      const { taskId, stepId, status } = request.body
      const task = service.updateStepStatus(taskId, stepId, status)
      return createSuccessResponse(task)
    })
  }
}
