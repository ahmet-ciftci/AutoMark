import { FaChartBar, FaFolder } from 'react-icons/fa'

const Sidebar = ({ activeView, onViewChange }) => {
  return (
    <div className="w-16 bg-dark-bg border-r border-dark-border flex flex-col items-center py-6 text-gray-400">
      <div 
        className={`p-3 mb-6 rounded-md cursor-pointer transition-all duration-200 group focus:outline-none
          ${activeView === 'fileExplorer' 
            ? 'bg-primary-700/20 text-primary-400' 
            : 'hover:bg-dark-hover hover:text-gray-200'}`}
        onClick={() => onViewChange('fileExplorer')}
        title="File Explorer"
        tabIndex={0}
        role="button"
        aria-pressed={activeView === 'fileExplorer'}
      >
        <FaFolder className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
      </div>
      <div 
        className={`p-3 mb-6 rounded-md cursor-pointer transition-all duration-200 group focus:outline-none
          ${activeView === 'reports' 
            ? 'bg-primary-700/20 text-primary-400' 
            : 'hover:bg-dark-hover hover:text-gray-200'}`}
        onClick={() => onViewChange('reports')}
        title="Reports"
        tabIndex={0}
        role="button"
        aria-pressed={activeView === 'reports'}
      >
        <FaChartBar className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
      </div>
    </div>
  )
}

export default Sidebar