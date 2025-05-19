import { useState, useEffect, useRef } from 'react' // Added useRef
import MenuBar from './components/layout/MenuBar'
import Sidebar from './components/layout/Sidebar'
import MainContent from './components/layout/MainContent'
import ConfigEditor from './components/views/ConfigEditor'
import ProjectCreation from './components/views/ProjectCreation'
import ReportsView from './components/views/ReportsView'
import FileExplorer from './components/views/FileExplorer'
import OpenProject from './components/views/OpenProject'
import { FaSpinner, FaClock } from 'react-icons/fa' // Added FaClock

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
  const [processingStatus, setProcessingStatus] = useState('idle'); // 'idle', 'processing', 'complete', 'error'
  const [processingDetails, setProcessingDetails] = useState({
    message: 'Initializing...',
    progress: 0,
    total: 0
  });
  
  // Time-to-live state
  const [ttlRemaining, setTtlRemaining] = useState(30); // 30 seconds default
  const timerRef = useRef(null);
  const [projectCreationFormData, setProjectCreationFormData] = useState(initialProjectCreationFormData);
  const [editingProjectId, setEditingProjectId] = useState(null); // Add this line

  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark-theme');
    document.body.classList.add('dark-bg');
  }, []);
  
  // TTL timer effect
  useEffect(() => {
    if (processingStatus === 'processing') {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Reset TTL to 30 seconds
      setTtlRemaining(30);
      
      // Set up a countdown timer
      timerRef.current = setInterval(() => {
        setTtlRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Clear timer when not processing
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [processingStatus]);
  
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
    console.log('App.jsx: onCreateProject called with data:', { project, testConfig });
    try {
      setProcessingStatus('processing');
      setProcessingDetails({
        message: 'Creating project and setting up configurations...',
        progress: 0,
        total: 100
      });

      let currentProjectId = editingProjectId;
      if (editingProjectId) {
        // Update existing project
        setProcessingDetails({
          message: 'Updating existing project...',
          progress: 10,
          total: 100
        });
        
        await window.electron.updateProject(editingProjectId, project.name, project.config_id, project.submissions_path);
        const existingTestConfig = await window.electron.getTestConfigByProjectId(editingProjectId);
        if (existingTestConfig) {
          await window.electron.deleteTestConfig(existingTestConfig.id);
        }
        await window.electron.addTestConfig(editingProjectId, testConfig);
      } else {
        // Create new project
        setProcessingDetails({
          message: 'Creating new project...',
          progress: 10,
          total: 100
        });
        
        const newProjectId = await window.electron.addProject(project);
        currentProjectId = newProjectId;
        setProjectId(newProjectId);
        await window.electron.addTestConfig(newProjectId, testConfig);
      }

      setProcessingDetails({
        message: 'Processing submissions...',
        progress: 30,
        total: 100
      });

      // Process project with concurrency
      const concurrency = 4;
      const results = await window.electron.processProject(
        currentProjectId,
        project.submissions_path,
        concurrency
      );

      console.log(editingProjectId ? "Project Updated." : "Project Created.");
      console.log("Project ID:", currentProjectId);

      setProcessingDetails({
        message: 'Finalizing...',
        progress: 90,
        total: 100
      });

      // Reset states and switch view
      setProjectCreationFormData(initialProjectCreationFormData);
      setEditingProjectId(null);
      setProjectId(currentProjectId);

      // Small delay to show completion
      setTimeout(() => {
        setProcessingStatus('complete');
        switchView('reports');
      }, 800);

    } catch (err) {
      console.error(editingProjectId ? "Error while project update:" : "Error while project creation:", err);
      setProcessingStatus('error');
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
      if (!projectIdToOpen) {
        console.error("Invalid project ID");
        return;
      }

      const project = await window.electron.getProjectById(projectIdToOpen);
      
      if (!project) {
        console.error("Project not found:", projectIdToOpen);
        alert("Could not load project. The project may have been deleted.");
        return;
      }
      
      console.log("Selected project:", project);
  
      // Update the projectId state which is used by ReportsView and FileExplorer
      setProjectId(projectIdToOpen);
      
      // Clear editing state
      setEditingProjectId(null);
      
      // Reset form data
      setProjectCreationFormData(initialProjectCreationFormData);
      
      // Close modal if it's open
      setShowOpenModal(false);
      
      // Switch view to reports
      switchView('reports');
    } catch (err) {
      console.error("Error loading project:", err);
      alert(`Error loading project: ${err.message || "Unknown error"}`);
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
        return (
          <>
            <p><strong>Welcome to AutoMark!</strong></p>
            <div className="h-4" />
            <p>This is the home screen where you can view, edit, or manage all existing projects.</p>
            <div className="h-4" />
            <p><strong>Available Actions:</strong></p>
            <ul className="list-disc list-inside">
              <li><strong>New Project:</strong> Create a new project from scratch.</li>
              <li><strong>Edit:</strong> Modify the configuration or details of an existing project.</li>
              <li><strong>Delete:</strong> Permanently remove a project.</li>
              <li><strong>Open:</strong> Navigate to project reports and results.</li>
            </ul>
            <div className="h-4" />
            <p>You can scroll to browse all available projects. Click any project to begin reviewing its results.</p>
          </>
        );
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
        return <FileExplorer projectId={projectId} />
      default:
        return <ReportsView />
    }
  }

  // Format the TTL time
  const formatTTL = (seconds) => {
    return `${seconds}s`;
  }

  // Get TTL color class based on time remaining
  const getTtlColorClass = () => {
    if (ttlRemaining > 15) return "text-green-500";
    if (ttlRemaining > 5) return "text-yellow-400";
    return "text-red-500";
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
      
      {/* Processing Modal */}
      {processingStatus === 'processing' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-[#1e1e1e] p-6 rounded-lg shadow-lg border border-[#333] w-96 animate-fadeIn">
            <div className="flex justify-center mb-4">
              <FaSpinner className="text-4xl text-primary-500 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-center text-gray-200 mb-4">
              Processing Project
            </h3>
            <p className="text-center text-gray-300 mb-4">
              {processingDetails.message}
            </p>
            
            {/* Progress bar */}
            <div className="w-full bg-[#333] rounded-full h-2.5 mb-4">
              <div 
                className="bg-primary-500 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${Math.max(5, (processingDetails.progress / processingDetails.total) * 100)}%` }}
              ></div>
            </div>
            
            {/* TTL Indicator */}
            <div className="flex justify-center items-center gap-2 mb-4">
              <FaClock className={getTtlColorClass()} />
              <span className={`font-mono font-semibold ${getTtlColorClass()}`}>
                {formatTTL(ttlRemaining)}
              </span>
              <span className="text-xs text-gray-400">submission time limit</span>
            </div>
            
            <p className="text-xs text-gray-400 text-center">
              This may take several minutes depending on the number of submissions.
              <br />
              Each submission has a {formatTTL(30)} time limit before it's marked as timed out.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
