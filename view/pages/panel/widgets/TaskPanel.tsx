import React, { useEffect, useState } from 'react'
import { listTasks } from '../../../apis/sdk.gen.js'
import type { ListTasksResponse } from '../../../apis/types.gen.js'

interface Task {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  subtasks: Subtask[]
  steps: Array<{
    id: string
    title: string
    status: 'completed' | 'failed' | 'cancelled' | 'processing'
    createdAt?: string
    updatedAt?: string
  }>
  createdAt?: string
  updatedAt?: string
}

interface Subtask {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed'
}

interface TaskPanelProps {
  // 暂无需要传入的props
}

function TaskPanel({}: TaskPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [hiddenAt, setHiddenAt] = useState<number | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // 计算任务进度
  const calculateProgress = (steps: Task['steps']): number => {
    if (steps.length === 0) return 0
    const completedSteps = steps.filter(step => step.status === 'completed')
    return Math.round((completedSteps.length / steps.length) * 100)
  }

  // 映射后端步骤状态到前端状态
  const mapStepStatus = (status: 'completed' | 'failed' | 'cancelled' | 'processing'): 'pending' | 'in-progress' | 'completed' => {
    switch (status) {
      case 'completed': return 'completed'
      case 'processing': return 'in-progress'
      case 'failed':
      case 'cancelled':
      default:
        return 'pending'
    }
  }

  // 加载任务列表
  const loadTasks = async () => {
    try {
      const response = await listTasks({ body: { page: 1, pageSize: 1 } })
      if (response.data?.data?.list && response.data.data.list.length > 0) {
        const task = response.data.data.list[0]
        if (task && task.id && task.title && task.steps) {
          const convertedTask: Task = {
            id: task.id,
            title: task.title,
            steps: task.steps,
            status: task.steps.every(step => step.status === 'completed') ? 'completed' :
              task.steps.some(step => step.status === 'processing') ? 'processing' :
                task.steps.some(step => step.status === 'failed') ? 'failed' : 'pending',
            progress: calculateProgress(task.steps),
            subtasks: task.steps.map(step => ({
              id: step.id,
              title: step.title,
              status: mapStepStatus(step.status)
            })),
            createdAt: task.createdAt || new Date().toISOString(),
            updatedAt: task.updatedAt || new Date().toISOString()
          }
          setTasks([convertedTask])
        } else {
          setTasks([])
        }
      } else {
        setTasks([])
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
      setTasks([])
    }
  }

  // 开始轮询任务状态
  const startPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    const interval = setInterval(async () => {
      await loadTasks()
    }, 500) // 每0.5秒轮询一次

    setPollingInterval(interval)
  }

  // 停止轮询
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  // 获取最新任务并判断是否应该显示
  const shouldShowTask = (): Task | null => {
    if (tasks.length === 0) return null

    const latestTask = tasks[0]
    if (!latestTask) return null

    // 如果任务已经被隐藏，不再显示（除非是新任务）
    if (hiddenAt && latestTask.updatedAt) {
      const taskUpdateTime = new Date(latestTask.updatedAt).getTime()
      if (taskUpdateTime <= hiddenAt) {
        return null
      }
    }

    // 检查是否有未完成的子步骤
    const hasIncompleteSteps = latestTask.subtasks.some(subtask =>
      subtask.status !== 'completed'
    )

    // 有未完成的步骤，直接显示
    if (hasIncompleteSteps) {
      return latestTask
    }

    // 全部完成，检查时间限制
    if (latestTask.updatedAt) {
      const timeDiff = (Date.now() - new Date(latestTask.updatedAt).getTime()) / 1000

      if (timeDiff <= 10) {
        return latestTask
      } else if (!hiddenAt) {
        setHiddenAt(Date.now())
      }
    }

    return null
  }

  const currentTask = shouldShowTask()

  // 组件挂载时开始轮询
  useEffect(() => {
    startPolling()
    return () => {
      stopPolling()
    }
  }, [])

  // 当任务列表变化时，重置隐藏状态（新任务到来）
  useEffect(() => {
    if (tasks.length > 0 && tasks[0]) {
      const latestTask = tasks[0]
      // 检查是否有进行中的步骤，如果有，重置hiddenAt
      const hasActiveSteps = latestTask.subtasks.some(subtask =>
        subtask.status === 'pending' || subtask.status === 'in-progress'
      )
      if (hasActiveSteps && hiddenAt) {
        setHiddenAt(null)
      }
    }
  }, [tasks, hiddenAt])

  if (!currentTask) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓'
      case 'processing': return '◯'
      case 'pending': return '○'
      case 'failed': return '✕'
      default: return '○'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 任务内容 */}
      <div className="p-6 max-h-80 overflow-y-auto">
        {currentTask && (
          <div className="space-y-6">
            {/* 主任务标题 - 简洁样式 */}
            <div className="flex items-start gap-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mt-0.5
                ${currentTask.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  currentTask.status === 'processing' ? 'bg-emerald-50 text-emerald-600' :
                    currentTask.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'}
              `}>
                {getStatusIcon(currentTask.status)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-base font-semibold leading-tight ${currentTask.status === 'completed' ? 'text-emerald-800' :
                    currentTask.status === 'processing' ? 'text-emerald-700' :
                      currentTask.status === 'failed' ? 'text-red-800' :
                        'text-gray-800'
                  }`}>
                  {currentTask.title}
                </h4>
                <div className={`text-sm mt-1 ${currentTask.status === 'completed' ? 'text-emerald-600' :
                    currentTask.status === 'processing' ? 'text-emerald-600' :
                      currentTask.status === 'failed' ? 'text-red-600' :
                        'text-gray-500'
                  }`}>
                  {currentTask.status === 'completed' ? '已完成' :
                    currentTask.status === 'processing' ? '执行中' :
                      currentTask.status === 'failed' ? '执行失败' :
                        '等待中'}
                </div>

                {/* 进度条 - 简洁样式 */}
                {currentTask.status === 'processing' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">进度</span>
                      <span className="text-xs text-emerald-600 font-medium">{currentTask.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${currentTask.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 子任务列表 - 简洁样式 */}
            {currentTask.subtasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-3 bg-emerald-400 rounded-full"></div>
                  <h5 className="text-sm font-medium text-gray-600">执行步骤</h5>
                </div>
                <div className="space-y-2 pl-4">
                  {currentTask.subtasks.map((subtask, index) => (
                    <div key={subtask.id} className="flex items-center gap-3 py-2">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full">
                        {subtask.status === 'completed' ? (
                          <div className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : subtask.status === 'in-progress' ? (
                          <div className="w-full h-full bg-emerald-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        ) : (
                          <div className="w-full h-full border border-gray-300 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className={`text-sm flex-1 ${subtask.status === 'completed' ? 'text-emerald-700 line-through' :
                          subtask.status === 'in-progress' ? 'text-emerald-700 font-medium' :
                            'text-gray-600'
                        }`}>
                        {subtask.title}
                      </span>
                      {subtask.status === 'completed' && (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          完成
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 完成状态 - 简洁样式 */}
        {currentTask && currentTask.status === 'completed' &&
          currentTask.subtasks.every((subtask) => subtask.status === 'completed') && (
            <div className="text-center py-4 border-t border-gray-100 mt-4">
              <div className="w-8 h-8 mx-auto mb-2 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div className="text-emerald-700 font-medium text-sm mb-1">任务完成</div>
              <div className="text-xs text-gray-500">即将自动关闭</div>
            </div>
          )}
      </div>
    </div>
  )
}

export default TaskPanel
