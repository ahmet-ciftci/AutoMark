import { useState, useEffect, useRef } from 'react'
import { FaFolder, FaChevronDown, FaPencilAlt, FaFileImport, FaFileExport, FaPlus, FaCheck } from 'react-icons/fa'

const ProjectCreation = ({ onEditLang, onCreateProject }) => {
  const [projectName, setProjectName] = useState('')
  const [projectPath, setProjectPath] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('Java')
  const [submissionsPath, setSubmissionsPath] = useState('')
  const [showLanguages, setShowLanguages] = useState(false)
  
  const languageDropdownRef = useRef(null)

  const languages = ['Java', 'C', 'C++', 'Python']

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguages(false)
      }
    }
    
    if (showLanguages) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguages])

  const onProjectNameChange = (e) => {
    setProjectName(e.target.value)
  }

  const onPickProjectPath = () => {
    setProjectPath('/path/to/project')
  }

  const onLanguageSelect = (lang) => {
    setSelectedLanguage(lang)
    setShowLanguages(false)
  }

  const onImportConfig = () => {
    // Import language configuration
  }

  const onExportConfig = () => {
    // Export language configuration
  }

  const onPickSubmissionsPath = () => {
    setSubmissionsPath('/path/to/submissions')
  }

  const onCancelProject = () => {
    setProjectName('')
    setProjectPath('')
    setSubmissionsPath('')
  }

  const handleCreateProject = () => {
    const projectConfig = {
      name: projectName,
      path: projectPath,
      language: selectedLanguage,
      submissionsPath
    }
    
    onCreateProject(projectConfig)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-gray-200">
        Create New Project
      </h1>
      
      <div className="space-y-6">
        <div className="flex items-center">
          <div className="w-40 text-gray-300">Project Name:</div>
          <input
            type="text"
            value={projectName}
            onChange={onProjectNameChange}
            className="input-field flex-1"
            placeholder="Enter project name"
          />
        </div>

        <div className="flex items-center">
          <div className="w-40 text-gray-300">Project Path:</div>
          <div className="flex-1 flex">
            <div className="flex-1 mr-2">
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="Select project directory"
                className="input-field w-full"
              />
            </div>
            <button 
              onClick={onPickProjectPath}
              className="bg-dark-hover px-3 py-2 rounded border border-dark-border hover:bg-dark-border"
              title="Browse for project directory"
            >
              <FaFolder className="text-gray-300" />
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-40 text-gray-300">Configuration:</div>
          <div className="flex-1">
            <div className="grid grid-cols-4 gap-3">
              <div className="relative" ref={languageDropdownRef}>
                <button 
                  onClick={() => setShowLanguages(!showLanguages)}
                  className="input-field w-full text-left flex items-center justify-between hover:border-dark-hover"
                >
                  <span>{selectedLanguage}</span>
                  <FaChevronDown className={`text-gray-400 text-sm transition-transform duration-200 ${showLanguages ? 'rotate-180' : ''}`} />
                </button>
                
                {showLanguages && (
                  <div className="absolute left-0 top-full mt-1 w-full bg-dark-surface border border-dark-border rounded-md z-50 overflow-hidden shadow-lg animate-fade-in">
                    {languages.map(lang => (
                      <div 
                        key={lang} 
                        className={`px-4 py-2 hover:bg-dark-hover cursor-pointer transition-colors ${selectedLanguage === lang ? 'bg-primary-700/20 text-primary-400' : ''}`}
                        onClick={() => onLanguageSelect(lang)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{lang}</span>
                          {selectedLanguage === lang && <FaCheck className="text-primary-400 text-sm" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => onEditLang(selectedLanguage)}
                className="btn-outline hover:border-primary-500 hover:bg-primary-700/20 hover:text-primary-400"
                title="Edit language configuration"
              >
                <FaPencilAlt className="mr-2 text-xs" />
                Edit
              </button>
              
              <button 
                onClick={onImportConfig}
                className="btn-outline hover:border-primary-500 hover:bg-primary-700/20 hover:text-primary-400"
                title="Import language configuration"
              >
                <FaFileImport className="mr-2 text-xs" />
                Import
              </button>
              
              <button 
                onClick={onExportConfig}
                className="btn-outline hover:border-primary-500 hover:bg-primary-700/20 hover:text-primary-400"
                title="Export language configuration"
              >
                <FaFileExport className="mr-2 text-xs" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-40 text-gray-300">Submissions Path:</div>
          <div className="flex-1 flex">
            <div className="flex-1 mr-2">
              <input
                type="text"
                value={submissionsPath}
                onChange={(e) => setSubmissionsPath(e.target.value)}
                placeholder="Select submissions directory"
                className="input-field w-full"
              />
            </div>
            <button 
              onClick={onPickSubmissionsPath}
              className="bg-dark-hover px-3 py-2 rounded border border-dark-border hover:bg-dark-border"
              title="Browse for submissions directory"
            >
              <FaFolder className="text-gray-300" />
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-8">
          <button
            onClick={onCancelProject}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateProject}
            className="btn-primary"
          >
            <FaPlus className="mr-2" />
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectCreation