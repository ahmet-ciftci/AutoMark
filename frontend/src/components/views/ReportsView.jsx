import { useState, useEffect } from 'react'
import { FaFilePdf, FaFileCsv, FaFileCode, FaDownload, FaTimes, FaCheck, FaExclamationTriangle, FaClock, FaExclamationCircle } from 'react-icons/fa'

const ReportsView = ({projectId}) => {
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [showExportSelection, setShowExportSelection] = useState(false)
  const [selectedReports, setSelectedReports] = useState([])
  const [hoveredOutputIndex, setHoveredOutputIndex] = useState(null)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [expectedOutput, setExpectedOutput] = useState([])
  const [studentOutput, setStudentOutput] = useState([])
  const [currentMatches, setCurrentMatches] = useState(0)
  const [currentTotal, setCurrentTotal] = useState(0)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [hasError, setHasError] = useState(false)
  const [errorType, setErrorType] = useState("")
  const [loading, setLoading] = useState(false)
  const [projectError, setProjectError] = useState(null)

  useEffect(() => {
    // Define an async function inside useEffect
    const fetchData = async () => {
      try {
        if (!projectId) {
          setProjectError("No project selected. Please open a project first.");
          setSubmissions([]);
          setExpectedOutput([]);
          return;
        }
        
        setLoading(true);
        setProjectError(null);
        
        // Fetch submissions and expected output
        const rows = await window.electron.getSubmissions(projectId);
        
        if (!rows || rows.length === 0) {
          setProjectError("No submissions found for this project.");
          setSubmissions([]);
          setLoading(false);
          return;
        }
        
        setSubmissions(rows);
        
        // Get test configuration to retrieve the expected output
        const testConfig = await window.electron.getTestConfigByProjectId(projectId);
        if (testConfig && testConfig.expected_output) {
          // Split expected output by line and format for display
          const expected = testConfig.expected_output.split('\n').map((line, idx) => ({
            id: idx,
            value: line.trim()
          }));
          setExpectedOutput(expected);
        } else {
          setExpectedOutput([]);
        }
        
        // Select the first submission by default if available
        if (rows.length > 0) {
          setSelectedSubmission(rows[0].submission_id);
          updateStudentOutput(rows[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching project data:", error);
        setProjectError(`Error fetching project data: ${error.message || "Unknown error"}`);
        setLoading(false);
      }
    };
    
    // Execute the async function
    fetchData();
  }, [projectId]);

  // Update displayed output when a student submission is selected
  useEffect(() => {
    if (selectedSubmission && submissions.length > 0) {
      const selectedStudent = submissions.find(s => s.submission_id === selectedSubmission);
      if (selectedStudent) {
        updateStudentOutput(selectedStudent);
      }
    }
  }, [selectedSubmission, submissions]);

  // Helper function to update student output display
  const updateStudentOutput = (student) => {
    // Reset error state
    setHasError(false);
    setErrorMessage("");
    setErrorType("");
    
    // Check for compilation, runtime errors, or timeout
    if (student.status === "compile_error" || student.status === "runtime_error" || student.status === "time_exceeded") {
      setHasError(true);
      
      // Set the appropriate error type based on the status
      if (student.status === "compile_error") {
        setErrorType("Compilation Error");
      } else if (student.status === "runtime_error") {
        setErrorType("Runtime Error");
      } else if (student.status === "time_exceeded") {
        setErrorType("Time Limit Exceeded");
      }
      
      setErrorMessage(student.error_message || "No error details available");
      setStudentOutput([]);
      setCurrentMatches(0);
      setCurrentTotal(0);
      return;
    }
    
    if (!student || !student.actual_output) {
      setStudentOutput([]);
      setCurrentMatches(0);
      setCurrentTotal(0);
      return;
    }
    
    // Split student output by line and format for display
    const output = student.actual_output.split('\n').map((line, idx) => {
      const expectedLine = idx < expectedOutput.length ? expectedOutput[idx].value : '';
      const isMatching = line.trim() === expectedLine;
      return {
        id: idx,
        value: line.trim(),
        matching: isMatching
      };
    });
    
    setStudentOutput(output);
    
    // Calculate matching lines
    const matches = output.filter(o => o.matching).length;
    setCurrentMatches(matches);
    setCurrentTotal(output.length);
  };

  const handleReportSelection = (submissionId) => {
    setSelectedReports(prev =>
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    )
  }

  const exportReport = async () => {
    if (selectedReports.length === 0) return;

    const filePath = await window.electron.showSaveDialog();
    if (!filePath) return;

    const selectedSubmissions = submissions.filter(sub =>
      selectedReports.includes(sub.submission_id)
    );

    let csvContent = 'Student ID,Status,Error Message,Actual Output\n';

    selectedSubmissions.forEach(sub => {
      const cleanOutput = (sub.actual_output || 'N/A').replace(/(\r\n|\n|\r)/gm, ' ');
      const errorMessage = (sub.error_message || 'N/A').replace(/(\r\n|\n|\r)/gm, ' ');
      csvContent += `"${sub.student_id}","${sub.status}","${errorMessage}","${cleanOutput}"\n`;
    });

    await window.electron.saveFile(filePath, csvContent);

    setShowSuccessModal(true);
    setShowExportSelection(false);
    setSelectedReports([]);
  };

  const getScoreColorClass = (score) => {
    if (score === undefined || score === null) return 'text-gray-400';
    const s = parseFloat(score)
    if (s >= 70) return 'text-green-500'
    if (s >= 50) return 'text-yellow-400'
    return 'text-red-500'
  }

  // Update the getStatusColorClass function to include time_exceeded
  const getStatusColorClass = (status) => {
    switch(status) {
      case 'success': return 'text-green-500';
      case 'compiled': return 'text-blue-400';
      case 'executed': return 'text-blue-500';
      case 'compile_error': return 'text-red-500';
      case 'runtime_error': return 'text-orange-500';
      case 'time_exceeded': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  }

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6 text-gray-200">Submission Reports</h1>
  
      {loading ? (
        <div className="flex flex-col justify-center items-center flex-grow">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-400">Loading submissions...</p>
        </div>
      ) : projectError ? (
        <div className="flex flex-col justify-center items-center flex-grow p-8">
          <FaExclamationCircle className="text-red-500 text-4xl mb-4" />
          <p className="text-gray-300 text-lg text-center mb-2">{projectError}</p>
          <p className="text-gray-400 text-center">Try opening a different project or creating a new one.</p>
        </div>
      ) : (
        <>
          {/* Export Controls */}
          <div className="mb-4 flex justify-end">
            <button 
              className="btn-secondary flex items-center" 
              onClick={() => setShowExportSelection(true)}
              disabled={submissions.length === 0}
            >
              <FaDownload className="mr-2" />
              Export Report
            </button>
          </div>
      
          {/* Main Content Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Submissions List */}
            <div className="card">
              <div className="card-header">SUBMISSIONS</div>
              <div className="p-2">
                {submissions.length === 0 ? (
                  <div className="text-gray-400 italic text-center p-4">
                    No submissions found
                  </div>
                ) : (
                  submissions.map(sub => {
                    let displayScoreText;
                    let scoreForColoring;

                    if (sub.actual_output != null) { // Check if actual_output exists
                      const studentOutputLines = sub.actual_output.split('\n').map(line => line.trim());
                      const subTotalLines = studentOutputLines.length;
                      let subMatches = 0;

                      // Compare with expectedOutput if available
                      if (expectedOutput && expectedOutput.length > 0) {
                        studentOutputLines.forEach((studentLine, index) => {
                          if (index < expectedOutput.length) {
                            if (studentLine === expectedOutput[index].value) {
                              subMatches++;
                            }
                          }
                        });
                      }
                      
                      const calculatedScore = subTotalLines > 0 ? Math.round((subMatches / subTotalLines) * 100) : 0;
                      displayScoreText = `${calculatedScore}%`;
                      scoreForColoring = calculatedScore;
                    } else {
                      displayScoreText = sub.status || 'Pending';
                      scoreForColoring = undefined; // Let getScoreColorClass handle this as gray
                    }

                    return (
                      <div
                        key={sub.submission_id}
                        className={`flex justify-between p-2 cursor-pointer rounded hover:bg-dark-hover text-gray-200 ${
                          selectedSubmission === sub.submission_id ? 'bg-dark-hover' : ''
                        }`}
                        onClick={() => setSelectedSubmission(sub.submission_id)}
                      >
                        <span>Student {sub.student_id}</span>
                        <span className={getScoreColorClass(scoreForColoring)}>
                          {displayScoreText}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
      
            {/* Expected Output */}
            <div className="card">
              <div className="card-header justify-center">Expected Output</div>
              <div className="p-4 flex flex-col items-center">
                {expectedOutput.length === 0 ? (
                  <div className="text-gray-400 italic text-center p-4">
                    No expected output configured
                  </div>
                ) : (
                  expectedOutput.map((o, idx) => (
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
                  ))
                )}
              </div>
            </div>
      
            {/* Actual Output or Error Message */}
            <div className="card">
              <div className="card-header justify-center">
                {hasError ? errorType : "Student Output"}
              </div>
              <div className="p-4 flex flex-col items-center">
                {hasError ? (
                  <div className="w-full">
                    <div className={`${
                      errorType === "Time Limit Exceeded" 
                        ? "bg-yellow-900/30 border border-yellow-700/40" 
                        : "bg-red-900/30 border border-red-700/40"
                    } rounded p-4 mb-4 flex items-start`}>
                      {errorType === "Time Limit Exceeded" ? (
                        <FaClock className="text-yellow-500 mr-3 mt-1 flex-shrink-0" />
                      ) : (
                        <FaExclamationTriangle className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h3 className={`font-medium mb-2 ${
                          errorType === "Time Limit Exceeded" 
                            ? "text-yellow-400" 
                            : errorType === "Compilation Error" 
                              ? "text-red-400" 
                              : "text-orange-400"
                        }`}>
                          {errorType}
                        </h3>
                        <pre className={`text-sm font-mono whitespace-pre-wrap overflow-auto max-h-64 ${
                          errorType === "Time Limit Exceeded" 
                            ? "text-yellow-200" 
                            : "text-red-200"
                        }`}>
                          {errorMessage}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {studentOutput.length === 0 ? (
                      <div className="text-gray-400 italic p-4">No output available</div>
                    ) : (
                      studentOutput.map((o, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredOutputIndex(idx)}
                          onMouseLeave={() => setHoveredOutputIndex(null)}
                          className={`py-2 px-4 m-1 font-mono rounded w-full text-center relative border ${
                            hoveredOutputIndex === idx
                              ? 'bg-dark-hover border-dark-hover'
                              : o.matching
                              ? 'border-green-500/30 bg-green-500/10'
                              : 'bg-error-700/20 text-error-100 border-error-700/30'
                          }`}
                        >
                          <span className="absolute left-2 text-xs text-gray-500">{idx + 1}</span>
                          {o.value}
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
      
          {/* Summary Footer */}
          {submissions.length > 0 && (
            <div className="card-footer mt-2 sticky bottom-0">
              <div className="flex justify-end space-x-6">
                <div>
                  <span className="text-gray-400">Matches:</span>
                  <span className="ml-2 font-medium text-white">
                    {currentMatches}/{currentTotal}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Score:</span>
                  <span className={`ml-2 ${
                    currentTotal > 0
                      ? getScoreColorClass(Math.round((currentMatches / currentTotal) * 100))
                      : 'text-gray-400' 
                  }`}>
                    {currentTotal > 0
                      ? Math.round((currentMatches / currentTotal) * 100) + '%'
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          )}
      
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
                      const isSelected = selectedReports.includes(sub.submission_id);
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
                            <span className={`px-2 py-1 rounded text-sm ${
                              sub.status === 'compile_error' || sub.status === 'runtime_error' 
                                ? getStatusColorClass(sub.status) 
                                : getScoreColorClass(sub.score || 0)
                            }`}>
                              {sub.status === 'compile_error' || sub.status === 'runtime_error' 
                                ? sub.status.replace('_', ' ') 
                                : (sub.score || '0')}
                            </span>
                          </div>
                          {isSelected && <FaCheck className="text-primary-400 float-right mt-2" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Export buttons */}
                <div className="p-4 border-t border-[#333] flex justify-end">
                  <button onClick={exportReport} className="btn-primary">
                    <FaFileCsv className="mr-2" /> Export as CSV
                  </button>
                </div>
              </div>
            </div>
          )}
      
          {/* Export Success Modal */}
          {showSuccessModal && (
            <div className="modal-backdrop">
              <div className="bg-[#1e1e1e] p-6 rounded shadow-md border border-green-500 max-w-md mx-auto mt-40">
                <h2 className="text-lg font-bold text-green-400 mb-2">Export Completed</h2>
                <p className="text-gray-300">Your CSV file was successfully saved.</p>
                <div className="mt-4 text-right">
                  <button className="btn-primary" onClick={() => setShowSuccessModal(false)}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ReportsView
