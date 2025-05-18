import React, { useState, useEffect } from 'react';
import { FaCog, FaPlus, FaFolderOpen, FaTrash } from 'react-icons/fa'; // Added FaTrash

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
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 pb-6 border-b border-gray-700">
          <h1 className="text-5xl font-bold text-gray-100 mb-4 sm:mb-0">
            Welcome to <span className="text-primary-400">AutoMark</span>
          </h1>
          <button
            onClick={onNewProjectClick}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md 
                       hover:shadow-[0_0_15px_2px_rgba(var(--color-primary-500-rgb),0.6)] 
                       dark:hover:shadow-[0_0_15px_2px_rgba(var(--color-primary-400-rgb),0.5)]
                       transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 
                       flex items-center text-lg"
            title="Create a new project"
          >
            <FaPlus className="mr-3 h-5 w-5" />
            New Project
          </button>
        </header>

        {projects.length === 0 && (
          <div className="text-center mt-10 py-16 px-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 transform transition-all duration-500">
            <FaFolderOpen className="text-7xl mb-8 text-primary-400 mx-auto animate-pulse" />
            <h2 className="text-4xl font-semibold text-gray-50 mb-6">
              Your AutoMark Workspace is Ready!
            </h2>
            <p className="text-gray-400 mb-10 text-xl max-w-lg mx-auto leading-relaxed">
              It looks like you don't have any projects yet. <br />
              Click the "New Project" button in the header to get started.
            </p>
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-800 rounded-xl shadow-lg p-7 flex flex-col border border-gray-700 hover:border-primary-500/70 hover:shadow-primary-500/10 transition-all duration-300 ease-in-out transform hover:-translate-y-1 group cursor-pointer"
                  onClick={() => onOpenProject(project.id)}
                  title={`Open project: ${project.name}`}
                >
                  {/* Top section: Project Name and Edit Button */}
                  <div className="flex justify-between items-center mb-3">
                    <h3
                      className="text-2xl font-semibold text-gray-100 truncate group-hover:text-primary-400 transition-colors flex-grow mr-3"
                    >
                      {project.name}
                    </h3>
                    <div className="flex items-center"> {/* Wrapper for buttons */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click when clicking settings
                          onEditProject(project.id);
                        }}
                        className="text-gray-400 hover:text-primary-300 bg-transparent hover:bg-gray-700/60 p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 flex-shrink-0 mr-2" // Added mr-2 for spacing
                        title="Project Settings"
                      >
                        <FaCog className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleDeleteProject(project.id, project.name); // Pass project.name to the handler
                        }}
                        className="text-gray-400 hover:text-red-500 bg-transparent hover:bg-gray-700/60 p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 flex-shrink-0"
                        title="Delete Project"
                      >
                        <FaTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Spacer to push chevron to the bottom */}
                  <div className="flex-grow">
                    {/* Content like a short description could go here in the future */}
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
