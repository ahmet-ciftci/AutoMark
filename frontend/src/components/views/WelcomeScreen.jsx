import React, { useState, useEffect } from 'react';
import { FaCog, FaPlus, FaFolderOpen, FaTrash, FaChevronRight } from 'react-icons/fa'; // Removed FaRegClock

const WelcomeScreen = ({ onOpenProject, onEditProject, onNewProjectClick }) => {
  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => { // Extracted fetchProjects to be callable
    try {
      const fetchedProjects = await window.electron.getAllProjects();
      setProjects(fetchedProjects || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteProject = async (projectId, projectName) => { // Added projectName for the confirmation dialog
    // Show a confirmation dialog
    if (window.confirm(`Are you sure you want to delete the project "${projectName}"? This action cannot be undone.`)) {
      try {
        await window.electron.deleteProject(projectId);
        // Refresh the project list after deletion
        fetchProjects(); 
      } catch (err) {
        console.error("Failed to delete project:", err);
        // Optionally, show an error message to the user
        alert(`Failed to delete project: ${err.message || 'Unknown error'}`); // Added an alert for user feedback
      }
    }
  };

  return (
    <div className="min-h-screen text-gray-100 p-8 selection:bg-primary-500 selection:text-white">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 pb-6 border-b border-gray-700/50 relative">
          <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent"></div>
          <h1 className="text-5xl font-bold mb-4 sm:mb-0">
            <span className="text-white">Welcome to</span> <span className="text-primary-400">AutoMark</span>
          </h1>
          <button
            onClick={onNewProjectClick}
            className="bg-primary-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg 
                       hover:shadow-[0_0_20px_5px_rgba(var(--color-primary-500-rgb),0.3)] 
                       transition-all duration-300 ease-in-out transform hover:-translate-y-1 
                       flex items-center text-lg relative overflow-hidden group"
            title="Create a new project"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-400/0 via-primary-300/10 to-primary-400/0 
                          transform -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out"></span>
            <FaPlus className="mr-3 h-5 w-5" />
            New Project
          </button>
        </header>

        {projects.length === 0 && (
          <div className="text-center mt-10 py-16 px-8 rounded-xl shadow-2xl backdrop-blur-sm border border-gray-700/50 transform transition-all duration-500 relative overflow-hidden">
            <div className="relative z-10">
              <FaFolderOpen className="text-7xl mb-8 text-primary-400 mx-auto" />
              <h2 className="text-4xl font-semibold text-gray-100 mb-6">
                Your AutoMark Workspace is Ready!
              </h2>
              <p className="text-gray-400 mb-10 text-xl max-w-lg mx-auto leading-relaxed">
                It looks like you don't have any projects yet. <br />
                Click the "New Project" button in the header to get started.
              </p>
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="backdrop-blur-sm rounded-xl shadow-xl p-6 
                             border border-gray-700/50 hover:border-primary-400/60 
                             hover:shadow-[0_10px_25px_-5px_rgba(var(--color-primary-500-rgb),0.3)] 
                             transition-all duration-500 ease-out transform hover:-translate-y-2 group cursor-pointer
                             relative overflow-hidden"
                  onClick={() => onOpenProject(project.id)}
                >
                  {/* Subtle accent */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/3 rounded-full blur-[30px] group-hover:bg-primary-500/5 transition-colors duration-500 ease-in-out"></div>
                  
                  {/* Glowing top border */}
                  <div className="absolute top-0 left-0 h-[2px] w-0 bg-gradient-to-r from-primary-400 to-primary-600 group-hover:w-full transition-all duration-700 ease-in-out"></div>
                  
                  {/* Top section: Project Name and Edit Button */}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <h3 className="text-2xl font-bold text-gray-100
                                  group-hover:text-primary-300 transition-colors duration-300 
                                  truncate flex-grow mr-3">
                      {project.name}
                    </h3>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click when clicking settings
                          onEditProject(project.id);
                        }}
                        className="text-gray-400 hover:text-primary-300 bg-gray-800/50 hover:bg-gray-700/50 p-2 rounded-lg 
                                 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
                        title="Project Settings"
                      >
                        <FaCog className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleDeleteProject(project.id, project.name);
                        }}
                        className="text-gray-400 hover:text-red-400 bg-gray-800/50 hover:bg-gray-700/50 p-2 rounded-lg 
                                 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                        title="Delete Project"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Project details section */}
                  <div className="flex-grow space-y-3 relative z-10">
                    <div className="h-px w-full bg-gray-700/30 my-2"></div>
                  </div>
                  
                  {/* Open indicator */}
                  <div className="mt-3 flex justify-end items-center text-primary-400/70 group-hover:text-primary-300 transition-colors duration-300 relative z-10">
                    <span className="text-sm font-medium mr-1.5 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">Open</span>
                    <FaChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;
