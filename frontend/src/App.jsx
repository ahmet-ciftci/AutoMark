import { useState, useEffect } from 'react'
import MenuBar from './components/layout/MenuBar'
import Sidebar from './components/layout/Sidebar'
import MainContent from './components/layout/MainContent'
import ConfigEditor from './components/views/ConfigEditor'
import ProjectCreation from './components/views/ProjectCreation'
import ReportsView from './components/views/ReportsView'
import FileExplorer from './components/views/FileExplorer'
import OpenProject from './components/views/OpenProject'; 

const initialProjectCreationFormData = {
  project_name: '',
  submissions_directory: '',
  selectedLanguage: '', 
  selectedConfigId: null,
  input_generation_method: 'manual',
  input: '',
  expected_output_generation_method: 'manual',
  expected_output: '',
  manualInput: '',
  inputScriptCommand: '',
  inputScriptFilePath: '',
  combinedInputScriptCommand: '', 
  inputFilePath: '',
  manualExpectedOutput: '',
  expectedOutputScriptCommand: '',
  expectedOutputScriptFilePath: '',
  combinedExpectedOutputScriptCommand: '',
  expectedOutputFilePath: '',
};

function App() {
  const [activeView, setActiveView] = useState('project')
  const [selectedLanguageForEditor, setSelectedLanguageForEditor] = useState('Java')
  const [key, setKey] = useState(0)
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [projectCreationFormData, setProjectCreationFormData] = useState(initialProjectCreationFormData);

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
    // Optionally reset form data when "New Project" is explicitly chosen from menu
    // setProjectCreationFormData(initialProjectCreationFormData); 
    switchView('project')
  }
  
  // Handler for the Edit button in ProjectCreation
  const onEditLanguage = (langName) => { // langName is the config_name
    setSelectedLanguageForEditor(langName)
    switchView('config')
  }

  // Handler for the New button in ProjectCreation
  const onNewLanguageConfig = () => {
    setSelectedLanguageForEditor(null); // Set language to null to indicate a new config
    switchView('config');
  };
  // Handler for project creation
  const [projectId, setProjectId] = useState(null);
  const onCreateProject = async ({ project, testConfig }) => {
    try {
      const newProjectId = await window.electron.addProject(project);
      setProjectId(newProjectId); 
      
      await window.electron.addTestConfig(newProjectId, testConfig);
      await window.electron.extractSubmissions(newProjectId, project.submissions_path);
      await window.electron.compileSubmissions(newProjectId);
      await window.electron.runSubmissions(newProjectId);
      await window.electron.compareOutputs(newProjectId);
  
      console.log("Project Handled.");
      console.log("Project ID:", newProjectId);
      setProjectCreationFormData(initialProjectCreationFormData); // Reset form on success
      switchView('reports');
  
    } catch (err) {
      console.error("Error while project creation:", err);
      alert("An error occured: " + err.message);
    }
  };
  
  // Configuration handlers
  const onCancelConfig = () => {
    switchView('project')
  }
  
  const onSaveConfig = (updatedConfig) => {
    // Update projectCreationFormData to select the newly saved/edited config
    setProjectCreationFormData(prevData => ({
      ...prevData,
      selectedLanguage: updatedConfig.config_name,
      selectedConfigId: updatedConfig.id,
    }));
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
                 selectedLanguage={selectedLanguageForEditor} 
                 onCancelConfig={onCancelConfig}
                 onSaveConfig={onSaveConfig}
               />
      case 'project':
        return <ProjectCreation 
                 formData={projectCreationFormData}
                 setFormData={setProjectCreationFormData}
                 initialFormData={initialProjectCreationFormData}
                 onEditLang={onEditLanguage}
                 onCreateProject={onCreateProject}
                 onNewLangConfig={onNewLanguageConfig} 
               />
      case 'reports':
        return <ReportsView projectId={projectId}/>
      case 'fileExplorer':
        return <FileExplorer />
      default:
        return <ReportsView />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-gray-200">
      <MenuBar onNewProject={openNewProject}
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
