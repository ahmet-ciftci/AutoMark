import { useState, useEffect } from 'react';
import { FaChevronRight, FaChevronDown, FaFolder, FaFolderOpen, FaFile } from 'react-icons/fa';

const FileExplorer = ({ projectId = 1 }) => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [folders, setFolders] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContentKey, setFileContentKey] = useState(0);

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const selectFile = async (filePath, fileName) => {
    setFileContentKey(prevKey => prevKey + 1);
    try {
      const content = await window.electron.readFile(filePath);
      setSelectedFile({
        id: filePath,
        name: fileName,
        content
      });
    } catch (err) {
      console.error("Failed to read file", err);
    }
  };

  useEffect(() => {
    const loadStructure = async () => {
      try {
        const structure = await window.electron.getProjectFiles(projectId);
        setFolders(structure);
      } catch (err) {
        console.error("Failed to load folder structure", err);
      }
    };

    loadStructure();
  }, [projectId]);

  const renderFolder = (item) => {
    if (item.type === 'file') {
      return (
        <div
          key={item.path}
          className={`ml-6 py-1.5 px-2 text-gray-200 cursor-pointer rounded ${
            selectedFile?.id === item.path ? 'file-selected' : 'hover:bg-dark-hover'
          }`}
          onClick={() => selectFile(item.path, item.name)}
        >
          <FaFile className="mr-2 text-gray-400 inline" />
          {item.name}
        </div>
      );
    }

    return (
      <div key={item.path} className="mb-1 ml-2">
        <div
          className="flex items-center py-1.5 px-2 cursor-pointer text-gray-200 hover:bg-dark-hover rounded"
          onClick={() => toggleFolder(item.path)}
        >
          <span className="mr-2">
            {expandedFolders[item.path] ? <FaChevronDown /> : <FaChevronRight />}
          </span>
          {expandedFolders[item.path]
            ? <FaFolderOpen className="mr-2 text-yellow-500" />
            : <FaFolder className="mr-2 text-yellow-500" />
          }
          {item.name}
        </div>
        {expandedFolders[item.path] && item.children?.map(renderFolder)}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6 text-gray-200">
        File Explorer
      </h1>

      <div className="flex-1 grid grid-cols-[300px_1fr] gap-4">
        <div className="card">
          <div className="card-header">EXPLORER</div>
          <div className="p-2 overflow-auto max-h-[calc(100vh-220px)]">
            {folders.map(renderFolder)}
          </div>
        </div>

        <div className="card overflow-auto">
          {selectedFile ? (
            <>
              <div className="card-header">
                {selectedFile.name}
              </div>
              <pre
                key={fileContentKey}
                className="font-mono text-gray-300 p-4 bg-dark-bg rounded file-content-fade selectable-text"
              >
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
  );
};

export default FileExplorer;
