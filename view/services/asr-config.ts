/**
 * ASR 配置管理工具 - 基于服务端 API
 */
import { getAsrConfig, updateAsrConfig, deleteAsrConfig } from '../apis'

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
    const response = await getAsrConfig()
    
    if (response.data?.status === 'SUCCESS' && response.data.data) {
      const data = response.data.data
      return {
        appkey: data.appkey,
        token: data.token,
        ...(data.updatedAt && { updatedAt: data.updatedAt })
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
    const response = await updateAsrConfig({
      body: {
        appkey: config.appkey,
        token: config.token
      }
    })
    
    if (response.data?.status === 'SUCCESS' && response.data.data) {
      const data = response.data.data
      return {
        appkey: data.appkey,
        token: data.token,
        ...(data.updatedAt && { updatedAt: data.updatedAt })
      }
    } else {
      throw new Error(response.data?.message || 'Failed to save ASR config')
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
    const response = await deleteAsrConfig()
    
    if (response.data?.status !== 'SUCCESS') {
      throw new Error(response.data?.message || 'Failed to clear ASR config')
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
