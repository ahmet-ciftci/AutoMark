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

      setProjectId(projectId);
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
  

  const getHelpContent = () => {
    switch (activeView) {
      case 'project':
        return (
          <>
            <p><strong>Create a New Project</strong></p>
            <p>This section allows you to start a new project by entering basic information, choosing a configuration, and setting up test cases.</p>

            <p><strong>Steps:</strong></p>
            <ul className="list-disc list-inside">
              <li><strong>Project Name:</strong> Type a name to identify the project.</li>
              <div className="h-4" />
              <li><strong>Submissions Path:</strong> Select the folder containing student submission files (e.g. .zip or folder with .java/.py files).</li>
              <div className="h-4" />
              <li><strong>Configuration:</strong> Choose a pre-defined configuration or create a new one using <em>+ New</em>, edit existing ones, or import/export configs.</li>
              <div className="h-4" />
              <li><strong>Input Method:</strong> Define how test inputs are provided. You can type them manually, upload from a file, or use a script.</li>
              <div className="h-4" />
              <li><strong>Expected Output:</strong> Specify what the correct output should be using the same method (manual, file, or script).</li>
              <div className="h-4" />
              <li><strong>Create Project:</strong> Once everything is set, click this button to initialize the project and begin processing.</li>
              <div className="h-4" />
            </ul>

            <p>If you're unsure about any field, start with a simple input/output test using manual mode.</p>
          </>
        );
      case 'config':
        return (
          <>
            <p><strong>Create or Edit a Configuration</strong></p>
            <p>This section allows you to define how student submissions are compiled and run. Each configuration corresponds to a programming language or environment.</p>

            <div className="h-4" />

            <p><strong>Configuration Name</strong></p>
            <p>Give your configuration a clear name (e.g. "Java 11", "Python 3").</p>

            <div className="h-4" />

            <p><strong>Compile Command</strong></p>
            <p>Specify the command used to compile code (e.g. <code>javac</code> for Java). Leave this empty for interpreted languages like Python.</p>

            <div className="h-4" />

            <p><strong>Source File(s)</strong></p>
            <p>Enter the names of the source files to compile (e.g. <code>Main.java</code>). You can list multiple files separated by spaces.</p>

            <div className="h-4" />

            <p><strong>Compile Params</strong></p>
            <p>Optional: Add any extra flags or parameters to pass during compilation (e.g. <code>-encoding UTF-8</code>).</p>

            <div className="h-4" />

            <p><strong>Run Command</strong></p>
            <p>This is the command to run the compiled program or script. For Java, it could be <code>java Main</code>. For Python, <code>python3 script.py</code>.</p>

            <div className="h-4" />

            <p>Click <strong>Save Configuration</strong> to store your settings. You can then use this configuration when creating a new project.</p>
          </>
        );
      case 'reports':
        return (
          <>
            <p className="text-lg font-semibold text-white">Submission Reports</p>
            <p>This page displays the results of student submissions after testing. Each student receives a percentage score based on how many test cases passed.</p>

            <div className="h-4" />

            <p className="font-semibold text-gray-200">How to Use</p>
            <ul className="list-disc list-inside text-gray-300">
              <li>Select a student from the list on the left.</li>
              <li>The middle column shows the <span className="font-medium text-white">Expected Output</span>.</li>
              <li>The right column shows the <span className="font-medium text-white">Student Output</span>.</li>
            </ul>

            <div className="h-4" />

            <p className="font-semibold text-gray-200">Score</p>
            <p>Each submission is graded as a percentage:</p>
            <ul className="list-disc list-inside text-gray-300">
              <li><span className="text-green-400 font-medium">100%</span>: All outputs matched</li>
              <li><span className="text-yellow-400 font-medium">Partial</span>: Some test cases matched</li>
              <li><span className="text-red-400 font-medium">0%</span>: No outputs matched</li>
            </ul>

            <div className="h-4" />

            <p className="font-semibold text-gray-200">Matches</p>
            <p>The bottom right shows how many test cases matched in the format <code>Matches: X/Y</code> and the final score.</p>

            <div className="h-4" />

            <p className="font-semibold text-gray-200">Exporting</p>
            <p>Click <span className="text-white font-medium">Export Report</span> to download a summary of all student results as a file.</p>
          </>
        );
      case 'fileExplorer':
        return (
          <>
            <p><strong>File Explorer</strong></p>
            <p>This view lets you browse the source code files submitted by students. You can inspect individual files and compare implementations.</p>

            <div className="h-4" />

            <p><strong>How to Use:</strong></p>
            <ul className="list-disc list-inside">
              <li>Folders in the left panel represent individual student submissions.</li>
              <li>Click a folder to expand and view its files.</li>
              <li>Click a file name (e.g. <code>main.c</code>) to view its contents in the right panel.</li>
            </ul>

            <div className="h-4" />

            <p><strong>Tip:</strong></p>
            <p>You can use this panel to manually inspect source code for logic, structure, or plagiarism concerns. However, automated comparison is handled in the Reports section.</p>
          </>

        );
      default:
        return <p>Help</p>;
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
        return <ReportsView projectId={projectId} />
      case 'fileExplorer':
        return <FileExplorer />
      default:
        return <ReportsView />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-gray-200">
      <MenuBar
        onNewProject={openNewProject}
        onOpenProject={() => setShowOpenModal(true)}
      onGoHome={goToWelcomeScreen} // Add this prop
        helpContent={getHelpContent()}
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
