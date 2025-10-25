import React, { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { chat, listTasks, getTask, deleteTask, updateStepStatus, getAgentConfig, updateAgentConfig } from '../../apis'
import type { ListTasksResponse, GetAgentConfigResponse, UpdateAgentConfigData } from '../../apis'

// 从API响应中提取类型
type Task = NonNullable<ListTasksResponse['data']['list'][0]>
type Step = Task['steps'][0]
type StepStatus = Step['status']

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface DebugPageProps {}

interface ProcessResult {
  timestamp: string
  userInput: string
  response: string
  status: 'success' | 'error' | 'processing'
  duration?: number
  error?: string
}

function DebugPage({}: DebugPageProps) {
  const [userInput, setUserInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<ProcessResult[]>([])
  
  // 配置相关状态
  const [agentConfig, setAgentConfig] = useState<any>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [tempSystemPrompt, setTempSystemPrompt] = useState('')
  
  // 任务相关状态
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalTasks, setTotalTasks] = useState(0)
  const pageSize = 10

  // 预设提示词
  const presetPrompts = [
    {
      name: '通用助手',
      prompt: '你是一个智能助手，负责回答用户的问题。请根据用户输入提供准确、有帮助的回答。'
    },
    {
      name: '代码助手',
      prompt: '你是一个专业的编程助手。请帮助用户解决编程问题，提供代码示例和技术建议。回答要准确、详细，并包含最佳实践。'
    },
    {
      name: '翻译助手',
      prompt: '你是一个专业的翻译助手。请将用户输入的文本进行准确翻译，并提供自然流畅的表达。如果需要，请提供多种翻译选项。'
    },
    {
      name: '写作助手',
      prompt: '你是一个专业的写作助手。请帮助用户改进文本、提供写作建议，或协助创作内容。注重语言的准确性和表达的清晰度。'
    },
    {
      name: '任务助手',
      prompt: '你是一个任务管理助手，能够帮助用户创建、管理和跟踪任务。你可以将复杂的工作分解为具体的步骤，并跟踪执行进度。'
    }
  ]

  // 初始化加载配置
  useEffect(() => {
    loadAgentConfig()
    loadTasks(1)
  }, [])

  // 加载 Agent 配置
  const loadAgentConfig = async () => {
    setIsLoadingConfig(true)
    try {
      const response = await getAgentConfig()
      if (response.data && response.data.status === 'SUCCESS' && response.data.data) {
        setAgentConfig(response.data.data)
        setTempSystemPrompt(response.data.data.systemPrompt || '')
      } else {
        console.error('加载配置失败:', response.data?.message)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    } finally {
      setIsLoadingConfig(false)
    }
  }

  // 更新系统提示词
  const updateSystemPrompt = async (prompt: string) => {
    try {
      const response = await updateAgentConfig({
        body: {
          systemPrompt: prompt
        }
      })
      
      if (response.data && response.data.status === 'SUCCESS') {
        setAgentConfig(response.data.data)
        setTempSystemPrompt(prompt)
        console.log('系统提示词更新成功')
      } else {
        alert('更新失败: ' + (response.data?.message || '未知错误'))
      }
    } catch (error) {
      console.error('更新系统提示词失败:', error)
      alert('更新失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        processInput()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [userInput, isProcessing])

  // 加载任务列表
  const loadTasks = async (page: number = 1) => {
    setIsLoadingTasks(true)
    try {
      const response = await listTasks({
        body: {
          page,
          pageSize
        }
      })
      
      if (response.data && response.data.status === 'SUCCESS') {
        setTasks(response.data.data.list)
        setTotalTasks(response.data.data.total)
        setCurrentPage(page)
      } else {
        console.error('加载任务失败:', response.data?.message)
      }
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      setIsLoadingTasks(false)
    }
  }

  // 刷新任务列表
  const refreshTasks = () => {
    loadTasks(currentPage)
  }

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return
    
    try {
      const response = await deleteTask({
        body: { id: taskId }
      })
      
      if (response.data && response.data.status === 'SUCCESS') {
        await loadTasks(currentPage)
        if (selectedTaskId === taskId) {
          setSelectedTaskId(null)
        }
      } else {
        alert('删除失败: ' + (response.data?.message || '未知错误'))
      }
    } catch (error) {
      console.error('删除任务失败:', error)
      alert('删除失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 更新步骤状态
  const handleUpdateStepStatus = async (taskId: string, stepId: string, status: StepStatus) => {
    try {
      const response = await updateStepStatus({
        body: {
          taskId,
          stepId,
          status
        }
      })
      
      if (response.data && response.data.status === 'SUCCESS') {
        await loadTasks(currentPage)
      } else {
        alert('更新状态失败: ' + (response.data?.message || '未知错误'))
      }
    } catch (error) {
      console.error('更新步骤状态失败:', error)
      alert('更新状态失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 初始化加载任务
  useEffect(() => {
    loadTasks(1)
  }, [])

  // 处理AI响应的函数
  const processInput = async () => {
    if (!userInput.trim()) {
      alert('请输入测试内容')
      return
    }

    setIsProcessing(true)
    const startTime = Date.now()
    
    // 创建新的处理记录
    const newResult: ProcessResult = {
      timestamp: new Date().toLocaleTimeString(),
      userInput: userInput,
      response: '',
      status: 'processing'
    }
    
    setResults(prev => [newResult, ...prev])
    
    try {
      // 构建消息数组
      const messages = [
        {
          role: 'user' as const,
          content: userInput
        }
      ]

      // 非流式处理
      const response = await chat({
        body: { messages }
      })
      
      const duration = Date.now() - startTime
      
      // 检查响应状态
      if (response.data && response.data.status === 'SUCCESS') {
        // 更新结果
        setResults(prev => prev.map((result, index) => 
          index === 0 ? { 
            ...result, 
            response: response.data!.data.content, 
            status: 'success',
            duration: duration
          } : result
        ))
      } else {
        throw new Error(response.data?.message || '未知错误')
      }
      
      // 清空用户输入
      setUserInput('')
      
    } catch (error) {
      console.error('Chat API error:', error)
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      
      // 处理错误
      setResults(prev => prev.map((result, index) => 
        index === 0 ? { 
          ...result, 
          response: '处理失败', 
          status: 'error',
          duration: duration,
          error: errorMessage
        } : result
      ))
    } finally {
      setIsProcessing(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  const exportResults = () => {
    const data = {
      exportTime: new Date().toISOString(),
      agentConfig: agentConfig,
      results: results
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-results-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 flex flex-col">
      {/* 标题栏 */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Agent 调试面板</h1>
            <p className="text-gray-600 text-sm">测试 AI Agent 的提示词和响应效果</p>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* 左侧：输入区域 */}
                    {/* 左侧：输入区域 */}
          <div className="space-y-6">
            {/* Agent 提示词输入 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  系统提示词
                  {isLoadingConfig && (
                    <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </h2>
                {/* 预设提示词按钮 */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {presetPrompts.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => setTempSystemPrompt(preset.prompt)}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-md transition-colors border border-blue-200"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={tempSystemPrompt}
                onChange={(e) => setTempSystemPrompt(e.target.value)}
                placeholder="输入系统提示词，定义AI助手的角色和行为..."
                className="w-full h-48 p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <div className="mt-2 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  字符数: {tempSystemPrompt.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSystemPrompt(tempSystemPrompt)}
                    disabled={isLoadingConfig || tempSystemPrompt === (agentConfig?.systemPrompt || '')}
                    className={cn(
                      "px-3 py-1 text-xs rounded-md transition-colors border",
                      isLoadingConfig || tempSystemPrompt === (agentConfig?.systemPrompt || '')
                        ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                    )}
                  >
                    {isLoadingConfig ? '更新中...' : '保存配置'}
                  </button>
                  <div className="text-xs text-blue-600">
                    ✓ 使用服务器配置
                  </div>
                </div>
              </div>
            </div>

            {/* 测试用户输入 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                测试用户输入
              </h2>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="输入要测试的用户问题或请求..."
                className="w-full h-24 p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              />
              <div className="mt-2 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  字符数: {userInput.length}
                </div>
                <div className="text-xs text-gray-400">
                  Ctrl+Enter 快速发送
                </div>
              </div>
            </div>

            {/* 开始处理按钮 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <button
                onClick={processInput}
                disabled={isProcessing || !userInput.trim()}
                className={cn(
                  "w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3",
                  isProcessing 
                    ? "bg-yellow-50 text-yellow-600 border border-yellow-200 cursor-not-allowed"
                    : !userInput.trim()
                    ? "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-blue-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {isProcessing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    处理中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    开始处理
                  </>
                )}
              </button>
              {/* 模式提示 */}
              <div className="mt-3 text-center">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  ⚡ 标准模式：完整响应
                </span>
              </div>
            </div>
          </div>

          {/* 中间：任务管理区域 */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                任务管理
                <span className="text-sm text-gray-500">({totalTasks})</span>
              </h2>
              <button
                onClick={refreshTasks}
                disabled={isLoadingTasks}
                className={cn(
                  "px-3 py-1 rounded-md text-sm transition-colors border",
                  isLoadingTasks
                    ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200"
                )}
              >
                {isLoadingTasks ? (
                  <>
                    <svg className="w-4 h-4 animate-spin inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    刷新中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    刷新
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-auto">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <p>暂无任务</p>
                  <p className="text-sm mt-1">当前没有任何任务</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 mb-1">{task.title}</h3>
                        <div className="text-xs text-gray-500">
                          {task.createdAt && new Date(task.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="删除任务"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {task.steps && task.steps.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700 mb-2">步骤进度:</div>
                        {task.steps.map((step) => (
                          <div key={step.id} className="flex items-center justify-between bg-white rounded p-2 border border-gray-200">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                step.status === 'completed' ? 'bg-green-500' :
                                step.status === 'failed' ? 'bg-red-500' :
                                step.status === 'cancelled' ? 'bg-gray-400' :
                                'bg-yellow-500'
                              )} />
                              <span className="text-sm text-gray-800">{step.title}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full",
                                step.status === 'completed' ? 'bg-green-100 text-green-700' :
                                step.status === 'failed' ? 'bg-red-100 text-red-700' :
                                step.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                                'bg-yellow-100 text-yellow-700'
                              )}>
                                {step.status === 'completed' ? '已完成' :
                                 step.status === 'failed' ? '失败' :
                                 step.status === 'cancelled' ? '已取消' : '处理中'}
                              </span>
                              {step.status === 'processing' && (
                                <button
                                  onClick={() => handleUpdateStepStatus(task.id, step.id, 'completed')}
                                  className="ml-1 text-xs px-2 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded transition-colors border border-green-200"
                                  title="标记为完成"
                                >
                                  完成
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* 分页 */}
            {totalTasks > pageSize && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div>
                  显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalTasks)} 条，共 {totalTasks} 条
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadTasks(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoadingTasks}
                    className={cn(
                      "px-3 py-1 rounded border transition-colors",
                      currentPage <= 1 || isLoadingTasks
                        ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                    )}
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => loadTasks(currentPage + 1)}
                    disabled={currentPage * pageSize >= totalTasks || isLoadingTasks}
                    className={cn(
                      "px-3 py-1 rounded border transition-colors",
                      currentPage * pageSize >= totalTasks || isLoadingTasks
                        ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                    )}
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：结果显示区域 */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                处理结果
              </h2>
              {results.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={exportResults}
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm rounded-md transition-colors border border-blue-200"
                  >
                    导出
                  </button>
                  <button
                    onClick={clearResults}
                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-md transition-colors border border-red-200"
                  >
                    清空
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 max-h-[600px] overflow-auto">
              {results.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p>暂无测试结果</p>
                  <p className="text-sm mt-1">输入内容并点击“开始处理”来查看结果</p>
                </div>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                        {result.duration && (
                          <span className="text-xs text-gray-400">
                            • {result.duration}ms
                          </span>
                        )}
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        result.status === 'success' ? 'bg-green-100 text-green-700 border border-green-200' :
                        result.status === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      )}>
                        {result.status === 'success' ? '成功' :
                         result.status === 'error' ? '失败' : '处理中...'}
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-gray-700 font-medium mb-1">用户输入:</div>
                        <div className="text-gray-800 bg-white p-2 rounded border border-gray-200">
                          {result.userInput}
                        </div>
                      </div>
                      
                      {result.response && (
                        <div>
                          <div className="text-gray-700 font-medium mb-1">
                            AI 响应:
                          </div>
                          <div className={cn(
                            "p-3 rounded border whitespace-pre-wrap",
                            result.status === 'success' ? 'text-green-800 bg-green-50 border-green-200' :
                            result.status === 'error' ? 'text-red-800 bg-red-50 border-red-200' :
                            'text-gray-800 bg-white border-gray-200'
                          )}>
                            {result.response}
                          </div>
                        </div>
                      )}

                      {result.status === 'error' && result.error && (
                        <div>
                          <div className="text-red-700 font-medium mb-1">错误详情:</div>
                          <div className="text-red-800 bg-red-50 p-2 rounded border border-red-200 text-xs font-mono">
                            {result.error}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugPage
