import React, { useState } from 'react'
import { Card } from '../../../components/ui'

interface Subtask {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed'
}

interface Task {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed'
  subtasks: Subtask[]
}

interface TaskStatusPanelProps {
  task: Task
}

export default function TaskStatusPanel({ task }: TaskStatusPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'running':
        return 'text-blue-400'
      case 'pending':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        )
      case 'running':
        return (
          <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z" />
          </svg>
        )
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        )
      default:
        return null
    }
  }

  const completedCount = task.subtasks.filter(subtask => subtask.status === 'completed').length
  const progressPercentage = (completedCount / task.subtasks.length) * 100

  return (
    <Card className="space-y-4">
      {/* 任务标题和总体状态 */}
      <div className="space-y-2">
        <div className="flex items-start space-x-2">
          <div className="flex-1">
            <h3 className="text-white font-medium text-sm leading-relaxed">
              {task.title}
            </h3>
            <p className="text-white/60 text-xs mt-1">
              {completedCount} / {task.subtasks.length} 项子任务已完成
            </p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-400 to-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* 子任务列表 */}
      <div className="space-y-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-white/80 text-xs font-medium hover:text-white transition-colors no-drag-region"
        >
          <span>子任务进度</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </button>
        {isExpanded && (
          <div className="space-y-2">
            {task.subtasks.map((subtask, index) => (
              <Card key={subtask.id} className="p-2!">
                <div className="flex items-center space-x-2">
                  <div className={`${getStatusColor(subtask.status)} shrink-0`}>
                    {getStatusIcon(subtask.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate ${subtask.status === 'completed'
                        ? 'text-white/80 line-through'
                        : 'text-white/90'
                      }`}>
                      {index + 1}. {subtask.title}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full ${subtask.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : subtask.status === 'running'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                      {subtask.status === 'completed' ? '完成' :
                        subtask.status === 'running' ? '进行中' : '等待'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
