import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useASR } from '../../../hooks/useASR'
import { chat } from '../../../apis/sdk.gen.js'

interface InputPanelProps {
  // 完全自管理，不需要外部props
}

function InputPanel({}: InputPanelProps) {
  const [textInput, setTextInput] = useState('')
  const [inputHistory, setInputHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [chatResponse, setChatResponse] = useState<string>('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 处理用户输入的主逻辑
  const handleSubmit = async (input: string, type: 'voice' | 'text') => {
    setIsProcessing(true)

    try {
      console.log(`Processing ${type} input:`, input)

      // 直接发送单条消息，不保留历史
      const messages = [
        { role: 'user' as const, content: input }
      ]

      // 与AI对话
      const chatResult = await chat({
        body: { messages }
      })

      if (chatResult.error) {
        throw new Error(chatResult.error.message || 'Chat failed')
      }

      // 保存AI响应内容
      if (chatResult.data?.data?.content) {
        const aiContent = chatResult.data.data.content
        setChatResponse(aiContent)
        console.log('AI Response:', aiContent)
      }

    } catch (error) {
      console.error('Processing error:', error)
      // 显示错误信息给用户
      const errorMsg = `处理失败: ${error instanceof Error ? error.message : '未知错误'}`
      setChatResponse(errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // ASR Hook - 更新为新的接口
  const {
    isListening: isRecording,
    isConnected: asrConnected,
    currentText: asrText,
    error: asrError,
    startListening,
    stopListening
  } = useASR((finalText: string) => {
    console.log('[InputPanel] ASR final result:', finalText)
    console.log('[InputPanel] Submitting final result:', finalText)
    handleSubmit(finalText, 'voice')
    addToHistory(finalText)
    setTextInput('') // 提交后清空输入框
  })

  // 同步中间结果到输入框
  useEffect(() => {
    if (asrText) {
      setTextInput(asrText)
    }
  }, [asrText])

  // 监听 ASR 错误
  useEffect(() => {
    if (asrError) {
      console.error('[InputPanel] ASR Error details:', {
        message: asrError,
        isRecording,
        asrConnected
      })
    }
  }, [asrError, isRecording, asrConnected])

  // 常用指令建议
  const suggestions = [
    "整理桌面文件",
    "清理垃圾文件", 
    "截屏并保存",
    "查看系统信息",
    "打开文件管理器",
    "查看网络状态"
  ]

  // 使用 useCallback 包装 handleVoiceInput
  const handleVoiceInput = useCallback(async () => {
    if (isProcessing) {
      console.warn('[InputPanel] Cannot start voice input: already processing')
      return
    }
    
    console.log('[InputPanel] Voice input triggered, ASR status:', {
      isRecording,
      asrConnected,
      asrError
    })
    
    try {
      // 如果要开始录音，先清空输入框
      if (!isRecording) {
        setTextInput('')
        console.log('[InputPanel] Starting new voice recording')
        await startListening()
      } else {
        console.log('[InputPanel] Stopping current voice recording')
        stopListening()
      }
    } catch (error) {
      console.error('[InputPanel] Failed to toggle voice input:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        isRecording,
        asrConnected,
        error
      })
    }
  }, [isProcessing, isRecording, startListening, stopListening, asrConnected])

  useEffect(() => {
    // 监听语音唤醒事件
    const handleVoiceWakeup = (data: { timestamp: number; action: string }) => {
      console.log('[InputPanel] Voice wakeup detected:', data)
      if (data.action === 'start-voice-input') {
        handleVoiceInput()
      }
    }

    // 监听快捷键语音激活事件
    const handleVoiceActivation = () => {
      console.log('[InputPanel] Voice activation triggered by shortcut')
      handleVoiceInput()
    }

    // 注册事件监听器
    window.electronAPI?.onVoiceWakeup?.(handleVoiceWakeup)
    window.electronAPI?.onVoiceActivation?.(handleVoiceActivation)

    return () => {
      window.electronAPI?.removeVoiceWakeupListener?.()
      window.electronAPI?.removeVoiceActivationListener?.()
    }
  }, [handleVoiceInput]) // 添加 handleVoiceInput 依赖

  const addToHistory = (input: string) => {
    setInputHistory(prev => {
      const newHistory = [input, ...prev.filter(item => item !== input)].slice(0, 10)
      return newHistory
    })
  }

  const handleTextSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && textInput.trim() && !isProcessing) {
      e.preventDefault()
      const submittedText = textInput.trim()
      handleSubmit(submittedText, 'text')
      addToHistory(submittedText)
      setTextInput('')
      setHistoryIndex(-1)
      setShowSuggestions(false)
    } else if (e.key === 'ArrowUp' && inputHistory.length > 0 && e.ctrlKey) {
      e.preventDefault()
      const newIndex = Math.min(historyIndex + 1, inputHistory.length - 1)
      setHistoryIndex(newIndex)
      setTextInput(inputHistory[newIndex] || '')
    } else if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setTextInput(inputHistory[newIndex] || '')
      } else {
        setHistoryIndex(-1)
        setTextInput('')
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleTextButtonSubmit = () => {
    if (textInput.trim() && !isProcessing) {
      const submittedText = textInput.trim()
      handleSubmit(submittedText, 'text')
      addToHistory(submittedText)
      setTextInput('')
      setHistoryIndex(-1)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setTextInput(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    if (!textInput && suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // 使用 setTimeout 延迟隐藏，以便用户点击建议项时能够触发 onClick 事件
    setTimeout(() => {
      setShowSuggestions(false)
    }, 150)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value)
    setHistoryIndex(-1)
    setShowSuggestions(false)
  }

  return (
    <div className="space-y-6">
      {/* 智能助手状态区域 */}
      <div className="text-center space-y-4">
        {/* AI 头像区域 - 重新设计为更现代化 */}
        <div className="flex justify-center">
          <div className="relative">
            <div className={`
              w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700 relative overflow-hidden
              ${isRecording
                ? "bg-linear-to-br from-mint-400 via-mint-500 to-mint-600 scale-110 shadow-2xl shadow-mint-400/50"
                : isProcessing
                ? "bg-linear-to-br from-mint-300 via-mint-400 to-mint-500 shadow-xl shadow-mint-300/40"
                : "bg-linear-to-br from-mint-200 via-mint-300 to-mint-400 hover:scale-105 shadow-lg shadow-mint-200/30"
              }
            `}>
              {/* 动态背景光效 */}
              <div className={`
                absolute inset-0 rounded-full opacity-30
                ${isRecording 
                  ? 'bg-linear-to-r from-white/40 via-transparent to-white/40 animate-spin'
                  : ''
                }
              `}></div>
              
              {/* AI表情 */}
              <div className="text-white text-4xl relative z-10 transition-all duration-300">
                {isRecording ? '🎙️' : (isProcessing ? '🤔' : '🤖')}
              </div>
              
              {/* 语音波纹效果 */}
              {isRecording && (
                <div className="absolute inset-0 rounded-full">
                  <div className="absolute inset-0 rounded-full bg-mint-400/20 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full bg-mint-400/30 animate-ping animation-delay-500"></div>
                  <div className="absolute inset-4 rounded-full bg-mint-400/40 animate-ping animation-delay-1000"></div>
                </div>
              )}

              {/* 处理中脉冲效果 */}
              {isProcessing && !isRecording && (
                <div className="absolute inset-1 rounded-full border-3 border-white/40 border-t-white/80 animate-spin"></div>
              )}
            </div>
            
            {/* 状态指示器 */}
            <div className="absolute -bottom-1 -right-1">
              <div className={`
                w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs
                ${isRecording ? 'bg-red-500 animate-pulse' :
                  isProcessing ? 'bg-yellow-500' :
                  asrConnected ? 'bg-green-500' :
                  asrError ? 'bg-red-400' : 'bg-gray-400'}
              `}>
                {isRecording ? '🔴' : isProcessing ? '⚡' : asrConnected ? '👂' : asrError ? '❌' : '💤'}
              </div>
            </div>
          </div>
        </div>

        {/* 状态文字提示 */}
        <div className="min-h-6">
          {isRecording && (
            <div className="text-mint-600 text-sm font-medium animate-pulse">
              🎤 正在聆听您的指令...
            </div>
          )}

          {isProcessing && !isRecording && (
            <div className="text-mint-600 text-sm font-medium flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-mint-400 border-t-transparent rounded-full animate-spin"></div>
              AI正在思考并执行...
            </div>
          )}
          {asrError && (
            <div className="text-red-500 text-sm font-medium">
              ❌ 语音识别错误: {asrError}
            </div>
          )}
          {asrConnected && !isRecording && !isProcessing && !asrError && (
            <div className="text-mint-600 text-sm font-medium">
              👂 语音识别已连接，点击麦克风开始说话
            </div>
          )}
          {!asrConnected && !isRecording && !isProcessing && !asrError && (
            <div className="text-gray-200 text-sm font-medium">
              💬 输入指令或点击语音按钮开始对话
            </div>
          )}
        </div>
      </div>

      {/* 思考状态显示 */}
      {isProcessing && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-mint-200/50 shadow-lg p-5 animate-fade-in">
          <div className="flex items-center justify-center gap-3">
            <div className="text-mint-700 text-sm font-bold">🤖 AI 助手</div>
            <div className="px-3 py-1 bg-mint-100 text-mint-700 text-xs font-medium rounded-full flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-mint-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-mint-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1 h-1 bg-mint-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span>思考中</span>
            </div>
          </div>
        </div>
      )}

      {/* AI响应显示区域 - 简化布局 */}
      {chatResponse && !isProcessing && (
        <div className="animate-fade-in">
          <div className="relative bg-linear-to-br from-mint-50 via-white to-mint-100 border border-mint-200/60 rounded-2xl shadow-lg max-h-48 overflow-hidden">
            {/* 装饰性边框光效 */}
            <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-transparent via-mint-300/20 to-transparent"></div>
            
            <div className="relative p-4 max-h-48 overflow-y-auto custom-scrollbar">
              {/* 简化的头部 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="text-mint-700 text-sm font-bold">🤖 AI 助手</div>
                <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  在线
                </div>
              </div>
              
              {/* 响应内容 */}
              <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                {chatResponse}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 输入区域 - 只在非处理状态显示 */}
      {!isProcessing && (
        <div className="space-y-4">
          {/* 主输入框 */}
          <div className="relative">
            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-mint-200/50 shadow-lg hover:shadow-xl hover:border-mint-300/60 transition-all duration-300 focus-within:border-mint-400 focus-within:shadow-xl">
              {/* 主输入区域 */}
              <div className="p-4 pb-2">
                {/* 输入框容器 */}
                <div className="relative">
                  {/* 输入框 */}
                  <textarea
                    ref={inputRef}
                    value={textInput}
                    onChange={handleInputChange}
                    onKeyDown={handleTextSubmit}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="告诉我您想要做什么..."
                    disabled={isProcessing}
                    rows={3}
                    className="w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base font-medium resize-none"
                  />
                </div>
              </div>

              {/* 底部功能栏 */}
              <div className="px-4 pb-3 flex items-center justify-between">
                {/* 左侧快捷键提示和功能按钮 */}
                <div className="flex items-center gap-3">
                  {/* 快捷键提示 */}
                  <div className="text-xs text-gray-400">
                    {!textInput ? "Ctrl+↑↓ 历史 · Enter发送 · Shift+Enter换行" : ""}
                  </div>
                  
                  {/* 功能按钮组 - 小型化 */}
                  <div className="flex items-center gap-2">
                    {/* 语音输入按钮 */}
                    <button
                      onClick={handleVoiceInput}
                      disabled={isProcessing}
                      title={`语音输入 ${asrConnected ? '(已连接)' : '(未连接)'}`}
                      className={`
                        group relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 no-drag-region
                        ${isRecording
                          ? "bg-red-500 hover:bg-red-600 text-white shadow-md"
                          : asrConnected
                          ? "bg-green-100 hover:bg-green-200 text-green-600"
                          : "bg-mint-100 hover:bg-mint-200 text-mint-600"
                        }
                        ${isProcessing ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
                      `}
                    >
                      <span className="text-sm transition-transform duration-200 group-hover:scale-110">
                        {isRecording ? '⏹' : '🎤'}
                      </span>
                      
                      {/* 语音按钮光环效果 */}
                      {isRecording && (
                        <div className="absolute inset-0 rounded-lg bg-red-400/30 animate-ping"></div>
                      )}
                      
                      {/* 连接状态指示 */}
                      {asrConnected && !isRecording && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                      )}
                    </button>

                    {/* 建议按钮 */}
                    <button
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      disabled={isProcessing}
                      title="常用建议"
                      className={`
                        group w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 no-drag-region hover:scale-105 disabled:opacity-50
                        ${showSuggestions ? "bg-blue-500 text-white" : "bg-mint-100 hover:bg-mint-200 text-mint-600"}
                      `}
                    >
                      <span className="text-sm transition-transform duration-200 group-hover:scale-110">
                        💡
                      </span>
                    </button>
                  </div>
                </div>
                
                {/* 右侧发送按钮 */}
                {textInput.trim() && (
                  <button
                    onClick={handleTextButtonSubmit}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-mint-500 hover:bg-mint-600 disabled:bg-mint-300 text-white text-sm font-semibold rounded-lg transition-all duration-200 no-drag-region shadow-md hover:shadow-lg hover:scale-105 flex items-center gap-2"
                  >
                    <span>发送</span>
                    <span className="text-sm">↗</span>
                  </button>
                )}
              </div>
            </div>

            {/* 建议列表 */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-xl border border-mint-200/50 shadow-xl z-50 animate-fade-in">
                <div className="p-3">
                  <div className="text-xs text-gray-500 mb-2 font-medium">💡 常用指令</div>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onMouseDown={(e) => {
                          e.preventDefault() // 防止输入框失去焦点
                          handleSuggestionClick(suggestion)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-mint-50 hover:text-mint-700 rounded-lg transition-colors duration-150"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default InputPanel
