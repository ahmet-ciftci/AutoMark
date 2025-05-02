const MainContent = ({ children }) => {
  return (
    <div className="flex-1 overflow-auto p-6 bg-[#121212]">
      {children}
    </div>
  )
}

export default MainContent