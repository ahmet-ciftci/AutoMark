import { useState, useEffect } from 'react'
import { FaFolder, FaSave, FaTimes, FaTerminal, FaFileAlt } from 'react-icons/fa'

const ConfigEditor = ({ selectedLanguage = 'Java', onCancelConfig, onSaveConfig }) => {
  // State for configuration settings
  const [compilerPath, setCompilerPath] = useState('')
  const [compileCommand, setCompileCommand] = useState('')
  const [runCommand, setRunCommand] = useState('')
  const [useArguments, setUseArguments] = useState(true)
  const [useScript, setUseScript] = useState(false)
  const [input, setInput] = useState('')
  const [expectedOutput, setExpectedOutput] = useState('')
  const [needsCompilation, setNeedsCompilation] = useState(true)

  // Set default values based on the selected language
  useEffect(() => {
    switch (selectedLanguage) {
      case 'Java':
        setCompilerPath('C:\\Program Files\\Java\\jdk-21\\bin\\javac.exe')
        setCompileCommand('javac Main.java')
        setRunCommand('java Main')
        setInput('5')
        setExpectedOutput('1,1,2,3,5,8,13,21,34,55')
        setNeedsCompilation(true)
        break
      case 'C':
        setCompilerPath('C:\\Program Files\\MSVC\\bin\\cl.exe')
        setCompileCommand('gcc main.c -o program')
        setRunCommand('./program')
        setInput('8')
        setExpectedOutput('1,1,2,3,5,8,13,21,34')
        setNeedsCompilation(true)
        break
      case 'C++':
        setCompilerPath('C:\\Program Files\\MSVC\\bin\\cl.exe')
        setCompileCommand('g++ main.cpp -o program')
        setRunCommand('./program')
        setInput('7')
        setExpectedOutput('1,1,2,3,5,8,13,21')
        setNeedsCompilation(true)
        break
      case 'Python':
        setCompilerPath('C:\\Program Files\\Python\\python.exe')
        setCompileCommand('')
        setRunCommand('python main.py')
        setInput('6')
        setExpectedOutput('1,1,2,3,5,8,13')
        setNeedsCompilation(false)
        break
      default:
        setCompilerPath('')
        setCompileCommand('')
        setRunCommand('')
        setInput('')
        setExpectedOutput('')
        setNeedsCompilation(true)
    }
  }, [selectedLanguage])

  const onPickCompilerPath = () => {
    console.log('Pick compiler path button clicked')
  }

  const onChangeCompileCmd = (e) => {
    setCompileCommand(e.target.value)
  }

  const onChangeRunCmd = (e) => {
    setRunCommand(e.target.value)
  }

  const onToggleArgument = () => {
    setUseArguments(true)
    setUseScript(false)
  }

  const onToggleScript = () => {
    setUseScript(true)
    setUseArguments(false)
  }

  const onInputChange = (e) => {
    setInput(e.target.value)
  }

  const onExpectedChange = (e) => {
    setExpectedOutput(e.target.value)
  }

  const handleCancelConfig = () => {
    if (onCancelConfig) {
      onCancelConfig()
    }
  }

  const handleSaveConfig = () => {
    const config = {
      language: selectedLanguage,
      compilerPath,
      compileCommand,
      runCommand,
      useArguments,
      useScript,
      input,
      expectedOutput,
    }
    
    if (onSaveConfig) {
      onSaveConfig(config)
    } else if (onCancelConfig) {
      onCancelConfig()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-gray-200">
        {selectedLanguage} Configuration
      </h1>
      
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2>Compiler Settings</h2>
          </div>
          <div className="card-body space-y-5">
            <div className="flex items-center">
              <div className="w-40 text-gray-300">Compiler Path:</div>
              <div className="flex-1 flex">
                <div className="flex-1 mr-2">
                  <input
                    type="text"
                    value={compilerPath}
                    onChange={(e) => setCompilerPath(e.target.value)}
                    placeholder="Path to compiler"
                    className="input-field w-full"
                  />
                </div>
                <button 
                  onClick={onPickCompilerPath}
                  className="bg-dark-hover px-3 py-2 rounded border border-dark-border hover:bg-dark-border"
                >
                  <FaFolder className="text-gray-300" />
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-40 text-gray-300">Compile Command:</div>
              <input
                type="text"
                value={compileCommand}
                onChange={onChangeCompileCmd}
                disabled={!needsCompilation}
                className={`input-field flex-1 ${
                  needsCompilation ? '' : 'bg-dark-bg cursor-not-allowed'
                }`}
                placeholder={!needsCompilation ? "Interpreted language - no compilation needed" : "Command to compile code"}
              />
            </div>

            <div className="flex items-center">
              <div className="w-40 text-gray-300">Run Command:</div>
              <input
                type="text"
                value={runCommand}
                onChange={onChangeRunCmd}
                className="input-field flex-1"
                placeholder="Command to run the compiled code"
              />
            </div>
          </div>
        </div>

        {/* Enhanced Test Case Card */}
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
              </div>
            </div>

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
  )
}

export default ConfigEditor