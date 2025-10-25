import React, { useState, useEffect } from 'react'
import {
  listMcpServer,
  createMcpServer,
  updateMcpServer,
  enableMcpServer,
  disableMcpServer,
  deleteMcpServer
} from '../../../apis/sdk.gen'

interface MCPServer {
  id: string
  name: string
  transport: 'stdio' | 'sse'
  enabled: boolean
  config: {
    command?: string
    args?: string[]
    url?: string
    env?: Record<string, string>
  }
}

interface CreateServerForm {
  name: string
  transport: 'stdio' | 'sse'
  command: string
  args: string
  url: string
  env: string
}

export function MCPConnectionCard() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null)
  const [formData, setFormData] = useState<CreateServerForm>({
    name: '',
    transport: 'stdio',
    command: '',
    args: '',
    url: '',
    env: ''
  })

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    setLoading(true)
    try {
      const response = await listMcpServer()
      if (response.data?.data?.list) {
        setServers(response.data.data.list as MCPServer[])
      }
    } catch (error) {
      console.error('Failed to load servers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      let config: any
      if (formData.transport === 'stdio') {
        config = { 
          command: formData.command, 
          args: formData.args.split(' ').filter(Boolean) 
        }
        // 处理环境变量
        if (formData.env.trim()) {
          try {
            config.env = JSON.parse(formData.env)
          } catch (error) {
            // 如果 JSON 解析失败，尝试简单的键值对格式
            const envObj: Record<string, string> = {}
            formData.env.split('\n').forEach(line => {
              const [key, ...valueParts] = line.split('=')
              if (key && valueParts.length > 0) {
                envObj[key.trim()] = valueParts.join('=').trim()
              }
            })
            config.env = envObj
          }
        }
      } else {
        config = { url: formData.url }
      }

      await createMcpServer({
        body: {
          name: formData.name,
          transport: formData.transport,
          config
        }
      })

      setShowCreateModal(false)
      resetForm()
      loadServers()
    } catch (error) {
      console.error('Failed to create server:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingServer) return

    try {
      let config: any
      if (formData.transport === 'stdio') {
        config = { 
          command: formData.command, 
          args: formData.args.split(' ').filter(Boolean) 
        }
        // 处理环境变量
        if (formData.env.trim()) {
          try {
            config.env = JSON.parse(formData.env)
          } catch (error) {
            // 如果 JSON 解析失败，尝试简单的键值对格式
            const envObj: Record<string, string> = {}
            formData.env.split('\n').forEach(line => {
              const [key, ...valueParts] = line.split('=')
              if (key && valueParts.length > 0) {
                envObj[key.trim()] = valueParts.join('=').trim()
              }
            })
            config.env = envObj
          }
        }
      } else {
        config = { url: formData.url }
      }

      await updateMcpServer({
        body: {
          id: editingServer.id,
          name: formData.name,
          transport: formData.transport,
          config
        }
      })

      setEditingServer(null)
      resetForm()
      loadServers()
    } catch (error) {
      console.error('Failed to update server:', error)
    }
  }

  const handleToggleEnabled = async (server: MCPServer) => {
    try {
      if (server.enabled) {
        await disableMcpServer({ body: { id: server.id } })
      } else {
        await enableMcpServer({ body: { id: server.id } })
      }
      loadServers()
    } catch (error) {
      console.error('Failed to toggle server:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此 MCP 服务器吗？')) return

    try {
      await deleteMcpServer({ body: { id } })
      loadServers()
    } catch (error) {
      console.error('Failed to delete server:', error)
    }
  }

  const openEditModal = (server: MCPServer) => {
    setEditingServer(server)
    // 将环境变量转换为 JSON 字符串或简单的键值对格式
    let envString = ''
    if (server.config.env) {
      try {
        envString = JSON.stringify(server.config.env, null, 2)
      } catch {
        // 如果不是有效的 JSON，就用简单格式
        envString = Object.entries(server.config.env)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n')
      }
    }
    
    setFormData({
      name: server.name,
      transport: server.transport,
      command: server.config.command || '',
      args: server.config.args?.join(' ') || '',
      url: server.config.url || '',
      env: envString
    })
    setShowCreateModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      transport: 'stdio',
      command: '',
      args: '',
      url: '',
      env: ''
    })
    setEditingServer(null)
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100/50 p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-linear-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-200/50">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">MCP 服务器管理</h2>
              <p className="text-sm text-gray-600">管理您的 Model Context Protocol 连接</p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true) }}
            className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">添加服务器</span>
            <span className="sm:hidden">添加</span>
          </button>
        </div>

        {/* 服务器列表 */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : servers.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 text-lg">暂无 MCP 服务器</p>
            <p className="text-gray-400 text-sm mt-2">点击上方按钮添加您的第一个服务器</p>
          </div>
        ) : (
          <div className="space-y-4">
            {servers.map((server) => (
              <div
                key={server.id}
                className="bg-white/80 rounded-2xl border-2 border-emerald-100/50 p-4 md:p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                      <h3 className="text-base md:text-lg font-bold text-gray-800 truncate">{server.name}</h3>
                      <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                        server.transport === 'stdio'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {server.transport.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleToggleEnabled(server)}
                        className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                          server.enabled
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {server.enabled ? '已启用' : '已禁用'}
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      {server.transport === 'stdio' ? (
                        <>
                          <div className="flex flex-col sm:flex-row sm:gap-2">
                            <span className="font-medium min-w-20 shrink-0">命令:</span>
                            <code className="flex-1 bg-gray-100 px-2 py-1 rounded text-xs break-all">{server.config.command}</code>
                          </div>
                          {server.config.args && server.config.args.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:gap-2">
                              <span className="font-medium min-w-20 shrink-0">参数:</span>
                              <code className="flex-1 bg-gray-100 px-2 py-1 rounded text-xs break-all">{server.config.args.join(' ')}</code>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:gap-2">
                          <span className="font-medium min-w-20 shrink-0">URL:</span>
                          <code className="flex-1 bg-gray-100 px-2 py-1 rounded text-xs break-all">{server.config.url}</code>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(server)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="编辑"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(server.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="删除"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建/编辑模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                  {editingServer ? '编辑 MCP 服务器' : '添加 MCP 服务器'}
                </h3>
                <button
                  onClick={() => { setShowCreateModal(false); resetForm() }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 左侧：基本信息 */}
                <div className="space-y-6">
                  {/* 服务器名称 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      服务器名称
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white border-2 border-emerald-200/50 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                      placeholder="输入服务器名称"
                    />
                  </div>

                  {/* 传输协议 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">传输协议</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-3 p-4 border-2 border-emerald-200/50 rounded-xl cursor-pointer hover:bg-emerald-50/50 transition-all">
                        <input
                          type="radio"
                          value="stdio"
                          checked={formData.transport === 'stdio'}
                          onChange={(e) => setFormData({ ...formData, transport: e.target.value as 'stdio' })}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <div>
                          <div className="font-semibold text-gray-800">STDIO</div>
                          <div className="text-xs text-gray-600">标准输入输出</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-4 border-2 border-emerald-200/50 rounded-xl cursor-pointer hover:bg-emerald-50/50 transition-all">
                        <input
                          type="radio"
                          value="sse"
                          checked={formData.transport === 'sse'}
                          onChange={(e) => setFormData({ ...formData, transport: e.target.value as 'sse' })}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <div>
                          <div className="font-semibold text-gray-800">SSE</div>
                          <div className="text-xs text-gray-600">服务器推送事件</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 右侧：配置信息 */}
                <div className="space-y-6">
                  {/* STDIO 配置 */}
                  {formData.transport === 'stdio' && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          命令
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.command}
                          onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                          className="w-full px-4 py-3 bg-white border-2 border-emerald-200/50 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                          placeholder="node"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">参数</label>
                        <textarea
                          value={formData.args}
                          onChange={(e) => setFormData({ ...formData, args: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 bg-white border-2 border-emerald-200/50 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none resize-none"
                          placeholder="server.js --port 3000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          环境变量
                          <span className="text-gray-500 text-xs ml-2">(可选，JSON格式或键=值格式)</span>
                        </label>
                        <textarea
                          value={formData.env}
                          onChange={(e) => setFormData({ ...formData, env: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 bg-white border-2 border-emerald-200/50 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none resize-none font-mono text-sm"
                          placeholder={`示例 JSON 格式：
{
  "NODE_ENV": "production",
  "API_KEY": "your-key"
}

或键=值格式：
NODE_ENV=production
API_KEY=your-key`}
                        />
                      </div>
                    </>
                  )}

                  {/* SSE 配置 */}
                  {formData.transport === 'sse' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        服务器 URL
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-emerald-200/50 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                        placeholder="https://example.com/sse"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={() => { setShowCreateModal(false); resetForm() }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={editingServer ? handleUpdate : handleCreate}
                  disabled={!formData.name || (formData.transport === 'stdio' ? !formData.command : !formData.url)}
                  className="flex-1 px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  {editingServer ? '保存' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
