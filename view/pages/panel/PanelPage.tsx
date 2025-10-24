import React, { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface PanelPageProps {}

function PanelPage({}: PanelPageProps) {
  const [isVoiceActivated, setIsVoiceActivated] = useState(false)
  const [isListening, setIsListening] = useState(false)

  useEffect(() => {
    // 监听语音激活事件
    const handleVoiceActivation = () => {
      setIsVoiceActivated(true)
      setTimeout(() => setIsVoiceActivated(false), 2000) // 2秒后重置状态
    }

    window.electronAPI?.onVoiceActivation?.(handleVoiceActivation)

    return () => {
      window.electronAPI?.removeVoiceActivationListener?.()
    }
  }, [])

  const handleVoiceInput = () => {
    setIsListening(!isListening)
    // 这里可以添加语音识别逻辑
  }

  const handleTextInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement
      if (target.value.trim()) {
        // 处理文本输入
        console.log('Text input:', target.value)
        target.value = ''
      }
    }
  }

  return (
    <div className="h-screen w-full bg-white/5 backdrop-blur-xl flex flex-col">
      {/* 头部区域 - 拖动区域 */}
      <div className="drag-region h-8 flex items-center justify-center shrink-0">
        <div className="text-white/60 text-xs font-medium">Voice Assistant</div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 p-4 flex flex-col">
        {/* NAME 头像区域 */}
        <div className="flex justify-center mb-6">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
            isVoiceActivated
              ? "bg-blue-500/80 scale-110 shadow-lg shadow-blue-500/50"
              : "bg-white/10 hover:bg-white/15"
          )}>
            <div className="text-white text-2xl">🎙️</div>
          </div>
        </div>

        {/* 语音激活状态提示 */}
        {isVoiceActivated && (
          <div className="text-center mb-4">
            <div className="text-white/80 text-sm animate-pulse">在呢</div>
          </div>
        )}

        {/* 输入区域 */}
        <div className="mt-auto">
          <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <input
              type="text"
              placeholder="输入指令或点击语音按钮..."
              className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-sm"
              onKeyDown={handleTextInput}
            />
            <button
              onClick={handleVoiceInput}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 no-drag-region",
                isListening
                  ? "bg-red-500/80 animate-pulse"
                  : "bg-white/20 hover:bg-white/30"
              )}
            >
              <div className="text-white text-sm">
                {isListening ? '⏹️' : '🎤'}
              </div>
            </button>
          </div>
        </div>

        {/* 任务分解面板 */}
        <div className="mt-4 h-32 bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="text-white/60 text-xs mb-2">任务分解面板</div>
          <div className="text-white/40 text-xs">等待任务...</div>
        </div>

        {/* 快捷操作 */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => window.electronAPI?.navigateToSettings?.()}
            className="flex-1 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white/70 text-xs transition-colors no-drag-region"
          >
            设置
          </button>
          <button
            onClick={() => window.electronAPI?.hideWindow?.()}
            className="flex-1 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white/70 text-xs transition-colors no-drag-region"
          >
            隐藏
          </button>
        </div>
      </div>
    </div>
  )
}

export default PanelPage
