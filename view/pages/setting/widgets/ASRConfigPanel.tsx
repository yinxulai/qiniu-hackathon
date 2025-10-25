import React, { useState, useEffect } from 'react'
import { getAsrConfig, updateAsrConfig, deleteAsrConfig } from '../../../apis'

interface ASRConfig {
  appkey: string
  token: string
}

export function ASRConfigPanel() {
  const [config, setConfig] = useState<ASRConfig>({
    appkey: '',
    token: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [hasValidConfig, setHasValidConfig] = useState(false)

  // 加载配置
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      
      // 使用生成的 API 客户端加载配置
      const response = await getAsrConfig()
      const savedConfig = response.data?.data
      if (savedConfig) {
        setConfig({
          appkey: savedConfig.appkey || '',
          token: savedConfig.token || ''
        })
      }
      
      // 检查是否有有效配置
      const hasValid = savedConfig && savedConfig.appkey.trim() !== '' && savedConfig.token.trim() !== ''
      setHasValidConfig(!!hasValid)
    } catch (error) {
      console.error('Failed to load ASR config:', error)
      setMessage({ type: 'error', text: '加载配置失败' })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config.appkey.trim() || !config.token.trim()) {
      setMessage({ type: 'error', text: '请填写完整的 AppKey 和 Token' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // 使用生成的 API 客户端保存配置
      const response = await updateAsrConfig({
        body: {
          appkey: config.appkey.trim(),
          token: config.token.trim()
        }
      })
      
      if (response.data?.status !== 'SUCCESS') {
        throw new Error(response.data?.message || '保存失败')
      }

      setHasValidConfig(true)
      setMessage({ type: 'success', text: '配置保存成功' })

      // 重新加载配置
      await loadConfig()
    } catch (error) {
      console.error('Failed to save ASR config:', error)
      setMessage({ type: 'error', text: '保存配置失败：' + (error instanceof Error ? error.message : '未知错误') })
    } finally {
      setLoading(false)
    }
  }

  const resetConfig = async () => {
    try {
      setLoading(true)
      
      setConfig({
        appkey: '',
        token: ''
      })
      
      const response = await deleteAsrConfig()
      if (response.data?.status !== 'SUCCESS') {
        throw new Error(response.data?.message || '删除失败')
      }

      setHasValidConfig(false)
      setMessage({ type: 'success', text: '配置已重置' })
    } catch (error) {
      console.error('Failed to reset ASR config:', error)
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
        <h3 className="text-xl font-semibold text-gray-800">阿里云语音识别配置</h3>
        <p className="text-gray-600 text-sm">
          配置阿里云语音识别服务的 AppKey 和 Token，用于实时语音转文字功能
        </p>
      </div>

      {/* 状态指示器 */}
      <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50">
        <div className={`w-3 h-3 rounded-full ${hasValidConfig ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        <span className={`text-sm font-medium ${hasValidConfig ? 'text-green-700' : 'text-gray-600'}`}>
          {hasValidConfig ? '配置已完成' : '等待配置'}
        </span>
      </div>

      {/* 配置表单 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AppKey
          </label>
          <input
            type="text"
            value={config.appkey}
            onChange={(e) => setConfig(prev => ({ ...prev, appkey: e.target.value }))}
            placeholder="请输入阿里云语音识别 AppKey"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Token
          </label>
          <input
            type="password"
            value={config.token}
            onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
            placeholder="请输入阿里云语音识别 Token"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            disabled={loading}
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={saveConfig}
          disabled={loading || !config.appkey.trim() || !config.token.trim()}
          className="flex-1 px-4 py-3 bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-200/50"
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
            <p className="font-medium">如何获取配置信息：</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>登录阿里云控制台</li>
              <li>进入智能语音交互产品页面</li>
              <li>创建项目并获取 AppKey</li>
              <li>在项目设置中获取 Token</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
