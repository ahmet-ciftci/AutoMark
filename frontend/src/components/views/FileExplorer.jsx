import { useState, useEffect } from 'react';
import { FaChevronRight, FaChevronDown, FaFolder, FaFolderOpen, FaFile, FaExclamationCircle } from 'react-icons/fa';

const FileExplorer = ({ projectId }) => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [folders, setFolders] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContentKey, setFileContentKey] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
      if (!projectId) {
        setError("No project selected. Please open or create a project first.");
        setFolders([]);
        setSelectedFile(null); // Clear selected file when project changes or is not selected
        setLoading(false); // Ensure loading is false
        return;
      }
      
      setLoading(true);
      setError(null);
      setSelectedFile(null); // Clear selected file on new load
      
      try {
        const structure = await window.electron.getProjectFiles(projectId);
        if (structure && structure.length > 0) {
          // Sort the structure: folders first, then files, then alphabetically by name
          const sortedStructure = structure.sort((a, b) => {
            // Sort by type first (folders before files)
            if (a.type === 'folder' && b.type === 'file') {
              return -1;
            }
            if (a.type === 'file' && b.type === 'folder') {
              return 1;
            }

            // Then sort by name alphabetically
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }
            return 0;
          });
          setFolders(sortedStructure);
        } else {
          // If structure is empty or not returned, it implies no submissions or a problem.
          // The backend error messages are more specific, so we prefer those if they exist.

          setFolders([]);
          setError("No submissions available for this project.");
        }
      } catch (err) {
        console.error("Failed to load folder structure", err);
        let friendlyMessage = "Unable to display project files at the moment."; // Default generic error
        
        if (err.message) {
          if (err.message.includes("No submissions found") || err.message.includes("No valid submission folders found")) {
            friendlyMessage = "No submissions available for this project.";
          } else if (err.message.includes("Config not found")) {
            friendlyMessage = "There seems to be a configuration issue with this project.";
          } else if (err.message.includes("ENOENT") || err.message.includes("directory does not exist")) {
            friendlyMessage = "The project directory was not found. Please check the project path.";
          }
          // Keep other specific backend errors if they are user-friendly enough,
          // otherwise, the default "Unable to display..." is used.
        }
        setError(friendlyMessage);
        setFolders([]);
      } finally {
        setLoading(false);
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
            {loading ? (
              <div className="flex flex-col justify-center items-center h-full text-gray-400 p-4">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 mb-4"></div>
                <p>Loading files...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-full text-center p-6">
                {error === "No submissions available for this project." || error.includes("No valid submission") ? (
                  <>
                    <FaExclamationCircle className="text-red-500 text-5xl mb-4" />
                    <h2 className="text-xl font-semibold text-gray-200 mb-1">
                      No submissions found for this project.
                    </h2>
                    <p className="text-gray-400 text-base max-w-md">
                      Try opening a different project or creating a new one.
                    </p>
                  </>
                ) : (
                  <>
                    <FaExclamationCircle className="text-red-500 text-5xl mb-4" />
                    <h2 className="text-xl font-semibold text-gray-200 mb-2">
                      Error Loading Files
                    </h2>
                    <p className="text-gray-400 max-w-md">{error}</p>
                    {error === "No project selected. Please open or create a project first." ? (
                      <p className="text-gray-500 text-sm mt-2">
                        You can select a project from the Welcome screen.
                      </p>
                    ) : (
                      <p className="text-gray-500 text-sm mt-2">
                        Please check the project settings or try again. If the issue persists, consult the logs.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : folders.length > 0 ? (
              folders.map(renderFolder)
            ) : (
              // This is the "empty" state when folders.length === 0 and no error
              <div className="flex flex-col justify-center items-center h-full text-center p-6">
                <FaExclamationCircle className="text-red-500 text-5xl mb-4" />
                <h2 className="text-xl font-semibold text-gray-200 mb-1">
                  No submissions found for this project.
                </h2>
                <p className="text-gray-400 text-base max-w-md">
                  Try opening a different project or creating a new one.
                </p>
              </div>
            )}
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
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <FaFile className="text-gray-600 text-4xl mb-4 opacity-30" />
              <h3 className="text-gray-300 text-xl mb-2">No File Selected</h3>
              <p className="text-gray-500 max-w-md">
                {error && error !== "No submissions available for this project." ? 
                  "File explorer encountered an issue. Once resolved, you'll be able to select and view files here." :
                  error === "No submissions available for this project." ?
                  "There are no submissions to select files from." :
                  folders.length === 0 ?
                  "There are no files to select in this project." :
                  "Select a file from the explorer panel to view its contents."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
