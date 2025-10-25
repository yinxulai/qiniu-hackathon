import React, { useState, useEffect } from 'react'
import { getAsrConfig, updateAsrConfig } from '../../../apis'

interface VoiceWakeupConfig {
  accessKey: string
}

export function VoiceWakeupPanel() {
  const [config, setConfig] = useState<VoiceWakeupConfig>({
    accessKey: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [hasValidConfig, setHasValidConfig] = useState(false)
  const [wakeupStatus, setWakeupStatus] = useState<{
    isActive: boolean
    isListening: boolean
    lastDetection?: Date
  }>({
    isActive: false,
    isListening: false
  })

  // 加载配置
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      
      // 使用 ASR 配置 API 加载 accessKey
      const response = await getAsrConfig()
      const savedConfig = response.data?.data
      if (savedConfig) {
        setConfig({
          accessKey: (savedConfig as any).accessKey || ''
        })
      }
      
      // 检查是否有有效配置
      const hasValid = savedConfig && (savedConfig as any).accessKey?.trim() !== ''
      setHasValidConfig(!!hasValid)
    } catch (error) {
      console.error('Failed to load Voice Wakeup config:', error)
      setMessage({ type: 'error', text: '加载配置失败' })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config.accessKey.trim()) {
      setMessage({ type: 'error', text: '请填写 Picovoice Access Key' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // 获取当前 ASR 配置
      const currentResponse = await getAsrConfig()
      const currentConfig = currentResponse.data?.data || {}

      // 更新配置，使用 any 类型绕过 TypeScript 检查
      const response = await updateAsrConfig({
        body: {
          appkey: (currentConfig as any).appkey || '',
          token: (currentConfig as any).token || '',
          accessKey: config.accessKey.trim()
        } as any
      })
      
      if (response.data?.status !== 'SUCCESS') {
        throw new Error(response.data?.message || '保存失败')
      }

      setHasValidConfig(true)
      setMessage({ type: 'success', text: '配置保存成功，语音唤醒服务将在重启后生效' })

      // 重新加载配置
      await loadConfig()
    } catch (error) {
      console.error('Failed to save Voice Wakeup config:', error)
      setMessage({ type: 'error', text: '保存配置失败：' + (error instanceof Error ? error.message : '未知错误') })
    } finally {
      setLoading(false)
    }
  }

  const resetConfig = async () => {
    try {
      setLoading(true)
      
      // 获取当前 ASR 配置
      const currentResponse = await getAsrConfig()
      const currentConfig = currentResponse.data?.data || {}

      // 只清除 accessKey，保留其他配置
      const response = await updateAsrConfig({
        body: {
          appkey: (currentConfig as any).appkey || '',
          token: (currentConfig as any).token || '',
          accessKey: ''
        } as any
      })
      
      if (response.data?.status !== 'SUCCESS') {
        throw new Error(response.data?.message || '重置失败')
      }

      setConfig({ accessKey: '' })
      setHasValidConfig(false)
      setMessage({ type: 'success', text: '配置已重置' })
    } catch (error) {
      console.error('Failed to reset Voice Wakeup config:', error)
      setMessage({ type: 'error', text: '重置失败：' + (error instanceof Error ? error.message : '未知错误') })
    } finally {
      setLoading(false)
    }
  }

  // 3秒后清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [message])

  return (
    <div className="space-y-6">
      {/* 标题和说明 */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-800">Picovoice 语音唤醒配置</h3>
        <p className="text-gray-600 text-sm">
          配置 Picovoice Access Key，启用离线语音唤醒功能，支持自定义唤醒词
        </p>
      </div>

      {/* 状态指示器 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50">
          <div className={`w-3 h-3 rounded-full ${hasValidConfig ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className={`text-sm font-medium ${hasValidConfig ? 'text-green-700' : 'text-gray-600'}`}>
            {hasValidConfig ? '配置已完成' : '等待配置'}
          </span>
        </div>
        
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50">
          <div className={`w-3 h-3 rounded-full ${wakeupStatus.isListening ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className={`text-sm font-medium ${wakeupStatus.isListening ? 'text-blue-700' : 'text-gray-600'}`}>
            {wakeupStatus.isListening ? '正在监听' : '未启动'}
          </span>
        </div>
      </div>

      {/* 配置表单 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Picovoice Access Key
          </label>
          <input
            type="password"
            value={config.accessKey}
            onChange={(e) => setConfig(prev => ({ ...prev, accessKey: e.target.value }))}
            placeholder="请输入 Picovoice Access Key"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            disabled={loading}
          />
        </div>
      </div>

      {/* 唤醒词信息 */}
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 12.536L12 9l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="space-y-2 text-sm">
            <p className="font-medium text-purple-800">唤醒词配置</p>
            <p className="text-purple-700">
              当前使用离线唤醒词文件：<code className="bg-purple-100 px-2 py-1 rounded">wake-up-word.ppn</code>
            </p>
            <p className="text-purple-600 text-xs">
              检测到唤醒词后，将自动显示主面板并启动语音输入模式
            </p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={saveConfig}
          disabled={loading || !config.accessKey.trim()}
          className="flex-1 px-4 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-200/50"
        >
          {loading ? '保存中...' : '保存配置'}
        </button>

        {hasValidConfig && (
          <button
            onClick={resetConfig}
            disabled={loading}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            重置
          </button>
        )}
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* 配置说明 */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="space-y-2 text-sm text-blue-800">
            <p className="font-medium">如何获取 Picovoice Access Key：</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>访问 <a href="https://console.picovoice.ai/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-800">Picovoice Console</a></li>
              <li>注册并登录账户（提供免费额度）</li>
              <li>在 Dashboard 中获取 Access Key</li>
              <li>粘贴到上方输入框并保存</li>
            </ol>
            <p className="text-blue-600 text-xs mt-2">
              注意：保存后需要重启应用才能启用语音唤醒功能
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
