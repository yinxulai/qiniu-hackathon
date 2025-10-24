import React, { useState } from 'react'
import { Card, Button, TextInput, Select, Switch, Modal } from '../../../components/ui'

interface Provider {
  id: string
  name: string
  type: 'openai' | 'anthropic' | 'azure' | 'custom'
  endpoint?: string
  apiKey: string
  model: string
  enabled: boolean
  config?: {
    maxTokens?: number
    temperature?: number
    topP?: number
  }
}

const PROVIDER_TYPES = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'custom', label: '自定义' }
]

const DEFAULT_MODELS: Record<Provider['type'], string[]> = {
  openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
  azure: ['gpt-4', 'gpt-35-turbo'],
  custom: []
}

export function ProviderManager() {
  const [providers, setProviders] = useState<Provider[]>([
    {
      id: '1',
      name: 'OpenAI GPT-4',
      type: 'openai',
      apiKey: 'sk-...',
      model: 'gpt-4',
      enabled: true,
      config: {
        maxTokens: 4000,
        temperature: 0.7,
        topP: 1
      }
    },
    {
      id: '2',
      name: 'Claude 3 Opus',
      type: 'anthropic',
      apiKey: 'sk-ant-...',
      model: 'claude-3-opus-20240229',
      enabled: false,
      config: {
        maxTokens: 4000,
        temperature: 0.7
      }
    }
  ])

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [newProvider, setNewProvider] = useState({
    name: '',
    type: 'openai' as Provider['type'],
    endpoint: '',
    apiKey: '',
    model: '',
    maxTokens: 4000,
    temperature: 0.7,
    topP: 1
  })

  const handleToggleProvider = (id: string) => {
    setProviders(providers.map(provider => 
      provider.id === id 
        ? { ...provider, enabled: !provider.enabled }
        : provider
    ))
  }

  const handleDeleteProvider = (id: string) => {
    setProviders(providers.filter(provider => provider.id !== id))
  }

  const handleAddProvider = () => {
    if (!newProvider.name || !newProvider.apiKey || !newProvider.model) return

    const provider: Provider = {
      id: Date.now().toString(),
      name: newProvider.name,
      type: newProvider.type,
      endpoint: newProvider.endpoint || undefined,
      apiKey: newProvider.apiKey,
      model: newProvider.model,
      enabled: false,
      config: {
        maxTokens: newProvider.maxTokens,
        temperature: newProvider.temperature,
        topP: newProvider.topP
      }
    }

    setProviders([...providers, provider])
    resetForm()
    setIsAddModalOpen(false)
  }

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider)
    setNewProvider({
      name: provider.name,
      type: provider.type,
      endpoint: provider.endpoint || '',
      apiKey: provider.apiKey,
      model: provider.model,
      maxTokens: provider.config?.maxTokens || 4000,
      temperature: provider.config?.temperature || 0.7,
      topP: provider.config?.topP || 1
    })
    setIsAddModalOpen(true)
  }

  const handleUpdateProvider = () => {
    if (!editingProvider || !newProvider.name || !newProvider.apiKey || !newProvider.model) return

    const updatedProvider: Provider = {
      ...editingProvider,
      name: newProvider.name,
      type: newProvider.type,
      endpoint: newProvider.endpoint || undefined,
      apiKey: newProvider.apiKey,
      model: newProvider.model,
      config: {
        maxTokens: newProvider.maxTokens,
        temperature: newProvider.temperature,
        topP: newProvider.topP
      }
    }

    setProviders(providers.map(provider => 
      provider.id === editingProvider.id ? updatedProvider : provider
    ))
    resetForm()
    setIsAddModalOpen(false)
    setEditingProvider(null)
  }

  const resetForm = () => {
    setNewProvider({
      name: '',
      type: 'openai',
      endpoint: '',
      apiKey: '',
      model: '',
      maxTokens: 4000,
      temperature: 0.7,
      topP: 1
    })
  }

  const getProviderIcon = (type: Provider['type']) => {
    switch (type) {
      case 'openai':
        return '🤖'
      case 'anthropic':
        return '🔮'
      case 'azure':
        return '☁️'
      case 'custom':
        return '⚙️'
      default:
        return '❓'
    }
  }

  const maskApiKey = (apiKey: string) => {
    if (apiKey.length <= 8) return '*'.repeat(apiKey.length)
    return apiKey.slice(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.slice(-4)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">模型供应商管理</h3>
          <p className="text-sm text-white/60 mt-1">
            配置和管理AI模型提供商
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingProvider(null)
            resetForm()
            setIsAddModalOpen(true)
          }}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          添加供应商
        </Button>
      </div>

      <div className="space-y-3">
        {providers.map((provider) => (
          <Card key={provider.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getProviderIcon(provider.type)}</span>
                  <div>
                    <h4 className="font-medium text-white">{provider.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-white/10 rounded text-white/70">
                        {PROVIDER_TYPES.find(t => t.value === provider.type)?.label}
                      </span>
                      <span className="text-xs text-white/60">{provider.model}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-white/60 space-y-1">
                  <div><span className="text-white/40">API Key:</span> {maskApiKey(provider.apiKey)}</div>
                  {provider.endpoint && (
                    <div><span className="text-white/40">Endpoint:</span> {provider.endpoint}</div>
                  )}
                  <div className="flex gap-4">
                    <span><span className="text-white/40">最大Token:</span> {provider.config?.maxTokens || 'N/A'}</span>
                    <span><span className="text-white/40">温度:</span> {provider.config?.temperature || 'N/A'}</span>
                    {provider.config?.topP && (
                      <span><span className="text-white/40">Top P:</span> {provider.config.topP}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={provider.enabled}
                  onChange={() => handleToggleProvider(provider.id)}
                />
                <Button
                  size="sm"
                  onClick={() => handleEditProvider(provider)}
                  icon={
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                />
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteProvider(provider.id)}
                  icon={
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                />
              </div>
            </div>
          </Card>
        ))}

        {providers.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-white/40">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">暂无模型供应商</p>
              <p className="text-xs mt-1">点击上方按钮添加新的供应商</p>
            </div>
          </Card>
        )}
      </div>

      {/* 添加/编辑供应商模态框 */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingProvider(null)
        }}
        title={editingProvider ? '编辑供应商' : '添加供应商'}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                供应商名称
              </label>
              <TextInput
                value={newProvider.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProvider({ ...newProvider, name: e.target.value })}
                placeholder="例如: OpenAI GPT-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                供应商类型
              </label>
              <Select
                value={newProvider.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewProvider({ ...newProvider, type: e.target.value as Provider['type'], model: '' })}
              >
                {PROVIDER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {(newProvider.type === 'azure' || newProvider.type === 'custom') && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                API Endpoint
              </label>
              <TextInput
                value={newProvider.endpoint}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProvider({ ...newProvider, endpoint: e.target.value })}
                placeholder="https://your-endpoint.com/v1"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              API Key
            </label>
            <TextInput
              type="password"
              value={newProvider.apiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              模型
            </label>
            {DEFAULT_MODELS[newProvider.type].length > 0 ? (
              <Select
                value={newProvider.model}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewProvider({ ...newProvider, model: e.target.value })}
                placeholder="选择模型"
              >
                {DEFAULT_MODELS[newProvider.type].map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </Select>
            ) : (
              <TextInput
                value={newProvider.model}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProvider({ ...newProvider, model: e.target.value })}
                placeholder="输入模型名称"
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                最大Token数
              </label>
              <TextInput
                type="number"
                value={newProvider.maxTokens.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProvider({ ...newProvider, maxTokens: parseInt(e.target.value) || 4000 })}
                placeholder="4000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                温度 (0-1)
              </label>
              <TextInput
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={newProvider.temperature.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProvider({ ...newProvider, temperature: parseFloat(e.target.value) || 0.7 })}
                placeholder="0.7"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Top P (0-1)
              </label>
              <TextInput
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={newProvider.topP.toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProvider({ ...newProvider, topP: parseFloat(e.target.value) || 1 })}
                placeholder="1"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="primary"
              onClick={editingProvider ? handleUpdateProvider : handleAddProvider}
              className="flex-1"
            >
              {editingProvider ? '更新' : '添加'}
            </Button>
            <Button
              onClick={() => {
                setIsAddModalOpen(false)
                setEditingProvider(null)
              }}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
