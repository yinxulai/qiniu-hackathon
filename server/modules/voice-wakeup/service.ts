import { Porcupine, BuiltinKeyword } from '@picovoice/porcupine-node'
import { PvRecorder } from '@picovoice/pvrecorder-node'

// ==================== 类型定义 ====================

export interface VoiceWakeupConfig {
  accessKey: string
  keywordPath?: string // 离线唤醒词文件路径
  modelPath?: string // 自定义模型文件路径（中文支持）
  keywords?: BuiltinKeyword[] // 内置关键词（可选）
  sensitivities?: number[]
  audioDeviceIndex?: number
}

export interface VoiceWakeupEvents {
  onWakewordDetected: (keywordIndex: number, keyword: string) => void
  onError: (error: Error) => void
  onStart: () => void
  onStop: () => void
}

// ==================== 常用关键词 ====================

export const CommonKeywords = {
  ALEXA: BuiltinKeyword.ALEXA,
  HEY_GOOGLE: BuiltinKeyword.HEY_GOOGLE,
  OK_GOOGLE: BuiltinKeyword.OK_GOOGLE,
  HEY_SIRI: BuiltinKeyword.HEY_SIRI,
  PORCUPINE: BuiltinKeyword.PORCUPINE
} as const

// ==================== 核心服务类 ====================

export class VoiceWakeupService {
  private porcupine: Porcupine | null = null
  private recorder: PvRecorder | null = null
  private isListening = false
  private config: VoiceWakeupConfig
  private events: VoiceWakeupEvents
  private audioBuffer: Int16Array | null = null

  constructor(config: VoiceWakeupConfig, events: VoiceWakeupEvents) {
    this.config = config
    this.events = events
  }

  /**
   * 初始化语音唤醒服务
   */
  async initialize(): Promise<void> {
    try {
      // 创建 Porcupine 实例，支持离线唤醒词文件和中文模型
      if (this.config.keywordPath) {
        // 使用离线唤醒词文件
        const porcupineOptions: any = {
          accessKey: this.config.accessKey,
          keywordPaths: [this.config.keywordPath],
          sensitivities: this.config.sensitivities || [0.5]
        }
        
        // 如果有中文模型文件，添加 modelPath 参数
        if (this.config.modelPath) {
          porcupineOptions.modelPath = this.config.modelPath
          console.log(`[VoiceWakeupService] Using Chinese model: ${this.config.modelPath}`)
        }
        
        this.porcupine = new Porcupine(
          porcupineOptions.accessKey,
          porcupineOptions.keywordPaths,
          porcupineOptions.sensitivities,
          porcupineOptions.modelPath
        )
      } else if (this.config.keywords) {
        // 使用内置关键词（不支持中文模型）
        this.porcupine = new Porcupine(
          this.config.accessKey,
          this.config.keywords,
          this.config.sensitivities || this.config.keywords.map(() => 0.5)
        )
      } else {
        throw new Error('Must provide either keywordPath or keywords')
      }

      // 创建录音器实例
      this.recorder = new PvRecorder(
        this.porcupine.frameLength,
        this.config.audioDeviceIndex ?? -1 // -1 使用默认设备
      )

      // 输出配置信息
      console.log(`[VoiceWakeupService] Initialized with access key`)
      if (this.config.keywordPath) {
        console.log(`[VoiceWakeupService] Using offline keyword file: ${this.config.keywordPath}`)
        if (this.config.modelPath) {
          console.log(`[VoiceWakeupService] Using Chinese model file: ${this.config.modelPath}`)
        }
      } else if (this.config.keywords) {
        console.log(`[VoiceWakeupService] Keywords: ${this.config.keywords.join(', ')}`)
      }
      console.log(`[VoiceWakeupService] Frame length: ${this.porcupine.frameLength}`)
      console.log(`[VoiceWakeupService] Sample rate: ${this.porcupine.sampleRate}`)
    } catch (error) {
      console.error('[VoiceWakeupService] Initialization failed:', error)
      throw error
    }
  }

  /**
   * 开始监听唤醒词
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      console.warn('[VoiceWakeupService] Already listening')
      return
    }

    if (!this.porcupine || !this.recorder) {
      throw new Error('Voice wakeup service not initialized')
    }

    try {
      // 启动录音器
      this.recorder.start()
      this.isListening = true
      
      console.log('[VoiceWakeupService] Started listening for wake words')
      this.events.onStart()

      // 开始音频处理循环
      this.processAudio()
    } catch (error) {
      console.error('[VoiceWakeupService] Failed to start listening:', error)
      this.events.onError(error as Error)
      throw error
    }
  }

  /**
   * 停止监听唤醒词
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return
    }

    try {
      this.isListening = false
      
      if (this.recorder) {
        this.recorder.stop()
      }
      
      console.log('[VoiceWakeupService] Stopped listening')
      this.events.onStop()
    } catch (error) {
      console.error('[VoiceWakeupService] Failed to stop listening:', error)
      this.events.onError(error as Error)
    }
  }

  /**
   * 音频处理循环
   */
  private async processAudio(): Promise<void> {
    while (this.isListening && this.recorder && this.porcupine) {
      try {
        // 读取音频帧 - 异步操作
        const audioFrame = await this.recorder.read()
        
        if (audioFrame && audioFrame.length > 0) {
          // 处理音频帧，检测唤醒词
          const keywordIndex = this.porcupine.process(audioFrame)
          
          if (keywordIndex >= 0) {
            let keyword: string
            if (this.config.keywordPath) {
              // 离线唤醒词文件，使用文件名作为关键词
              keyword = 'Custom Wake Word'
            } else if (this.config.keywords) {
              // 内置关键词
              keyword = this.config.keywords[keywordIndex] || 'Unknown'
            } else {
              keyword = 'Wake Word'
            }
            
            console.log(`[VoiceWakeupService] Wake word detected: ${keyword} (index: ${keywordIndex})`)
            this.events.onWakewordDetected(keywordIndex, keyword)
          }
        }
        
        // 短暂休眠避免占用过多CPU
        await new Promise(resolve => setTimeout(resolve, 10))
      } catch (error) {
        console.error('[VoiceWakeupService] Audio processing error:', error)
        this.events.onError(error as Error)
        break
      }
    }
  }

  /**
   * 获取可用的音频设备列表
   * 注意：实际的设备枚举可能需要根据 pvrecorder 版本调整
   */
  static getAudioDevices(): string[] {
    try {
      // 这里简化实现，实际使用时可能需要根据具体的API文档调整
      console.log('[VoiceWakeupService] Audio device enumeration not implemented, using default device')
      return ['Default Audio Device']
    } catch (error) {
      console.error('[VoiceWakeupService] Failed to get audio devices:', error)
      return []
    }
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    isListening: boolean
    isInitialized: boolean
    keywords?: BuiltinKeyword[]
    keywordPath?: string
    modelPath?: string
    frameLength?: number
    sampleRate?: number
  } {
    return {
      isListening: this.isListening,
      isInitialized: this.porcupine !== null,
      ...(this.config.keywords && { keywords: this.config.keywords }),
      ...(this.config.keywordPath && { keywordPath: this.config.keywordPath }),
      ...(this.config.modelPath && { modelPath: this.config.modelPath }),
      ...(this.porcupine?.frameLength && { frameLength: this.porcupine.frameLength }),
      ...(this.porcupine?.sampleRate && { sampleRate: this.porcupine.sampleRate })
    }
  }

  /**
   * 释放资源
   */
  async dispose(): Promise<void> {
    try {
      await this.stopListening()
      
      if (this.recorder) {
        this.recorder.release()
        this.recorder = null
      }
      
      if (this.porcupine) {
        this.porcupine.release()
        this.porcupine = null
      }
      
      console.log('[VoiceWakeupService] Resources released')
    } catch (error) {
      console.error('[VoiceWakeupService] Failed to dispose resources:', error)
      throw error
    }
  }

  /**
   * 更新配置（需要重新初始化）
   */
  async updateConfig(newConfig: Partial<VoiceWakeupConfig>): Promise<void> {
    const wasListening = this.isListening
    
    try {
      // 停止当前服务
      await this.dispose()
      
      // 更新配置
      this.config = { ...this.config, ...newConfig }
      
      // 重新初始化
      await this.initialize()
      
      // 如果之前在监听，则重新开始监听
      if (wasListening) {
        await this.startListening()
      }
      
      console.log('[VoiceWakeupService] Configuration updated')
    } catch (error) {
      console.error('[VoiceWakeupService] Failed to update configuration:', error)
      throw error
    }
  }
}
