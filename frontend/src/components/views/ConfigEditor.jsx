import { useState, useEffect } from 'react'
import { FaFolder, FaSave, FaTimes } from 'react-icons/fa'

const ConfigEditor = ({ selectedLanguage = 'Java', onCancelConfig, onSaveConfig }) => {
  // State for configuration settings
  const [compilerPath, setCompilerPath] = useState('')
  const [compilerName, setCompilerName] = useState('') // Added compilerName state
  const [compileCommand, setCompileCommand] = useState('')
  const [runCommand, setRunCommand] = useState('')
  const [needsCompilation, setNeedsCompilation] = useState(true)
  
  // Set default values based on the selected language
  useEffect(() => {
    switch (selectedLanguage) {
      case 'Java':
        setCompilerPath('C:\\Program Files\\Java\\jdk-21\\bin\\javac.exe')
        setCompilerName('javac') // Default compiler name for Java
        setCompileCommand('javac Main.java')
        setRunCommand('java Main')
        setNeedsCompilation(true)
        break
      case 'C':
        setCompilerPath('C:\\Program Files\\MSVC\\bin\\cl.exe')
        setCompilerName('gcc') // Default compiler name for C
        setCompileCommand('gcc main.c -o program')
        setRunCommand('./program')
        setNeedsCompilation(true)
        break
      case 'C++':
        setCompilerPath('C:\\Program Files\\MSVC\\bin\\cl.exe')
        setCompilerName('g++') // Default compiler name for C++
        setCompileCommand('g++ main.cpp -o program')
        setRunCommand('./program')
        setNeedsCompilation(true)
        break
      case 'Python':
        setCompilerPath('C:\\Program Files\\Python\\python.exe')
        setCompilerName('python') // Default compiler name for Python
        setCompileCommand('')
        setRunCommand('python main.py')
        setNeedsCompilation(false)
        break
      default:
        setCompilerPath('')
        setCompilerName('') // Default empty compiler name
        setCompileCommand('')
        setRunCommand('')
        setNeedsCompilation(true)
    }
  }, [selectedLanguage])

  const onPickCompilerPath = () => {
    setCompilerPath(`C:\\Program Files\\${selectedLanguage}\\bin\\compiler.exe`)
    console.log('Pick compiler path button clicked')
  }

  const onChangeCompileCmd = (e) => {
    setCompileCommand(e.target.value)
  }

  const onChangeRunCmd = (e) => {
    setRunCommand(e.target.value)
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
      compilerName, // Include compilerName in the saved config
      compileCommand,
      runCommand,
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
              <div className="w-40 text-gray-300">Compiler Name:</div>
              <input
                type="text"
                value={compilerName}
                onChange={(e) => setCompilerName(e.target.value)}
                className="input-field flex-1"
                placeholder="Name of the compiler executable (e.g., javac, gcc, python)"
              />
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