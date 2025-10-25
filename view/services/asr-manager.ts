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
    
    // 从设置面板获取保存的配置
    const savedConfig = getSavedASRConfig()
    
    // 默认配置
    this.config = {
      appkey: savedConfig?.appkey || 'qXYw03ZUTteWDOuq',
      token: savedConfig?.token || '5d1430b8e80e4fa497b8e2af3e6b55c9',
      sampleRate: 16000,
      format: 'pcm',
      enableIntermediateResult: true,
      enablePunctuationPrediction: true,
      enableInverseTextNormalization: true,
      bufferSize: 2048,
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
    if (!hasValidASRConfig()) {
      console.warn('[ASRManager] Invalid or missing ASR configuration, using mock mode')
      this.updateStatus(ASRStatus.CONNECTED)
      return
    }

    // 重新加载最新的配置
    const savedConfig = getSavedASRConfig()
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
  reloadConfig(): void {
    const savedConfig = getSavedASRConfig()
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
        console.log('[ASRManager] Final result:', result.text)
        if (result.text && !this.hasSentFinal) {
          this.updateText(result.text)
          this.setSilenceTimer()
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
        console.log('[ASRManager] Recording stopped')
        this.updateRecording(false)
        this.updateStatus(ASRStatus.CONNECTED)
        
        // 立即发送最终结果
        this.sendFinalResult()
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
    
    this.silenceTimer = setTimeout(() => {
      console.log('[ASRManager] Silence detected, sending final result')
      this.sendFinalResult()
    }, 3000)
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
      
      // 清理状态
      setTimeout(() => {
        this.updateText('')
        this.hasSentFinal = false
      }, 100)
    }
    
    this.clearSilenceTimer()
  }
}
