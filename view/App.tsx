import React, { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

import PanelPage from './pages/panel/PanelPage.js'
import DebugPage from './pages/debug/DebugPage.js'
import SettingPage from './pages/setting/SettingPage.js'

export default function AppRouter() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash.slice(1) || '/')

  useEffect(() => {
    // 监听来自主进程的导航事件
    const handleNavigate = (route: string) => {
      setCurrentRoute(route)
      // 更新hash路由
      window.location.hash = route
    }

    window.electronAPI?.onNavigate?.(handleNavigate)

    return () => {
      window.electronAPI?.removeNavigateListener?.()
    }
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/panel" replace />} />
        <Route path="/panel" element={<PanelPage />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/setting" element={<SettingPage />} />
      </Routes>
    </HashRouter>
  )
}
