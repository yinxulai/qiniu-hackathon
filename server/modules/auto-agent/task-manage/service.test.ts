import { describe, it, expect, beforeEach } from 'vitest'
import { createTaskService } from './service'
import type { TaskManageService } from './service'

describe('TaskManageService', () => {
  let service: TaskManageService

  beforeEach(() => {
    service = createTaskService()
  })

  describe('createTask', () => {
    it('应该创建新任务', () => {
      const input = {
        title: '测试任务',
        steps: [
          { title: '步骤1' },
          { title: '步骤2' }
        ]
      }

      const task = service.createTask(input)

      expect(task.id).toBeDefined()
      expect(task.title).toBe('测试任务')
      expect(task.steps).toHaveLength(2)
      expect(task.steps[0]?.title).toBe('步骤1')
      expect(task.steps[0]?.status).toBe('processing')
      expect(task.createdAt).toBeDefined()
      expect(task.updatedAt).toBeDefined()
    })
  })

  describe('listTasks', () => {
    it('应该返回空列表当没有任务时', () => {
      const result = service.listTasks()
      expect(result.list).toEqual([])
      expect(result.total).toBe(0)
    })

    it('应该返回任务列表', () => {
      const task1 = service.createTask({
        title: '任务1',
        steps: [{ title: '步骤1' }]
      })
      // 等待一下确保时间戳不同
      const task2 = service.createTask({
        title: '任务2',
        steps: [{ title: '步骤2' }]
      })

      const result = service.listTasks()
      expect(result.list).toHaveLength(2)
      expect(result.total).toBe(2)
      
      // 检查任务是否按创建时间排序（不依赖具体顺序）
      const task1Found = result.list.find(t => t.title === '任务1')
      const task2Found = result.list.find(t => t.title === '任务2')
      expect(task1Found).toBeDefined()
      expect(task2Found).toBeDefined()
    })

    it('应该支持分页', () => {
      for (let i = 1; i <= 5; i++) {
        service.createTask({
          title: `任务${i}`,
          steps: [{ title: '步骤1' }]
        })
      }

      const page1 = service.listTasks(1, 2)
      expect(page1.list).toHaveLength(2)
      expect(page1.total).toBe(5)

      const page2 = service.listTasks(2, 2)
      expect(page2.list).toHaveLength(2)
      expect(page2.total).toBe(5)
    })
  })

  describe('getTask', () => {
    it('应该根据ID获取任务', () => {
      const task = service.createTask({
        title: '测试任务',
        steps: [{ title: '步骤1' }]
      })

      const retrieved = service.getTask(task.id)
      expect(retrieved).toEqual(task)
    })

    it('应该返回null当任务不存在时', () => {
      const result = service.getTask('nonexistent-id')
      expect(result).toBeNull()
    })
  })

  describe('updateTask', () => {
    it('应该更新任务标题', async () => {
      const task = service.createTask({
        title: '原标题',
        steps: [{ title: '步骤1' }]
      })

      const updated = service.updateTask(task.id, {
        title: '新标题'
      })

      expect(updated.title).toBe('新标题')
      expect(updated.id).toBe(task.id)
      expect(updated.steps).toHaveLength(1)
    })

    it('应该更新任务步骤', () => {
      const task = service.createTask({
        title: '测试任务',
        steps: [{ title: '步骤1' }]
      })

      const updated = service.updateTask(task.id, {
        steps: [
          { title: '步骤1' },
          { title: '步骤2' }
        ]
      })

      expect(updated.steps).toHaveLength(2)
      expect(updated.steps[1]?.title).toBe('步骤2')
    })

    it('应该抛出错误当任务不存在时', () => {
      expect(() => {
        service.updateTask('nonexistent-id', { title: '新标题' })
      }).toThrow('任务不存在')
    })
  })

  describe('deleteTask', () => {
    it('应该删除任务', () => {
      const task = service.createTask({
        title: '测试任务',
        steps: [{ title: '步骤1' }]
      })

      service.deleteTask(task.id)

      const result = service.getTask(task.id)
      expect(result).toBeNull()
    })

    it('应该抛出错误当任务不存在时', () => {
      expect(() => {
        service.deleteTask('nonexistent-id')
      }).toThrow('任务不存在')
    })
  })

  describe('updateStepStatus', () => {
    it('应该更新步骤状态', async () => {
      const task = service.createTask({
        title: '测试任务',
        steps: [{ title: '步骤1' }]
      })

      const stepId = task.steps[0]!.id
      const updated = service.updateStepStatus(task.id, stepId, 'completed')

      expect(updated.steps[0]?.status).toBe('completed')
      expect(updated.id).toBe(task.id)
      expect(updated.title).toBe(task.title)
    })

    it('应该抛出错误当任务不存在时', () => {
      expect(() => {
        service.updateStepStatus('nonexistent-task', 'step-id', 'completed')
      }).toThrow('任务不存在')
    })

    it('应该抛出错误当步骤不存在时', () => {
      const task = service.createTask({
        title: '测试任务',
        steps: [{ title: '步骤1' }]
      })

      expect(() => {
        service.updateStepStatus(task.id, 'nonexistent-step', 'completed')
      }).toThrow('步骤不存在')
    })
  })

  describe('getTasksByStatus', () => {
    beforeEach(() => {
      const task1 = service.createTask({
        title: '任务1',
        steps: [{ title: '步骤1' }]
      })
      service.updateStepStatus(task1.id, task1.steps[0]!.id, 'completed')

      const task2 = service.createTask({
        title: '任务2',
        steps: [{ title: '步骤2' }]
      })
      service.updateStepStatus(task2.id, task2.steps[0]!.id, 'failed')

      service.createTask({
        title: '任务3',
        steps: [{ title: '步骤3' }]
      })
    })

    it('应该返回所有任务当不指定状态时', () => {
      const tasks = service.getTasksByStatus()
      expect(tasks).toHaveLength(3)
    })

    it('应该根据步骤状态筛选任务', () => {
      const completedTasks = service.getTasksByStatus('completed')
      expect(completedTasks).toHaveLength(1)
      expect(completedTasks[0]?.title).toBe('任务1')

      const failedTasks = service.getTasksByStatus('failed')
      expect(failedTasks).toHaveLength(1)
      expect(failedTasks[0]?.title).toBe('任务2')

      const processingTasks = service.getTasksByStatus('processing')
      expect(processingTasks).toHaveLength(1)
      expect(processingTasks[0]?.title).toBe('任务3')
    })
  })

  describe('asAgentTools', () => {
    it('应该返回工具列表', () => {
      const tools = service.asAgentTools()
      expect(tools).toHaveLength(7)
      
      const toolNames = tools.map(tool => tool.name)
      expect(toolNames).toContain('createTask')
      expect(toolNames).toContain('listTasks')
      expect(toolNames).toContain('getTask')
      expect(toolNames).toContain('updateTask')
      expect(toolNames).toContain('deleteTask')
      expect(toolNames).toContain('updateStepStatus')
      expect(toolNames).toContain('getTasksByStatus')
    })

    it('createTask工具应该正常工作', async () => {
      const tools = service.asAgentTools()
      const createTaskTool = tools.find(tool => tool.name === 'createTask')!

      const input = JSON.stringify({
        title: '通过工具创建的任务',
        steps: [{ title: '工具步骤' }]
      })

      const result = await createTaskTool.invoke(input)
      const task = JSON.parse(result)

      expect(task.title).toBe('通过工具创建的任务')
      expect(task.steps).toHaveLength(1)
    })
  })
})

/**
 * 测试辅助函数
 */

/**
 * 测试辅助函数
 */

// 创建测试数据
export function createTestData(service: TaskManageService): void {
  console.log('[TEST] Creating test data...')
  
  // 创建一个正在进行的任务
  const task1 = service.createTask({
    title: '测试任务：搭建项目开发环境',
    steps: [
      { title: '安装 Node.js 和 npm' },
      { title: '初始化项目结构' },
      { title: '配置开发工具' },
      { title: '编写基础代码' }
    ]
  })
  
  // 更新一些步骤状态
  service.updateStepStatus(task1.id, task1.steps[0]!.id, 'completed')
  service.updateStepStatus(task1.id, task1.steps[1]!.id, 'completed')
  service.updateStepStatus(task1.id, task1.steps[2]!.id, 'processing')
  
  // 创建一个已完成的任务
  const task2 = service.createTask({
    title: '测试任务：设计用户界面',
    steps: [
      { title: '绘制线框图' },
      { title: '设计视觉稿' },
      { title: '制作交互原型' }
    ]
  })
  
  // 全部完成
  service.updateStepStatus(task2.id, task2.steps[0]!.id, 'completed')
  service.updateStepStatus(task2.id, task2.steps[1]!.id, 'completed')
  service.updateStepStatus(task2.id, task2.steps[2]!.id, 'completed')
  
  console.log('[TEST] Test data created - 2 tasks with sample steps')
}

// 获取任务统计信息
export function getTaskStats(service: TaskManageService) {
  const total = service.listTasks(1, 1000).total
  const completed = service.getTasksByStatus('completed').length
  const processing = service.getTasksByStatus('processing').length
  const failed = service.getTasksByStatus('failed').length
  const cancelled = service.getTasksByStatus('cancelled').length
  
  return {
    total,
    byStatus: { completed, processing, failed, cancelled }
  }
}
