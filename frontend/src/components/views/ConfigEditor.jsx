import { useState, useEffect } from 'react'
import { FaFolder, FaSave, FaTimes } from 'react-icons/fa'

const ConfigEditor = ({ selectedLanguage = null, onCancelConfig, onSaveConfig }) => {
  const [config_name, setConfigName] = useState('');
  const [compile_command, setCompileCommand] = useState('');
  const [source_code, setSourceCode] = useState('');
  const [compile_parameters, setCompileParameters] = useState('');
  const [run_command, setRunCommand] = useState('');

  const [config_id, setConfigId] = useState(null);

  const [placeholders, setPlaceholders] = useState({
    compileCommand: 'Compilation command (if needed)',
    sourceCode: 'Source file name(s)',
    compileParameters: 'Additional compilation parameters',
    runCommand: 'Execution command'
  });

  useEffect(() => {
    const loadConfigData = async () => {
      if (!selectedLanguage) return;
  
      try {
        const config = await window.electron.getConfigByName(selectedLanguage);
        if (config) {
          setConfigId(config.id);
          setConfigName(config.name || '');
          setCompileCommand(config.compile_command || '');
          setSourceCode(config.source_code || '');
          setCompileParameters(config.compile_parameters || '');
          setRunCommand(config.run_command || '');
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
  
    loadConfigData();
  }, [selectedLanguage]);
  
  

  const onPickCompilerPath = () => {
    console.log('Pick compiler path button clicked');
  };

  const onChangeCompileCmd = (e) => {
    setCompileCommand(e.target.value);
  };

  const onChangeSourceCode = (e) => {
    setSourceCode(e.target.value);
  };

  const onChangeCompileParams = (e) => {
    setCompileParameters(e.target.value);
  };

  const onChangeRunCmd = (e) => {
    setRunCommand(e.target.value);
  };

  const handleCancelConfig = () => {
    if (onCancelConfig) {
      onCancelConfig();
    }
  };

  const handleSaveConfig = async () => {
    const config = {
      id: config_id,
      config_name: config_name.trim() || 'Untitled Configuration',
      compile_command,
      source_code,
      compile_parameters,
      run_command,
    };
  
    try {
      if (config.id) {
        await window.electron.updateConfig(config);
      } else {
        await window.electron.saveConfig(config);
      }
      
      onSaveConfig?.(config); 
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };
  
  

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-gray-200">
        {config_name ? `${config_name} Configuration` : 'New Configuration'}
      </h1>

      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2>Configuration Settings</h2>
          </div>
          <div className="card-body space-y-5">
            <div className="flex items-center">
              <div className="w-40 text-gray-300">Configuration Name:</div>
              <input
                type="text"
                value={config_name}
                onChange={(e) => setConfigName(e.target.value)}
                className="input-field flex-1"
                placeholder="Enter a name for this configuration"
              />
            </div>

            <div className="flex items-center">
              <div className="w-40 text-gray-300">Compile Command:</div>
              <input
                type="text"
                value={compile_command}
                onChange={onChangeCompileCmd}
                className="input-field flex-1"
                placeholder={placeholders.compileCommand}
              />
            </div>

            <div className="flex items-center">
              <div className="w-40 text-gray-300">Source File(s):</div>
              <input
                type="text"
                value={source_code}
                onChange={onChangeSourceCode}
                className="input-field flex-1"
                placeholder={placeholders.sourceCode}
              />
            </div>

            <div className="flex items-center">
              <div className="w-40 text-gray-300">Compile Params:</div>
              <input
                type="text"
                value={compile_parameters}
                onChange={onChangeCompileParams}
                className="input-field flex-1"
                placeholder={placeholders.compileParameters}
              />
            </div>

            <div className="flex items-center">
              <div className="w-40 text-gray-300">Run Command:</div>
              <input
                type="text"
                value={run_command}
                onChange={onChangeRunCmd}
                className="input-field flex-1"
                placeholder={placeholders.runCommand}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-8">
          <button
            onClick={handleCancelConfig}
            className="btn-secondary"
          >
            <FaTimes className="mr-2" /> Cancel
          </button>
          <button
            onClick={handleSaveConfig}
            className="btn-primary"
          >
            <FaSave className="mr-2" /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigEditor;