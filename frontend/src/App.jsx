import { useState, useEffect } from 'react'
import MenuBar from './components/layout/MenuBar'
import Sidebar from './components/layout/Sidebar'
import MainContent from './components/layout/MainContent'
import ConfigEditor from './components/views/ConfigEditor'
import ProjectCreation from './components/views/ProjectCreation'
import ReportsView from './components/views/ReportsView'
import FileExplorer from './components/views/FileExplorer'
import OpenProject from './components/views/OpenProject'; 
import WelcomeScreen from './components/views/WelcomeScreen'; // Add this line

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
  const [activeView, setActiveView] = useState('welcome') // Change default view
  const [selectedLanguageForEditor, setSelectedLanguageForEditor] = useState('Java')
  const [key, setKey] = useState(0)
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [projectCreationFormData, setProjectCreationFormData] = useState(initialProjectCreationFormData);
  const [editingProjectId, setEditingProjectId] = useState(null); // Add this line

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

  const goToWelcomeScreen = () => {
    setEditingProjectId(null);
    setProjectCreationFormData(initialProjectCreationFormData);
    switchView('welcome');
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
    console.log('App.jsx: onCreateProject called with data:', { project, testConfig }); // Added console log
    try {
      let currentProjectId = editingProjectId;
      if (editingProjectId) {
        // Update existing project
        await window.electron.updateProject(editingProjectId, project.name, project.config_id, project.submissions_path);
        // Assuming test config might also need update, or a new one if it changed significantly.
        // For simplicity, let's assume we might need to update or add a new one.
        // This might require a more sophisticated check or a dedicated updateTestConfig function if test configs are versioned or complex.
        // For now, let's delete the old one and add the new one.
        // This is a simplification. A real app might need a more robust update strategy.
        const existingTestConfig = await window.electron.getTestConfigByProjectId(editingProjectId);
        if (existingTestConfig) {
          await window.electron.deleteTestConfig(existingTestConfig.id);
        }
        await window.electron.addTestConfig(editingProjectId, testConfig);

      } else {
        // Create new project
        const newProjectId = await window.electron.addProject(project);
        currentProjectId = newProjectId;
        setProjectId(newProjectId);
        await window.electron.addTestConfig(newProjectId, testConfig);
      }
      
      await window.electron.extractSubmissions(currentProjectId, project.submissions_path);
      await window.electron.compileSubmissions(currentProjectId);
      await window.electron.runSubmissions(currentProjectId);
      await window.electron.compareOutputs(currentProjectId);
  
      console.log(editingProjectId ? "Project Updated." : "Project Created.");
      console.log("Project ID:", currentProjectId);
      setProjectCreationFormData(initialProjectCreationFormData); // Reset form
      setEditingProjectId(null); // Reset editing state
      setProjectId(currentProjectId); // Ensure current project ID is set for reports view
      switchView('reports');
  
    } catch (err) {
      console.error(editingProjectId ? "Error while project update:" : "Error while project creation:", err);
      alert("An error occurred: " + err.message);
    }
  };
  
  // Configuration handlers
  const onCancelConfig = () => {
    switchView('project') // Always go back to the project creation/editing screen
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

  const onSelectExistingProject = async (projectIdToOpen) => {
    try {
      const project = await window.electron.getProjectById(projectIdToOpen);
      console.log("Selected project:", project);
  
      setProjectId(projectIdToOpen);
      setEditingProjectId(null); // Clear editing state
      setProjectCreationFormData(initialProjectCreationFormData); // Reset form
      setShowOpenModal(false);
      switchView('reports');
    } catch (err) {
      console.error("Error loading project:", err);
      alert("Could not load project.");
    }
  };

  const handleEditProject = async (projectIdToEdit) => {
    try {
      const projectToEdit = await window.electron.getProjectById(projectIdToEdit);
      const testConfigToEdit = await window.electron.getTestConfigByProjectId(projectIdToEdit);
      
      if (projectToEdit && testConfigToEdit) {
        setProjectCreationFormData({
          project_name: projectToEdit.name,
          submissions_directory: projectToEdit.submissions_path,
          selectedConfigId: projectToEdit.config_id,
          // Assuming you have a way to get config_name from config_id or store it
          // For now, let's try to find it in configurations list if available
          // This part might need adjustment based on how configurations are managed/loaded
          selectedLanguage: '' /* Placeholder, might need to fetch/find config name */, 
          
          input_generation_method: testConfigToEdit.input_method,
          input: testConfigToEdit.input, // This might need to be split back into manualInput, script parts etc.
          manualInput: testConfigToEdit.input_method === 'manual' ? testConfigToEdit.input : '',
          combinedInputScriptCommand: testConfigToEdit.input_method === 'script' ? testConfigToEdit.input : '',
          inputFilePath: testConfigToEdit.input_method === 'file' ? testConfigToEdit.input : '',
          // TODO: Split combined script commands back into command and path if necessary for UI
          inputScriptCommand: '', 
          inputScriptFilePath: '',

          expected_output_generation_method: testConfigToEdit.output_method,
          expected_output: testConfigToEdit.expected_output, // Similar to input, might need splitting
          manualExpectedOutput: testConfigToEdit.output_method === 'manual' ? testConfigToEdit.expected_output : '',
          combinedExpectedOutputScriptCommand: testConfigToEdit.output_method === 'script' ? testConfigToEdit.expected_output : '',
          expectedOutputFilePath: testConfigToEdit.output_method === 'file' ? testConfigToEdit.expected_output : '',
          // TODO: Split combined script commands back into command and path
          expectedOutputScriptCommand: '',
          expectedOutputScriptFilePath: '',
        });
        // Fetch and set the config name for display
        if (projectToEdit.config_id) {
          const configs = await window.electron.getConfigurations();
          const selectedConfig = configs.find(c => c.config_id === projectToEdit.config_id);
          if (selectedConfig) {
            setProjectCreationFormData(prev => ({...prev, selectedLanguage: selectedConfig.config_name}));
          }
        }

        setEditingProjectId(projectIdToEdit);
        switchView('project');
      } else {
        throw new Error("Project or TestConfig not found for editing.");
      }
    } catch (err) {
      console.error("Error preparing project for editing:", err);
      alert("Could not load project data for editing.");
    }
  };
  

  // Render the appropriate view based on activeView state
  const renderView = () => {
    switch (activeView) {
      case 'welcome': // Add this case
        return <WelcomeScreen 
                  onOpenProject={onSelectExistingProject} 
                  onEditProject={handleEditProject} 
                  onNewProjectClick={openNewProject} // Pass openNewProject here
                />;
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
                 isEditing={!!editingProjectId} // Pass isEditing prop
                 onCancel={() => goToWelcomeScreen()} // Pass cancel handler
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
      onGoHome={goToWelcomeScreen} // Add this prop
        />
      
      <div className="flex flex-1 overflow-hidden">
        {activeView !== 'project' && activeView !== 'config' && activeView !== 'welcome' && (
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
