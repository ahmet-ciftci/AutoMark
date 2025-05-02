import { useState, useEffect, useRef } from 'react'
import { FaFolder, FaChevronDown, FaPencilAlt, FaFileImport, FaFileExport, FaPlus, FaCheck, FaTerminal, FaFileAlt, FaFileCode, FaKeyboard } from 'react-icons/fa'

const ProjectCreation = ({ onEditLang, onCreateProject, onNewLangConfig }) => {
  const [project_name, setProjectName] = useState('')
  const [submissions_directory, setSubmissionsDirectory] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedConfigId, setSelectedConfigId] = useState(null)
  const [showLanguages, setShowLanguages] = useState(false)
  const [configurations, setConfigurations] = useState([])

  const [input_generation_method, setInputMethod] = useState('manual')
  const [input, setInput] = useState('')
  const [expected_output_generation_method, setExpectedOutputMethod] = useState('manual')
  const [expected_output, setExpectedOutput] = useState('')

  const [manualInput, setManualInput] = useState('')
  const [inputScriptCommand, setInputScriptCommand] = useState('')
  const [inputScriptFilePath, setInputScriptFilePath] = useState('')
  const [combinedInputScriptCommand, setCombinedInputScriptCommand] = useState('')
  const [inputFilePath, setInputFilePath] = useState('')

  const [manualExpectedOutput, setManualExpectedOutput] = useState('')
  const [expectedOutputScriptCommand, setExpectedOutputScriptCommand] = useState('')
  const [expectedOutputScriptFilePath, setExpectedOutputScriptFilePath] = useState('')
  const [combinedExpectedOutputScriptCommand, setCombinedExpectedOutputScriptCommand] = useState('')
  const [expectedOutputFilePath, setExpectedOutputFilePath] = useState('')

  const languageDropdownRef = useRef(null)

  const [testPlaceholders, setTestPlaceholders] = useState({
    input: 'Enter input value',
    expectedOutput: 'Enter expected output',
    inputScriptCommand: 'Command to execute',
    inputScriptFilePath: 'Path to script',
    inputFilePath: 'Path to input file',
    expectedOutputScriptCommand: 'Command to execute',
    expectedOutputScriptFilePath: 'Path to script',
    expectedOutputFilePath: 'Path to expected output file',
  })

  useEffect(() => {
    if (inputScriptCommand && inputScriptFilePath) {
      setCombinedInputScriptCommand(`${inputScriptCommand} ${inputScriptFilePath}`)
    } else if (inputScriptCommand) {
      setCombinedInputScriptCommand(inputScriptCommand)
    } else if (inputScriptFilePath) {
      setCombinedInputScriptCommand(inputScriptFilePath)
    } else {
      setCombinedInputScriptCommand('')
    }
  }, [inputScriptCommand, inputScriptFilePath])

  useEffect(() => {
    if (expectedOutputScriptCommand && expectedOutputScriptFilePath) {
      setCombinedExpectedOutputScriptCommand(`${expectedOutputScriptCommand} ${expectedOutputScriptFilePath}`)
    } else if (expectedOutputScriptCommand) {
      setCombinedExpectedOutputScriptCommand(expectedOutputScriptCommand)
    } else if (expectedOutputScriptFilePath) {
      setCombinedExpectedOutputScriptCommand(expectedOutputScriptFilePath)
    } else {
      setCombinedExpectedOutputScriptCommand('')
    }
  }, [expectedOutputScriptCommand, expectedOutputScriptFilePath])

  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        const mockConfigs = []
        setConfigurations(mockConfigs)
      } catch (error) {
        console.error('Failed to fetch configurations:', error)
      }
    }

    fetchConfigurations()
  }, [])

  useEffect(() => {
    setManualInput('')
    setInputScriptCommand('')
    setInputScriptFilePath('')
    setInputFilePath('')
    setManualExpectedOutput('')
    setExpectedOutputScriptCommand('')
    setExpectedOutputScriptFilePath('')
    setExpectedOutputFilePath('')
    setInput('')
    setExpectedOutput('')
  }, [selectedLanguage])

  useEffect(() => {
    let finalInputVal = ''
    switch (input_generation_method) {
      case 'manual':
        finalInputVal = manualInput
        break
      case 'script':
        finalInputVal = combinedInputScriptCommand
        break
      case 'file':
        finalInputVal = inputFilePath
        break
      default:
        finalInputVal = ''
    }
    setInput(finalInputVal)
  }, [input_generation_method, manualInput, combinedInputScriptCommand, inputFilePath])

  useEffect(() => {
    let finalExpectedOutputVal = ''
    switch (expected_output_generation_method) {
      case 'manual':
        finalExpectedOutputVal = manualExpectedOutput
        break
      case 'script':
        finalExpectedOutputVal = combinedExpectedOutputScriptCommand
        break
      case 'file':
        finalExpectedOutputVal = expectedOutputFilePath
        break
      default:
        finalExpectedOutputVal = ''
    }
    setExpectedOutput(finalExpectedOutputVal)
  }, [expected_output_generation_method, manualExpectedOutput, combinedExpectedOutputScriptCommand, expectedOutputFilePath])

  const onProjectNameChange = (e) => {
    setProjectName(e.target.value)
  }

  const onLanguageSelect = (config) => {
    setSelectedLanguage(config.config_name)
    setSelectedConfigId(config.config_id)
    setShowLanguages(false)
  }

  const onPickSubmissionsPath = async () => {
    try {
      const directoryPath = await window.electron.openDirectory()
      if (directoryPath) {
        setSubmissionsDirectory(directoryPath)
      }
    } catch (error) {
      console.error('Error opening directory dialog:', error)
    }
  }

  const onToggleInputManual = () => setInputMethod('manual')
  const onToggleInputScript = () => setInputMethod('script')
  const onToggleInputFile = () => setInputMethod('file')

  const onToggleOutputManual = () => setExpectedOutputMethod('manual')
  const onToggleOutputScript = () => setExpectedOutputMethod('script')
  const onToggleOutputFile = () => setExpectedOutputMethod('file')

  const onManualInputChange = (e) => setManualInput(e.target.value)
  const onManualExpectedChange = (e) => setManualExpectedOutput(e.target.value)

  const onPickInputFile = async () => {
    try {
      const filePath = await window.electron.openFile()
      if (filePath) setInputFilePath(filePath)
    } catch (error) {
      console.error('Error picking input file:', error)
    }
  }

  const onPickInputScriptFile = async () => {
    try {
      const filePath = await window.electron.openFile()
      if (filePath) setInputScriptFilePath(filePath)
    } catch (error) {
      console.error('Error picking input script file:', error)
    }
  }

  const onPickExpectedOutputFile = async () => {
    try {
      const filePath = await window.electron.openFile()
      if (filePath) setExpectedOutputFilePath(filePath)
    } catch (error) {
      console.error('Error picking expected output file:', error)
    }
  }

  const onPickExpectedOutputScriptFile = async () => {
    try {
      const filePath = await window.electron.openFile()
      if (filePath) setExpectedOutputScriptFilePath(filePath)
    } catch (error) {
      console.error('Error picking expected output script file:', error)
    }
  }

  const onCancelProject = () => {
    setProjectName('')
    setSubmissionsDirectory('')
    setManualInput('')
    setInputScriptCommand('')
    setInputScriptFilePath('')
    setInputFilePath('')
    setManualExpectedOutput('')
    setExpectedOutputScriptCommand('')
    setExpectedOutputScriptFilePath('')
    setExpectedOutputFilePath('')
    setInput('')
    setExpectedOutput('')
    setInputMethod('manual')
    setExpectedOutputMethod('manual')
  }

  const handleCreateProject = () => {
    if (!selectedConfigId) {
      console.error('No configuration selected or config_id not found.')
      return
    }

    const projectData = {
      name: project_name,
      config_id: selectedConfigId,
      submissions_path: submissions_directory,
    }

    const testConfigData = {
      input_method: input_generation_method,
      input: input,
      output_method: expected_output_generation_method,
      expected_output: expected_output,
    }

    const projectPayload = {
      project: projectData,
      testConfig: testConfigData,
    }

    onCreateProject(projectPayload)
  }

  const handleNewLanguageConfig = () => {
    if (onNewLangConfig) {
      onNewLangConfig()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-gray-200">Create New Project</h1>

      <div className="space-y-6">
        <div className="card">
          <div className="card-header">Project Settings</div>
          <div className="card-body space-y-5">
            <div className="flex items-center">
              <div className="w-40 text-gray-300">Project Name:</div>
              <input
                type="text"
                value={project_name}
                onChange={onProjectNameChange}
                className="input-field flex-1"
                placeholder="Enter project name"
              />
            </div>

            <div className="flex items-center">
              <div className="w-40 text-gray-300">Submissions Path:</div>
              <div className="flex-1 flex">
                <div className="flex-1 mr-2">
                  <input
                    type="text"
                    value={submissions_directory}
                    onChange={(e) => setSubmissionsDirectory(e.target.value)}
                    placeholder="Select submissions directory"
                    className="input-field w-full"
                    readOnly
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
          <div className="card-header">Configuration</div>
          <div className="card-body space-y-5">
            <div className="flex items-center">
              <div className="w-40 text-gray-300">Configuration:</div>
              <div className="flex-1">
                <div className="grid grid-cols-5 gap-3">
                  <div className="relative col-span-1" ref={languageDropdownRef}>
                    <button
                      onClick={() => setShowLanguages(!showLanguages)}
                      className="input-field w-full text-left flex items-center justify-between hover:border-dark-hover"
                    >
                      <span>{selectedLanguage || 'Select Config...'}</span>
                      <FaChevronDown
                        className={`text-gray-400 text-sm transition-transform duration-200 ${
                          showLanguages ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showLanguages && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-dark-surface border border-dark-border rounded-md z-50 overflow-hidden shadow-lg animate-fade-in">
                        {configurations.length === 0 ? (
                          <div className="px-4 py-2 text-gray-400">No configurations available</div>
                        ) : (
                          configurations.map((config) => (
                            <div
                              key={config.config_id}
                              className={`px-4 py-2 hover:bg-dark-hover cursor-pointer transition-colors ${
                                selectedLanguage === config.config_name ? 'bg-primary-700/20 text-primary-400' : ''
                              }`}
                              onClick={() => onLanguageSelect(config)}
                            >
                              <div className="flex items-center justify-between">
                                <span>{config.config_name}</span>
                                {selectedLanguage === config.config_name && <FaCheck className="text-primary-400 text-sm" />}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleNewLanguageConfig}
                    className="btn-outline hover:border-secondary-500 hover:bg-secondary-700/20 hover:text-secondary-400"
                    title="Create new configuration"
                  >
                    <FaPlus className="mr-2 text-xs" />
                    New
                  </button>

                  <button
                    onClick={() => onEditLang(selectedLanguage)}
                    className="btn-outline hover:border-primary-500 hover:bg-primary-700/20 hover:text-primary-400"
                    title="Edit configuration"
                    disabled={!selectedLanguage}
                  >
                    <FaPencilAlt className="mr-2 text-xs" />
                    Edit
                  </button>

                  <button
                    onClick={() => {}}
                    className="btn-outline hover:border-primary-500 hover:bg-primary-700/20 hover:text-primary-400"
                    title="Import configuration"
                  >
                    <FaFileImport className="mr-2 text-xs" />
                    Import
                  </button>

                  <button
                    onClick={() => {}}
                    className="btn-outline hover:border-primary-500 hover:bg-primary-700/20 hover:text-primary-400"
                    title="Export configuration"
                  >
                    <FaFileExport className="mr-2 text-xs" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Test Case Configuration</h2>
          </div>

          <div className="card-body space-y-5">
            <div className="flex items-center">
              <div className="w-40 text-gray-300">Input Method:</div>
              <div className="flex space-x-4">
                <div
                  onClick={onToggleInputManual}
                  className={`toggle-btn ${
                    input_generation_method === 'manual'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaKeyboard
                    className={`mr-2 ${
                      input_generation_method === 'manual' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  Manual
                </div>
                <div
                  onClick={onToggleInputFile}
                  className={`toggle-btn ${
                    input_generation_method === 'file'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaFileCode
                    className={`mr-2 ${
                      input_generation_method === 'file' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  File
                </div>
                <div
                  onClick={onToggleInputScript}
                  className={`toggle-btn ${
                    input_generation_method === 'script'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaTerminal
                    className={`mr-2 ${
                      input_generation_method === 'script' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  Script
                </div>
              </div>
            </div>

            {input_generation_method === 'manual' && (
              <div className="flex items-center animate-fade-in">
                <div className="w-40 text-gray-300">Manual Input:</div>
                <input
                  type="text"
                  value={manualInput}
                  onChange={onManualInputChange}
                  className="input-field flex-1"
                  placeholder={testPlaceholders.input}
                />
              </div>
            )}

            {input_generation_method === 'script' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Input Script Cmd:</div>
                  <input
                    type="text"
                    value={inputScriptCommand}
                    onChange={(e) => setInputScriptCommand(e.target.value)}
                    className="input-field flex-1"
                    placeholder={testPlaceholders.inputScriptCommand}
                  />
                </div>
                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Input Script File:</div>
                  <div className="flex-1 flex">
                    <input
                      type="text"
                      value={inputScriptFilePath}
                      onChange={(e) => setInputScriptFilePath(e.target.value)}
                      className="input-field flex-1 mr-2"
                      placeholder={testPlaceholders.inputScriptFilePath}
                    />
                    <button
                      onClick={onPickInputScriptFile}
                      className="bg-dark-hover px-3 py-2 rounded border border-dark-border hover:bg-dark-border"
                      title="Browse for input script file"
                    >
                      <FaFolder className="text-gray-300" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Final Input Cmd:</div>
                  <input
                    type="text"
                    value={combinedInputScriptCommand}
                    className="input-field flex-1 bg-dark-bg cursor-not-allowed"
                    placeholder="Combined script command"
                    disabled
                  />
                </div>
              </div>
            )}

            {input_generation_method === 'file' && (
              <div className="flex items-center animate-fade-in">
                <div className="w-40 text-gray-300">Input File Path:</div>
                <div className="flex-1 flex">
                  <input
                    type="text"
                    value={inputFilePath}
                    onChange={(e) => setInputFilePath(e.target.value)}
                    placeholder={testPlaceholders.inputFilePath}
                    className="input-field flex-1 mr-2"
                    readOnly
                  />
                  <button
                    onClick={onPickInputFile}
                    className="bg-dark-hover px-3 py-2 rounded border border-dark-border hover:bg-dark-border"
                    title="Browse for Input File"
                  >
                    <FaFolder className="text-gray-300" />
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-dark-border my-6"></div>

            <div className="flex items-center">
              <div className="w-40 text-gray-300">Expected Output:</div>
              <div className="flex space-x-4">
                <div
                  onClick={onToggleOutputManual}
                  className={`toggle-btn ${
                    expected_output_generation_method === 'manual'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaKeyboard
                    className={`mr-2 ${
                      expected_output_generation_method === 'manual' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  Manual
                </div>
                <div
                  onClick={onToggleOutputFile}
                  className={`toggle-btn ${
                    expected_output_generation_method === 'file'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaFileCode
                    className={`mr-2 ${
                      expected_output_generation_method === 'file' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  File
                </div>
                <div
                  onClick={onToggleOutputScript}
                  className={`toggle-btn ${
                    expected_output_generation_method === 'script'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaTerminal
                    className={`mr-2 ${
                      expected_output_generation_method === 'script' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  Script
                </div>
              </div>
            </div>

            {expected_output_generation_method === 'manual' && (
              <div className="flex animate-fade-in">
                <div className="w-40 text-gray-300 mt-2">Manual Output:</div>
                <div className="flex-1">
                  <textarea
                    value={manualExpectedOutput}
                    onChange={onManualExpectedChange}
                    className="input-field w-full h-24 resize-none font-mono text-sm"
                    placeholder={testPlaceholders.expectedOutput}
                  />
                </div>
              </div>
            )}

            {expected_output_generation_method === 'script' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Output Script Cmd:</div>
                  <input
                    type="text"
                    value={expectedOutputScriptCommand}
                    onChange={(e) => setExpectedOutputScriptCommand(e.target.value)}
                    className="input-field flex-1"
                    placeholder={testPlaceholders.expectedOutputScriptCommand}
                  />
                </div>
                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Output Script File:</div>
                  <div className="flex-1 flex">
                    <input
                      type="text"
                      value={expectedOutputScriptFilePath}
                      onChange={(e) => setExpectedOutputScriptFilePath(e.target.value)}
                      className="input-field flex-1 mr-2"
                      placeholder={testPlaceholders.expectedOutputScriptFilePath}
                    />
                    <button
                      onClick={onPickExpectedOutputScriptFile}
                      className="bg-dark-hover px-3 py-2 rounded border border-dark-border hover:bg-dark-border"
                      title="Browse for expected output script file"
                    >
                      <FaFolder className="text-gray-300" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Final Output Cmd:</div>
                  <input
                    type="text"
                    value={combinedExpectedOutputScriptCommand}
                    className="input-field flex-1 bg-dark-bg cursor-not-allowed"
                    placeholder="Combined script command"
                    disabled
                  />
                </div>
              </div>
            )}

            {expected_output_generation_method === 'file' && (
              <div className="flex items-center animate-fade-in">
                <div className="w-40 text-gray-300">Output File Path:</div>
                <div className="flex-1 flex">
                  <input
                    type="text"
                    value={expectedOutputFilePath}
                    onChange={(e) => setExpectedOutputFilePath(e.target.value)}
                    placeholder={testPlaceholders.expectedOutputFilePath}
                    className="input-field flex-1 mr-2"
                    readOnly
                  />
                  <button
                    onClick={onPickExpectedOutputFile}
                    className="bg-dark-hover px-3 py-2 rounded border border-dark-border hover:bg-dark-border"
                    title="Browse for Expected Output File"
                  >
                    <FaFolder className="text-gray-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-8">
          <button onClick={onCancelProject} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleCreateProject} className="btn-primary">
            <FaPlus className="mr-2" />
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectCreation