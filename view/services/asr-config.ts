/**
 * ASR 配置管理工具
 */

export interface StoredASRConfig {
  appkey: string
  token: string
}

/**
 * 获取保存的 ASR 配置
 */
export function getSavedASRConfig(): StoredASRConfig | null {
  try {
    const savedConfig = localStorage.getItem('asrConfig')
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      if (parsed.appkey && parsed.token) {
        return {
          appkey: parsed.appkey,
          token: parsed.token
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse saved ASR config:', error)
  }
  return null
}

/**
 * 保存 ASR 配置
 */
export function saveASRConfig(config: StoredASRConfig): void {
  try {
    localStorage.setItem('asrConfig', JSON.stringify(config))
  } catch (error) {
    console.error('Failed to save ASR config:', error)
    throw error
  }
}

/**
 * 清除 ASR 配置
 */
export function clearASRConfig(): void {
  try {
    localStorage.removeItem('asrConfig')
  } catch (error) {
    console.error('Failed to clear ASR config:', error)
  }
}

/**
 * 检查是否有有效的 ASR 配置
 */
export function hasValidASRConfig(): boolean {
  const config = getSavedASRConfig()
  return config !== null && config.appkey.trim() !== '' && config.token.trim() !== ''
}
