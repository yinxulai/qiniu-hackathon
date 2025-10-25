/**
 * ASR 配置管理工具 - 基于服务端 API
 */

export interface StoredASRConfig {
  appkey: string
  token: string
  updatedAt?: string
}

/**
 * 获取保存的 ASR 配置
 */
export async function getSavedASRConfig(): Promise<StoredASRConfig | null> {
  try {
    const response = await fetch('http://localhost:28731/asr/config/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success && result.data) {
      return {
        appkey: result.data.appkey,
        token: result.data.token,
        updatedAt: result.data.updatedAt
      }
    }
    
    return null
  } catch (error) {
    console.error('Failed to get saved ASR config:', error)
    return null
  }
}

/**
 * 保存 ASR 配置
 */
export async function saveASRConfig(config: Omit<StoredASRConfig, 'updatedAt'>): Promise<StoredASRConfig> {
  try {
    const response = await fetch('http://localhost:28731/asr/config/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appkey: config.appkey,
        token: config.token
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success && result.data) {
      return {
        appkey: result.data.appkey,
        token: result.data.token,
        updatedAt: result.data.updatedAt
      }
    } else {
      throw new Error(result.message || 'Failed to save ASR config')
    }
  } catch (error) {
    console.error('Failed to save ASR config:', error)
    throw error
  }
}

/**
 * 清除 ASR 配置
 */
export async function clearASRConfig(): Promise<void> {
  try {
    const response = await fetch('http://localhost:28731/asr/config/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to clear ASR config')
    }
  } catch (error) {
    console.error('Failed to clear ASR config:', error)
    throw error
  }
}

/**
 * 检查是否有有效的 ASR 配置
 */
export async function hasValidASRConfig(): Promise<boolean> {
  try {
    const config = await getSavedASRConfig()
    return config !== null && config.appkey.trim() !== '' && config.token.trim() !== ''
  } catch (error) {
    console.error('Failed to check ASR config validity:', error)
    return false
  }
}
