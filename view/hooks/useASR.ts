import { useState, useEffect, useRef, useCallback } from 'react'
import { AliyunASRSDK, ASRStatus, type ASRConfig, type ASREvents, type ASRResult } from '../services/asr-sdk'

interface UseASRConfig extends Partial<ASRConfig> {
  /** 是否在组件挂载时自动连接 */
  autoConnect?: boolean
  /** 识别结果回调 */
  onResult?: (text: string, isFinal: boolean) => void
  /** 错误回调 */
  onError?: (error: Error) => void
}

interface UseASRReturn {
  /** ASR 状态 */
  status: ASRStatus
  /** 是否正在录音 */
  isRecording: boolean
  /** 是否已连接 */
  isConnected: boolean
  /** 当前识别的文本（包括中间结果） */
  currentText: string
  /** 连接到 ASR 服务 */
  connect: () => Promise<void>
  /** 断开连接 */
  disconnect: () => void
  /** 开始录音 */
  startRecording: () => Promise<void>
  /** 停止录音 */
  stopRecording: () => void
  /** 切换录音状态 */
  toggleRecording: () => Promise<void>
  /** 错误信息 */
  error: string | null
  /** 清除当前文本 */
  clearText: () => void
  /** 是否正在等待发送（静音期间） */
  isWaitingToSend: boolean
}

/**
 * 阿里云实时语音识别 Hook
 */
export function useASR(config: UseASRConfig = {}): UseASRReturn {
  const [status, setStatus] = useState<ASRStatus>(ASRStatus.DISCONNECTED)
  const [isRecording, setIsRecording] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isWaitingToSend, setIsWaitingToSend] = useState(false)
  
  const asrRef = useRef<AliyunASRSDK | null>(null)
  const finalTextRef = useRef('')
  const intermediateTextRef = useRef('')
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)

    // 硬编码配置 - 实际使用时需要替换为真实的阿里云配置
  const defaultConfig: ASRConfig = {
    appkey: 'qXYw03ZUTteWDOuq', // 替换为实际的阿里云 AppKey
    token: '5d1430b8e80e4fa497b8e2af3e6b55c9',   // 替换为实际的阿里云 Token
    sampleRate: 16000,
    format: 'pcm',
    enableIntermediateResult: true,
    enablePunctuationPrediction: true,
    enableInverseTextNormalization: true,
    bufferSize: 2048
  }

  // 合并配置
  const asrConfig = { ...defaultConfig, ...config }

  // 事件处理器
  const events: ASREvents = {
    onConnected: () => {
      console.log('[ASR] Connected to service')
      setStatus(ASRStatus.CONNECTED)
      setError(null)
    },
    onDisconnected: () => {
      console.log('[ASR] Disconnected from service')
      setStatus(ASRStatus.DISCONNECTED)
      setIsRecording(false)
    },
    onError: (err) => {
      console.error('[ASR] Error:', err)
      setError(err.message)
      setStatus(ASRStatus.ERROR)
      setIsRecording(false)
      config.onError?.(err)
    },
    onResult: (result) => {
      console.log('[ASR] Final result:', result)
      if (result.text) {
        // 更新最终文本，但不立即发送，等待静音检测
        finalTextRef.current = result.text
        // 确保显示完整文本（最终结果 + 任何中间结果）
        const fullText = finalTextRef.current + intermediateTextRef.current
        setCurrentText(fullText)
        config.onResult?.(fullText, false) // 先作为中间结果显示
        lastUpdateTimeRef.current = Date.now()
        
        // 清除之前的定时器并重新设置
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }
        
        setIsWaitingToSend(true)
        silenceTimerRef.current = setTimeout(() => {
          console.log('[ASR] Final silence timeout, sending result')
          const finalCompleteText = finalTextRef.current + intermediateTextRef.current
          if (finalCompleteText.trim()) {
            config.onResult?.(finalCompleteText.trim(), true)
            finalTextRef.current = ''
            intermediateTextRef.current = ''
            setCurrentText('')
          }
          setIsWaitingToSend(false)
          silenceTimerRef.current = null
        }, 3000)
      }
    },
    onIntermediateResult: (result) => {
      console.log('[ASR] Intermediate result:', result)
      if (result.text) {
        intermediateTextRef.current = result.text
        const fullText = finalTextRef.current + intermediateTextRef.current
        setCurrentText(fullText)
        config.onResult?.(fullText, false)
        
        // 更新最后一次收到结果的时间
        lastUpdateTimeRef.current = Date.now()
        
        // 清除之前的静音定时器
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
        
        // 设置新的静音检测定时器
        setIsWaitingToSend(true)
        silenceTimerRef.current = setTimeout(() => {
          console.log('[ASR] Silence detected, sending final result')
          const finalText = finalTextRef.current + intermediateTextRef.current
          if (finalText.trim()) {
            config.onResult?.(finalText.trim(), true)
            // 清空文本准备下次输入
            finalTextRef.current = ''
            intermediateTextRef.current = ''
            setCurrentText('')
          }
          setIsWaitingToSend(false)
          silenceTimerRef.current = null
        }, 3000) // 3秒静音后发送
      }
    },
    onRecordingStart: () => {
      console.log('[ASR] Recording started')
      setIsRecording(true)
      setStatus(ASRStatus.RECORDING)
      setError(null)
    },
    onRecordingStop: () => {
      console.log('[ASR] Recording stopped')
      setIsRecording(false)
      setStatus(ASRStatus.CONNECTED)
      
      // 停止录音时立即发送当前文本
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      
      const currentFullText = finalTextRef.current + intermediateTextRef.current
      if (currentFullText.trim()) {
        console.log('[ASR] Sending text on recording stop:', currentFullText)
        // 先显示完整文本
        setCurrentText(currentFullText)
        config.onResult?.(currentFullText, false)
        // 然后稍微延迟发送最终结果
        setTimeout(() => {
          config.onResult?.(currentFullText.trim(), true)
          finalTextRef.current = ''
          intermediateTextRef.current = ''
          setCurrentText('')
        }, 200)
      }
      
      setIsWaitingToSend(false)
    },
    onStatusChange: (newStatus) => {
      console.log('[ASR] Status changed:', newStatus)
      setStatus(newStatus)
    }
  }

  // 连接到 ASR 服务
  const connect = useCallback(async () => {
    // 检查配置是否为占位符值
    if (!asrConfig.appkey || !asrConfig.token || 
        asrConfig.appkey === 'your_aliyun_asr_appkey_here' || 
        asrConfig.token === 'your_aliyun_asr_token_here') {
      console.warn('[ASR] AppKey and Token are not configured, using mock mode')
      // 模拟连接成功
      setStatus(ASRStatus.CONNECTED)
      setError(null)
      return
    }

    try {
      if (asrRef.current) {
        asrRef.current.disconnect()
      }
      
      asrRef.current = new AliyunASRSDK(asrConfig, events)
      await asrRef.current.connect()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect to ASR service')
      setError(error.message)
      config.onError?.(error)
    }
  }, [asrConfig.appkey, asrConfig.token])

  // 断开连接
  const disconnect = useCallback(() => {
    if (asrRef.current) {
      asrRef.current.disconnect()
      asrRef.current = null
    }
    setStatus(ASRStatus.DISCONNECTED)
    setIsRecording(false)
    setError(null)
  }, [])

  // 开始录音
  const startRecording = useCallback(async () => {
    // 检查是否为模拟模式
    if (!asrRef.current && (
      !asrConfig.appkey || !asrConfig.token ||
      asrConfig.appkey === 'your_aliyun_asr_appkey_here' ||
      asrConfig.token === 'your_aliyun_asr_token_here'
    )) {
      console.log('[ASR] Using mock recording mode')
      setIsRecording(true)
      setStatus(ASRStatus.RECORDING)
      setError(null)
      
      // 清除之前的文本
      finalTextRef.current = ''
      intermediateTextRef.current = ''
      setCurrentText('')
      
      // 模拟语音识别过程
      let mockCounter = 0
      const mockTexts = [
        "正在识别...",
        "请帮我",
        "请帮我整理",
        "请帮我整理桌面",
        "请帮我整理桌面文件"
      ]
      
      const mockInterval = setInterval(() => {
        if (mockCounter < mockTexts.length - 1) {
          // 中间结果
          const currentMockText = mockTexts[mockCounter] || ''
          intermediateTextRef.current = currentMockText
          setCurrentText(finalTextRef.current + intermediateTextRef.current)
          config.onResult?.(finalTextRef.current + intermediateTextRef.current, false)
          
          // 模拟静音检测
          lastUpdateTimeRef.current = Date.now()
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
          }
          
          setIsWaitingToSend(true)
          silenceTimerRef.current = setTimeout(() => {
            const finalText = finalTextRef.current + intermediateTextRef.current
            if (finalText.trim()) {
              // 先显示完整文本
              setCurrentText(finalText)
              config.onResult?.(finalText, false)
              // 然后发送最终结果
              setTimeout(() => {
                config.onResult?.(finalText.trim(), true)
                finalTextRef.current = ''
                intermediateTextRef.current = ''
                setCurrentText('')
                setIsWaitingToSend(false)
                setIsRecording(false)
                setStatus(ASRStatus.CONNECTED)
              }, 200)
            } else {
              setIsWaitingToSend(false)
              setIsRecording(false)
              setStatus(ASRStatus.CONNECTED)
            }
          }, 3000)
          
          mockCounter++
        } else {
          // 最终结果
          clearInterval(mockInterval)
          const finalMockText = mockTexts[mockTexts.length - 1] || ''
          finalTextRef.current = finalMockText
          setCurrentText(finalTextRef.current)
          
          // 清除之前的定时器并设置新的
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
          }
          
          setIsWaitingToSend(true)
          silenceTimerRef.current = setTimeout(() => {
            const completeText = finalTextRef.current + intermediateTextRef.current
            // 先显示完整文本
            setCurrentText(completeText)
            config.onResult?.(completeText, false)
            // 然后发送最终结果
            setTimeout(() => {
              config.onResult?.(completeText.trim(), true)
              finalTextRef.current = ''
              intermediateTextRef.current = ''
              setCurrentText('')
              setIsWaitingToSend(false)
              setIsRecording(false)
              setStatus(ASRStatus.CONNECTED)
            }, 200)
          }, 3000)
        }
      }, 800)
      
      return
    }

    if (!asrRef.current?.isConnected()) {
      throw new Error('Not connected to ASR service')
    }

    try {
      // 清除之前的文本
      finalTextRef.current = ''
      intermediateTextRef.current = ''
      setCurrentText('')
      
      await asrRef.current.startRecording()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start recording')
      setError(error.message)
      config.onError?.(error)
      throw error
    }
  }, [])

  // 停止录音
  const stopRecording = useCallback(() => {
    // 清除静音检测定时器
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    
    // 模拟模式下直接设置状态
    if (!asrRef.current) {
      // 立即发送当前文本
      const currentFullText = finalTextRef.current + intermediateTextRef.current
      if (currentFullText.trim()) {
        config.onResult?.(currentFullText.trim(), true)
        finalTextRef.current = ''
        intermediateTextRef.current = ''
        setCurrentText('')
      }
      
      setIsRecording(false)
      setStatus(ASRStatus.CONNECTED)
      setIsWaitingToSend(false)
      return
    }
    
    if (asrRef.current) {
      asrRef.current.stopRecording()
    }
  }, [])

  // 切换录音状态
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording()
    } else {
      // 如果没有连接，先尝试连接
      if (!asrRef.current?.isConnected()) {
        await connect()
      }
      await startRecording()
    }
  }, [isRecording, connect, startRecording, stopRecording])

  // 清除当前文本
  const clearText = useCallback(() => {
    // 清除静音检测定时器
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    
    finalTextRef.current = ''
    intermediateTextRef.current = ''
    setCurrentText('')
    setIsWaitingToSend(false)
  }, [])

  // 自动连接
  useEffect(() => {
    if (config.autoConnect || asrConfig.appkey !== 'your_aliyun_asr_appkey_here') {
      connect().catch(console.error)
    }

    return () => {
      disconnect()
    }
  }, [config.autoConnect])

  // 清理资源
  useEffect(() => {
    return () => {
      if (asrRef.current) {
        asrRef.current.disconnect()
      }
      // 清理定时器
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
    }
  }, [])

  return {
    status,
    isRecording,
    isConnected: status === ASRStatus.CONNECTED || status === ASRStatus.RECORDING,
    currentText,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    toggleRecording,
    error,
    clearText,
    isWaitingToSend
  }
}
