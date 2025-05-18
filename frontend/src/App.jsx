import { useState, useEffect } from 'react'
import MenuBar from './components/layout/MenuBar'
import Sidebar from './components/layout/Sidebar'
import MainContent from './components/layout/MainContent'
import ConfigEditor from './components/views/ConfigEditor'
import ProjectCreation from './components/views/ProjectCreation'
import ReportsView from './components/views/ReportsView'
import FileExplorer from './components/views/FileExplorer'
import OpenProject from './components/views/OpenProject'; 

function App() {
  const [activeView, setActiveView] = useState('project')
  const [selectedLanguage, setSelectedLanguage] = useState('Java') // Can be null for 'new' config
  const [key, setKey] = useState(0) // For view transitions
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('idle'); // 'idle', 'processing', 'complete', 'error'

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
  const [projectId, setProjectId] = useState(null);
  const onCreateProject = async ({ project, testConfig }) => {
    try {
      setProcessingStatus('processing');
      
      // Step 1: Create the project and get its ID
      const newProjectId = await window.electron.addProject(project);
      setProjectId(newProjectId);
      
      // Step 2: Add test configuration
      await window.electron.addTestConfig(newProjectId, testConfig);
      
      // Step 3: Process the entire project using Processor.js
      const concurrency = 4; // Can be adjusted based on system capabilities
      const results = await window.electron.processProject(
        newProjectId, 
        project.submissions_path, 
        concurrency
      );
      
      console.log("Project processing complete:", results);
      console.log("Project ID:", newProjectId);
      
      setProcessingStatus('complete');
      switchView('reports');
    } catch (err) {
      console.error("Error while processing project:", err);
      setProcessingStatus('error');
      alert("An error occurred: " + err.message);
    }
  };
  
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

  const onSelectExistingProject = async (projectId) => {
    try {
      const project = await window.electron.getProjectById(projectId);
      console.log("Selected project:", project);
  
      setProjectId(projectId);
      setShowOpenModal(false);
      switchView('reports');
    } catch (err) {
      console.error("Error loading project:", err);
      alert("Could not load project.");
    }
  };

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
                 processingStatus={processingStatus}
               />
      case 'reports':
        return <ReportsView projectId={projectId}/>
      case 'fileExplorer':
        return <FileExplorer projectId={projectId} />
      default:
        return <ReportsView />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-gray-200">
      <MenuBar 
        onNewProject={openNewProject}
        onOpenProject={() => setShowOpenModal(true)}
      />
      
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

      {showOpenModal && (
        <OpenProject
          onSelectProject={onSelectExistingProject}
          onClose={() => setShowOpenModal(false)}
        />
      )} 
    </div>
  )
}

export default App
