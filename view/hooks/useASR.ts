import { useState, useEffect, useRef, useCallback } from 'react'
import { ASRManager } from '../services/asr-manager'

interface UseASRReturn {
  isListening: boolean
  isConnected: boolean
  error: string | null
  currentText: string
  startListening: () => Promise<void>
  stopListening: () => void
  reloadConfig: () => Promise<void>
}

export const useASR = (onFinalText?: (text: string) => void): UseASRReturn => {
  const [isListening, setIsListening] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentText, setCurrentText] = useState('')
  
  const asrManagerRef = useRef<ASRManager | null>(null)
  const onFinalTextRef = useRef(onFinalText)
  
  useEffect(() => {
    onFinalTextRef.current = onFinalText
  }, [onFinalText])
  
  useEffect(() => {
    const manager = new ASRManager()
    asrManagerRef.current = manager
    
    const handleStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent
      const status = customEvent.detail
      setIsConnected(status === 'connected' || status === 'recording')
    }
    
    const handleRecordingChange = (event: Event) => {
      const customEvent = event as CustomEvent
      const isRecording = customEvent.detail
      setIsListening(isRecording)
    }
    
    const handleTextUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      const text = customEvent.detail
      setCurrentText(text)
    }
    
    const handleFinalResult = (event: Event) => {
      const customEvent = event as CustomEvent
      const text = customEvent.detail
      console.log('最终语音识别结果:', text)
      
      if (text && text.trim() && onFinalTextRef.current) {
        onFinalTextRef.current(text.trim())
      }
      
      setCurrentText('')
      
      // 处理完最终结果后，确保停止监听，等待下次主动唤醒
      setTimeout(() => {
        if (asrManagerRef.current && asrManagerRef.current.isRecording) {
          console.log('[useASR] Auto-stopping after final result processing')
          asrManagerRef.current.stopRecording()
        }
      }, 200)
    }
    
    const handleError = (event: Event) => {
      const customEvent = event as CustomEvent
      const errorInfo = customEvent.detail
      console.error('ASR 错误:', errorInfo)
      setError(errorInfo.message || '语音识别错误')
    }
    
    manager.addEventListener('statusChange', handleStatusChange)
    manager.addEventListener('recordingChange', handleRecordingChange)
    manager.addEventListener('textUpdate', handleTextUpdate)
    manager.addEventListener('finalResult', handleFinalResult)
    manager.addEventListener('error', handleError)
    
    return () => {
      manager.removeEventListener('statusChange', handleStatusChange)
      manager.removeEventListener('recordingChange', handleRecordingChange)
      manager.removeEventListener('textUpdate', handleTextUpdate)
      manager.removeEventListener('finalResult', handleFinalResult)
      manager.removeEventListener('error', handleError)
      manager.disconnect()
    }
  }, [])
  
  const startListening = useCallback(async () => {
    if (!asrManagerRef.current) return
    
    try {
      setError(null)
      
      if (!asrManagerRef.current.isConnected) {
        await asrManagerRef.current.connect()
      }
      
      await asrManagerRef.current.startRecording()
    } catch (err) {
      console.error('启动语音识别失败:', err)
      setError(err instanceof Error ? err.message : '启动语音识别失败')
    }
  }, [])
  
  const stopListening = useCallback(() => {
    if (!asrManagerRef.current) return
    
    try {
      asrManagerRef.current.stopRecording()
    } catch (err) {
      console.error('停止语音识别失败:', err)
      setError(err instanceof Error ? err.message : '停止语音识别失败')
    }
  }, [])
  
  const reloadConfig = useCallback(async () => {
    if (asrManagerRef.current) {
      await asrManagerRef.current.reloadConfig()
    }
  }, [])

  return {
    isListening,
    isConnected,
    error,
    currentText,
    startListening,
    stopListening,
    reloadConfig
  }
}
