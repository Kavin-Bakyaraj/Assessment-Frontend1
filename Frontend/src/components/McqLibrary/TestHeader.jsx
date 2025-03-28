import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ImportQuestion from "../../assets/ImportQuestion.svg";
import AddQuestion from "../../assets/AddQuestion.svg";
import { IoSearchSharp } from "react-icons/io5";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { X, Download, Upload,Edit } from "lucide-react";
import QuestionModal from "./QuestionModal";
import * as XLSX from "xlsx";
// Removed PreviewModal import
import correct from "../../assets/icons/correcticon.png";
import Pagination from "@mui/material/Pagination";
import { SlArrowRight } from "react-icons/sl";
import QuestionDetailsMcq from "../staff/mcq/QuestionDetailsMcq";
import downloadSampleFile from "../../assets/SampleDoc/sample_document.xlsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Integrated PreviewModal component directly inside TestHeader.jsx
const PreviewModal = ({
  isOpen,
  onClose,
  selectedQuestions,
  setSelectedQuestions,
  isBulkUpload,
  setBulkSelectedQuestions,
  onSave,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  // Ensure selectedQuestions is an array; default to empty array if not
  const questionsArray = Array.isArray(selectedQuestions)
    ? selectedQuestions
    : [];

  // Reset selected question IDs when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedQuestionIds([]);

      // Also reset parent component's selected questions
      if (isBulkUpload && setBulkSelectedQuestions) {
        setBulkSelectedQuestions([]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const questionsPerPage = 5;
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = questionsArray.slice(
    indexOfFirstQuestion,
    indexOfLastQuestion
  );
  const totalPages = Math.ceil(questionsArray.length / questionsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleCheckboxChange = (questionIndex) => {
    const newSelectedIds = selectedQuestionIds.includes(questionIndex)
      ? selectedQuestionIds.filter((id) => id !== questionIndex)
      : [...selectedQuestionIds, questionIndex];

    setSelectedQuestionIds(newSelectedIds);

    // Update parent component's selected questions state
    if (isBulkUpload && setBulkSelectedQuestions) {
      const updatedSelectedQuestions = questionsArray.filter((_, index) =>
        newSelectedIds.includes(index)
      );
      setBulkSelectedQuestions(updatedSelectedQuestions);
    }
  };

  const handleSelectAll = (event) => {
    let newSelectedIds;

    if (event.target.checked) {
      // Select all questions across all pages
      newSelectedIds = Array.from(
        { length: questionsArray.length },
        (_, i) => i
      );
    } else {
      // Deselect all questions
      newSelectedIds = [];
    }

    setSelectedQuestionIds(newSelectedIds);

    // Update parent component's selected questions state
    if (isBulkUpload && setBulkSelectedQuestions) {
      const updatedSelectedQuestions = questionsArray.filter((_, index) =>
        newSelectedIds.includes(index)
      );
      setBulkSelectedQuestions(updatedSelectedQuestions);
    }
  };

  const handleSaveSelectedQuestions = async () => {
    const filteredQuestions = questionsArray.filter((_, index) =>
      selectedQuestionIds.includes(index)
    );

    if (filteredQuestions.length === 0) {
      toast.warning("Select at least 1 question");
      return;
    }

    // Set the selected questions in the parent component
    if (setBulkSelectedQuestions) {
      setBulkSelectedQuestions(filteredQuestions);
    }

    // Call the onSave function to handle the upload
    if (onSave) {
      onSave();
    }

    // Close the modal
    onClose();
  };

  // Function to handle modal closing without saving questions
  const closeModal = () => {
    // Just close the modal without saving any questions
    onClose();
    // Reset selected question IDs
    setSelectedQuestionIds([]);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-7xl">
        <h2 className="text-lg font-bold mb-4 text-[#111933]">
          Preview Selected Questions
        </h2>
        <h4 className="text-gray-500 mb-6">
          Select the questions you want to add to the test
        </h4>
        <div className="overflow-x-auto border border-gray shadow rounded-md">
          <table className="min-w-full bg-white border-collapse">
            <thead>
              <tr className="bg-[#111933] text-white">
                {isBulkUpload && (
                  <th className="flex items-center justify-between py-4 px-4 border-r">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          questionsArray.length > 0 &&
                          selectedQuestionIds.length === questionsArray.length
                        }
                        className="accent-[#111933]"
                      />
                      <span className="ml-2 ">Select All</span>
                    </div>
                  </th>
                )}
                <th className="py-3 px-4 text-left border-r">Question</th>
                {/* <th className="py-3 px-4 text-left border-r">Correct Answer</th> */}
                <th className="py-3 px-4 text-left border-r">Blooms</th>
                <th className="py-3 relative px-4 text-center">Edit </th>
              </tr>
            </thead>
            <tbody>
              {currentQuestions.map((question, index) => {
                const questionIndex = indexOfFirstQuestion + index;
                return (
                  <tr key={questionIndex} className="border-b hover:bg-gray-50">
                    {isBulkUpload && (
                      <td className="py-5 px-4 flex items-center justify-between">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.includes(questionIndex)}
                          onChange={() => handleCheckboxChange(questionIndex)}
                          className="accent-[#111933]"
                        />
                      </td>
                    )}
                    <td className="py-4 px-4 text-[#111933]">
                      {question.question}
                    </td>
                    {/* <td className="py-4 px-4 text-[#111933]">{question.correctAnswer}</td> */}
                    <td className="py-4 px-4 text-[#111933]">
                      {question.blooms}
                    </td>
                    <td className="py-4 px-4 flex justify-center">
                        <button
                          onClick={() => setSelectedQuestion(question)}
                          className="text-[#111933] bg-white flex items-center px-4 py-1 rounded-lg"
                        >
                          <Edit className="text-xs" size={15} />
                        </button>
                      </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            className="mt-4 flex justify-center text-white"
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#111933",
              },
              "& .MuiPaginationItem-root.Mui-selected": {
                backgroundColor: "#111933",
                color: "#fff",
              },
              "& .MuiPaginationItem-root:hover": {
                backgroundColor: "rgba(0, 9, 117, 0.4)",
                color: "#fff",
              },
            }}
          />
        )}

        {isBulkUpload ? (
          <div className="flex justify-center space-x-5">
            <button
              onClick={closeModal}
              className="mt-4 flex py-2 px-10 rounded-lg font-semibold text-sm bg-[#111933] text-white border border-[#111933] hover:bg-opacity-80"
            >
              Close
            </button>
            <button
              onClick={handleSaveSelectedQuestions}
              className="mt-4 flex py-2 px-10 rounded-lg font-semibold text-sm bg-[#111933] text-white border border-[#111933] hover:bg-opacity-80"
              disabled={selectedQuestionIds.length === 0}
            >
              Save Selected Questions ({selectedQuestionIds.length})
            </button>
          </div>
        ) : (
          <button
            onClick={closeModal}
            className="mt-4 flex mx-auto py-2 px-10 rounded-lg text-sm bg-[#FFCC00] text-[#111933] border border-[#ffcc00] hover:bg-opacity-80"
          >
            Close
          </button>
        )}
      </div>
      {selectedQuestion && (
        <QuestionDetailsMcq
          selectedQuestion={selectedQuestion}
          setSelectedQuestion={setSelectedQuestion}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          setSelectedQuestions={setSelectedQuestions}
          allQuestions={questionsArray}
          isBulkUpload={isBulkUpload}
        />
      )}
    </div>
  );
};

const TotalQuestions = ({ totalQuestions }) => {
  return (
    <div
      style={{
        flexDirection: "row",
        display: "flex",
        justifyContent: "left",
        width: "16rem",
        height: "30px",
        borderRadius: "10px",
        paddingTop: "5px",
      }}
    >
      {/* <div className=' text-normal font-semibold'>Total Questions: </div> */}
      <div className="pl-2 text-normal font-semibold">{totalQuestions}</div>
    </div>
  );
};

const Header = ({ searchQuery, setSearchQuery, totalQuestions }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [test, setTest] = useState(location.state["test"] || {});
  const [view, setView] = useState("list"); // 'list', 'details'
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTest, setEditedTest] = useState({
    ...test,
    tags: test?.tags || [],
  });
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false);
  const [testTags, setTestTags] = useState(test?.tags || []);
  const [uploadStatus, setUploadStatus] = useState(null); // Define uploadStatus
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false); // State for preview modal
  const [selectedQuestionsForUpload, setSelectedQuestionsForUpload] = useState(
    []
  ); // Selected questions for upload

  const [manualCategory, setManualCategory] = useState("");
  const [testTagsInput, setTestTagsInput] = useState("");
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    level: "",
    tags: "",
  });
  const [currentPreviewPage, setCurrentPreviewPage] = useState(1);
  const questionsPerPage = 3;
  const inputRef = useRef(null);

  const handleTestTagsChange = (e) => {
    setTestTagsInput(e.target.value);
    if (e.target.value.endsWith(",")) {
      const newTag = e.target.value.slice(0, -1).trim();
      if (newTag && !testTags.includes(newTag)) {
        const updatedTags = [...testTags, newTag];
        setTestTags(updatedTags);
        setEditedTest({ ...editedTest, tags: updatedTags }); // Synchronize with editedTest
      }
      setTestTagsInput("");
    }
  };

  const handleTestTagsKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newTag = testTagsInput.trim();
      if (newTag && !testTags.includes(newTag)) {
        const updatedTags = [...testTags, newTag];
        setTestTags(updatedTags);
        setEditedTest({ ...editedTest, tags: updatedTags }); // Synchronize with editedTest
      }
      setTestTagsInput("");
    }
  };

  const removeTestTag = (tagIndex) => {
    const newTags = testTags.filter((_, i) => i !== tagIndex);
    setTestTags(newTags);
    setEditedTest({ ...editedTest, tags: newTags }); // Synchronize with editedTest
  };

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setView("details");
  };

  const handleBack = () => {
    setView("list");
    setSelectedQuestion(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const fetchAllTests = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fetch-all-tests/`);
      const tests = response.data.tests;
      setTest(tests.filter((t) => t._id === test._id)[0]);
    } catch (error) {
      console.error("Error fetching tests:", error);
    }
  };

  useEffect(() => {
    fetchAllTests();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/update-test/${editedTest.test_id}/`,
        {
          test_name: editedTest.test_name,
          level: editedTest.level,
          tags: editedTest.tags, // Use editedTest.tags
          category:
            editedTest.category === "Others"
              ? manualCategory
              : editedTest.category,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        test.test_name = editedTest.test_name;
        test.level = editedTest.level;
        test.tags = editedTest.tags;
        setIsEditing(false);
        setEditedTest({ ...editedTest, ...response.data });
        toast.success("Test details saved successfully");
      } else {
        setError("Failed to update test");
        toast.error("Failed to update test");
      }
    } catch (error) {
      setError("An error occurred while updating the test");
      toast.error("An error occurred while updating the test");
      console.error("Error updating test:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = () => {
    setIsManualAddModalOpen(true);
  };

  const handleManualAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadStatus(null); // Reset upload status

    // Ensure correctAnswer is populated
    if (!newQuestion.correctAnswer) {
      setError("Please specify the correct answer");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/append-question-to-test/`,
        {
          test_id: editedTest.test_id,
          ...newQuestion,
          tags: newQuestion.tags.split(",").map((tag) => tag.trim()), // Convert tags to array
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setIsManualAddModalOpen(false);
        setNewQuestion({
          question: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctAnswer: "",
          level: "",
          tags: "",
        });
        setEditedTest((prevTest) => ({
          ...prevTest,
          questions: [...prevTest.questions, response.data.new_question],
        }));
        setUploadStatus("Success: Question added successfully");
        toast.success("Question added successfully");

        // Refresh the page
        window.location.reload();
      } else {
        setError("Failed to add question");
        setUploadStatus("Error: Failed to add question");
        toast.error("Failed to add question");
      }
    } catch (error) {
      console.error("Error adding question:", error);
      setError("An error occurred while adding the question");
      setUploadStatus("Error: An error occurred while adding the question");
      toast.error("An error occurred while adding the question");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = () => {
    setIsBulkUploadModalOpen(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith(".xlsx")) {
      toast.error("Please select a valid XLSX file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
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

      // Required columns check
      const requiredColumns = [
        "Question",
        "Option1",
        "Option2",
        "Correct_Answer",
        "Level",
        "Tags",
        "Blooms",
      ];
      const hasRequiredColumns = requiredColumns.every((col) =>
        headers.includes(col)
      );

      if (!hasRequiredColumns) {
        toast.error("Invalid file format. Ensure required columns exist.");
        return;
      }

      let validQuestions = [];
      let skippedCount = 0;

      dataRows.forEach((row, index) => {
        // Check if required fields exist
        if (
          !row.Question ||
          !row.Option1 ||
          !row.Option2 ||
          !row.Correct_Answer ||
          !row.Level ||
          !row.Blooms
        ) {
          toast.error(`Missing required fields in row ${index + 1}.`);
          skippedCount++;
          return;
        }

        // Fetch options
        const options = [
          row.Option1,
          row.Option2,
          row.Option3,
          row.Option4,
        ].filter(Boolean);

        // Ensure at least 2 options exist
        if (options.length < 2) {
          toast.error(`At least 2 options are required in row ${index + 1}.`);
          skippedCount++;
          return;
        }

        // Ensure correct_answer exists in options
        if (!options.includes(row.Correct_Answer)) {
          toast.error(
            `Correct answer must be one of the provided options in row ${
              index + 1
            }.`
          );
          skippedCount++;
          return;
        }

        // Convert tags into an array
        const formattedTags = row.Tags
          ? row.Tags.split(",").map((tag) => tag.trim())
          : [];

        validQuestions.push({
          question: row.Question.trim(),
          options,
          correctAnswer: row.Correct_Answer.trim(),
          level: row.Level.trim(),
          blooms: row.Blooms.trim(),
          tags: formattedTags,
          selected: false, // Initialize selection state
        });
      });

      if (validQuestions.length === 0) {
        toast.error("No valid questions found! Please check the file format.");
        return;
      }

      let message = `${validQuestions.length} questions were selected.`;
      if (skippedCount > 0) {
        message += ` ${skippedCount} questions were not selected due to an invalid format.`;
      }

      setPreviewQuestions(validQuestions);
      setIsPreviewModalOpen(true); // Open preview modal
      toast.success(message);
    };

    reader.onerror = (error) => {
      console.error("File reading error:", error);
      toast.error("Error reading file");
    };

    reader.readAsBinaryString(file);
  };

  const onDrop = (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      toast.error("No file selected. Please upload a valid XLSX file.");
      return;
    }

    const file = acceptedFiles[0];
    if (!file.name.endsWith(".xlsx")) {
      toast.error("Please select a valid XLSX file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
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

      // Required columns check
      const requiredColumns = [
        "Question",
        "Option1",
        "Option2",
        "Correct_Answer",
        "Level",
        "Tags",
        "Blooms",
      ];
      const hasRequiredColumns = requiredColumns.every((col) =>
        headers.includes(col)
      );

      if (!hasRequiredColumns) {
        toast.error("Invalid file format. Ensure required columns exist.");
        return;
      }

      let validQuestions = [];
      let skippedCount = 0;

      dataRows.forEach((row, index) => {
        // Check if required fields exist
        if (
          !row.Question ||
          !row.Option1 ||
          !row.Option2 ||
          !row.Correct_Answer ||
          !row.Level ||
          !row.Blooms
        ) {
          toast.error(`Missing required fields in row ${index + 1}.`);
          skippedCount++;
          return;
        }

        // Fetch options
        const options = [
          row.Option1,
          row.Option2,
          row.Option3,
          row.Option4,
        ].filter(Boolean);

        // Ensure at least 2 options exist
        if (options.length < 2) {
          toast.error(`At least 2 options are required in row ${index + 1}.`);
          skippedCount++;
          return;
        }

        // Ensure correct_answer exists in options
        if (!options.includes(row.Correct_Answer)) {
          toast.error(
            `Correct answer must be one of the provided options in row ${
              index + 1
            }.`
          );
          skippedCount++;
          return;
        }

        // Convert tags into an array
        const formattedTags = row.Tags
          ? row.Tags.split(",").map((tag) => tag.trim())
          : [];

        validQuestions.push({
          question: row.Question.trim(),
          options,
          correctAnswer: row.Correct_Answer,
          level: row.Level.trim(),
          blooms: row.Blooms.trim(),
          tags: formattedTags,
          selected: false, // Initialize selection state
        });
      });

      if (validQuestions.length === 0) {
        toast.error("No valid questions found! Please check the file format.");
        return;
      }

      let message = `${validQuestions.length} questions were selected.`;
      if (skippedCount > 0) {
        message += ` ${skippedCount} questions were not selected due to an invalid format.`;
      }

      setPreviewQuestions(validQuestions);
      setIsPreviewModalOpen(true); // Open preview modal
      toast.success(message);
    };

    reader.onerror = (error) => {
      console.error("File reading error:", error);
      toast.error("Error reading file");
    };

    reader.readAsBinaryString(file);
  };

  const handleFileUpload = async () => {
    // Check if we have selected questions first
    if (
      !selectedQuestionsForUpload ||
      selectedQuestionsForUpload.length === 0
    ) {
      toast.error("No questions selected for upload");
      return;
    }

    // Convert all fields to strings
    const payload = {
      test_id: editedTest.test_id.toString(),
      questions: selectedQuestionsForUpload.map((question) => ({
        question: question.question.toString(),
        options: question.options.map((option) => option.toString()),
        correctAnswer: question.correctAnswer.toString(),
        level: question.level.toString(),
        blooms: question.blooms.toString(),
        tags: question.tags.map((tag) => tag.toString()),
        selected: question.selected.toString(), // If 'selected' is part of the payload
      })),
    };

    console.log("Upload payload:", payload); // Add logging to verify payload

    setLoading(true);
    setError(null);
    setUploadStatus(null); // Reset upload status

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/bulk-upload-questions-to-test/`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        const uploadedQuestions = Array.isArray(response.data.questions)
          ? response.data.questions
          : [];
        setIsBulkUploadModalOpen(false);
        setUploadFile(null);
        setPreviewQuestions([]);
        setEditedTest((prevTest) => ({
          ...prevTest,
          questions: [...prevTest.questions, ...uploadedQuestions],
        }));
        setUploadStatus("Success: Questions uploaded successfully");
        toast.success("Questions uploaded successfully");

        // Store uploaded questions in session storage
        sessionStorage.setItem(
          "uploadedQuestions",
          JSON.stringify(uploadedQuestions)
        );

        // Refresh the page
        window.location.reload();
      } else {
        setError("Failed to upload questions");
        setUploadStatus("Error: Failed to upload questions");
        toast.error("Failed to upload questions");
      }
    } catch (error) {
      setError("An error occurred while uploading the questions");
      setUploadStatus("Error: An error occurred while uploading the questions");
      toast.error("An error occurred while uploading the questions");
      console.error("Error uploading questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsBulkUploadModalOpen(false);
    setUploadFile(null);
    setPreviewQuestions([]);
    setError(null);
    setUploadStatus(null); // Reset upload status
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  const handleCloseManualAddModal = () => {
    setIsManualAddModalOpen(false);
    setNewQuestion({
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      level: "",
      tags: "",
    });
    setError(null);
    setUploadStatus(null); // Reset upload status
  };

  const handlePrevPage = () => {
    setCurrentPreviewPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPreviewPage((prevPage) =>
      Math.min(
        prevPage + 1,
        Math.ceil(previewQuestions.length / questionsPerPage)
      )
    );
  };

  const getCurrentQuestions = () => {
    const startIndex = (currentPreviewPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    return previewQuestions.slice(startIndex, endIndex);
  };

  const handleDownloadSample = () => {
    const link = document.createElement("a");
    link.href = downloadSampleFile;
    link.download = "sample_document.xlsx";
    link.click();
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadFile(files[0]);

      Papa.parse(files[0], {
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          const questions = results.data
            .filter((question) => question.question && question.correctAnswer)
            .map((question) => ({
              ...question,
              level: question.level || question.Level,
              tags: question.tags
                ? question.tags.split(",").map((tag) => tag.trim())
                : [], // Ensure tags are split by comma and trimmed
              selected: false,
            }));
          setPreviewQuestions(questions);
          setIsPreviewModalOpen(true); // Open preview modal
        },
        error: (error) => {
          setError("Failed to parse the CSV file");
          console.error("Error parsing CSV file:", error);
        },
      });
    }
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleFinishQuestions = async (questions) => {
    setLoading(true);
    setError(null);

    try {
      for (const question of questions) {
        const payload = {
          test_id: editedTest.test_id,
          question: question.question,
          option1: question.optionA,
          option2: question.optionB,
          option3: question.optionC,
          option4: question.optionD,
          correctAnswer: question.answer,
          level: question.level,
          tags: question.tags.split(",").map((tag) => tag.trim()), // Convert tags to array
          blooms: question.blooms,
        };

        const response = await axios.post(
          `${API_BASE_URL}/api/append-question-to-test/`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 200) {
          setEditedTest((prevTest) => ({
            ...prevTest,
            questions: [...prevTest.questions, response.data.new_question],
          }));
          toast.success("Question added successfully");
        } else {
          setError("Failed to add question");
          toast.error("Failed to add question");
        }
      }

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Error adding questions:", error);
      setError("An error occurred while adding the questions");
      toast.error("An error occurred while adding the questions");
    } finally {
      setLoading(false);
    }
  };

  if (!test) {
    return <div>No test selected</div>;
  }

  return (
    <div className="flex flex-col md:flex-row justify-between items-center py-3 bg-white rounded-t-lg ">
      <div className="flex flex-1 items-center gap-2 mt-2 md:mt-0 ">
        {/* <TotalQuestions totalQuestions={totalQuestions} /> */}
        <div className="relative flex-grow flex items-center w-1/2">
          <span className="absolute left-4 text-gray-500">
            <IoSearchSharp className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-11/12 py-2 pl-12 pr-4 border-2 rounded-lg transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-2  md:mt-0">
        <button
          onClick={handleBulkUpload}
          className="inline-flex items-center px-6 py-2 w-144px font-medium bg-[#111933] text-[#ffffff] hover:bg-[#111933] hover:scale-102 cursor-pointer"
          style={{ borderRadius: "0.5rem" }}
        >
          Import Question
          <img src={ImportQuestion} alt="Import" className="w-4 h-4 ml-3" />
        </button>
        <button
          onClick={handleManualAdd}
          className="inline-flex items-center px-6 py-2 w-144px font-medium bg-[#111933] text-[#ffffff] hover:bg-[#111933] transform transition-transform hover:scale-102 cursor-pointer"
          style={{ borderRadius: "0.5rem" }}
        >
          Add Question
          <img src={AddQuestion} alt="Add" className="w-4 h-4 ml-3" />
        </button>
      </div>
      {isBulkUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-[#111933]">
                Upload Files
              </h1>

              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[#A0A0A0] text-sm mb-6">

              Easily add questions by uploading your prepared files in{' '}
              <span className="font-medium text-[#111933] opacity-60">xlsx format.</span>

            </p>
            <hr className="border-t border-gray-400 my-4" />
            {/* <button
              onClick={handleDownloadSample}
              className="mb-4 w-full bg-[#E3E3E366] bg-opacity-70 text-[#111933] hover:bg-[#E3E3E3] hover:bg-opacity-100 py-2 px-4 rounded-md text-sm font-medium flex justify-between items-center"
            >
              <span>Sample file</span>
              <Download className="w-5 h-5 text-[#111933]" />
            </button> */}

            <div
              {...getRootProps()}
              className={`border-2 border-dashed ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }
                     rounded-lg p-5 flex flex-col items-center mb-6 w-full cursor-pointer transition-colors`}
            >
              <input {...getInputProps()} accept=".csv, .xlsx" id="fileInput" />

              <p className="text-[#111933] text-xl mb-4">
                {isDragActive
                  ? "Drop your file here"
                  : "Drag and drop or click to upload"}
              </p>
              <p className="text-gray-500 text-sm mb-4">
                Upload files only in xlsx format.
              </p>
              <button
                type="button"
                className="bg-[#111933] text-white px-6 py-2 rounded-md cursor-pointer flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById("fileInput").click();
                }}
              >
                Upload <Upload size={20} />
              </button>
            </div>
            <div className="p-2 rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">Instructions</h2>
              <p className="text-[#A0A0A0] mb-2 text-sm">

                Easily add questions by uploading your prepared files as{' '}
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
                  The correct answer should be specified in the correct answer
                  column.
                </li>
                <li className="flex items-center gap-2">
                  <img src={correct} alt="Checkmark" className="w-4 h-4" />
                  Ensure all fields are properly filled.
                </li>
              </ul>
            </div>
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-2 border border-[#111933] text-[#111933] px-6 py-2 rounded-md cursor-pointer mt-4"
            >
              <span>Sample Document</span>
              <Download className="w-5 h-5 text-[#111933]" />
            </button>

            {error && (
              <div
                className={`mt-4 p-3 rounded-md ${
                  error.startsWith("Success")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {error}
              </div>
            )}
          </div>
        </div>
      )}
      {isManualAddModalOpen && (
        <QuestionModal
          isSingleQuestionModalOpen={isManualAddModalOpen}
          setIsSingleQuestionModalOpen={setIsManualAddModalOpen}
          initialQuestionData={newQuestion}
          onFinish={handleFinishQuestions} // Pass the handleFinishQuestions function
        />
      )}
      {isPreviewModalOpen && (
        <PreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          selectedQuestions={previewQuestions}
          setSelectedQuestions={setPreviewQuestions}
          isBulkUpload={true}
          setBulkSelectedQuestions={setSelectedQuestionsForUpload} // Pass the setter for selected questions
          onSave={handleFileUpload} // Pass the handleFileUpload function
        />
      )}
    </div>
  );
};

export default Header;
