import { useState, useEffect } from 'react'
import MenuBar from './components/layout/MenuBar'
import Sidebar from './components/layout/Sidebar'
import MainContent from './components/layout/MainContent'
import ConfigEditor from './components/views/ConfigEditor'
import ProjectCreation from './components/views/ProjectCreation'
import ReportsView from './components/views/ReportsView'
import FileExplorer from './components/views/FileExplorer'

function App() {
  const [activeView, setActiveView] = useState('project')
  const [selectedLanguage, setSelectedLanguage] = useState('Java') // Can be null for 'new' config
  const [key, setKey] = useState(0) // For view transitions
  
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark-theme');
    document.body.classList.add('dark-bg');
  }, []);
  
  // Change view with animation
  const switchView = (newView) => {
    setActiveView(newView)
    setKey(prev => prev + 1)
  }
  
  // Menu handlers for opening project
  const openNewProject = () => {
    switchView('project')
  }
  
  // Handler for the Edit button in ProjectCreation
  const onEditLanguage = (lang) => {
    setSelectedLanguage(lang)
    switchView('config')
  }

  // Handler for the New button in ProjectCreation
  const onNewLanguageConfig = () => {
    setSelectedLanguage(null); // Set language to null to indicate a new config
    switchView('config');
  };

  // Handler for project creation
  const onCreateProject = (projectConfig) => {
    switchView('reports')
  }
  
  // Configuration handlers
  const onCancelConfig = () => {
    switchView('project')
  }
  
  const onSaveConfig = (config) => {
    switchView('project')
  }

  // Handle sidebar view changes
  const handleViewChange = (view) => {
    switchView(view)
  }

  // Render the appropriate view based on activeView state
  const renderView = () => {
    switch (activeView) {
      case 'config':
        return <ConfigEditor 
                 selectedLanguage={selectedLanguage} // Pass null if creating new
                 onCancelConfig={onCancelConfig}
                 onSaveConfig={onSaveConfig}
               />
      case 'project':
        return <ProjectCreation 
                 onEditLang={onEditLanguage}
                 onCreateProject={onCreateProject}
                 onNewLangConfig={onNewLanguageConfig} // Pass the new handler
               />
      case 'reports':
        return <ReportsView />
      case 'fileExplorer':
        return <FileExplorer />
      default:
        return <ReportsView />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-gray-200">
      <MenuBar onNewProject={openNewProject} />
      <div className="flex flex-1 overflow-hidden">
        {activeView !== 'project' && activeView !== 'config' && (
          <Sidebar 
            activeView={activeView}
            onViewChange={handleViewChange}
          />
        )}
        <MainContent>
          <div key={key} className="animate-fade-in h-full">
            {renderView()}
          </div>
        </MainContent>
      </div>
    </div>
  )
}

export default App
