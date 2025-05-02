import { useState } from 'react'
import { FaFilePdf, FaFileCsv, FaFileCode, FaDownload, FaTimes, FaChevronRight, FaFolder, FaFolderOpen, FaCheck } from 'react-icons/fa'

const ReportsView = () => {
  const [expandedFolders, setExpandedFolders] = useState({})
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [showExportSelection, setShowExportSelection] = useState(false)
  const [selectedReports, setSelectedReports] = useState([])
  const [hoveredOutputIndex, setHoveredOutputIndex] = useState(null)

  // Data structures for reports
  const courses = {}
  const outputs = []

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }))
  }

  const handleReportSelection = (reportId) => {
    const isCurrentlySelected = selectedReports.includes(reportId);
    
    setSelectedReports(prev => 
      isCurrentlySelected 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  }

  const exportReport = (format) => {
    if (selectedReports.length === 0) {
      return
    }
    
    setShowExportOptions(false)
    setShowExportSelection(false)
  }

  // State for selected student to display report for
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Helper function to determine color based on score percentage
  const getScoreColorClass = (scorePercentage) => {
    const score = parseFloat(scorePercentage);
    if (score >= 70) return 'text-green-500'; 
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-500';
  }

  // Neutral color when no data exists
  const scoreColorClass = 'text-gray-400';

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6 text-gray-200">
        Project Reports
      </h1>

      {/* Export controls */}
      <div className="mb-4 flex items-center justify-end space-x-2">
        <button 
          className="btn-secondary flex items-center"
          onClick={() => {
            setShowExportSelection(!showExportSelection)
            setShowExportOptions(false)
          }}
        >
          <FaDownload className="mr-2" />
          Export Report
        </button>
        
        {showExportOptions && (
          <div className="flex space-x-2 animate-fade-in">
            <button 
              className="btn-danger btn-sm flex items-center"
              onClick={() => exportReport('pdf')}
              title="Export as PDF"
            >
              <FaFilePdf className="mr-2" />
              PDF
            </button>
            <button 
              className="btn-success btn-sm flex items-center"
              onClick={() => exportReport('csv')}
              title="Export as CSV"
            >
              <FaFileCsv className="mr-2" />
              CSV
            </button>
            <button 
              className="btn-primary btn-sm flex items-center"
              onClick={() => exportReport('json')}
              title="Export as JSON"
            >
              <FaFileCode className="mr-2" />
              JSON
            </button>
          </div>
        )}
      </div>

      {/* Export Selection Modal */}
      {showExportSelection && (
        <div className="modal-backdrop">
          <div className="bg-[#1e1e1e] border border-[#333] rounded-md w-full max-w-4xl max-h-[90vh] flex flex-col animate-modal">
            <div className="card-header justify-between">
              <h3 className="font-medium text-xl">Select Reports to Export</h3>
              <button
                onClick={() => setShowExportSelection(false)}
                className="text-gray-400 hover:text-gray-200 p-2"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              {Object.keys(courses).map(courseName => (
                <div key={courseName} className="mb-4">
                  <div className="font-medium text-lg mb-3 text-gray-200">{courseName}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {courses[courseName].map(student => {
                      const isSelected = selectedReports.includes(student.id);
                      
                      return (
                        <div 
                          key={`${student.id}-${isSelected ? 'selected' : 'unselected'}`}
                          onClick={() => handleReportSelection(student.id)}
                          className={`
                            p-4 rounded-md cursor-pointer 
                            ${isSelected 
                              ? 'bg-primary-700/30 border border-primary-500 animate-card-select' 
                              : 'bg-[#262626] border border-[#333] hover:border-[#444] hover:bg-[#2a2a2a]'}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium">{student.name}</span>
                            <span className={`px-2 py-1 rounded text-sm ${
                              parseFloat(student.score) >= 70 ? 'bg-green-900 text-green-100' : 
                              parseFloat(student.score) >= 50 ? 'bg-yellow-900 text-yellow-100' : 
                              'bg-red-900 text-red-100'
                            }`}>
                              {student.score}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="flex justify-end mt-2">
                              <FaCheck className="text-primary-400" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="card-footer flex justify-between items-center">
              <div>
                <span className="text-gray-400">Selected: </span>
                <span className="text-white font-medium">{selectedReports.length} reports</span>
              </div>
              <div className="flex space-x-3">
                <button
                  className="btn-secondary"
                  onClick={() => setShowExportSelection(false)}
                >
                  Cancel
                </button>
                {selectedReports.length > 0 && (
                  <div className="flex space-x-3">
                    <button 
                      className="btn-danger flex items-center font-medium hover:shadow-glow-red"
                      onClick={() => exportReport('pdf')}
                      title="Export as PDF"
                    >
                      <FaFilePdf className="mr-2" />
                      PDF
                    </button>
                    <button 
                      className="btn-success flex items-center font-medium hover:shadow-glow-green"
                      onClick={() => exportReport('csv')}
                      title="Export as CSV"
                    >
                      <FaFileCsv className="mr-2" />
                      CSV
                    </button>
                    <button 
                      className="btn-primary flex items-center font-medium hover:shadow-glow-blue"
                      onClick={() => exportReport('json')}
                      title="Export as JSON"
                    >
                      <FaFileCode className="mr-2" />
                      JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content - now wrapped in a scrollable container */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Simplified Project Files Explorer */}
          <div className="card">
            <div className="card-header">SUBMISSIONS</div>
            <div className="p-2">
              {Object.keys(courses).map(courseName => (
                <div key={courseName}>
                  <div 
                    className="flex items-center py-1 cursor-pointer text-gray-200 hover:bg-dark-hover px-2 rounded"
                    onClick={() => toggleFolder(courseName)}
                  >
                    <span className={`mr-1 folder-icon ${expandedFolders[courseName] ? 'folder-icon-expanded' : ''}`}>
                      <FaChevronRight />
                    </span>
                    {expandedFolders[courseName] ? <FaFolderOpen className="mr-2 text-yellow-500" /> : <FaFolder className="mr-2 text-yellow-500" />}
                    {courseName}
                  </div>
                  <div className={`folder-children ml-6 ${expandedFolders[courseName] ? 'folder-children-expanded' : ''}`}>
                    {courses[courseName].map(student => (
                      <div 
                        key={student.id}
                        className={`flex items-center justify-between py-1 px-2 cursor-pointer text-gray-200 w-full rounded hover:bg-dark-hover ${
                          selectedStudent === student.id ? 'bg-dark-hover' : ''
                        }`}
                        onClick={() => setSelectedStudent(student.id)}
                      >
                        <span>{student.name}</span>
                        <span className="text-sm">{student.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Output */}
          <div className="card">
            <div className="card-header justify-center">Expected Output</div>
            <div className="p-4 flex flex-col items-center">
              {outputs
                .filter(output => output.matching || output.expected)
                .map((output, idx) => (
                  <div 
                    key={idx} 
                    className={`py-2 px-4 m-1 font-mono rounded w-full text-center relative border ${
                      hoveredOutputIndex === idx ? 'bg-dark-hover border-dark-hover' : 'border-transparent'
                    }`}
                    onMouseEnter={() => setHoveredOutputIndex(idx)}
                    onMouseLeave={() => setHoveredOutputIndex(null)}
                  >
                    <span className="absolute left-2 text-xs text-gray-500">{idx+1}</span>
                    {output.value}
                  </div>
                ))}
            </div>
          </div>

          {/* Output */}
          <div className="card">
            <div className="card-header justify-center">Output</div>
            <div className="p-4 flex flex-col items-center">
              {outputs
                .filter(output => output.matching || output.actual)
                .map((output, idx) => {
                  const isErrorOutput = output.actual && !output.matching;
                  return (
                    <div 
                      key={idx} 
                      className={`py-2 px-4 m-1 font-mono rounded w-full text-center relative border ${
                        hoveredOutputIndex === idx 
                          ? 'bg-dark-hover border-dark-hover' 
                          : isErrorOutput
                            ? 'bg-error-700/20 text-error-100 border-error-700/30' 
                            : 'border-transparent'
                      }`}
                      onMouseEnter={() => setHoveredOutputIndex(idx)}
                      onMouseLeave={() => setHoveredOutputIndex(null)}
                    >
                      <span className="absolute left-2 text-xs text-gray-500">{idx+1}</span>
                      {output.value}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary footer */}
      <div className="card-footer mt-2 sticky bottom-0">
        <div className="flex justify-end">
          <div className="flex space-x-6">
            <div>
              <span className="text-gray-400">Matches:</span> 
              <span className={`ml-2 ${scoreColorClass} font-medium`}>0/0</span>
            </div>
            <div>
              <span className="text-gray-400">Score:</span> 
              <span className={`ml-2 ${scoreColorClass}`}>0%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsView