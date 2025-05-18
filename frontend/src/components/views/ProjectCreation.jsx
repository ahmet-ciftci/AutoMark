import { useState, useEffect, useRef } from 'react'
import { FaFolder, FaChevronDown, FaPencilAlt, FaFileImport, FaFileExport, FaPlus, FaCheck, FaTerminal, FaFileAlt, FaFileCode, FaKeyboard, FaTrash } from 'react-icons/fa'

const ProjectCreation = ({
  onCreateProject, 
  onNewLangConfig, 
  onEditLang,
  formData,
  setFormData,
  initialFormData,
  isEditing, // Add isEditing prop
  onCancel // Add onCancel prop
}) => {
  const [showLanguages, setShowLanguages] = useState(false)
  const [configurations, setConfigurations] = useState([])

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
    let newCombinedCommand = '';
    if (formData.inputScriptCommand && formData.inputScriptFilePath) {
      newCombinedCommand = `${formData.inputScriptCommand} ${formData.inputScriptFilePath}`;
    } else if (formData.inputScriptCommand) {
      newCombinedCommand = formData.inputScriptCommand;
    } else if (formData.inputScriptFilePath) {
      newCombinedCommand = formData.inputScriptFilePath;
    }
    if (newCombinedCommand !== formData.combinedInputScriptCommand) {
      setFormData(prev => ({ ...prev, combinedInputScriptCommand: newCombinedCommand }));
    }
  }, [formData.inputScriptCommand, formData.inputScriptFilePath, formData.combinedInputScriptCommand, setFormData]);

  useEffect(() => {
    let newCombinedCommand = '';
    if (formData.expectedOutputScriptCommand && formData.expectedOutputScriptFilePath) {
      newCombinedCommand = `${formData.expectedOutputScriptCommand} ${formData.expectedOutputScriptFilePath}`;
    } else if (formData.expectedOutputScriptCommand) {
      newCombinedCommand = formData.expectedOutputScriptCommand;
    } else if (formData.expectedOutputScriptFilePath) {
      newCombinedCommand = formData.expectedOutputScriptFilePath;
    }
    if (newCombinedCommand !== formData.combinedExpectedOutputScriptCommand) {
      setFormData(prev => ({ ...prev, combinedExpectedOutputScriptCommand: newCombinedCommand }));
    }
  }, [formData.expectedOutputScriptCommand, formData.expectedOutputScriptFilePath, formData.combinedExpectedOutputScriptCommand, setFormData]);


  //CONFIGURATION DROPDOWN
  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        const configs = await window.electron.getConfigurations();
        setConfigurations(configs); // dropdownn set
      } catch (error) {
        console.error('Failed to fetch configurations:', error);
      }
    };
  
    fetchConfigurations();
  }, []);

  const onSaveConfig = (updatedConfig) => {
    setFormData(prev => ({ ...prev, selectedLanguage: updatedConfig.config_name, selectedConfigId: updatedConfig.id }));
    setShowLanguages(false);                        
    // setIsEditing(false); // Not needed as per current flow
    
    window.electron.getConfigurations().then((configs) => {
      setConfigurations(configs);
    });
  };
  
  

  // useEffect(() => {}, [formData.selectedLanguage])

  useEffect(() => {
    let finalInputVal = ''
    switch (formData.input_generation_method) {
      case 'manual':
        finalInputVal = formData.manualInput
        break
      case 'script':
        finalInputVal = formData.combinedInputScriptCommand
        break
      case 'file':
        finalInputVal = formData.inputFilePath
        break
      default:
        finalInputVal = ''
    }
    if (finalInputVal !== formData.input) {
      setFormData(prev => ({ ...prev, input: finalInputVal }));
    }
  }, [formData.input_generation_method, formData.manualInput, formData.combinedInputScriptCommand, formData.inputFilePath, formData.input, setFormData]);

  useEffect(() => {
    let finalExpectedOutputVal = ''
    switch (formData.expected_output_generation_method) {
      case 'manual':
        finalExpectedOutputVal = formData.manualExpectedOutput
        break
      case 'script':
        finalExpectedOutputVal = formData.combinedExpectedOutputScriptCommand
        break
      case 'file':
        finalExpectedOutputVal = formData.expectedOutputFilePath
        break
      default:
        finalExpectedOutputVal = ''
    }
    if (finalExpectedOutputVal !== formData.expected_output) {
      setFormData(prev => ({ ...prev, expected_output: finalExpectedOutputVal }));
    }
  }, [
    formData.expected_output_generation_method, 
    formData.manualExpectedOutput, 
    formData.combinedExpectedOutputScriptCommand, 
    formData.expectedOutputFilePath,
    formData.expected_output,
    setFormData
  ]);


  const handleEditLang = () => {
    if (!formData.selectedLanguage) return;
    if (onEditLang) {
      // Pass the name of the selected configuration
      const selectedConfig = configurations.find(c => c.config_id === formData.selectedConfigId);
      if (selectedConfig) {
        onEditLang(selectedConfig.config_name);
      } else {
        // Fallback or error if config_name not found, though selectedLanguage should hold it
        onEditLang(formData.selectedLanguage); 
      }
    }
  };
  
  const handleDeleteConfig = async () => {
    if (!formData.selectedConfigId) return
    if (!window.confirm('Delete this configuration?')) return
    try {
      await window.electron.deleteConfig(formData.selectedConfigId)
      // refresh list and clear selection
      const configs = await window.electron.getConfigurations()
      setConfigurations(configs)
      setFormData(prev => ({ ...prev, selectedLanguage: '', selectedConfigId: null }));
      setShowLanguages(false)
    } catch (err) {
      console.error('Failed to delete config:', err)
    }
  };
  

  const onProjectNameChange = (e) => {
    setFormData(prev => ({ ...prev, project_name: e.target.value }));
  }

  const onLanguageSelect = (config) => {
    setFormData(prev => ({ ...prev, selectedLanguage: config.config_name, selectedConfigId: config.config_id }));
    setShowLanguages(false)
  }

  const onPickSubmissionsPath = async () => {
    try {
      const directoryPath = await window.electron.openDirectory()
      if (directoryPath) {
        setFormData(prev => ({ ...prev, submissions_directory: directoryPath }));
      }
    } catch (error) {
      console.error('Error opening directory dialog:', error)
    }
  }

  const onToggleInputManual = () => setFormData(prev => ({ ...prev, input_generation_method: 'manual' }));
  const onToggleInputScript = () => setFormData(prev => ({ ...prev, input_generation_method: 'script' }));
  const onToggleInputFile = () => setFormData(prev => ({ ...prev, input_generation_method: 'file' }));

  const onToggleOutputManual = () => setFormData(prev => ({ ...prev, expected_output_generation_method: 'manual' }));
  const onToggleOutputScript = () => setFormData(prev => ({ ...prev, expected_output_generation_method: 'script' }));
  const onToggleOutputFile = () => setFormData(prev => ({ ...prev, expected_output_generation_method: 'file' }));

  const onManualInputChange = (e) => setFormData(prev => ({ ...prev, manualInput: e.target.value }));
  const onManualExpectedChange = (e) => setFormData(prev => ({ ...prev, manualExpectedOutput: e.target.value }));

  const onPickInputFile = async () => {
    try {
      const filePath = await window.electron.openFile()
      if (filePath) setFormData(prev => ({ ...prev, inputFilePath: filePath }));
    } catch (error) {
      console.error('Error picking input file:', error)
    }
  }

  const onPickInputScriptFile = async () => {
    try {
      const filePath = await window.electron.openFile()
      if (filePath) setFormData(prev => ({ ...prev, inputScriptFilePath: filePath }));
    } catch (error) {
      console.error('Error picking input script file:', error)
    }
  }

  const onPickExpectedOutputFile = async () => {
    try {
      const filePath = await window.electron.openFile()
      if (filePath) setFormData(prev => ({ ...prev, expectedOutputFilePath: filePath }));
    } catch (error) {
      console.error('Error picking expected output file:', error)
    }
  }

  const onPickExpectedOutputScriptFile = async () => {
    try {
      const filePath = await window.electron.openFile()
      if (filePath) setFormData(prev => ({ ...prev, expectedOutputScriptFilePath: filePath }));
    } catch (error) {
      console.error('Error picking expected output script file:', error)
    }
  }

  const onCancelProject = () => {
    setFormData(initialFormData); // Reset to initial state provided by App.jsx
    if (onCancel) { // Use the new onCancel prop
      onCancel();
    }
  }

  const handleCreateProject = () => {
    if (!formData.selectedConfigId) {
      console.error('No configuration selected or config_id not found.')
      return
    }

    const projectData = {
      name: formData.project_name,
      config_id: formData.selectedConfigId,
      submissions_path: formData.submissions_directory,
    }

    const testConfigData = {
      input_method: formData.input_generation_method,
      input: formData.input,
      output_method: formData.expected_output_generation_method,
      expected_output: formData.expected_output,
    }

    const projectPayload = {
      project: projectData,
      testConfig: testConfigData,
    }
    console.log('ProjectCreation.jsx: handleCreateProject called with payload:', projectPayload); // Added console log
    onCreateProject(projectPayload)
  }

  return (
    <>

    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-gray-200">
        {isEditing ? 'Edit Project' : 'Create New Project'}
      </h1>

      <div className="space-y-6">
        <div className="card">
          <div className="card-header">Project Settings</div>
          <div className="card-body space-y-5">
            <div className="flex items-center">
              <div className="w-40 text-gray-300">Project Name:</div>
              <input
                type="text"
                value={formData.project_name}
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
                    value={formData.submissions_directory}
                    onChange={(e) => setFormData(prev => ({ ...prev, submissions_directory: e.target.value }))}
                    placeholder="Select submissions directory"
                    className="input-field w-full"
                    readOnly // Should remain readOnly if path is picked by dialog
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
                      <span>{formData.selectedLanguage || 'Select Config...'}</span>
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
                                formData.selectedLanguage === config.config_name ? 'bg-primary-700/20 text-primary-400' : ''
                              }`}
                              onClick={() => onLanguageSelect(config)}
                            >
                              <div className="flex items-center justify-between">
                                <span>{config.config_name}</span>
                                {formData.selectedLanguage === config.config_name && <FaCheck className="text-primary-400 text-sm" />}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onNewLangConfig} // Directly use prop from App.jsx
                    className="btn-outline hover:border-secondary-500 hover:bg-secondary-700/20 hover:text-secondary-400"
                    title="Create new configuration"
                  >
                    <FaPlus className="mr-2 text-xs" />
                    New
                  </button>

                  <button
                    onClick={handleEditLang}
                    className="btn-outline hover:border-primary-500 hover:bg-primary-700/20 hover:text-primary-400"
                    title="Edit configuration"
                    disabled={!formData.selectedLanguage}
                  >
                    <FaPencilAlt className="mr-2 text-xs" />
                    Edit
                  </button>

                  <button
                    onClick={handleDeleteConfig}
                    className="btn-outline hover:border-error-500 hover:bg-error-700/20 hover:text-error-400"
                    title="Delete configuration"
                    disabled={!formData.selectedLanguage}
                  >
                    <FaTrash className="mr-2 text-xs" /> Delete
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
                    formData.input_generation_method === 'manual'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaKeyboard
                    className={`mr-2 ${
                      formData.input_generation_method === 'manual' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  Manual
                </div>
                <div
                  onClick={onToggleInputFile}
                  className={`toggle-btn ${
                    formData.input_generation_method === 'file'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaFileCode
                    className={`mr-2 ${
                      formData.input_generation_method === 'file' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  File
                </div>
                <div
                  onClick={onToggleInputScript}
                  className={`toggle-btn ${
                    formData.input_generation_method === 'script'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaTerminal
                    className={`mr-2 ${
                      formData.input_generation_method === 'script' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  Script
                </div>
              </div>
            </div>

            {formData.input_generation_method === 'manual' && (
              <div className="flex items-center animate-fade-in">
                <div className="w-40 text-gray-300">Manual Input:</div>
                <input
                  type="text"
                  value={formData.manualInput}
                  onChange={onManualInputChange}
                  className="input-field flex-1"
                  placeholder={testPlaceholders.input}
                />
              </div>
            )}

            {formData.input_generation_method === 'script' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Input Script Cmd:</div>
                  <input
                    type="text"
                    value={formData.inputScriptCommand}
                    onChange={(e) => setFormData(prev => ({ ...prev, inputScriptCommand: e.target.value }))}
                    className="input-field flex-1"
                    placeholder={testPlaceholders.inputScriptCommand}
                  />
                </div>
                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Input Script File:</div>
                  <div className="flex-1 flex">
                    <input
                      type="text"
                      value={formData.inputScriptFilePath}
                      onChange={(e) => setFormData(prev => ({ ...prev, inputScriptFilePath: e.target.value }))}
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
                    value={formData.combinedInputScriptCommand}
                    className="input-field flex-1 bg-dark-bg cursor-not-allowed"
                    placeholder="Combined script command"
                    disabled
                  />
                </div>
              </div>
            )}

            {formData.input_generation_method === 'file' && (
              <div className="flex items-center animate-fade-in">
                <div className="w-40 text-gray-300">Input File Path:</div>
                <div className="flex-1 flex">
                  <input
                    type="text"
                    value={formData.inputFilePath}
                    onChange={(e) => setFormData(prev => ({ ...prev, inputFilePath: e.target.value }))}
                    placeholder={testPlaceholders.inputFilePath}
                    className="input-field flex-1 mr-2"
                    readOnly // Should remain readOnly if path is picked by dialog
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
                    formData.expected_output_generation_method === 'manual'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaKeyboard
                    className={`mr-2 ${
                      formData.expected_output_generation_method === 'manual' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  Manual
                </div>
                <div
                  onClick={onToggleOutputFile}
                  className={`toggle-btn ${
                    formData.expected_output_generation_method === 'file'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaFileCode
                    className={`mr-2 ${
                      formData.expected_output_generation_method === 'file' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  File
                </div>
                <div
                  onClick={onToggleOutputScript}
                  className={`toggle-btn ${
                    formData.expected_output_generation_method === 'script'
                      ? 'bg-primary-700/30 border-primary-500 text-white'
                      : 'bg-dark-bg border-dark-border text-gray-400 hover:border-dark-hover hover:bg-dark-hover/30'
                  }`}
                >
                  <FaTerminal
                    className={`mr-2 ${
                      formData.expected_output_generation_method === 'script' ? 'text-primary-400' : 'text-gray-500'
                    }`}
                  />
                  Script
                </div>
              </div>
            </div>

            {formData.expected_output_generation_method === 'manual' && (
              <div className="flex animate-fade-in">
                <div className="w-40 text-gray-300 mt-2">Manual Output:</div>
                <div className="flex-1">
                  <textarea
                    value={formData.manualExpectedOutput}
                    onChange={onManualExpectedChange}
                    className="input-field w-full h-24 resize-none font-mono text-sm"
                    placeholder={testPlaceholders.expectedOutput}
                  />
                </div>
              </div>
            )}

            {formData.expected_output_generation_method === 'script' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Output Script Cmd:</div>
                  <input
                    type="text"
                    value={formData.expectedOutputScriptCommand}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedOutputScriptCommand: e.target.value }))}
                    className="input-field flex-1"
                    placeholder={testPlaceholders.expectedOutputScriptCommand}
                  />
                </div>
                <div className="flex items-center">
                  <div className="w-40 text-gray-300">Output Script File:</div>
                  <div className="flex-1 flex">
                    <input
                      type="text"
                      value={formData.expectedOutputScriptFilePath}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedOutputScriptFilePath: e.target.value }))}
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
                    value={formData.combinedExpectedOutputScriptCommand}
                    className="input-field flex-1 bg-dark-bg cursor-not-allowed"
                    placeholder="Combined script command"
                    disabled
                  />
                </div>
              </div>
            )}

            {formData.expected_output_generation_method === 'file' && (
              <div className="flex items-center animate-fade-in">
                <div className="w-40 text-gray-300">Output File Path:</div>
                <div className="flex-1 flex">
                  <input
                    type="text"
                    value={formData.expectedOutputFilePath}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedOutputFilePath: e.target.value }))}
                    placeholder={testPlaceholders.expectedOutputFilePath}
                    className="input-field flex-1 mr-2"
                    readOnly // Should remain readOnly if path is picked by dialog
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
            {isEditing ? <FaPencilAlt className="mr-2" /> : <FaPlus className="mr-2" />}
            {isEditing ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

export default ProjectCreation