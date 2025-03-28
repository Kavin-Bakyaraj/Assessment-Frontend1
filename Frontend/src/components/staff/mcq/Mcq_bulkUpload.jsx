import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import downloadSampleFile from "../../../assets/SampleDoc/sample_document.xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ChevronRight, Upload } from "lucide-react";
import { Download } from "lucide-react";
import PreviewTable from "../previewtable";
import { X } from 'lucide-react';
import correct from '../../../assets/icons/correcticon.png'
import EditPanel from './EditPanel';
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal"; // Import the ConfirmModal component
import bg from '../../../assets/bgpattern.svg';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-7xl relative">
        <button
          onClick={() => onClose(false)}
          className=""
        >
          <X className="absolute top-5 right-5 w-8 h-8 text-white bg-[#111933] rounded-full p-1" />
        </button>
        {children}
      </div>
    </div>
  );
};

const Mcq_bulkUpload = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("My Device");
  const [setHighlightStep] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(5);
  const [showImage, setShowImage] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const requiredQuestions = location.state?.requiredQuestions || 0;
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // State for modal
  // Load questions and selected questions from localStorage on component mount
  useEffect(() => {
    const storedQuestions = JSON.parse(localStorage.getItem("uploadedQuestions")) || [];
    const storedSelections = JSON.parse(localStorage.getItem("selectedQuestions")) || [];

    setQuestions(storedQuestions);
    setSelectedQuestions(storedSelections);

    // Show preview if there are questions stored
    if (storedQuestions.length > 0) {
      setShowImage(false);
      setShowPreview(true);
    }
  }, []);

  // Save questions and selected questions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("uploadedQuestions", JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem("selectedQuestions", JSON.stringify(selectedQuestions));
  }, [selectedQuestions]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "My Drive") setHighlightStep(1);
    else if (tab === "Dropbox") setHighlightStep(2);
    else if (tab === "My Device") setHighlightStep(3);
  };

  const handleEdit = (questionIndex) => {
    const question = questions[questionIndex];
    setEditingQuestion(question);
    setIsEditPanelOpen(true);
  };

  // Add this function to handle save
  const handleSaveEdit = (editedQuestion) => {
    const newQuestions = [...questions];
    const index = questions.findIndex(q => q.question === editingQuestion.question);
    if (index !== -1) {
      newQuestions[index] = editedQuestion;
      setQuestions(newQuestions);
    }
    setIsEditPanelOpen(false);
    setEditingQuestion(null);
  };

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
        let message = `${validQuestions.length} Questions were Uploaded.`;
        if (skippedCount > 0) {
          message += ` ${skippedCount} Questions were not selected due to an invalid format.`;
        }

        // Reset selected questions on new file upload
        setSelectedQuestions([]);
        setQuestions(validQuestions);
        setShowImage(false);
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

  const handleSelectQuestion = (index) => {
    setSelectedQuestions((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map((_, index) => index));
    }
  };

  const handleSubmit = async () => {
    if (selectedQuestions.length === 0) {
        toast.warn("Please select some questions before submitting.", {
            position: "top-center",
            autoClose: 3000,
        });
        return; // Stop further execution
    }

    if (selectedQuestions.length < requiredQuestions) {
        toast.warn(`Please select at least ${requiredQuestions} questions.`, {
            position: "top-center",
            autoClose: 3000,
        });
        return;
    }

    const token = localStorage.getItem("contestToken");
    const selected = selectedQuestions.map((index) => {
        const question = questions[index];
        return {
            ...question,
            options: question.options.map(String), // Convert all options to strings
        };
    });

    try {
        const response = await axios.post(
            `${API_BASE_URL}/api/mcq/save-questions/`,
            { questions: selected },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                withCredentials: true,
            }
        );

        toast.success("Questions added successfully!", {
            position: "top-center",
            autoClose: 3000,
        });

        // Clear local storage after successful submission
        localStorage.removeItem("uploadedQuestions");
        localStorage.removeItem("selectedQuestions");

        // Reset state
        setQuestions([]);
        setSelectedQuestions([]);

        navigate("/mcq/QuestionsDashboard");
    } catch (error) {
        console.error("Error submitting questions:", error);
        toast.error("Failed to submit questions. Please try again.", {
            position: "top-center",
            autoClose: 3000,
        });
    }
};


  const handleClearAll = () => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to clear all uploaded questions?")) {
      localStorage.removeItem("uploadedQuestions");
      localStorage.removeItem("selectedQuestions");
      setQuestions([]);
      setSelectedQuestions([]);
      setShowImage(true);
      setShowPreview(false);
      toast.info("All questions have been cleared.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const downloadSample = () => {
    const link = document.createElement('a');
    link.href = downloadSampleFile;
    link.download = "sample_document.xlsx";
    link.click();
  };

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen flex flex-col items-center py-20 pt-28 px-6"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}>
      <div className="w-full max-w-[1500px] px-12">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[#111933] text-sm">
            <span className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100" onClick={() => setIsConfirmModalOpen(true)}>Home</span>
            <span className="flex items-center -space-x-2">
            <ChevronRight size={15} />
            <ChevronRight size={15} />
          </span>
            <span
              className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100"
              onClick={() => navigate("/mcq/details")}
            >
              Assessment Overview
            </span>
            <span className="flex items-center -space-x-2">
            <ChevronRight size={15} />
            <ChevronRight size={15} />
          </span>
            <span
              className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100"
              onClick={() => {
                localStorage.setItem("mcqAssessmentInitialStep", "2");
                navigate("/mcq/details");
              }}
            >
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
            <span >
              Bulk Upload
            </span>
          </div>
        </div>
        {/* <div>
          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div> */}
        {!showPreview && (
          <div className="bg-white shadow-lg rounded-xl px-10 py-12 w-full">
            <div className="text-start mb-6">
              <h1 className="text-3xl font-bold text-[#111933] mb-2">Upload Files</h1>
              <p className="text-[#A0A0A0] text-sm">
                Easily add questions by uploading your prepared files in{' '}
                <span className="font-medium text-[#111933] opacity-60">xlsx</span>
              </p>
              <hr className="border-t border-gray-400 my-4" />
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center mb-6 w-full">
              <p className="text-[#111933] text-xl mb-4">Upload files only in xlsx format</p>
              <label
                htmlFor="fileInput"
                className="bg-[#111933] text-white px-6 py-2 rounded-md cursor-pointer flex items-center gap-2"
              >
                Upload <Upload size={20} />
              </label>
              <input
                type="file"
                id="fileInput"
                className="hidden"
                accept=".csv, .xlsx"
                onChange={handleFileUpload}
              />
            </div>
            <div className=" p-6 rounded-lg w-full">
              <h2 className="text-lg font-semibold mb-1">Instructions</h2>
              <p className="text-[#A0A0A0] mb-2 text-sm">
                Easily add questions by uploading your prepared files in{' '}
                <span className="font-medium text-[#111933] opacity-60">xlsx format.</span>
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
            <button
              onClick={downloadSample}
              className="flex ml-7 items-center w-2/7 gap-2 border border-[#111933] text-[#111933] px-6 py-1 rounded-md cursor-pointer"
            >
              Sample Document <Download size={18} />
            </button>
          </div>
        )}
        {showPreview && (
          <div className="mt-4 mb-6 flex justify-between">
            <label
              htmlFor="fileInput"
              className="bg-[#111933] text-white px-6 py-3 rounded-lg shadow cursor-pointer transition flex items-center"
            >
              <Upload size={18} className="mr-2" /> Change File
            </label>
            <input
              type="file"
              id="fileInput"
              className="hidden"
              accept=".csv, .xlsx"
              onChange={handleFileUpload}
            />

            <button
              onClick={handleClearAll}
              className="bg-red-50 text-red-600 border border-red-300 px-6 py-3 rounded-lg hover:bg-red-100 transition"
            >
              Clear Questions
            </button>
          </div>
        )}
        <Modal isOpen={showPreview} onClose={() => setShowPreview(false)}>
          {questions.length > 0 ? (
            <PreviewTable
              questions={currentQuestions}
              selectedQuestions={selectedQuestions}
              currentPage={currentPage}
              questionsPerPage={questionsPerPage}
              totalQuestions={questions.length}  // ✅ Pass total questions
              onSelectQuestion={handleSelectQuestion}
              onSelectAll={handleSelectAll}
              onPageChange={paginate}
              onSubmit={handleSubmit}
              indexOfFirstQuestion={indexOfFirstQuestion}
              totalPages={totalPages}
              showBlooms={true}
              onEdit={handleEdit}
            />
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                <X size={36} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">No Questions Available</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                You haven't uploaded any questions yet. Please upload a XLSX file with your questions.
              </p>
              <label
                htmlFor="fileInputEmpty"
                className="bg-[#111933] text-white px-8 py-3 rounded-lg cursor-pointer hover:bg-[#1a2346] transition flex items-center justify-center w-64 mx-auto"
              >
                <Upload size={20} className="mr-2" /> Upload Questions
              </label>
              <input
                type="file"
                id="fileInputEmpty"
                className="hidden"
                accept=".csv, .xlsx"
                onChange={handleFileUpload}
              />
            </div>
          )}
        </Modal>
        <EditPanel
          isOpen={isEditPanelOpen}
          onClose={() => setIsEditPanelOpen(false)}
          question={editingQuestion}
          onSave={handleSaveEdit}
        />
        <ConfirmModal
          isConfirmModalOpen={isConfirmModalOpen}
          setIsConfirmModalOpen={setIsConfirmModalOpen}
          targetPath="/staffdashboard"
        />
      </div>
    </div>
  );
};

export default Mcq_bulkUpload;
