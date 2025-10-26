/**
 * 阿里云实时语音识别 SDK
 * 基于 WebSocket 的实时语音转文字服务
 * 
 * @author Siwei Team
 * @version 1.0.0
 */

export interface ASRConfig {
  /** 阿里云应用 AppKey */
  appkey: string;
  /** 阿里云访问令牌 */
  token: string;
  /** 音频采样率，默认 16000 */
  sampleRate?: number;
  /** 音频格式，默认 pcm */
  format?: string;
  /** 是否启用中间结果，默认 true */
  enableIntermediateResult?: boolean;
  /** 是否启用标点符号预测，默认 true */
  enablePunctuationPrediction?: boolean;
  /** 是否启用逆向文本规范化，默认 true */
  enableInverseTextNormalization?: boolean;
  /** WebSocket 缓冲区大小，默认 2048 */
  bufferSize?: number;
}

export interface ASRResult {
  /** 识别结果文本 */
  text: string;
  /** 是否为最终结果 */
  isFinal: boolean;
  /** 置信度 */
  confidence?: number;
  /** 识别开始时间 */
  beginTime?: number;
  /** 识别结束时间 */
  endTime?: number;
}

export interface ASREvents {
  /** 连接成功 */
  onConnected?: () => void;
  /** 连接断开 */
  onDisconnected?: () => void;
  /** 连接错误 */
  onError?: (error: Error) => void;
  /** 识别结果 */
  onResult?: (result: ASRResult) => void;
  /** 中间识别结果 */
  onIntermediateResult?: (result: ASRResult) => void;
  /** 录音开始 */
  onRecordingStart?: () => void;
  /** 录音停止 */
  onRecordingStop?: () => void;
  /** 状态变化 */
  onStatusChange?: (status: ASRStatus) => void;
}

export enum ASRStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECORDING = 'recording',
  ERROR = 'error'
}

/**
 * 阿里云实时语音识别 SDK
 */
export class AliyunASRSDK {
  private config: Required<ASRConfig>;
  private events: ASREvents;
  private websocket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private audioInput: MediaStreamAudioSourceNode | null = null;
  private audioStream: MediaStream | null = null;
  private status: ASRStatus = ASRStatus.DISCONNECTED;
  private taskId: string = '';
  private isRecording: boolean = false;

  constructor(config: ASRConfig, events: ASREvents = {}) {
    this.config = {
      ...config,
      sampleRate: config.sampleRate || 16000,
      format: config.format || 'pcm',
      enableIntermediateResult: config.enableIntermediateResult !== false,
      enablePunctuationPrediction: config.enablePunctuationPrediction !== false,
      enableInverseTextNormalization: config.enableInverseTextNormalization !== false,
      bufferSize: config.bufferSize || 2048
    };
    this.events = events;
  }

  /**
   * 生成 UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }).replace(/-/g, '');
  }

  /**
   * 更新状态
   */
  private updateStatus(status: ASRStatus) {
    this.status = status;
    this.events.onStatusChange?.(status);
  }

  /**
   * 连接到语音识别服务
   */
  async connect(): Promise<void> {
    if (this.status === ASRStatus.CONNECTED || this.status === ASRStatus.CONNECTING) {
      throw new Error('Already connected or connecting');
    }

    return new Promise((resolve, reject) => {
      try {
        this.updateStatus(ASRStatus.CONNECTING);
        
        const socketUrl = `wss://nls-gateway.cn-shanghai.aliyuncs.com/ws/v1?token=${this.config.token}`;
        this.websocket = new WebSocket(socketUrl);

        this.websocket.onopen = () => {
          this.updateStatus(ASRStatus.CONNECTED);
          this.events.onConnected?.();

          // 发送开始转录消息
          this.taskId = this.generateUUID();
          const startTranscriptionMessage = {
            header: {
              appkey: this.config.appkey,
              namespace: "SpeechTranscriber",
              name: "StartTranscription",
              task_id: this.taskId,
              message_id: this.generateUUID()
            },
            payload: {
              format: this.config.format,
              speech_noise_threshold: 0.5,
              sample_rate: this.config.sampleRate,
              enable_semantic_sentence_detection: true,
              enable_intermediate_result: this.config.enableIntermediateResult,
              enable_punctuation_prediction: this.config.enablePunctuationPrediction,
              enable_inverse_text_normalization: this.config.enableInverseTextNormalization
            }
          };

          this.websocket!.send(JSON.stringify(startTranscriptionMessage));
          resolve();
        };

        this.websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.websocket.onerror = (event) => {
          const error = new Error(`WebSocket error: ${event}`);
          this.updateStatus(ASRStatus.ERROR);
          this.events.onError?.(error);
          reject(error);
        };

        this.websocket.onclose = () => {
          this.updateStatus(ASRStatus.DISCONNECTED);
          this.events.onDisconnected?.();
          this.cleanup();
        };

      } catch (error) {
        this.updateStatus(ASRStatus.ERROR);
        reject(error);
      }
    });
  }

  /**
   * 处理服务器消息
   */
  private handleMessage(message: any) {
    const { header, payload } = message;
    
    switch (header.name) {
      case 'TranscriptionStarted':
        // 转录已开始，可以开始录音
        break;
        
      case 'SentenceBegin':
        // 句子开始
        break;
        
      case 'TranscriptionResultChanged':
        // 中间识别结果
        if (payload && payload.result) {
          const result: ASRResult = {
            text: payload.result,
            isFinal: false,
            confidence: payload.confidence,
            beginTime: payload.begin_time,
            endTime: payload.end_time
          };
          this.events.onIntermediateResult?.(result);
        }
        break;
        
      case 'SentenceEnd':
        // 最终识别结果
        if (payload && payload.result) {
          const result: ASRResult = {
            text: payload.result,
            isFinal: true,
            confidence: payload.confidence,
            beginTime: payload.begin_time,
            endTime: payload.end_time
          };
          this.events.onResult?.(result);
        }
        break;
        
      case 'TranscriptionCompleted':
        // 转录完成，这时服务端已经处理完所有剩余数据
        console.log('[AliyunASRSDK] Transcription completed by server');
        // 如果还有最后的结果，确保它被处理
        if (payload && payload.result) {
          const finalResult: ASRResult = {
            text: payload.result,
            isFinal: true,
            confidence: payload.confidence,
            beginTime: payload.begin_time,
            endTime: payload.end_time
          };
          console.log('[AliyunASRSDK] Final result from completion:', finalResult.text);
          this.events.onResult?.(finalResult);
        }
        break;
        
      default:
        console.log('Unknown message type:', header.name);
    }
  }

  /**
   * 开始录音
   */
  async startRecording(): Promise<void> {
    if (this.status !== ASRStatus.CONNECTED) {
      throw new Error('Not connected to ASR service');
    }

    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      // 获取音频输入设备
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // 创建音频上下文
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });

      this.audioInput = this.audioContext.createMediaStreamSource(this.audioStream);

      // 创建脚本处理器
      this.scriptProcessor = this.audioContext.createScriptProcessor(
        this.config.bufferSize, 
        1, 
        1
      );

      this.scriptProcessor.onaudioprocess = (event) => {
        // 即使在停止录音过程中，也要处理最后的音频数据
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = event.inputBuffer.getChannelData(0);
        const inputData16 = new Int16Array(inputData.length);
        
        // 转换为 PCM 16-bit
        for (let i = 0; i < inputData.length; ++i) {
          const sample = inputData[i] || 0;
          inputData16[i] = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        }

        // 发送音频数据，即使在停止过程中也要发送最后的数据
        try {
          this.websocket.send(inputData16.buffer);
        } catch (error) {
          console.error('[AliyunASRSDK] Failed to send audio data:', error);
        }
      };

      // 连接音频节点
      this.audioInput.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.isRecording = true;
      this.updateStatus(ASRStatus.RECORDING);
      this.events.onRecordingStart?.();

    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  /**
   * 停止录音
   */
  stopRecording(): void {
    if (!this.isRecording) {
      return;
    }

    console.log('[AliyunASRSDK] Stopping recording and sending completion signal...');
    
    // 立即标记为停止录音，防止继续发送音频数据
    this.isRecording = false;
    
    // 发送音频流结束信号给服务端，让它处理剩余的缓存数据
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      try {
        const stopMessage = {
          header: {
            message_id: this.generateUUID(),
            task_id: this.taskId,
            namespace: 'SpeechTranscriber',
            name: 'StopTranscription',
            appkey: this.config.appkey
          }
        };
        
        console.log('[AliyunASRSDK] Sending stop transcription signal');
        this.websocket.send(JSON.stringify(stopMessage));
        
        // 等待一段时间让服务端处理剩余数据，然后再清理资源
        setTimeout(() => {
          this.cleanupAudioResources();
        }, 500); // 给服务端500ms时间处理剩余数据
        
      } catch (error) {
        console.error('[AliyunASRSDK] Failed to send stop signal:', error);
        // 如果发送失败，直接清理资源
        this.cleanupAudioResources();
      }
    } else {
      // 如果WebSocket已断开，直接清理资源
      this.cleanupAudioResources();
    }
  }

  /**
   * 清理音频资源
   */
  private cleanupAudioResources(): void {
    console.log('[AliyunASRSDK] Cleaning up audio resources...');
    
    // 清理音频资源
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.audioInput) {
      this.audioInput.disconnect();
      this.audioInput = null;
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.updateStatus(ASRStatus.CONNECTED);
    this.events.onRecordingStop?.();
    console.log('[AliyunASRSDK] Audio resources cleaned up');
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.stopRecording();

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.cleanup();
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    this.stopRecording();
    this.websocket = null;
    this.taskId = '';
  }

  /**
   * 获取当前状态
   */
  getStatus(): ASRStatus {
    return this.status;
  }

  /**
   * 是否正在录音
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.status === ASRStatus.CONNECTED || this.status === ASRStatus.RECORDING;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ASRConfig>): void {
    if (this.isConnected()) {
      throw new Error('Cannot update config while connected');
    }
    
    this.config = { ...this.config, ...config };
  }

  /**
   * 更新事件处理器
   */
  updateEvents(events: Partial<ASREvents>): void {
    this.events = { ...this.events, ...events };
  }
}
