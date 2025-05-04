import { useEffect, useState } from 'react';

function OpenProject({ onSelectProject, onClose }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    window.electron.getAllProjects().then(setProjects).catch(console.error);
  }, []);

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 p-6 rounded shadow-xl w-96 z-50">
      <h2 className="text-xl font-bold mb-4 text-white">Select a Project</h2>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {projects.map((p) => (
          <li key={p.id}>
            <button 
              className="w-full text-left text-blue-400 hover:text-blue-200"
              onClick={() => onSelectProject(p.id)}
            >
              {p.name}
            </button>
          </li>
        ))}
      </ul>
      <button className="mt-4 text-sm text-red-400 hover:text-red-300" onClick={onClose}>Cancel</button>
    </div>
  );
}

export default OpenProject;
