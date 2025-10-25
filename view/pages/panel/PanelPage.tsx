import React, { useState, useEffect } from 'react'
import { createTask, listTasks, chat } from '../../apis/sdk.gen.js'
import type { ListTasksResponse } from '../../apis/types.gen.js'
import InputPanel from './widgets/InputPanel.js'
import TaskPanel from './widgets/TaskPanel.js'

interface PanelPageProps {}

type Task = {
  id: string
  title: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  steps: Array<{
    id: string
    title: string
    status: 'completed' | 'failed' | 'cancelled' | 'processing'
    createdAt?: string
    updatedAt?: string
  }>
  subtasks: Array<{
    id: string
    title: string
    status: 'pending' | 'in-progress' | 'completed'
  }>
  createdAt?: string
  updatedAt?: string
}

function PanelPage({}: PanelPageProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [chatResponse, setChatResponse] = useState<string>('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string, timestamp: Date }>>([])
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // 添加消息到聊天历史
  const addToChatHistory = (role: 'user' | 'assistant', content: string) => {
    setChatHistory(prev => [...prev, { role, content, timestamp: new Date() }])
  }

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

  // 检查任务是否应该显示
  const shouldShowTask = (task: Task): boolean => {
    const now = new Date()
    
    // 检查任务本身的更新时间
    if (task.updatedAt) {
      const taskUpdatedAt = new Date(task.updatedAt)
      const timeDiff = (now.getTime() - taskUpdatedAt.getTime()) / 1000
      if (timeDiff <= 30) {
        return true // 30秒内更新的任务保留显示
      }
    }
    
    // 检查子任务的更新时间
    for (const step of task.steps) {
      if (step.updatedAt) {
        const stepUpdatedAt = new Date(step.updatedAt)
        const timeDiff = (now.getTime() - stepUpdatedAt.getTime()) / 1000
        if (timeDiff <= 30) {
          return true // 30秒内更新的子任务保留显示
        }
      }
    }
    
    // 检查是否有待处理或处理中的状态
    if (task.status === 'pending' || task.status === 'processing') {
      return true
    }
    
    // 检查子任务是否有待处理或处理中的状态
    for (const step of task.steps) {
      if (step.status === 'processing') {
        return true
      }
    }
    
    return false
  }

  // 加载任务列表
  const loadTasks = async () => {
    try {
      const response = await listTasks({ body: {} })
      if (response.data?.data?.list) {
        // 转换API数据格式为组件所需格式
        const convertedTasks: Task[] = response.data.data.list.map(task => ({
          ...task,
          status: task.steps.every(step => step.status === 'completed') ? 'completed' :
            task.steps.some(step => step.status === 'processing') ? 'processing' :
              task.steps.some(step => step.status === 'failed') ? 'failed' : 'pending',
          progress: calculateProgress(task.steps),
          subtasks: task.steps.map(step => ({
            id: step.id,
            title: step.title,
            status: mapStepStatus(step.status)
          }))
        }))
        
        // 只取第一个任务，并检查是否应该显示
        const firstTask = convertedTasks[0]
        if (firstTask && shouldShowTask(firstTask)) {
          setTasks([firstTask])
        } else {
          setTasks([])
        }
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  // 停止轮询
  const stopTaskPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
      setIsPolling(false)
      console.log('[POLLING] Task polling stopped')
    }
  }

  // 开始轮询任务状态
  const startTaskPolling = () => {
    // 如果已经在轮询，先停止之前的轮询
    if (pollingInterval) {
      stopTaskPolling()
    }

    console.log('[POLLING] Starting task polling...')
    setIsPolling(true)

    const interval = setInterval(async () => {
      try {
        console.log('[POLLING] Fetching task updates...')
        await loadTasks()

        // 检查是否所有任务都完成
        const currentTasks = await listTasks({ body: {} })
        if (currentTasks.data?.data?.list) {
          const activeTasks = currentTasks.data.data.list

          // 如果没有任务或所有任务都完成了
          if (activeTasks.length === 0) {
            console.log('[POLLING] No active tasks, stopping polling')
            stopTaskPolling()
            setIsProcessing(false)
            return
          }

          const allCompleted = activeTasks.every(task =>
            task.steps.every(step => step.status === 'completed')
          )

          if (allCompleted) {
            console.log('[POLLING] All tasks completed, stopping polling in 3 seconds')
            setTimeout(() => {
              setTasks([])
              setIsProcessing(false)
              stopTaskPolling()
            }, 3000)
          }
        }
      } catch (error) {
        console.error('[POLLING] Error during polling:', error)
        // 轮询出错时不立即停止，继续尝试
      }
    }, 2000) // 每2秒轮询一次

    setPollingInterval(interval)

    // 60秒后强制停止轮询（防止无限轮询）
    setTimeout(() => {
      if (interval === pollingInterval) {
        console.log('[POLLING] Timeout reached, stopping polling')
        stopTaskPolling()
        setIsProcessing(false)
      }
    }, 60000)
  }

  // 处理用户输入
  const handleInputSubmit = async (input: string, type: 'voice' | 'text') => {
    setIsProcessing(true)

    try {
      console.log(`Processing ${type} input:`, input)

      // 1. 添加用户消息到历史记录
      addToChatHistory('user', input)

      // 2. 构建包含历史记录的消息列表
      const messages = [
        ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user' as const, content: input }
      ]

      // 3. 与AI对话
      const chatResult = await chat({
        body: { messages }
      })

      if (chatResult.error) {
        throw new Error(chatResult.error.message || 'Chat failed')
      }

      // 4. 保存AI响应内容
      if (chatResult.data?.data?.content) {
        const aiContent = chatResult.data.data.content
        setChatResponse(aiContent)
        addToChatHistory('assistant', aiContent)
        console.log('AI Response:', aiContent)
      }

      // 5. 等待一会儿让AI处理任务
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 6. 获取最新的任务列表
      await loadTasks()

      // 7. 开始轮询任务状态更新
      startTaskPolling()

    } catch (error) {
      console.error('Processing error:', error)
      // 显示错误信息给用户
      const errorMsg = `处理失败: ${error instanceof Error ? error.message : '未知错误'}`
      setChatResponse(errorMsg)
      addToChatHistory('assistant', errorMsg)
    } finally {
      // 如果没有任务被创建，立即停止处理状态
      setTimeout(() => {
        if (tasks.length === 0) {
          setIsProcessing(false)
        }
      }, 2000)
    }
  }

  // 处理任务完成
  const handleTaskComplete = () => {
    console.log('[TASK] All tasks completed by user action')
    setTasks([])
    setIsProcessing(false)
    setChatResponse('')
    stopTaskPolling()
    // 保留聊天历史记录，不清除
  }

  // 组件加载时获取初始任务列表
  useEffect(() => {
    loadTasks()
  }, [])

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      stopTaskPolling()
    }
  }, [])

  return (
    <div className="h-screen w-full bg-transparent flex flex-col relative overflow-hidden">
      {/* 主要内容区域 */}
      <div className="flex-1 p-6 flex flex-col gap-6 relative z-10">
        {/* 输入面板 */}
        <InputPanel
          onSubmit={handleInputSubmit}
          isProcessing={isProcessing}
          aiResponse={chatResponse}
          isPolling={isPolling}
        />

        {/* 任务面板 */}
        <TaskPanel
          tasks={tasks}
          isProcessing={isProcessing}
          onTaskComplete={handleTaskComplete}
        />
      </div>
    </div>
  )
}

export default PanelPage
