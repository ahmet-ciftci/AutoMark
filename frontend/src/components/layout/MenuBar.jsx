import { useState, useEffect, useRef } from 'react'
import { FaEye, FaQuestionCircle, FaHome } from 'react-icons/fa'

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

  const handleNewProject = () => {
    onNewProject()
    closeMenu()
  }

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
    <div ref={menuRef} className="bg-[#121212] text-gray-200 h-12 flex items-center px-4 w-full border-b border-[#333] shadow-sm">
      <div className="flex gap-1">
        {/* Home Button */}
        <button 
          onClick={handleGoHome}
          className={`menu-bar-item flex items-center gap-2`}
          title="Go to Welcome Screen"
        >
          <FaHome className="text-sm" />
          <span>Home</span>
        </button>

        {/* VIEW MENU */}
        <div className="relative">
          <button 
            onClick={() => toggleMenu('view')}
            className={`menu-bar-item flex items-center gap-2 ${openMenu === 'view' ? 'active bg-dark-hover text-white' : ''}`}
          >
            <FaEye className="text-sm" />
            <span>View</span>
          </button>
          {openMenu === 'view' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#1e1e1e] rounded-md z-50 border border-[#333] shadow-lg">
              <div className="py-1">
                <div className="menu-item group" onClick={() => handleViewAction('resetZoom')}>
                  <span className="menu-item-text">Actual Size</span>
                  {/* <span className=\"menu-item-shortcut\">Ctrl+0</span> */}
                </div>
                <div className="menu-item group" onClick={() => handleViewAction('zoomIn')}>
                  <span className="menu-item-text">Zoom In</span>
                  {/* <span className=\"menu-item-shortcut\">Ctrl++</span> */}
                </div>
                <div className="menu-item group" onClick={() => handleViewAction('zoomOut')}>
                  <span className="menu-item-text">Zoom Out</span>
                  {/* <span className=\"menu-item-shortcut\">Ctrl+-</span> */}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HELP MENU */}
        <div className="relative">
          <button 
            onClick={() => toggleMenu('help')}
            className={`menu-bar-item flex items-center gap-2 ${openMenu === 'help' ? 'active bg-dark-hover text-white' : ''}`}
          >
            <FaQuestionCircle className="text-sm" />
            <span>Help</span>
          </button>
          {openMenu === 'help' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#1e1e1e] rounded-md z-50 border border-[#333] shadow-lg">
              <div className="py-2 px-3 text-sm text-gray-300 space-y-2 max-h-80 overflow-y-auto">
                {helpContent || (
                  <p>Help content is not available.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuBar
