import React, { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { chat } from '../../apis'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface DebugPageProps {}

interface ProcessResult {
  timestamp: string
  agentPrompt: string
  userInput: string
  response: string
  status: 'success' | 'error' | 'processing'
  duration?: number
  error?: string
}

function DebugPage({}: DebugPageProps) {
  const [userInput, setUserInput] = useState('')
  const [agentPrompt, setAgentPrompt] = useState('你是一个智能助手，负责回答用户的问题。请根据用户输入提供准确、有帮助的回答。')
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<ProcessResult[]>([])

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
    }
  ]

  // 从本地存储加载提示词
  useEffect(() => {
    const savedPrompt = localStorage.getItem('debugAgentPrompt')
    if (savedPrompt) {
      setAgentPrompt(savedPrompt)
    }
  }, [])

  // 提示词变化时自动保存
  useEffect(() => {
    localStorage.setItem('debugAgentPrompt', agentPrompt)
  }, [agentPrompt])

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
  }, [userInput, agentPrompt, isProcessing])

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
      agentPrompt: agentPrompt,
      userInput: userInput,
      response: '',
      status: 'processing'
    }
    
    setResults(prev => [newResult, ...prev])
    
    try {
      // 构建消息数组
      const messages = [
        {
          role: 'system' as const,
          content: agentPrompt
        },
        {
          role: 'user' as const,
          content: userInput
        }
      ]

      // 调用真实的 chat API
      const response = await chat({
        body: {
          messages: messages
        }
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
        
        // 清空用户输入
        setUserInput('')
      } else {
        throw new Error(response.data?.message || '未知错误')
      }
      
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
      agentPrompt: agentPrompt,
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
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* 左侧：输入区域 */}
                    {/* 左侧：输入区域 */}
          <div className="space-y-6">
            {/* Agent 提示词输入 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Agent 提示词
                </h2>
                {/* 预设提示词按钮 */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {presetPrompts.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => setAgentPrompt(preset.prompt)}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-md transition-colors border border-blue-200"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder="输入 Agent 的系统提示词，定义AI助手的角色和行为..."
                className="w-full h-48 p-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              <div className="mt-2 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  字符数: {agentPrompt.length}
                </div>
                <div className="text-xs text-green-600">
                  ✓ 自动保存
                </div>
              </div>
            </div>

            {/* 测试用户输入 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
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
            </div>
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
                      <div className="flex items-center gap-2">
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
                          <div className="text-gray-700 font-medium mb-1">AI 响应:</div>
                          <div className={cn(
                            "p-3 rounded border",
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
