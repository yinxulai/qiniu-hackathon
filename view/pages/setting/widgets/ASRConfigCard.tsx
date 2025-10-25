import React, { useState, useEffect } from 'react'
import { getSavedASRConfig, saveASRConfig, clearASRConfig, hasValidASRConfig } from '../../../services/asr-config'

interface ASRConfig {
  appkey: string
  token: string
}

export function ASRConfigCard() {
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

  const loadConfig = () => {
    // 使用新的配置工具函数加载配置
    const savedConfig = getSavedASRConfig()
    if (savedConfig) {
      setConfig({
        appkey: savedConfig.appkey,
        token: savedConfig.token
      })
    }
    
    // 检查是否有有效配置
    setHasValidConfig(hasValidASRConfig())
  }

  const saveConfig = async () => {
    if (!config.appkey.trim() || !config.token.trim()) {
      setMessage({ type: 'error', text: '请填写完整的 AppKey 和 Token' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // 使用新的配置工具函数保存配置
      saveASRConfig({
        appkey: config.appkey.trim(),
        token: config.token.trim()
      })
      
      setMessage({ type: 'success', text: '语音识别配置已保存，重新连接后生效' })
      
      // 更新配置状态
      setHasValidConfig(true)
      
      // 3秒后清除消息
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save ASR config:', error)
      setMessage({ type: 'error', text: '保存配置失败' })
    } finally {
      setLoading(false)
    }
  }

  const resetConfig = () => {
    setConfig({
      appkey: '',
      token: ''
    })
    clearASRConfig()
    setHasValidConfig(false)
    setMessage({ type: 'success', text: '配置已重置' })
    setTimeout(() => setMessage(null), 3000)
  }

  const testConnection = async () => {
    if (!config.appkey.trim() || !config.token.trim()) {
      setMessage({ type: 'error', text: '请先填写 AppKey 和 Token' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // 先保存配置（临时）
      const tempConfig = {
        appkey: config.appkey.trim(),
        token: config.token.trim()
      }
      
      // 创建临时的 ASRManager 进行测试
      const { ASRManager } = await import('../../../services/asr-manager.js')
      const testManager = new ASRManager(tempConfig)
      
      // 尝试连接
      await testManager.connect()
      
      // 连接成功，断开连接
      testManager.disconnect()
      
      setMessage({ type: 'success', text: '语音识别服务连接正常！' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('ASR connection test failed:', error)
      setMessage({ 
        type: 'error', 
        text: `连接测试失败：${error instanceof Error ? error.message : '未知错误'}` 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-emerald-100/50 p-6 md:p-8">
      {/* 卡片头部 */}
      <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">语音识别配置</h2>
          <p className="text-sm md:text-base text-gray-600">配置阿里云语音识别服务</p>
        </div>
        {/* 配置状态指示器 */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          hasValidConfig 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-amber-100 text-amber-800 border border-amber-200'
        }`}>
          {hasValidConfig ? '已配置' : '未配置'}
        </div>
      </div>

      {/* 配置表单 */}
      <div className="space-y-4 md:space-y-6">
        {/* AppKey 配置 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            AppKey
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={config.appkey}
            onChange={(e) => setConfig(prev => ({ ...prev, appkey: e.target.value }))}
            placeholder="请输入阿里云语音识别的 AppKey"
            className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          />
          <p className="text-xs text-gray-500">
            在阿里云语音服务控制台获取您的 AppKey
          </p>
        </div>

        {/* Token 配置 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Token
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="password"
            value={config.token}
            onChange={(e) => setConfig(prev => ({ ...prev, token: e.target.value }))}
            placeholder="请输入阿里云语音识别的 Token"
            className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          />
          <p className="text-xs text-gray-500">
            在阿里云语音服务控制台获取您的访问令牌
          </p>
        </div>
      </div>

      {/* 状态消息 */}
      {message && (
        <div className={`mt-4 p-3 rounded-xl text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-8">
        <button
          onClick={saveConfig}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              保存中...
            </div>
          ) : (
            '保存配置'
          )}
        </button>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-white/70 text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          测试连接
        </button>
        
        <button
          onClick={resetConfig}
          disabled={loading}
          className="flex-1 sm:flex-none px-6 py-3 bg-white/70 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          重置
        </button>
      </div>

      {/* 帮助信息 */}
      <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
        <h3 className="text-sm font-medium text-blue-800 mb-2">配置说明</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 请确保您已开通阿里云语音识别服务</li>
          <li>• AppKey 和 Token 可在阿里云控制台的语音服务页面获取</li>
          <li>• 配置保存后，语音识别功能将使用新的凭据</li>
          <li>• 建议定期更新 Token 以确保安全性</li>
        </ul>
      </div>
    </div>
  )
}
