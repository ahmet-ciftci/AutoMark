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
        return <p>Yardım içeriği mevcut değil.</p>;
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
        helpContent={getHelpContent()}
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
