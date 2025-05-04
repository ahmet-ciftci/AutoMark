import { useState, useEffect } from 'react'
import { FaFilePdf, FaFileCsv, FaFileCode, FaDownload, FaTimes, FaCheck } from 'react-icons/fa'

const ReportsView = ({projectId}) => {
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [showExportSelection, setShowExportSelection] = useState(false)
  const [selectedReports, setSelectedReports] = useState([])
  const [hoveredOutputIndex, setHoveredOutputIndex] = useState(null)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [outputs, setOutputs] = useState([])


  useEffect(() => {
    // Define an async function inside useEffect
    const fetchData = async () => {
      try {
        // Fetch submissions
        const rows = await window.electron.getSubmissions(projectId);
        setSubmissions(rows);
        
        const transformedOutputs = rows.map((row, idx) => ({
          id: idx,
          expected: true,
          actual: true,
          value: row.actual_output || '',
          matching: row.status === 'success'
        }));
        setOutputs(transformedOutputs);
      } catch (error) {
        console.error("Error fetching project data:", error);
      }
    };
    
    // Execute the async function
    fetchData();
  }, [projectId]);

  const handleReportSelection = (submissionId) => {
    setSelectedReports(prev =>
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    )
  }

  const exportReport = (format) => {
    if (selectedReports.length === 0) return
    setShowExportOptions(false)
    setShowExportSelection(false)
  }

  const getScoreColorClass = (score) => {
    const s = parseFloat(score)
    if (s >= 70) return 'text-green-500'
    if (s >= 50) return 'text-yellow-400'
    return 'text-red-500'
  }

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6 text-gray-200">Submission Reports</h1>
  
      {/* Export Controls */}
      <div className="mb-4 flex justify-end">
        <button className="btn-secondary flex items-center" onClick={() => setShowExportSelection(true)}>
          <FaDownload className="mr-2" />
          Export Report
        </button>
      </div>
  
      {/* Export Selection Modal */}
      {showExportSelection && (
        <div className="modal-backdrop">
          <div className="bg-[#1e1e1e] border border-[#333] rounded-md w-full max-w-3xl flex flex-col animate-modal">
            <div className="card-header justify-between">
              <h3 className="font-medium text-xl">Select Submissions</h3>
              <button onClick={() => setShowExportSelection(false)} className="text-gray-400 hover:text-gray-200 p-2">
                <FaTimes />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submissions.map(sub => {
                  const isSelected = selectedReports.includes(sub.submission_id)
                  return (
                    <div
                      key={sub.submission_id}
                      onClick={() => handleReportSelection(sub.submission_id)}
                      className={`p-4 rounded cursor-pointer ${
                        isSelected
                          ? 'bg-primary-700/30 border border-primary-500'
                          : 'bg-[#262626] border border-[#333] hover:border-[#444] hover:bg-[#2a2a2a]'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="text-gray-300 font-medium">Student {sub.student_id}</span>
                        <span className={`px-2 py-1 rounded text-sm ${getScoreColorClass(sub.score || 0)}`}>
                          {sub.score || '0'}
                        </span>
                      </div>
                      {isSelected && <FaCheck className="text-primary-400 float-right mt-2" />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
  
      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Submissions List */}
        <div className="card">
          <div className="card-header">SUBMISSIONS</div>
          <div className="p-2">
            {submissions.map(sub => (
              <div
                key={sub.submission_id}
                className={`flex justify-between p-2 cursor-pointer rounded hover:bg-dark-hover text-gray-200 ${
                  selectedSubmission === sub.submission_id ? 'bg-dark-hover' : ''
                }`}
                onClick={() => setSelectedSubmission(sub.submission_id)}
              >
                <span>Student {sub.student_id}</span>
                <span>{sub.status}</span>
              </div>
            ))}
          </div>
        </div>
  
        {/* Expected Output */}
        <div className="card">
          <div className="card-header justify-center">Expected Output</div>
          <div className="p-4 flex flex-col items-center">
            {outputs
              .filter(o => o.expected)
              .map((o, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredOutputIndex(idx)}
                  onMouseLeave={() => setHoveredOutputIndex(null)}
                  className={`py-2 px-4 m-1 font-mono rounded w-full text-center relative border ${
                    hoveredOutputIndex === idx ? 'bg-dark-hover border-dark-hover' : 'border-transparent'
                  }`}
                >
                  <span className="absolute left-2 text-xs text-gray-500">{idx + 1}</span>
                  {o.value}
                </div>
              ))}
          </div>
        </div>
  
        {/* Actual Output */}
        <div className="card">
          <div className="card-header justify-center">Output</div>
          <div className="p-4 flex flex-col items-center">
            {outputs
              .filter(o => o.actual)
              .map((o, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredOutputIndex(idx)}
                  onMouseLeave={() => setHoveredOutputIndex(null)}
                  className={`py-2 px-4 m-1 font-mono rounded w-full text-center relative border ${
                    hoveredOutputIndex === idx
                      ? 'bg-dark-hover border-dark-hover'
                      : o.matching
                      ? 'border-transparent'
                      : 'bg-error-700/20 text-error-100 border-error-700/30'
                  }`}
                >
                  <span className="absolute left-2 text-xs text-gray-500">{idx + 1}</span>
                  {o.value}
                </div>
              ))}
          </div>
        </div>
      </div>
  
      {/* Summary Footer */}
      <div className="card-footer mt-2 sticky bottom-0">
        <div className="flex justify-end space-x-6">
          <div>
            <span className="text-gray-400">Matches:</span>
            <span className="ml-2 text-white font-medium">
              {outputs.filter(o => o.matching).length}/{outputs.length}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Score:</span>
            <span className="ml-2 text-white">
              {outputs.length > 0
                ? Math.round((outputs.filter(o => o.matching).length / outputs.length) * 100) + '%'
                : '0%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
  
}

export default ReportsView
