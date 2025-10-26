import React from 'react'
import InputPanel from './widgets/InputPanel.js'
import TaskPanel from './widgets/TaskPanel.js'

interface PanelPageProps {}

function PanelPage({}: PanelPageProps) {
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">

        <div className="mt-4 space-y-3">
          <InputPanel />
        </div>
        <div className="mt-4 space-y-3">
          <TaskPanel />
        </div>
      </div>
    </div>
  )
}

export default PanelPage
