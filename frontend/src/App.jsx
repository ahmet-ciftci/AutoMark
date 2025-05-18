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

function App() {
  const [activeView, setActiveView] = useState('project')
  const [selectedLanguage, setSelectedLanguage] = useState('Java') // Can be null for 'new' config
  const [key, setKey] = useState(0) // For view transitions
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
      setProcessingDetails({
        message: 'Creating project and setting up configurations...',
        progress: 0,
        total: 100
      });
      
      // Step 1: Create the project and get its ID
      const newProjectId = await window.electron.addProject(project);
      setProjectId(newProjectId);
      
      setProcessingDetails({
        message: 'Setting up test configuration...',
        progress: 10,
        total: 100
      });
      
      // Step 2: Add test configuration
      await window.electron.addTestConfig(newProjectId, testConfig);
      
      setProcessingDetails({
        message: 'Processing submissions...',
        progress: 20,
        total: 100
      });
      
      // Step 3: Process the entire project using Processor.js
      const concurrency = 4; // Can be adjusted based on system capabilities
      const results = await window.electron.processProject(
        newProjectId, 
        project.submissions_path, 
        concurrency
      );
      
      console.log("Project processing complete:", results);
      console.log("Project ID:", newProjectId);
      
      setProcessingDetails({
        message: 'Finalizing processing...',
        progress: 90,
        total: 100
      });
      
      // Small delay to show completion
      setTimeout(() => {
        setProcessingStatus('complete');
        switchView('reports');
      }, 800);
      
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
