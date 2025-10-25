import React, { useState, useEffect } from 'react'
import { getAgentConfig, updateAgentConfig } from '../../../apis/sdk.gen'

interface AgentConfig {
  apiKey: string
  baseUrl: string
  modelId: string
  systemPrompt?: string
}

export function ModelProviderCard() {
  const [config, setConfig] = useState<AgentConfig>({
    apiKey: '',
    baseUrl: '',
    modelId: '',
    systemPrompt: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 加载配置
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await getAgentConfig()
      if (response.data?.data) {
        setConfig({
          apiKey: response.data.data.apiKey || '',
          baseUrl: response.data.data.baseUrl || '',
          modelId: response.data.data.modelId || '',
          systemPrompt: response.data.data.systemPrompt || ''
        })
      }
    } catch (error) {
      console.error('Failed to load config:', error)
      showMessage('error', '加载配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: any = {
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        modelId: config.modelId
      }
      
      if (config.systemPrompt) {
        body.systemPrompt = config.systemPrompt
      }
      
      await updateAgentConfig({ body })
      showMessage('success', '配置已保存')
    } catch (error) {
      console.error('Failed to save config:', error)
      showMessage('error', '保存配置失败')
    } finally {
      setSaving(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 p-8 space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-linear-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-200/50">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">AI 模型配置</h2>
          <p className="text-sm text-gray-600">配置您的 AI 模型服务提供商</p>
        </div>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          API Key
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            className="w-full px-4 py-3 pr-12 bg-white/80 border-2 border-emerald-200/50 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
            placeholder="请输入 API Key"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
          >
            {showApiKey ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Base URL */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Base URL
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          value={config.baseUrl}
          onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
          className="w-full px-4 py-3 bg-white/80 border-2 border-emerald-200/50 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
          placeholder="https://api.openai.com/v1"
        />
      </div>

      {/* Model ID */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Model ID
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          value={config.modelId}
          onChange={(e) => setConfig({ ...config, modelId: e.target.value })}
          className="w-full px-4 py-3 bg-white/80 border-2 border-emerald-200/50 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
          placeholder="gpt-4-turbo-preview"
        />
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          系统提示词
          <span className="text-gray-400 text-xs ml-2">(可选)</span>
        </label>
        <textarea
          value={config.systemPrompt}
          onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 bg-white/80 border-2 border-emerald-200/50 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none resize-none"
          placeholder="设置 AI 助手的行为和角色..."
        />
      </div>

      {/* 保存按钮 */}
      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleSave}
          disabled={saving || !config.apiKey || !config.baseUrl || !config.modelId}
          className="flex-1 px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              保存中...
            </span>
          ) : (
            '保存配置'
          )}
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-xl border-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        } flex items-center gap-3 animate-fade-in`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}
    </div>
  )
}
