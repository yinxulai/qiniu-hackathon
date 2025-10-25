import React, { useState, useEffect, useRef } from 'react'

interface InputPanelProps {
  onSubmit: (input: string, type: 'voice' | 'text') => void
  isProcessing: boolean
  aiResponse?: string
}

function InputPanel({ onSubmit, isProcessing, aiResponse }: InputPanelProps) {
  const [isVoiceActivated, setIsVoiceActivated] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [inputHistory, setInputHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 常用指令建议
  const suggestions = [
    "整理桌面文件",
    "清理垃圾文件", 
    "截屏并保存",
    "查看系统信息",
    "打开文件管理器",
    "查看网络状态"
  ]

  useEffect(() => {
    // 监听语音激活事件
    const handleVoiceActivation = () => {
      setIsVoiceActivated(true)
      setTimeout(() => setIsVoiceActivated(false), 2000)
    }

    window.electronAPI?.onVoiceActivation?.(handleVoiceActivation)

    return () => {
      window.electronAPI?.removeVoiceActivationListener?.()
    }
  }, [])

  const handleVoiceInput = () => {
    if (isProcessing) return
    
    setIsListening(!isListening)
    if (!isListening) {
      // 模拟语音识别
      setTimeout(() => {
        const mockVoiceInput = "请帮我整理桌面文件"
        onSubmit(mockVoiceInput, 'voice')
        setIsListening(false)
        addToHistory(mockVoiceInput)
      }, 2000)
    }
  }

  const addToHistory = (input: string) => {
    setInputHistory(prev => {
      const newHistory = [input, ...prev.filter(item => item !== input)].slice(0, 10)
      return newHistory
    })
  }

  const handleTextSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && textInput.trim() && !isProcessing) {
      onSubmit(textInput.trim(), 'text')
      addToHistory(textInput.trim())
      setTextInput('')
      setHistoryIndex(-1)
      setShowSuggestions(false)
    } else if (e.key === 'ArrowUp' && inputHistory.length > 0) {
      e.preventDefault()
      const newIndex = Math.min(historyIndex + 1, inputHistory.length - 1)
      setHistoryIndex(newIndex)
      setTextInput(inputHistory[newIndex] || '')
    } else if (e.key === 'ArrowDown') {
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
      onSubmit(textInput.trim(), 'text')
      addToHistory(textInput.trim())
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
              ${isVoiceActivated || isListening
                ? "bg-linear-to-br from-mint-400 via-mint-500 to-mint-600 scale-110 shadow-2xl shadow-mint-400/50"
                : isProcessing
                ? "bg-linear-to-br from-mint-300 via-mint-400 to-mint-500 shadow-xl shadow-mint-300/40"
                : "bg-linear-to-br from-mint-200 via-mint-300 to-mint-400 hover:scale-105 shadow-lg shadow-mint-200/30"
              }
            `}>
              {/* 动态背景光效 */}
              <div className={`
                absolute inset-0 rounded-full opacity-30
                ${(isVoiceActivated || isListening) 
                  ? 'bg-linear-to-r from-white/40 via-transparent to-white/40 animate-spin' 
                  : ''
                }
              `}></div>
              
              {/* AI表情 */}
              <div className="text-white text-4xl relative z-10 transition-all duration-300">
                {isListening ? '🎙️' : (isProcessing ? '�' : '🤖')}
              </div>
              
              {/* 语音波纹效果 */}
              {isListening && (
                <div className="absolute inset-0 rounded-full">
                  <div className="absolute inset-0 rounded-full bg-mint-400/20 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full bg-mint-400/30 animate-ping animation-delay-500"></div>
                  <div className="absolute inset-4 rounded-full bg-mint-400/40 animate-ping animation-delay-1000"></div>
                </div>
              )}

              {/* 处理中脉冲效果 */}
              {isProcessing && !isListening && (
                <div className="absolute inset-1 rounded-full border-3 border-white/40 border-t-white/80 animate-spin"></div>
              )}
            </div>
            
            {/* 状态指示器 */}
            <div className="absolute -bottom-1 -right-1">
              <div className={`
                w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs
                ${isListening ? 'bg-red-500 animate-pulse' : 
                  isProcessing ? 'bg-yellow-500' :
                  isVoiceActivated ? 'bg-green-500' : 'bg-gray-400'}
              `}>
                {isListening ? '🔴' : isProcessing ? '⚡' : isVoiceActivated ? '👂' : '💤'}
              </div>
            </div>
          </div>
        </div>

        {/* 状态文字提示 */}
        <div className="min-h-6">
          {isListening && (
            <div className="text-mint-600 text-sm font-medium animate-pulse">
              🎤 正在聆听您的指令...
            </div>
          )}
          {isProcessing && !isListening && (
            <div className="text-mint-600 text-sm font-medium flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-mint-400 border-t-transparent rounded-full animate-spin"></div>
              AI正在思考并执行...
            </div>
          )}
          {isVoiceActivated && !isListening && !isProcessing && (
            <div className="text-mint-600 text-sm font-medium">
              👋 我在这里，请说出您的需求
            </div>
          )}
          {!isVoiceActivated && !isListening && !isProcessing && (
            <div className="text-gray-500 text-sm">
              💬 输入指令或点击语音按钮开始对话
            </div>
          )}
        </div>
      </div>

      {/* AI响应显示区域 - 优化样式 */}
      {aiResponse && (
        <div className="animate-fade-in">
          <div className="relative p-5 bg-linear-to-br from-mint-50 via-white to-mint-100 border border-mint-200/60 rounded-2xl shadow-lg">
            {/* 装饰性边框光效 */}
            <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-transparent via-mint-300/20 to-transparent"></div>
            
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 bg-linear-to-br from-mint-500 to-mint-600 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                <span className="text-white text-lg">🤖</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-mint-700 text-base font-bold">AI 助手</div>
                  <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    在线
                  </div>
                </div>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                  {aiResponse}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 输入区域 - 全面改进 */}
      <div className="space-y-4">
        {/* 主输入框 */}
        <div className="relative">
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-mint-200/50 shadow-lg hover:shadow-xl hover:border-mint-300/60 transition-all duration-300 focus-within:border-mint-400 focus-within:shadow-xl">
            <div className="flex items-center gap-4 p-4">
              {/* 输入图标 */}
              <div className="w-8 h-8 bg-mint-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-mint-600 text-sm">💭</span>
              </div>
              
              {/* 输入框 */}
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={handleInputChange}
                onKeyDown={handleTextSubmit}
                onFocus={handleInputFocus}
                placeholder="告诉我您想要做什么..."
                disabled={isProcessing}
                className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base font-medium"
              />
              
              {/* 快捷键提示 */}
              {!textInput && (
                <div className="text-xs text-gray-400 shrink-0">
                  ↑↓ 历史 · ⌘K 建议
                </div>
              )}
              
              {/* 发送按钮 */}
              {textInput.trim() && (
                <button
                  onClick={handleTextButtonSubmit}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-mint-500 hover:bg-mint-600 disabled:bg-mint-300 text-white text-sm font-semibold rounded-xl transition-all duration-200 no-drag-region shadow-md hover:shadow-lg hover:scale-105"
                >
                  发送 ↗
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
                      onClick={() => handleSuggestionClick(suggestion)}
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

        {/* 功能按钮组 */}
        <div className="flex items-center justify-center gap-3">
          {/* 语音输入按钮 */}
          <button
            onClick={handleVoiceInput}
            disabled={isProcessing}
            className={`
              group relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 no-drag-region shadow-lg hover:shadow-xl
              ${isListening
                ? "bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/40"
                : "bg-linear-to-br from-mint-500 to-mint-600 hover:from-mint-600 hover:to-mint-700 shadow-mint-500/40"
              }
              ${isProcessing ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}
            `}
          >
            <div className="text-white text-xl transition-transform duration-200 group-hover:scale-110">
              {isListening ? '⏹️' : '🎤'}
            </div>
            
            {/* 语音按钮光环效果 */}
            {isListening && (
              <div className="absolute inset-0 rounded-2xl bg-red-400/30 animate-ping"></div>
            )}
          </button>

          {/* 建议按钮 */}
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            disabled={isProcessing}
            className="group w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl flex items-center justify-center transition-all duration-300 no-drag-region shadow-lg hover:shadow-xl hover:scale-110 disabled:opacity-50"
          >
            <div className="text-white text-xl transition-transform duration-200 group-hover:scale-110">
              💡
            </div>
          </button>

          {/* 历史记录按钮 */}
          {inputHistory.length > 0 && (
            <button
              onClick={() => {/* 显示历史记录 */}}
              disabled={isProcessing}
              className="group w-14 h-14 bg-linear-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-2xl flex items-center justify-center transition-all duration-300 no-drag-region shadow-lg hover:shadow-xl hover:scale-110 disabled:opacity-50"
            >
              <div className="text-white text-xl transition-transform duration-200 group-hover:scale-110">
                📚
              </div>
            </button>
          )}
        </div>

        {/* 使用提示 */}
        <div className="text-center">
          <div className="text-xs text-gray-400 space-x-4">
            <span>🎤 按住语音键说话</span>
            <span>💡 点击获取建议</span>
            <span>⌨️ 按Enter发送</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InputPanel
