import { useState, useEffect, useRef } from 'react'
import { FaFile, FaEdit, FaEye, FaQuestionCircle } from 'react-icons/fa'

const MenuBar = ({ onNewProject = () => {}, onOpenProject = () => {} }) => {
  const [openMenu, setOpenMenu] = useState(null)
  const menuRef = useRef(null)
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null)
      }
    }
    
    // Add event listener when a menu is open
    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenu])
  
  const toggleMenu = (menu) => {
    if (openMenu === menu) {
      setOpenMenu(null)
    } else {
      setOpenMenu(menu)
    }
  }
  
  const closeMenu = () => {
    setOpenMenu(null)
  }
  
  const handleNewProject = () => {
    onNewProject()
    closeMenu()
  }
  
  return (
    <div ref={menuRef} className="bg-[#121212] text-gray-200 h-12 flex items-center px-4 w-full border-b border-[#333] shadow-sm">
      <div className="flex gap-1">
        <div className="relative">
          <button 
            onClick={() => toggleMenu('file')}
            className={`menu-bar-item flex items-center gap-2 ${openMenu === 'file' ? 'active bg-dark-hover text-white' : ''}`}
          >
            <FaFile className="text-sm" />
            <span>File</span>
          </button>
          {openMenu === 'file' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#1e1e1e] rounded-md z-50 border border-[#333] shadow-lg">
              <div className="py-1">
                <div className="menu-item group" onClick={handleNewProject}>
                  <span className="menu-item-text">New Project</span>
                  <span className="menu-item-shortcut">Ctrl+N</span>
                </div>
<div className="menu-item group" onClick={() => { onOpenProject(); closeMenu(); }}>
                  <span className="menu-item-text">Open Project</span>
                  <span className="menu-item-shortcut">Ctrl+O</span>
                </div>
                <div className="menu-item group" onClick={closeMenu}>
                  <span className="menu-item-text">Save Project</span>
                  <span className="menu-item-shortcut">Ctrl+S</span>
                </div>
                <div className="menu-item group" onClick={closeMenu}>
                  <span className="menu-item-text">Save Project As</span>
                  <span className="menu-item-shortcut">Ctrl+Shift+S</span>
                </div>
                <div className="border-t border-[#444] my-1"></div>
                <div className="menu-item group" onClick={closeMenu}>
                  <span className="menu-item-text">Close Window</span>
                  <span className="menu-item-shortcut">Alt+F4</span>
                </div>
                <div className="border-t border-[#444] my-1"></div>
                <div className="menu-item group" onClick={closeMenu}>
                  <span className="menu-item-text">Exit</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => toggleMenu('edit')}
            className={`menu-bar-item flex items-center gap-2 ${openMenu === 'edit' ? 'active bg-dark-hover text-white' : ''}`}
          >
            <FaEdit className="text-sm" />
            <span>Edit</span>
          </button>
          {openMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#1e1e1e] rounded-md z-50 border border-[#333] shadow-lg">
              <div className="py-1">
                <div className="menu-item group" onClick={closeMenu}>
                  <span className="menu-item-text">Cut</span>
                  <span className="menu-item-shortcut">Ctrl+X</span>
                </div>
                <div className="menu-item group" onClick={closeMenu}>
                  <span className="menu-item-text">Copy</span>
                  <span className="menu-item-shortcut">Ctrl+C</span>
                </div>
                <div className="menu-item group" onClick={closeMenu}>
                  <span className="menu-item-text">Paste</span>
                  <span className="menu-item-shortcut">Ctrl+V</span>
                </div>
              </div>
            </div>
          )}
        </div>

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
                {/* Simplified menu content */}
              </div>
            </div>
          )}
        </div>

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
              <div className="py-1">
                {/* Simplified menu content */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuBar