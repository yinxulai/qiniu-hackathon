import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

import PanelPage from './pages/panel/PanelPage.js'
import DebugPage from './pages/debug/DebugPage.js'
import { SettingPage } from './pages/setting/SettingPage.js'

export default function AppRouter() {
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
