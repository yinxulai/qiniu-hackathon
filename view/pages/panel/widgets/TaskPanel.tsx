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
      {/* 简洁的头部 */}
      <div className="px-6 py-4 border-b border-gray-50">
        <h3 className="text-base font-medium text-gray-900">当前任务</h3>
      </div>

      {/* 任务内容 */}
      <div className="p-6 max-h-80 overflow-y-auto">
        {currentTask && (
          <div className="space-y-6">
            {/* 主任务标题 - 薄荷流光主题 */}
            <div className="flex items-start gap-4">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5 shadow-sm
                ${currentTask.status === 'completed' ? 'bg-emerald-500 text-white' : 
                  currentTask.status === 'processing' ? 'bg-linear-to-br from-emerald-400 to-green-500 text-white' : 
                  currentTask.status === 'failed' ? 'bg-red-500 text-white' :
                  'bg-gray-200 text-gray-600'}
              `}>
                {getStatusIcon(currentTask.status)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-gray-900 leading-tight">
                  {currentTask.title}
                </h4>
                
                {/* 进度条 - 薄荷流光渐变 */}
                {currentTask.status === 'processing' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">进度</span>
                      <span className="text-sm font-semibold text-emerald-600">{currentTask.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-linear-to-r from-emerald-400 via-green-400 to-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${currentTask.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 子任务列表 - 薄荷流光主题 */}
            {currentTask.subtasks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-linear-to-b from-emerald-400 to-green-500 rounded-full"></div>
                  <h5 className="text-sm font-semibold text-gray-700">执行步骤</h5>
                </div>
                <div className="space-y-2 pl-5">
                  {currentTask.subtasks.map((subtask, index) => (
                    <div key={subtask.id} className="flex items-center gap-3 py-2">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-200">
                        {subtask.status === 'completed' ? (
                          <div className="w-full h-full bg-linear-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        ) : subtask.status === 'in-progress' ? (
                          <div className="w-full h-full border-emerald-400 bg-emerald-50 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                          </div>
                        ) : (
                          <div className="w-full h-full border-gray-200 bg-gray-50 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <span className={`text-sm font-medium flex-1 ${
                        subtask.status === 'completed' ? 'text-emerald-700' :
                        subtask.status === 'in-progress' ? 'text-emerald-600' :
                        'text-gray-500'
                      }`}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 完成状态 - 薄荷流光主题 */}
        {currentTask && currentTask.status === 'completed' && 
         currentTask.subtasks.every(subtask => subtask.status === 'completed') && (
          <div className="text-center py-6 border-t border-gray-100 mt-6">
            <div className="w-12 h-12 mx-auto mb-3 bg-linear-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">✨</span>
            </div>
            <div className="text-emerald-700 font-semibold text-base mb-1">任务完成</div>
            <div className="text-sm text-gray-500">即将自动关闭</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskPanel
