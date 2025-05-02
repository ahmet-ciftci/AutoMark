import { useState, useEffect, useRef } from 'react'
import { FaFolder, FaChevronDown, FaPencilAlt, FaFileImport, FaFileExport, FaPlus, FaCheck, FaTerminal, FaFileAlt, FaFileCode } from 'react-icons/fa'

const ProjectCreation = ({ onEditLang, onCreateProject }) => {
  const [projectName, setProjectName] = useState('')
  const [projectPath, setProjectPath] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('Java')
  const [submissionsPath, setSubmissionsPath] = useState('')
  const [showLanguages, setShowLanguages] = useState(false)
  
  // Test case configuration states (moved from ConfigEditor)
  const [useArguments, setUseArguments] = useState(true)
  const [useScript, setUseScript] = useState(false)
  const [useTxtFile, setUseTxtFile] = useState(false)
  const [input, setInput] = useState('')
  const [expectedOutput, setExpectedOutput] = useState('')
  const [txtFilePath, setTxtFilePath] = useState('')
  const [scriptCommand, setScriptCommand] = useState('')
  const [scriptFilePath, setScriptFilePath] = useState('')
  const [combinedScriptCommand, setCombinedScriptCommand] = useState('')
  
  const languageDropdownRef = useRef(null)

  const languages = ['Java', 'C', 'C++', 'Python']

  // Update combined script command when component values change
  useEffect(() => {
    if (scriptCommand && scriptFilePath) {
      setCombinedScriptCommand(`${scriptCommand} ${scriptFilePath}`);
    } else if (scriptCommand) {
      setCombinedScriptCommand(scriptCommand);
    } else if (scriptFilePath) {
      setCombinedScriptCommand(scriptFilePath);
    } else {
      setCombinedScriptCommand('');
    }
  }, [scriptCommand, scriptFilePath]);

  // Set default test case values based on selected language
  useEffect(() => {
    switch (selectedLanguage) {
      case 'Java':
        setInput('5')
        setExpectedOutput('1,1,2,3,5,8,13,21,34,55')
        setScriptCommand('java -jar')
        break
      case 'C':
        setInput('8')
        setExpectedOutput('1,1,2,3,5,8,13,21,34')
        setScriptCommand('./run.sh')
        break
      case 'C++':
        setInput('7')
        setExpectedOutput('1,1,2,3,5,8,13,21')
        setScriptCommand('./run.sh')
        break
      case 'Python':
        setInput('6')
        setExpectedOutput('1,1,2,3,5,8,13')
        setScriptCommand('python')
        break
      default:
        setInput('')
        setExpectedOutput('')
        setScriptCommand('')
    }
  }, [selectedLanguage])

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
    console.log('Mock project path set')
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
    console.log('Mock submissions path set')
  }

  // Test case configuration handlers
  const onToggleArgument = () => {
    setUseArguments(true)
    setUseScript(false)
    setUseTxtFile(false)
  }

  const onToggleScript = () => {
    setUseScript(true)
    setUseArguments(false)
    setUseTxtFile(false)
  }

  const onToggleTxtFile = () => {
    setUseTxtFile(true)
    setUseArguments(false)
    setUseScript(false)
  }

  const onInputChange = (e) => {
    setInput(e.target.value)
  }

  const onExpectedChange = (e) => {
    setExpectedOutput(e.target.value)
  }

  const onPickTxtFile = () => {
    setTxtFilePath(`C:\\Users\\student\\input_${selectedLanguage.toLowerCase()}.txt`)
    console.log('Mock txt file path set')
  }

  const onPickScriptFile = () => {
    const fileExtension = selectedLanguage === 'Java' ? 'jar' : 
                         selectedLanguage === 'Python' ? 'py' : 'sh';
    setScriptFilePath(`C:\\Users\\student\\runner_${selectedLanguage.toLowerCase()}.${fileExtension}`)
    console.log('Mock script file path set')
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
      submissionsPath,
      // Include test case configuration
      testConfig: {
        useArguments,
        useScript,
        useTxtFile,
        input,
        expectedOutput,
        txtFilePath,
        scriptCommand,
        scriptFilePath,
        combinedScriptCommand
      }
    }
    
    onCreateProject(projectConfig)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-gray-200">
        Create New Project
      </h1>
      
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">Project Settings</div>
          <div className="card-body space-y-5">
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
          </div>
        </div>

        <div className="card">
          <div className="card-header">Language Configuration</div>
          <div className="card-body space-y-5">
            <div className="flex items-center">
              <div className="w-40 text-gray-300">Language:</div>
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
          </div>
        </div>

        {/* Test Case Configuration Card - Moved from ConfigEditor */}
        <div className="card">
          <div className="card-header">
            <h2>Test Case Configuration</h2>
          </div>
          
          <div className="card-body space-y-5">
            <div className="flex items-center">
              <div className="w-40 text-gray-300">Input Method:</div>
              <div className="flex space-x-4">
                <div 
                  onClick={onToggleArgument}
                  className={`toggle-btn ${useArguments 
                    ? 'bg-primary-700/30 border-primary-500 text-white' 
                    : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'}`}
                >
                  <FaTerminal className={`mr-2 ${useArguments ? 'text-primary-400' : 'text-gray-500'}`} />
                  Command Arguments
                </div>
                <div 
                  onClick={onToggleScript}
                  className={`toggle-btn ${useScript 
                    ? 'bg-primary-700/30 border-primary-500 text-white' 
                    : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'}`}
                >
                  <FaFileAlt className={`mr-2 ${useScript ? 'text-primary-400' : 'text-gray-500'}`} />
                  Script File
                </div>
                <div 
                  onClick={onToggleTxtFile}
                  className={`toggle-btn ${useTxtFile 
                    ? 'bg-primary-700/30 border-primary-500 text-white' 
                    : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'}`}
                >
                  <FaFileCode className={`mr-2 ${useTxtFile ? 'text-primary-400' : 'text-gray-500'}`} />
                  TXT File
                </div>
              </div>
            </div>

            {useArguments && (
              <div className="flex items-center">
                <div className="w-40 text-gray-300">Input:</div>
                <input
                  type="text"
                  value={input}
                  onChange={onInputChange}
                  className="input-field flex-1"
                  placeholder="Input values for testing"
                />
              </div>
            )}

            {useScript && (
              <>
                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Script Command:</div>
                  <input
                    type="text"
                    value={scriptCommand}
                    onChange={(e) => setScriptCommand(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Command to execute the script (e.g., python, bash, java -jar)"
                  />
                </div>

                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Script File:</div>
                  <div className="flex-1 flex">
                    <div className="flex-1 mr-2">
                      <input
                        type="text"
                        value={scriptFilePath}
                        onChange={(e) => setScriptFilePath(e.target.value)}
                        className="input-field w-full"
                        placeholder="Path to script file"
                      />
                    </div>
                    <button 
                      onClick={onPickScriptFile}
                      className="bg-dark-hover px-3 py-2 rounded border border-dark-border hover:bg-dark-border"
                      title="Browse for script file"
                    >
                      <FaFolder className="text-gray-300" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Final Command:</div>
                  <input
                    type="text"
                    value={combinedScriptCommand}
                    className="input-field flex-1 bg-dark-bg cursor-not-allowed"
                    placeholder="Combined script command will appear here"
                    disabled
                  />
                </div>
              </>
            )}

            {useTxtFile && (
              <div className="flex items-center">
                <div className="w-40 text-gray-300">Input File:</div>
                <div className="flex-1 flex">
                  <div className="flex-1 mr-2">
                    <input
                      type="text"
                      value={txtFilePath}
                      onChange={(e) => setTxtFilePath(e.target.value)}
                      placeholder="Select input file (*.txt)"
                      className="input-field w-full"
                    />
                  </div>
                  <button 
                    onClick={onPickTxtFile}
                    className="bg-dark-hover px-3 py-2 rounded border border-dark-border hover:bg-dark-border"
                    title="Browse for TXT file"
                  >
                    <FaFolder className="text-gray-300" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex">
              <div className="w-40 text-gray-300 mt-2">Expected Output:</div>
              <div className="flex-1">
                <textarea
                  value={expectedOutput}
                  onChange={onExpectedChange}
                  className="input-field w-full h-24 resize-none font-mono text-sm"
                  placeholder="Expected output for comparison"
                />
              </div>
            </div>
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