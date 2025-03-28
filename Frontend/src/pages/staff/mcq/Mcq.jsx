import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FiltersSidebar from "../../../components/McqLibrary/FiltersSidebar";
import Header from "../../../components/McqLibrary/Header";
import QuestionsList from "../../../components/McqLibrary/QuestionsList";
import QuestionModal from "../../../components/McqLibrary/QuestionModal";
import ImportModal from "../../../components/McqLibrary/ImportModal";
import QuestionDetails from "../../../components/McqLibrary/QuestionDetails";
import ConfirmationModal from "../../../components/McqLibrary/ConfirmationModal";
import PreviewModal from "../../../components/staff/mcq/PreviewModal"; // Import PreviewModal
import axios from "axios";
import Papa from "papaparse"; // For CSV parsing
import * as XLSX from 'xlsx';
import bg from '../../../assets/bgpattern.svg';

const BLOOMS_ORDER = [
  "L1 - Remember",
  "L2 - Understanding",
  "L3 - Apply",
  "L4 - Analyze",
  "L5 - Evaluate",
  "L6 - Create",
];

const Mcq = () => {
  const [modalStates, setModalStates] = useState({
    isModalOpen: false,
    isSingleQuestionModalOpen: false,
    showConfirm: false,
    isEditing: false,
    isPreviewModalOpen: false, // Add state for PreviewModal
  });

  const [questionData, setQuestionData] = useState({
    questions: [],
    selectedQuestion: null,
    singleQuestionData: {
      question: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      option5: "",
      option6: "",
      answer: "",
      level: "easy",
      tags: "",
      blooms: "",
    },
    previewQuestions: [], // Add state for questions to preview
    selectedPreviewQuestions: [], // Add state for selected questions from preview
  });

  const [uiState, setUiState] = useState({
    loading: true,
    isLoading: false,
    error: null,
    uploadStatus: "",
    currentPage: 1,
    searchQuery: "",
    filters: { level: [], tags: [], section: [], blooms: [] },
    availableTags: [],
    availableSections: [],
    availableBlooms: [],
  });

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const navigate = useNavigate();
  const questionsPerPage = 10;

  const toggleModal = (modalType, value) => {
    setModalStates((prev) => ({ ...prev, [modalType]: value }));
  };

  const handleUpdatePreviewQuestion = (updatedQuestion) => {
    setQuestionData((prev) => {
      const updatedPreviewQuestions = prev.previewQuestions.map((q) =>
        q.question === updatedQuestion.question ? updatedQuestion : q
      );
      return { ...prev, previewQuestions: updatedPreviewQuestions };
    });
  };

  const handlePreview = () => {
    const fileInput = document.getElementById("fileInput");
    if (fileInput.files.length > 0) {
      handleBulkUpload({ target: { files: fileInput.files } });
    } else if (questionData.selectedPreviewQuestions.length > 0) {
      // If no new file is uploaded but there are saved questions, show them in PreviewModal
      toggleModal("isPreviewModalOpen", true);
    } else {
      toast.error("Please upload a file or save questions to preview.");
    }
  };

  // Update the handleApiRequest function to include credentials
  const handleApiRequest = async (url, method, body = null) => {
    try {
      const options = {
        method,
        headers: method === 'POST' || method === 'PUT'
          ? { 'Content-Type': 'application/json' }
          : {},
        body: body ? JSON.stringify(body) : null,
        credentials: 'include', // Include cookies in all requests
      };

      const response = await fetch(`${API_BASE_URL}${url}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${method.toLowerCase()} data`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${method}):`, error);
      throw error;
    }
  };

  // Update fetchQuestions to handle authentication errors
  const fetchQuestions = useCallback(async () => {
    try {
      setUiState(prev => ({ ...prev, loading: true }));
      const data = await handleApiRequest('/api/fetch-all-questions/', 'GET');
      let fetchedQuestions = data.questions.reverse();

      const questionMap = new Map();
      const uniqueQuestions = [];
      const duplicates = [];
      fetchedQuestions.forEach(question => {
        if (questionMap.has(question.question)) {
          duplicates.push(question);
        } else {
          questionMap.set(question.question, true);
          uniqueQuestions.push(question);
        }
      });

      setQuestionData(prev => ({ ...prev, questions: uniqueQuestions }));

      if (duplicates.length > 0) {
        const duplicateIds = duplicates.map(question => question.question_id);
        await Promise.all(duplicateIds.map(id =>
          axios.delete(`${API_BASE_URL}/api/delete_question/${id}/`, {
            withCredentials: true
          })
        ));
        toast.success("Duplicate questions deleted successfully!");
      }

      setUiState(prev => ({ ...prev, error: null }));
    } catch (err) {
      // Handle potential authentication errors
      if (err.message === "Authentication required") {
        toast.error("Authentication required. Please log in again.");
        // Optionally redirect to login page
        // navigate('/login');
      } else {
        setUiState(prev => ({
          ...prev,
          error: "Failed to load questions. Please try again later.",
        }));
      }
    } finally {
      setUiState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const handleDelete = async (question_id) => {
    try {
      await handleApiRequest(`/api/delete_question/${question_id}/`, "DELETE");
      toast.success("Question deleted successfully");
      fetchQuestions();
    } catch (error) {
      toast.error("Failed to delete question");
    }
  };

  const handleUpdate = async (question_id) => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      const { question, options, correctAnswer, level, tags, blooms } =
        questionData.selectedQuestion;

      // Filter out empty options and ensure 2–4 options
      const validOptions = (options || []).filter((opt) => opt.trim() !== "");
      if (validOptions.length < 2 || validOptions.length > 4) {
        throw new Error("Number of options must be between 2 and 4.");
      }
      if (!validOptions.includes(correctAnswer)) {
        throw new Error("Correct answer must be one of the options.");
      }

      // Normalize tags to an array
      const normalizedTags = Array.isArray(tags)
        ? tags
        : tags
          ? tags.split(",").map((tag) => tag.trim())
          : [];

      const payload = {
        question,
        options: validOptions, // Send only non-empty options
        correctAnswer,
        level: level || "general",
        tags: normalizedTags,
        // Exclude blooms since backend doesn't handle it
      };

      const response = await handleApiRequest(
        `/api/update_question/${question_id}/`,
        "PUT",
        payload
      );

      // Update local questions state with the response
      setQuestionData((prev) => ({
        ...prev,
        questions: prev.questions.map(
          (q) =>
            q.question_id === question_id ? { ...q, ...payload, blooms } : q // Preserve blooms locally
        ),
      }));

      toggleModal("isEditing", false);
      toast.success("Question Updated Successfully!");
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error(
        `Failed to update question: ${error.message || "Unknown error"}`
      );
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleSingleQuestionSubmit = async (e) => {
    e.preventDefault();
    const { question, option1, option2, option3, option4, answer, level } =
      questionData.singleQuestionData;

    if (!question || !option1 || !option2 || !answer || !level) {
      setUiState((prev) => ({
        ...prev,
        uploadStatus: "Error: Please fill in all required fields",
      }));
      return;
    }

    const options = [option1, option2, option3, option4];
    if (!options.includes(answer)) {
      setUiState((prev) => ({
        ...prev,
        uploadStatus: "Error: Answer must be one of the options",
      }));
      return;
    }

    try {
      await handleApiRequest(
        "/api/upload-single-question/",
        "POST",
        questionData.singleQuestionData
      );

      toast.success("Question uploaded successfully!");
      setQuestionData((prev) => ({
        ...prev,
        singleQuestionData: {
          question: "",
          option1: "",
          option2: "",
          option3: "",
          option4: "",
          answer: "",
          level: "easy",
          tags: "",
          blooms: "",
        },
      }));

      fetchQuestions();
      setTimeout(() => toggleModal("isSingleQuestionModalOpen", false), 1500);
    } catch (err) {
      setUiState((prev) => ({
        ...prev,
        uploadStatus: "Error: Unable to upload question.",
      }));
    }
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

          // If valid, add to list
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
        setQuestionData((prev) => ({
          ...prev,
          previewQuestions: validQuestions,
          selectedPreviewQuestions: [],
        }));

        // Open the PreviewModal
        setModalStates((prev) => ({
          ...prev,
          isPreviewModalOpen: true,
        }));

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

  // Only modify the handleSaveSelectedQuestions function - changing the API endpoint
  const handleSaveSelectedQuestions = async () => {
    try {
      setUiState(prev => ({ ...prev, isLoading: true }));

      const questionsToUpload = questionData.selectedPreviewQuestions;

      if (!questionsToUpload || questionsToUpload.length === 0) {
        toast.error("No questions selected. Please select and save questions in the preview before submitting.");
        setUiState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const formData = new FormData();
      const csvContent = Papa.unparse(questionsToUpload.map(q => ({
        question: q.question,
        option1: q.options[0] || "",
        option2: q.options[1] || "",
        option3: q.options[2] || "",
        option4: q.options[3] || "",
        option5: q.options.length > 4 ? q.options[4] : "",
        option6: q.options.length > 5 ? q.options[5] : "",
        correctAnswer: q.correctAnswer,
        Level: q.level,
        tags: q.tags.join(','),
        blooms: q.blooms
      })));
      formData.append("file", new Blob([csvContent], { type: "text/csv" }), "uploaded_questions.csv");

      // Change the endpoint URL to match the renamed backend function
      // Change this line in handleSaveSelectedQuestions function
      const response = await fetch(`${API_BASE_URL}/api/mcq-bulk-upload/`, {
        method: "POST",
        body: formData,
        credentials: 'include', // Include cookies in the request
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchQuestions();
        toggleModal('isPreviewModalOpen', false);
        toggleModal('isModalOpen', false);
        // Optionally reset selectedPreviewQuestions after successful submission
        setQuestionData(prev => ({
          ...prev,
          selectedPreviewQuestions: [],
          previewQuestions: []
        }));
      } else {
        toast.error(`Error: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      toast.error("Error: Unable to upload questions.");
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getFilteredQuestions = () => {
    return questionData.questions.filter((question) => {
      const matchesSearch =
        question.question
          .toLowerCase()
          .includes(uiState.searchQuery.toLowerCase()) ||
        question.options.some((option) =>
          option.toLowerCase().includes(uiState.searchQuery.toLowerCase())
        );

      const matchesLevel =
        uiState.filters.level.length === 0 ||
        uiState.filters.level.includes(question.level);

      const questionTags =
        typeof question.tags === "string"
          ? question.tags.split(",").map((tag) => tag.trim())
          : question.tags || [];
      const matchesTags =
        uiState.filters.tags.length === 0 ||
        uiState.filters.tags.some((tag) => questionTags.includes(tag));

      const matchesSection =
        uiState.filters.section.length === 0 ||
        uiState.filters.section.includes(question.section);

      const matchesBlooms =
        uiState.filters.blooms.length === 0 ||
        uiState.filters.blooms.some((bloom) =>
          question.blooms.startsWith(bloom.split(" ")[0])
        );

      return (
        matchesSearch &&
        matchesLevel &&
        matchesTags &&
        matchesSection &&
        matchesBlooms
      );
    });
  };

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    const filteredQuestions = getFilteredQuestions(); // Use the filtered questions based on current filters
    const tags = new Set();
    const blooms = new Set();

    // Filter tags and blooms based on the questions that match the selected difficulty level(s)
    filteredQuestions.forEach((question) => {
      if (question.tags) {
        const questionTags =
          typeof question.tags === "string"
            ? question.tags.split(",").map((tag) => tag.trim())
            : question.tags;
        questionTags.forEach((tag) => tags.add(tag));
      }
      if (
        question.blooms &&
        (uiState.filters.level.length === 0 ||
          uiState.filters.level.includes(question.level))
      ) {
        blooms.add(question.blooms);
      }
    });

    // Ensure all Bloom's levels are included if no difficulty level is selected
    if (uiState.filters.level.length === 0) {
      BLOOMS_ORDER.forEach((bloom) => blooms.add(bloom));
    }

    // Sort blooms according to the predefined order
    const sortedBlooms = BLOOMS_ORDER.filter((bloom) => blooms.has(bloom));

    setUiState((prev) => ({
      ...prev,
      availableTags: Array.from(tags),
      availableBlooms: sortedBlooms,
    }));
  }, [questionData.questions, uiState.filters.level]); // Add uiState.filters.level as a dependency

  const filteredQuestions = getFilteredQuestions();
  const indexOfLastQuestion = uiState.currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(
    indexOfFirstQuestion,
    indexOfLastQuestion
  );
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  const handleFinishQuestions = async (questionList) => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      const convertedQuestions = questionList.map((question) => ({
        question: question.question,
        option1: question.optionA || "",
        option2: question.optionB || "",
        option3: question.optionC || "",
        option4: question.optionD || "",
        option5: question.optionE || "",
        option6: question.optionF || "",
        answer: question.answer,
        level: question.level,
        tags: question.tags,
        blooms: question.blooms,
      }));

      const uploadPromises = convertedQuestions.map((question) =>
        handleApiRequest("/api/upload-single-question/", "POST", question)
      );

      await Promise.all(uploadPromises);
      await fetchQuestions();

      toast.success(
        `${convertedQuestions.length} questions added successfully!`
      );
    } catch (error) {
      toast.error("Failed to add questions. Please try again.");
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="min-h-screen pt-24"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}>
      <ToastContainer />
      <div className="max-w-full mx-auto px-20 py-10">
        <div className="bg-white p-8 main-container rounded-lg">
          <h3 className="font-bold text-2xl  text-[#111933]">
            Question Library
          </h3>
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-light text-lg text-[#111933]">
              Select and preview questions from your collection
            </h4>
            <span className="text-lg text-gray-600 mb-2">
              Total Questions :{" "}
              <span className="text-5xl text-[#111933] font-semibold">
                {filteredQuestions.length}
              </span>
            </span>


          </div>
          <hr className=" border-gray-300 mb-4" />

          <div className="flex flex-col lg:flex-row gap-6">
            <FiltersSidebar
              filters={uiState.filters}
              toggleFilter={(type, value) => {
                setUiState((prev) => ({
                  ...prev,
                  filters: {
                    ...prev.filters,
                    [type]: prev.filters[type].includes(value)
                      ? prev.filters[type].filter((item) => item !== value)
                      : [...prev.filters[type], value],
                  },
                  currentPage: 1, // Reset to page 1 when filters change
                }));
              }}
              clearFilters={() => {
                setUiState((prev) => ({
                  ...prev,
                  filters: { level: [], tags: [], section: [], blooms: [] },
                  searchQuery: "",
                  currentPage: 1, // Reset to page 1 when filters are cleared
                }));
              }}
              availableTags={uiState.availableTags}
              availableSections={uiState.availableSections}
              availableBlooms={uiState.availableBlooms}
            />

            <div className="flex-1 border rounded-md">
              <Header
                totalQuestions={filteredQuestions.length}
                searchQuery={uiState.searchQuery}
                setSearchQuery={(query) =>
                  setUiState((prev) => ({
                    ...prev,
                    searchQuery: query,
                    currentPage: 1,
                  }))
                } // Reset to page 1 when search query changes
                setIsModalOpen={(value) => toggleModal("isModalOpen", value)}
                setIsSingleQuestionModalOpen={(value) =>
                  toggleModal("isSingleQuestionModalOpen", value)
                }
              />

              {filteredQuestions.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700 mt-4">
                  <strong className="font-medium">No Results: </strong>
                  <span>No questions found.</span>
                </div>
              ) : (
                <QuestionsList
                  questions={questionData.questions}
                  loading={uiState.loading}
                  error={uiState.error}
                  currentQuestions={currentQuestions}
                  setSelectedQuestion={(question) =>
                    setQuestionData((prev) => ({
                      ...prev,
                      selectedQuestion: question,
                    }))
                  }
                  currentPage={uiState.currentPage}
                  totalPages={totalPages}
                  setCurrentPage={(page) =>
                    setUiState((prev) => ({ ...prev, currentPage: page }))
                  }
                  handleDelete={handleDelete} // Pass the delete function here
                />
              )}
            </div>
          </div>
        </div>

        {questionData.selectedQuestion && (
          <QuestionDetails
            selectedQuestion={questionData.selectedQuestion}
            setSelectedQuestion={(question) =>
              setQuestionData((prev) => ({
                ...prev,
                selectedQuestion: question,
              }))
            }
            isEditing={modalStates.isEditing}
            setIsEditing={(value) => toggleModal("isEditing", value)}
            handleUpdate={handleUpdate}
            isLoading={uiState.isLoading}
            setShowConfirm={(value) => toggleModal("showConfirm", value)}
            originalQuestion={questionData.questions.find(
              (q) => q.question_id === questionData.selectedQuestion.question_id
            )} // Pass original question
          />
        )}

        {modalStates.isModalOpen && (
          <ImportModal
            isModalOpen={modalStates.isModalOpen}
            setIsModalOpen={(value) => toggleModal("isModalOpen", value)}
            handleBulkUpload={handleFileUpload}
            uploadStatus={uiState.uploadStatus}
            handlePreview={() => {
              const fileInput = document.getElementById("fileInput");
              if (fileInput.files.length > 0) {
                // If a new file is uploaded, parse it and reset selections
                handleFileUpload({ target: { files: fileInput.files } });
              } else if (questionData.previewQuestions.length > 0) {
                // If no new file but previewQuestions exist, show them with saved selections
                toggleModal("isPreviewModalOpen", true);
              } else {
                toast.error("Please upload a file to preview questions.");
              }
            }}
            handleSubmit={handleSaveSelectedQuestions}
          />
        )}

        {modalStates.isSingleQuestionModalOpen && (
          <QuestionModal
            isSingleQuestionModalOpen={modalStates.isSingleQuestionModalOpen}
            setIsSingleQuestionModalOpen={(value) =>
              toggleModal("isSingleQuestionModalOpen", value)
            }
            initialQuestionData={{
              question: "",
              optionA: "",
              optionB: "",
              optionC: "",
              optionD: "",
              optionE: "",
              optionF: "",
              answer: "",
              level: "",
              blooms: "",
              tags: "",
            }}
            onFinish={handleFinishQuestions}
          />
        )}

        {modalStates.showConfirm && (
          <ConfirmationModal
            showConfirm={modalStates.showConfirm}
            setShowConfirm={(value) => toggleModal("showConfirm", value)}
            handleDelete={handleDelete}
            selectedQuestion={questionData.selectedQuestion}
            setSelectedQuestion={(question) =>
              setQuestionData((prev) => ({
                ...prev,
                selectedQuestion: question,
              }))
            }
            navigate={navigate}
          />
        )}

        {modalStates.isPreviewModalOpen && (
          <PreviewModal
            isOpen={modalStates.isPreviewModalOpen}
            onClose={() => toggleModal("isPreviewModalOpen", false)}
            selectedQuestions={questionData.previewQuestions} // Pass all preview questions
            setSelectedQuestions={(questions) =>
              setQuestionData((prev) => ({
                ...prev,
                previewQuestions: questions,
              }))
            }
            allQuestions={questionData.previewQuestions}
            isBulkUpload={true}
            setBulkSelectedQuestions={(questions) =>
              setQuestionData((prev) => ({
                ...prev,
                selectedPreviewQuestions: questions, // Update selected questions
              }))
            }
            onSubmit={handleSaveSelectedQuestions}
          />
        )}
      </div>
    </div>
  );
};

export default Mcq;
