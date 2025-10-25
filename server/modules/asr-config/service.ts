import Store from 'electron-store'
import type { ASRConfig } from './schema'

interface ASRConfigStore {
  config: ASRConfig | null
}

export class ASRConfigService {
  private store: Store<ASRConfigStore>

  constructor() {
    this.store = new Store<ASRConfigStore>({
      name: 'asr-config',
      defaults: {
        config: null
      },
      encryptionKey: 'asr-config-encryption-key-2024'
    })
  }

  /**
   * 获取 ASR 配置
   */
  getConfig(): ASRConfig | null {
    return this.store.get('config')
  }

  /**
   * 更新 ASR 配置
   */
  updateConfig(appkey: string, token: string, accessKey?: string): ASRConfig {
    // 获取当前配置以保留原有的 accessKey
    const currentConfig = this.getConfig()
    
    const config: ASRConfig = {
      appkey: appkey.trim(),
      token: token.trim(),
      accessKey: accessKey !== undefined ? accessKey.trim() : currentConfig?.accessKey,
      updatedAt: new Date().toISOString()
    }
    
    this.store.set('config', config)
    
    console.log('[ASRConfigService] Config updated')
    return config
  }

  /**
   * 删除 ASR 配置
   */
  deleteConfig(): boolean {
    try {
      this.store.set('config', null)
      console.log('[ASRConfigService] Config deleted')
      return true
    } catch (error) {
      console.error('[ASRConfigService] Failed to delete config:', error)
      return false
    }
  }

  /**
   * 检查是否有有效配置
   */
  hasValidConfig(): boolean {
    const config = this.getConfig()
    return config !== null && 
           config.appkey.trim() !== '' && 
           config.token.trim() !== ''
  }

  /**
   * 获取配置用于 ASR SDK
   */
  getSDKConfig(): { appkey: string; token: string } | null {
    const config = this.getConfig()
    if (!config || !this.hasValidConfig()) {
      return null
    }
    
    return {
      appkey: config.appkey,
      token: config.token
    }
  }
}
