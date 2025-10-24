import React, { useState, useRef, useEffect } from 'react'
import { Card, Button, Input } from '../../../components/ui'

interface VoiceInputModuleProps {
  onVoiceInput: (text: string) => void
  onTextInput: (text: string) => void
}

export default function VoiceInputModule({ onVoiceInput, onTextInput }: VoiceInputModuleProps) {
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 监听全局语音激活
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const handleVoiceActivation = () => {
        toggleRecording()
      }
      
      window.electronAPI.onVoiceActivation(handleVoiceActivation)
      
      return () => {
        window.electronAPI.removeVoiceActivationListener()
      }
    }
  }, [])

  const handleTextSubmit = () => {
    if (inputText.trim()) {
      onTextInput(inputText.trim())
      setInputText('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // 这里会集成实际的语音识别功能
    if (!isRecording) {
      setIsListening(true)
      // 模拟语音识别
      setTimeout(() => {
        setIsListening(false)
        setIsRecording(false)
        onVoiceInput('语音识别结果示例')
      }, 3000)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  return (
    <div className="space-y-3">
      {/* 输入区域 */}
      <div className="relative">
        <Card className="overflow-hidden rounded-xl p-0">
          <Input
            ref={textareaRef}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value)
              adjustTextareaHeight()
            }}
            onKeyPress={handleKeyPress}
            placeholder="输入您的指令，或点击麦克风使用语音..."
            style={{ height: '48px' }}
          />
          
          {/* 底部工具栏 */}
          <div className="flex items-center justify-between px-4 py-2">
            {/* 语音按钮 */}
            <Button
              size="sm"
              onClick={toggleRecording}
              variant={isRecording ? 'danger' : 'default'}
              icon={
                isListening ? (
                  <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2z"/>
                    <path d="m19 10-1.5-1.5c-.8.8-1.7 1.1-2.7 1.1s-1.9-.3-2.7-1.1L10.6 10c1.2 1.2 2.7 1.8 4.2 1.8s3-.6 4.2-1.8z"/>
                    <path d="M17.3 11c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2z"/>
                    <path d="M17.3 11c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
                  </svg>
                )
              }
            >
            </Button>

            {/* 发送按钮 */}
            <Button
              size="sm"
              onClick={handleTextSubmit}
              disabled={!inputText.trim()}
              variant="primary"
              icon={
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              }
            >
            </Button>
          </div>
        </Card>

        {/* 录音状态指示 */}
        {isListening && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white px-3 py-1 rounded-full text-xs animate-pulse">
            正在录音...
          </div>
        )}
      </div>

      {/* 快捷建议 */}
      <div className="flex flex-wrap gap-2">
        {['整理桌面', '系统优化', '文件搜索'].map((suggestion) => (
          <Button
            key={suggestion}
            onClick={() => setInputText(suggestion)}
            variant="pill"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}
