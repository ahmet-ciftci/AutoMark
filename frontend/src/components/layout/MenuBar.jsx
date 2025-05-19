import { useState, useEffect, useRef } from 'react'
import { FaEye, FaQuestionCircle, FaHome } from 'react-icons/fa'
import '../../assets/css/menubar.css'

const MenuBar = ({ onNewProject = () => {}, onOpenProject = () => {}, helpContent = null, onGoHome = () => {} }) => {
  const [openMenu, setOpenMenu] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null)
      }
    }
    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenu])

  const toggleMenu = (menu) => {
    setOpenMenu(prev => (prev === menu ? null : menu))
  }

  const closeMenu = () => setOpenMenu(null)

  const handleGoHome = () => {
    onGoHome();
    closeMenu();
  }

  const handleViewAction = (action) => {
    if (window.electron && typeof window.electron[action] === 'function') {
      window.electron[action]();
    }
    closeMenu();
  };

  return (
    <div 
      ref={menuRef} 
      className="bg-gradient-to-r from-dark-bg via-dark-surface to-dark-bg text-gray-200 h-14 flex items-center px-4 w-full
                border-b border-dark-border relative z-10 shadow-md"
    >
      {/* Gradient line at the bottom */}
      <div className="absolute -bottom-[1px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent"></div>
      
      <div className="flex items-center gap-1">
        {/* Logo section */}
        <div className="flex items-center mr-4">
          <span className="text-xl font-bold text-white">Auto<span className="text-primary-400">Mark</span></span>
        </div>

        {/* Home Button */}
        <button 
          onClick={handleGoHome}
          className="group relative px-3 py-2 rounded-md flex items-center gap-2 transition-all duration-300 
                   hover:bg-primary-500/10 text-gray-200 hover:text-primary-300 overflow-hidden"
          title="Go to home screen"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-400/0 via-primary-300/5 to-primary-400/0 
                    transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></span>
          <FaHome className="text-sm" />
          <span className="font-medium">Home</span>
        </button>

        {/* VIEW MENU */}
        <div className="relative">
          <button 
            onClick={() => toggleMenu('view')}
            className={`group relative px-3 py-2 rounded-md flex items-center gap-2 transition-all duration-300
                      ${openMenu === 'view' 
                        ? 'bg-primary-500/20 text-primary-300' 
                        : 'hover:bg-primary-500/10 text-gray-200 hover:text-primary-300'}
                      overflow-hidden`}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-400/0 via-primary-300/5 to-primary-400/0 
                          transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></span>
            <FaEye className="text-sm" />
            <span className="font-medium">View</span>
          </button>
          
          {openMenu === 'view' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-dark-surface rounded-lg z-50 overflow-hidden
                           border border-dark-border shadow-lg backdrop-blur-sm
                           animate-fadeIn transition-all duration-200 transform origin-top-left">
              <div className="py-1 divide-y divide-dark-border/50">
                <div 
                  className="group px-3 py-2 hover:bg-primary-500/10 cursor-pointer transition-all duration-200
                          flex items-center text-gray-300 hover:text-primary-300"
                  onClick={() => handleViewAction('resetZoom')}
                >
                  <span className="menu-item-text">Actual Size</span>
                </div>
                <div 
                  className="group px-3 py-2 hover:bg-primary-500/10 cursor-pointer transition-all duration-200
                          flex items-center text-gray-300 hover:text-primary-300"
                  onClick={() => handleViewAction('zoomIn')}
                >
                  <span className="menu-item-text">Zoom In</span>
                </div>
                <div 
                  className="group px-3 py-2 hover:bg-primary-500/10 cursor-pointer transition-all duration-200
                          flex items-center text-gray-300 hover:text-primary-300"
                  onClick={() => handleViewAction('zoomOut')}
                >
                  <span className="menu-item-text">Zoom Out</span>
                </div>
              </div>
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary-500/20 to-transparent"></div>
            </div>
          )}
        </div>

        {/* HELP MENU */}
        <div className="relative">
          <button 
            onClick={() => toggleMenu('help')}
            className={`group relative px-3 py-2 rounded-md flex items-center gap-2 transition-all duration-300
                      ${openMenu === 'help' 
                        ? 'bg-primary-500/20 text-primary-300' 
                        : 'hover:bg-primary-500/10 text-gray-200 hover:text-primary-300'}
                      overflow-hidden`}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-400/0 via-primary-300/5 to-primary-400/0 
                          transform -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></span>
            <FaQuestionCircle className="text-sm" />
            <span className="font-medium">Help</span>
          </button>
          
          {openMenu === 'help' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-dark-surface rounded-lg z-50 overflow-hidden
                           border border-dark-border shadow-lg backdrop-blur-sm
                           animate-fadeIn transition-all duration-200 transform origin-top-left">
              <div className="py-2 px-3 text-sm text-gray-300 space-y-2 max-h-80 overflow-y-auto">
                {helpContent || (
                  <p>Help content is not available.</p>
                )}
              </div>
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary-500/20 to-transparent"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuBar
