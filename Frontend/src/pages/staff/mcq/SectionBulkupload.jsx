import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Upload, Download, X, ChevronRight } from 'lucide-react';
import correct from '../../../assets/icons/correcticon.png';
import downloadSampleFile from '../../../assets/SampleDoc/sample_document.xlsx';
import PreviewTable from '../../../components/staff/previewtable';
import EditPanel from '../../../components/staff/mcq/EditPanel'; // Import the EditPanel component
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal"; // Import the ConfirmModal component
import bg from '../../../assets/bgpattern.svg';

const SectionBulkupload = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(5);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // State for modal
  useEffect(() => {
    const storedQuestions = JSON.parse(localStorage.getItem('uploadedQuestions')) || [];
    setQuestions(storedQuestions);
    if (storedQuestions.length > 0) {
      setShowPreview(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('uploadedQuestions', JSON.stringify(questions));
  }, [questions]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith(".xlsx")) {
      toast.error("Please select a valid XLSX file.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const headers = jsonData[0] || [];
        const dataRows = jsonData.slice(1).map((row) => {
          let rowObject = {};
          headers.forEach((header, index) => {
            rowObject[header] = row[index];
          });
          return rowObject;
        });

        // ✅ REQUIRED COLUMNS CHECK
        const requiredColumns = ["Question", "Correct_Answer", "Level", "Blooms"];
        const optionColumns = ["Option1", "Option2", "Option3", "Option4"];
        const hasRequiredColumns = requiredColumns.every((col) => headers.includes(col));
        const availableOptions = optionColumns.filter((col) => headers.includes(col));

        if (!hasRequiredColumns || availableOptions.length < 2) {
          toast.error("Invalid file format. Ensure required columns exist and at least two options are provided.", {
            position: "top-center",
            autoClose: 3000,
          });
          return;
        }

        let validQuestions = [];
        let skippedCount = 0;

        dataRows.forEach((row, index) => {
          // Check if required fields exist
          if (!row.Question) {
            toast.error(`Question is missing in row ${index + 1}.`, {
              position: "top-center",
              autoClose: 3000,
            });
            skippedCount++;
            return;
          }

          if (!row.Blooms) {
            toast.error(`Blooms taxonomy is missing in row ${index + 1}.`, {
              position: "top-center",
              autoClose: 3000,
            });
            skippedCount++;
            return;
          }

          // Fetch options
          const options = availableOptions.map((opt) => row[opt]).filter(Boolean);

          // Ensure at least 2 options exist
          if (options.length < 2) {
            toast.error(`At least 2 options are required in row ${index + 1}.`, {
              position: "top-center",
              autoClose: 3000,
            });
            skippedCount++;
            return;
          }

          // Ensure at most 4 options exist
          if (options.length > 4) {
            toast.error(`A maximum of 4 options are allowed in row ${index + 1}.`, {
              position: "top-center",
              autoClose: 3000,
            });
            skippedCount++;
            return;
          }

          // ✅ Ensure correct_answer exists in options
          if (!options.includes(row.Correct_Answer)) {
            toast.error(`Correct answer must be one of the provided options in row ${index + 1}.`, {
              position: "top-center",
              autoClose: 3000,
            });
            skippedCount++;
            return;
          }

          // ✅ If valid, add to list
          validQuestions.push({
            question: row.Question,
            options,
            correctAnswer: row.Correct_Answer,
            blooms: row.Blooms,
            level: row.Level || "easy",
            tags: row.Tags ? row.Tags.split(',').map(tag => tag.trim()) : [],
          });
        });

        if (validQuestions.length === 0) {
          toast.error("No valid questions found! Please check the file format.", {
            position: "top-center",
            autoClose: 3000,
          });
          return;
        }

        // ✅ Success Message with Skipped Count
        let message = `${validQuestions.length} questions were selected.`;
        if (skippedCount > 0) {
          message += ` ${skippedCount} questions were not selected due to an invalid format.`;
        }

        // Reset selected questions on new file upload
        setSelectedQuestions([]);
        setQuestions(validQuestions);
        // setShowImage(false);
        setShowPreview(true);

        toast.success(message, {
          position: "top-center",
          autoClose: 4000,
        });

      } catch (error) {
        console.error("Error processing file:", error);
        toast.error(`Error processing file: ${error.message}`, {
          position: "top-center",
          autoClose: 3000,
        });
      }
    };
    reader.onerror = (error) => {
      console.error("File reading error:", error);
      toast.error("Error reading file", {
        position: "top-center",
        autoClose: 3000,
      });
    };

    reader.readAsBinaryString(file);
  };



  const handleEdit = (questionIndex) => {
    const question = questions[questionIndex];
    if (!question) {
      console.error("Editing question is undefined!");
      return;
    }
    setEditingQuestion(question);
    setIsEditPanelOpen(true);
  };


  const handleSaveEdit = (editedQuestion) => {
    if (!editingQuestion) {
      console.error("No question is being edited.");
      return;
    }

    const newQuestions = [...questions];
    const index = questions.findIndex(q => q.question === editingQuestion.question);
    if (index === -1) {
      console.error("Edited question not found in list.");
      return;
    }

    newQuestions[index] = editedQuestion;
    setQuestions(newQuestions);
    setIsEditPanelOpen(false);
    setEditingQuestion(null);
  };


  const handleDownloadSample = () => {
    const link = document.createElement('a');
    link.href = downloadSampleFile;
    link.download = 'sample_document.xlsx';
    link.click();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all uploaded questions?')) {
      localStorage.removeItem('uploadedQuestions');
      setQuestions([]);
      setSelectedQuestions([]);
      setShowPreview(false);
      setUploadStatus(null);
      toast.info('All questions have been cleared.', {
        position: 'top-center',
        autoClose: 3000,
      });
    }
  };

  const handleSubmit = () => {
    if (selectedQuestions.length === 0) {
      toast.error('No questions selected. Please select at least one question to submit.', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    const formData = JSON.parse(sessionStorage.getItem('mcqAssessmentFormData'));
    const sections = JSON.parse(sessionStorage.getItem('sections')) || [{ selectedQuestions: [] }];

    sections[0].selectedQuestions.push(...selectedQuestions.map(index => questions[index]));

    sessionStorage.setItem('sections', JSON.stringify(sections));
    console.log();

    // Clear local storage after successful submission
    localStorage.removeItem('uploadedQuestions');
    localStorage.removeItem('selectedQuestions');

    // Reset state
    setQuestions([]);
    setSelectedQuestions([]);
    setShowPreview(false);

    navigate('/mcq/combinedDashboard', { state: { selectedQuestions, formData } });
    toast.success('Questions added successfully');
  };



  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen flex flex-col items-center py-10 pt-32 px-6"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}>
      <div className="w-full max-w-[1500px] px-12">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[#111933] text-sm">
            <span className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100" onClick={() => setIsConfirmModalOpen(true)}>
              Home
            </span>
            <span className="flex items-center -space-x-2">
            <ChevronRight size={15} />
            <ChevronRight size={15} />
          </span>
            <span className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100" onClick={() => navigate('/mcq/details')}>
              Assessment Overview
            </span>
            <span className="flex items-center -space-x-2">
            <ChevronRight size={15} />
            <ChevronRight size={15} />
          </span>
            <span className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100" onClick={() => navigate('/mcq/details')}>
              Test Configuration
            </span>
            <span className="flex items-center -space-x-2">
            <ChevronRight size={15} />
            <ChevronRight size={15} />
          </span>
            <span onClick={() => window.history.back()} className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100">
              Add Questions
            </span>
            <span className="flex items-center -space-x-2">
            <ChevronRight size={15} />
            <ChevronRight size={15} />
          </span>
            <span>Import Questions</span>
          </div>
        </div>
        <div>
          <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        </div>
        {!showPreview && (
          <div className="bg-white shadow-lg rounded-xl px-10 py-12 w-full">
            <div className="text-start mb-6">
              <h1 className="text-3xl font-bold text-[#111933] mb-2">Upload Files</h1>
              <p className="text-[#A0A0A0] text-sm">
                Easily add questions by uploading your prepared files as{' '}
                <span className="font-medium text-[#111933] opacity-60">xlsx format.</span>
              </p>
              <hr className="border-t border-gray-400 my-4" />
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center mb-6 w-full">
              <p className="text-[#111933] text-xl mb-4">Upload files only in xlsx.</p>
              <label htmlFor="fileInput" className="bg-[#111933] text-white px-6 py-2 rounded-md cursor-pointer flex items-center gap-2">
                Upload <Upload size={20} />
              </label>
              <input type="file" id="fileInput" className="hidden" accept=".csv, .xlsx" onChange={handleFileUpload} />
            </div>
            <div className="p-6 rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">Instructions</h2>
              <p className="text-[#A0A0A0] mb-2 text-sm">
                Easily add questions by uploading your prepared files in{' '}
                <span className="font-medium text-[#111933] opacity-60">xlsx.</span>
              </p>
              <hr className="border-t border-gray-400 my-4" />
              <ul className="text-sm text-[#111933] space-y-2">
                <li className="flex items-center gap-2">
                  <img src={correct} alt="Checkmark" className="w-4 h-4" />
                  Ensure your file is in XLSX format.
                </li>
                <li className="flex items-center gap-2">
                  <img src={correct} alt="Checkmark" className="w-4 h-4" />
                  Options should be labeled as option1, option2, ..., option4.
                </li>
                <li className="flex items-center gap-2">
                  <img src={correct} alt="Checkmark" className="w-4 h-4" />
                  The correct answer should be specified in the correct answer column.
                </li>
                <li className="flex items-center gap-2">
                  <img src={correct} alt="Checkmark" className="w-4 h-4" />
                  Ensure all fields are properly filled.
                </li>
              </ul>
            </div>
            <button onClick={handleDownloadSample} className="flex items-center gap-2 border border-[#111933] text-[#111933] px-6 py-2 rounded-md cursor-pointer mt-4">
              Sample Document <Download size={18} />
            </button>
            {uploadStatus && (
              <div className={`mt-4 p-3 rounded-md ${uploadStatus.startsWith('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {uploadStatus}
              </div>
            )}
          </div>
        )}
        {showPreview && (
          <div className="mt-4 mb-6 flex justify-between">
            <label htmlFor="fileInput" className="bg-yellow-400 text-black px-6 py-3 rounded-lg shadow hover:bg-yellow-500 cursor-pointer transition flex items-center">
              <Upload size={18} className="mr-2" /> Change File
            </label>
            <input type="file" id="fileInput" className="hidden" accept=".csv, .xlsx" onChange={handleFileUpload} />
            <button onClick={handleClearAll} className="bg-red-50 text-red-600 border border-red-300 px-6 py-3 rounded-lg hover:bg-red-100 transition">
              Clear Questions
            </button>
          </div>
        )}
        {showPreview && questions.length > 0 && (
          <>
            <PreviewTable
              questions={currentQuestions}
              selectedQuestions={selectedQuestions}
              currentPage={currentPage}
              questionsPerPage={questionsPerPage}
              totalQuestions={questions.length}  // ✅ Pass total questions
              onSelectQuestion={(index) =>
                setSelectedQuestions((prev) =>
                  prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
                )
              }
              onSelectAll={(isSelected) =>
                setSelectedQuestions(isSelected ? Array.from({ length: questions.length }, (_, i) => i) : [])
              }
              onPageChange={paginate}
              onSubmit={handleSubmit}
              indexOfFirstQuestion={indexOfFirstQuestion}
              totalPages={totalPages}
              onEdit={handleEdit}
            />
            {isEditPanelOpen && editingQuestion && (
              <EditPanel
                isOpen={isEditPanelOpen}
                onClose={() => setIsEditPanelOpen(false)}
                question={editingQuestion}
                onSave={handleSaveEdit}
              />
            )}
          </>
        )}
      </div>
      <ConfirmModal
        isConfirmModalOpen={isConfirmModalOpen}
        setIsConfirmModalOpen={setIsConfirmModalOpen}
        targetPath="/staffdashboard"
      />
    </div>
  );
};

export default SectionBulkupload;
