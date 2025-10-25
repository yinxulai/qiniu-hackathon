import React, { useEffect, useState } from 'react'

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
  tasks: Task[]
  isProcessing: boolean
  onTaskComplete: () => void
}

function TaskPanel({ tasks, isProcessing, onTaskComplete }: TaskPanelProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isProcessing || tasks.length > 0) {
      setIsVisible(true)
    } else {
      // 延迟隐藏，让用户看到完成状态
      const timer = setTimeout(() => setIsVisible(false), 2000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isProcessing, tasks])

  useEffect(() => {
    // 检查所有任务是否完成
    if (tasks.length > 0) {
      const allCompleted = tasks.every(task => 
        task.status === 'completed' && 
        task.subtasks.every(subtask => subtask.status === 'completed')
      )
      
      if (allCompleted) {
        setTimeout(() => {
          onTaskComplete()
        }, 3000) // 3秒后自动关闭
      }
    }
  }, [tasks, onTaskComplete])

  if (!isVisible) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'processing': return '⚡'
      case 'pending': return '⏳'
      case 'failed': return '❌'
      default: return '⏳'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'processing': return 'text-mint-600'
      case 'pending': return 'text-gray-500'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-2xl border border-white/50 shadow-xl shadow-mint-500/10 overflow-hidden transition-all duration-500 animate-fade-in">
      {/* 头部 */}
      <div className="bg-linear-to-r from-mint-500 to-mint-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📋</span>
            </div>
            <h3 className="text-white font-semibold text-base">当前任务</h3>
          </div>
          {isProcessing && (
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white/90 text-sm font-medium">处理中</span>
            </div>
          )}
        </div>
      </div>

      {/* 任务列表 */}
      <div className="p-5 space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
        {isProcessing && tasks.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-mint-100 to-mint-200 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-mint-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-gray-700 text-base font-semibold mb-2">AI 正在分析任务...</div>
            <div className="text-gray-500 text-sm">请稍候，正在为您制定执行计划</div>
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-mint-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-mint-400 rounded-full animate-pulse animation-delay-500"></div>
                <div className="w-2 h-2 bg-mint-400 rounded-full animate-pulse animation-delay-1000"></div>
              </div>
            </div>
          </div>
        )}

        {tasks.map((task, index) => (
          <div key={task.id} className="space-y-3 animate-fade-in">
            {/* 主任务 */}
            <div className="flex items-start gap-4 p-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200/50 shadow-sm">
              <div className="mt-1">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-lg
                  ${task.status === 'completed' ? 'bg-green-100 text-green-600' : 
                    task.status === 'processing' ? 'bg-mint-100 text-mint-600' : 
                    task.status === 'failed' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-500'}
                `}>
                  <span>{getStatusIcon(task.status)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold text-base ${getStatusColor(task.status)}`}>
                    {task.title}
                  </h4>
                </div>
                
                {/* 进度条 */}
                {task.status === 'processing' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">进度</span>
                      <span className="font-semibold">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-linear-to-r from-mint-400 to-mint-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 子任务 */}
            {task.subtasks.length > 0 && (
              <div className="ml-8 space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-sm
                      ${subtask.status === 'completed' ? 'bg-green-100 text-green-600' : 
                        subtask.status === 'in-progress' ? 'bg-mint-100 text-mint-600' : 
                        'bg-gray-100 text-gray-500'}
                    `}>
                      <span>{getStatusIcon(subtask.status)}</span>
                    </div>
                    <span className={`text-sm flex-1 font-medium ${getStatusColor(subtask.status)}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* 完成状态 */}
        {tasks.length > 0 && tasks.every(task => task.status === 'completed') && (
          <div className="text-center py-6 border-t border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl">🎉</span>
            </div>
            <div className="text-green-600 font-bold text-lg mb-2">所有任务已完成！</div>
            <div className="text-gray-500 text-sm">面板将在3秒后自动关闭</div>
            <div className="mt-3 w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskPanel
