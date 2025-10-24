import React from 'react'
import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="h-screen w-full bg-transparent drag-region">
      {/* 主内容区域 - 取消拖拽以允许交互 */}
      <div className="h-full w-full no-drag-region">
        <Outlet />
      </div>
    </div>
  )
}

export default Layout
