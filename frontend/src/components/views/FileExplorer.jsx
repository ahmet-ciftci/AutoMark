import { useState } from 'react'
import { FaChevronRight, FaChevronDown, FaFolder, FaFolderOpen, FaFile, FaCode } from 'react-icons/fa'

const FileExplorer = () => {
  const [expandedFolders, setExpandedFolders] = useState({})
  
  // File system structure
  const folders = {}

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }))
  }

  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContentKey, setFileContentKey] = useState(0)
  
  const selectFile = (fileId, fileName) => {
    setFileContentKey(prevKey => prevKey + 1)
    setSelectedFile({
      id: fileId,
      name: fileName,
      content: ''
    })
  }

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6 text-gray-200">
        File Explorer
      </h1>
      
      <div className="flex-1 grid grid-cols-[300px_1fr] gap-4">
        <div className="card">
          <div className="card-header">EXPLORER</div>
          <div className="p-2 overflow-auto max-h-[calc(100vh-220px)]">
            {Object.keys(folders).map(folderName => (
              <div key={folderName} className="mb-1">
                <div 
                  className="flex items-center py-1.5 px-2 cursor-pointer text-gray-200 hover:bg-dark-hover rounded"
                  onClick={() => toggleFolder(folderName)}
                >
                  <span className={`mr-2 folder-icon ${expandedFolders[folderName] ? 'folder-icon-expanded' : ''}`}>
                    <FaChevronRight />
                  </span>
                  {expandedFolders[folderName] 
                    ? <FaFolderOpen className="mr-2 text-yellow-500" /> 
                    : <FaFolder className="mr-2 text-yellow-500" />
                  }
                  {folderName}
                </div>
                <div className={`folder-children ${expandedFolders[folderName] ? 'folder-children-expanded' : ''}`}>
                  {folders[folderName]?.map(item => (
                    <div key={item.id} className="ml-4">
                      <div 
                        className="flex items-center py-1.5 px-2 cursor-pointer text-gray-200 hover:bg-dark-hover rounded"
                        onClick={() => toggleFolder(item.name)}
                      >
                        <span className={`mr-2 folder-icon ${expandedFolders[item.name] ? 'folder-icon-expanded' : ''}`}>
                          <FaChevronRight />
                        </span>
                        {expandedFolders[item.name] 
                          ? <FaFolderOpen className="mr-2 text-yellow-500" /> 
                          : <FaFolder className="mr-2 text-yellow-500" />
                        }
                        {item.name}
                      </div>
                      <div className={`folder-children ${expandedFolders[item.name] ? 'folder-children-expanded' : ''}`}>
                        {item.children && item.children.map(child => (
                          <div 
                            key={child.id} 
                            className={`ml-6 py-1.5 px-2 text-gray-200 cursor-pointer rounded ${
                              selectedFile?.id === child.id ? 'file-selected' : 'hover:bg-dark-hover'
                            }`}
                            onClick={() => selectFile(child.id, child.name)}
                          >
                            <FaFile className="mr-2 text-gray-400 inline" />
                            {child.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card overflow-auto">
          {selectedFile ? (
            <>
              <div className="card-header">
                {selectedFile.name}
              </div>
              <pre key={fileContentKey} className="font-mono text-gray-300 p-4 bg-dark-bg rounded file-content-fade selectable-text">
                {selectedFile.content}
              </pre>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileExplorer