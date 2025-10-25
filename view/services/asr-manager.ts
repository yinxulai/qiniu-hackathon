/**
 * ASR 管理器 - 基于事件的语音识别服务
 */
import { AliyunASRSDK, ASRStatus, type ASRConfig, type ASREvents as SDKEvents } from './asr-sdk'
import { getSavedASRConfig, hasValidASRConfig } from './asr-config'

export interface ASREvents {
  /** 连接状态变化 */
  onStatusChange: (status: ASRStatus) => void
  /** 录音状态变化 */
  onRecordingChange: (isRecording: boolean) => void
  /** 文本更新（实时显示） */
  onTextUpdate: (text: string) => void
  /** 最终结果（提交用） */
  onFinalResult: (text: string) => void
  /** 错误发生 */
  onError: (error: Error) => void
}

export class ASRManager extends EventTarget {
  private sdk: AliyunASRSDK | null = null
  private _status: ASRStatus = ASRStatus.DISCONNECTED
  private _isRecording = false
  private _currentText = ''
  private _error: string | null = null
  
  private silenceTimer: NodeJS.Timeout | null = null
  private hasSentFinal = false
  private readonly config: ASRConfig

  constructor(config: Partial<ASRConfig> = {}) {
    super()
    
    // 默认配置（将在连接时从服务端加载最新配置）
    this.config = {
      appkey: 'qXYw03ZUTteWDOuq', // 默认值，将被服务端配置覆盖
      token: '5d1430b8e80e4fa497b8e2af3e6b55c9', // 默认值，将被服务端配置覆盖
      sampleRate: 16000,
      format: 'pcm',
      enableIntermediateResult: true,
      enablePunctuationPrediction: true,
      enableInverseTextNormalization: true,
      bufferSize: 1024, // 从 2048 减小到1024，获得更低延迟
      ...config
    }
  }

  // Getters
  get status() { return this._status }
  get isRecording() { return this._isRecording }
  get currentText() { return this._currentText }
  get error() { return this._error }
  get isConnected() { 
    return this._status === ASRStatus.CONNECTED || this._status === ASRStatus.RECORDING 
  }

  /**
   * 连接到 ASR 服务
   */
  async connect(): Promise<void> {
    if (this._status === ASRStatus.CONNECTED || this._status === ASRStatus.CONNECTING) {
      console.warn('[ASRManager] Already connected or connecting')
      return
    }

    // 检查是否有有效的配置
    if (!(await hasValidASRConfig())) {
      console.warn('[ASRManager] Invalid or missing ASR configuration, using mock mode')
      this.updateStatus(ASRStatus.CONNECTED)
      return
    }

    // 重新加载最新的配置
    const savedConfig = await getSavedASRConfig()
    if (savedConfig) {
      this.config.appkey = savedConfig.appkey
      this.config.token = savedConfig.token
    }

    try {
      console.log('[ASRManager] Connecting to ASR service...')
      this.updateStatus(ASRStatus.CONNECTING)
      
      if (this.sdk) {
        this.sdk.disconnect()
      }
      
      this.sdk = new AliyunASRSDK(this.config, this.createSDKEvents())
      await this.sdk.connect()
      
      console.log('[ASRManager] Connected successfully')
    } catch (error) {
      console.error('[ASRManager] Connection failed:', error)
      const err = error instanceof Error ? error : new Error('Connection failed')
      this.updateError(err)
      throw err
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('[ASRManager] Disconnecting...')
    
    if (this.sdk) {
      this.sdk.disconnect()
      this.sdk = null
    }
    
    this.clearSilenceTimer()
    this.updateStatus(ASRStatus.DISCONNECTED)
    this.updateRecording(false)
    this.updateText('')
    this.updateError(null)
    this.hasSentFinal = false
  }

  /**
   * 开始录音
   */
  async startRecording(): Promise<void> {
    if (!this.sdk || this._status !== ASRStatus.CONNECTED) {
      const error = new Error(`Cannot start recording. Status: ${this._status}`)
      console.error('[ASRManager]', error.message)
      this.updateError(error)
      throw error
    }

    try {
      console.log('[ASRManager] Starting recording...')
      await this.sdk.startRecording()
    } catch (error) {
      console.error('[ASRManager] Failed to start recording:', error)
      const err = error instanceof Error ? error : new Error('Recording start failed')
      this.updateError(err)
      throw err
    }
  }

  /**
   * 停止录音
   */
  async stopRecording(): Promise<void> {
    if (!this.sdk || !this._isRecording) {
      console.warn('[ASRManager] Cannot stop recording: not recording')
      return
    }

    try {
      console.log('[ASRManager] Stopping recording...')
      await this.sdk.stopRecording()
    } catch (error) {
      console.error('[ASRManager] Failed to stop recording:', error)
      const err = error instanceof Error ? error : new Error('Recording stop failed')
      this.updateError(err)
      throw err
    }
  }

  /**
   * 切换录音状态
   */
  async toggleRecording(): Promise<void> {
    if (this._isRecording) {
      await this.stopRecording()
    } else {
      await this.startRecording()
    }
  }

  /**
   * 重新加载配置
   */
  async reloadConfig(): Promise<void> {
    const savedConfig = await getSavedASRConfig()
    if (savedConfig) {
      this.config.appkey = savedConfig.appkey
      this.config.token = savedConfig.token
      console.log('[ASRManager] Configuration reloaded from settings')
    }
  }

  /**
   * 清除当前文本
   */
  clearText(): void {
    this.updateText('')
    this.hasSentFinal = false
  }

  /**
   * 创建 SDK 事件处理器
   */
  private createSDKEvents(): SDKEvents {
    return {
      onConnected: () => {
        console.log('[ASRManager] SDK connected')
        this.updateStatus(ASRStatus.CONNECTED)
        this.updateError(null)
      },
      
      onDisconnected: () => {
        console.log('[ASRManager] SDK disconnected')
        this.updateStatus(ASRStatus.DISCONNECTED)
        this.updateRecording(false)
      },
      
      onError: (error) => {
        console.error('[ASRManager] SDK error:', error)
        this.updateError(error)
        this.updateStatus(ASRStatus.ERROR)
        this.updateRecording(false)
      },
      
      onResult: (result) => {
        console.log('[ASRManager] Final result from SDK:', result.text)
        if (result.text && !this.hasSentFinal) {
          this.updateText(result.text)
          // 对于最终结果，不要立即设置静音定时器，而是稍等一下
          setTimeout(() => {
            if (!this.hasSentFinal) {
              this.setSilenceTimer()
            }
          }, 100)
        }
      },
      
      onIntermediateResult: (result) => {
        console.log('[ASRManager] Intermediate result:', result.text)
        if (result.text && !this.hasSentFinal) {
          this.updateText(result.text)
          this.setSilenceTimer()
        }
      },
      
      onRecordingStart: () => {
        console.log('[ASRManager] Recording started')
        this.updateRecording(true)
        this.updateStatus(ASRStatus.RECORDING)
        this.updateError(null)
        
        // 重置状态
        this.updateText('')
        this.hasSentFinal = false
        this.clearSilenceTimer()
      },
      
      onRecordingStop: () => {
        console.log('[ASRManager] Recording stopped, waiting for final text processing...')
        this.updateRecording(false)
        this.updateStatus(ASRStatus.CONNECTED)
        
        // 由于SDK现在会发送停止信号并等待服务端完成处理，这里的延迟可以减少
        setTimeout(() => {
          console.log('[ASRManager] Sending final result after recording stop delay')
          this.sendFinalResult()
        }, 100) // 从300ms减少到100ms，因为SDK层面已经处理了数据同步
      },
      
      onStatusChange: (status) => {
        console.log('[ASRManager] Status changed:', status)
        this.updateStatus(status)
      }
    }
  }

  /**
   * 更新状态
   */
  private updateStatus(status: ASRStatus): void {
    if (this._status !== status) {
      this._status = status
      this.dispatchEvent(new CustomEvent('statusChange', { detail: status }))
    }
  }

  /**
   * 更新录音状态
   */
  private updateRecording(isRecording: boolean): void {
    if (this._isRecording !== isRecording) {
      this._isRecording = isRecording
      this.dispatchEvent(new CustomEvent('recordingChange', { detail: isRecording }))
    }
  }

  /**
   * 更新文本
   */
  private updateText(text: string): void {
    this._currentText = text
    this.dispatchEvent(new CustomEvent('textUpdate', { detail: text }))
  }

  /**
   * 更新错误
   */
  private updateError(error: Error | null): void {
    this._error = error?.message || null
    if (error) {
      this.dispatchEvent(new CustomEvent('error', { detail: error }))
    }
  }

  /**
   * 设置静音检测定时器
   */
  private setSilenceTimer(): void {
    this.clearSilenceTimer()
    
    // 延长静音检测时间以避免过早截断语音
    this.silenceTimer = setTimeout(() => {
      console.log('[ASRManager] Silence detected, sending final result')
      this.sendFinalResult()
    }, 3000) // 从 3000 改为 5000毫秒
  }

  /**
   * 清除静音定时器
   */
  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer)
      this.silenceTimer = null
    }
  }

  /**
   * 发送最终结果
   */
  private sendFinalResult(): void {
    if (this._currentText.trim() && !this.hasSentFinal) {
      console.log('[ASRManager] Sending final result:', this._currentText.trim())
      this.hasSentFinal = true
      
      this.dispatchEvent(new CustomEvent('finalResult', { 
        detail: this._currentText.trim() 
      }))
      
      // 由于SDK现在正确处理了数据同步，可以减少这里的延迟
      setTimeout(() => {
        // 自动停止录音，等待下次主动唤醒
        if (this._isRecording) {
          console.log('[ASRManager] Auto-stopping recording after final result')
          this.stopRecording().catch((error) => {
            console.error('[ASRManager] Failed to auto-stop recording:', error)
          })
        }
      }, 200) // 从500ms减少到200ms
      
      // 清理状态
      setTimeout(() => {
        this.updateText('')
        this.hasSentFinal = false
      }, 100)
    }
    
    this.clearSilenceTimer()
  }
}
