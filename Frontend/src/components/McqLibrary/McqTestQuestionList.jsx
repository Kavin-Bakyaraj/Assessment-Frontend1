import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Trash2 } from "lucide-react";
import axios from "axios";
import TestQuestionDetails from "./TestQuestionDetails";
import Pagination from "@mui/material/Pagination";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  faArrowLeft,
  faEdit,
  faSave,
  faPlus,
  faUpload,
  faTimes,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FiltersSidebar from "./FiltersSidebar";
import Header from "./TestHeader";
import { FaTrash } from "react-icons/fa";
import { object } from "yup";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const McqTestQuestionList = ({
  testId,
  test,
  setSelectedQuestion,
  currentPage,
  setCurrentPage,
  isEditing,
  handleEdit,
  deleteSelectedQuestions,
  view,
  setView,
  selectedQuestion,
  handleManualAdd,
  handleBulkUpload,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [filters, setFilters] = useState({ level: [], tags: [], blooms: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSingleQuestionModalOpen, setIsSingleQuestionModalOpen] =
    useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableBlooms, setAvailableBlooms] = useState([]);
  const [duplicateQuestions, setDuplicateQuestions] = useState([]);

  const fetchQuestions = useCallback(async () => {
    try {
      console.log("Fetching questions for test ID:", testId);
      if (!testId) {
        console.error("Test ID is undefined");
        return;
      }

      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/fetch_questions_for_test/?test_id=${testId}`
      );
      console.log("API Response:", JSON.stringify(response.data, null, 2)); // Pretty-print the response

      if (response.data.error) {
        setError(response.data.error);
        setQuestions([]);
        toast.error("Error fetching questions.");
      } else {
        let fetchedQuestions = response.data.questions.reverse();

        const questionMap = new Map();
        const uniqueQuestions = [];
        const duplicates = [];
        fetchedQuestions.forEach((question) => {
          if (questionMap.has(question.question)) {
            duplicates.push(question);
          } else {
            questionMap.set(question.question, true);
            uniqueQuestions.push(question);
          }
        });

        setQuestions(uniqueQuestions);
        setDuplicateQuestions(duplicates);

        if (duplicates.length > 0) {
          const duplicateIds = duplicates.map(
            (question) => question.question_id
          );
          await Promise.all(
            duplicateIds.map((id) =>
              axios.delete(
                `${API_BASE_URL}/api/delete-question-from-test/${testId}/${id}/`
              )
            )
          );
          toast.success("Duplicate questions deleted successfully!");
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Failed to fetch questions. Please try again.");
      setLoading(false);
      toast.error("Failed to fetch questions. Please try again.");
    }
  }, [testId]);
  const BLOOMS_ORDER = [
    "L1 - Remember",
    "L2 - Understanding",
    "L3 - Apply",
    "L4 - Analyze",
    "L5 - Evaluate",
    "L6 - Create",
  ];

  useEffect(() => {
    fetchQuestions();
  }, [testId, fetchQuestions]);

  useEffect(() => {
    filterQuestions();
  }, [questions, filters, searchQuery]);

  useEffect(() => {
    const filteredQuestions = questions.filter((question) => {
      const matchesLevel =
        filters.level.length === 0 || filters.level.includes(question.level);
      return matchesLevel;
    });

    const tagsSet = new Set();
    const bloomsSet = new Set();

    // Function to check if a bloom level matches any variation
    function matchesBloomLevel(bloom, level) {
      const variations = [
        level,
        level.toLowerCase(),
        level.split(' ')[0], // e.g., "L1"
        level.split(' ')[2].toLowerCase(), // e.g., "remember"
      ];
      return variations.some(variation => bloom.includes(variation));
    }

    filteredQuestions.forEach((question) => {
      if (question.tags) {
        question.tags.forEach((tag) => tagsSet.add(tag));
      }
      console.log(question.blooms);

      if (question.blooms) {
        BLOOMS_ORDER.forEach((level) => {
          if (matchesBloomLevel(question.blooms, level)) {
            bloomsSet.add(level);
          }
        });
      }
    });
    const sortedBlooms = BLOOMS_ORDER.filter((bloom) => bloomsSet.has(bloom));
    console.log(sortedBlooms);



    setAvailableTags(Array.from(tagsSet));
    setAvailableBlooms(sortedBlooms);
  }, [questions, filters.level]);

  const onDeleteQuestion = async (question_id) => {
    if (!testId) {
      console.error("Test ID is undefined");
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/delete-question-from-test/${testId}/${question_id}/`
      );
      if (response.status === 200) {
        setQuestions(
          questions.filter((question) => question.question_id !== question_id)
        );
        toast.success("Question deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete the question. Please try again.");
    } finally {
      setDeleting(false);
      setShowConfirmModal(false);
    }
  };

  const handleDeleteClick = (question_id) => {
    setQuestionToDelete(question_id);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    if (questionToDelete) {
      onDeleteQuestion(questionToDelete);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setQuestionToDelete(null);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const toggleFilter = (filterType, value) => {
    setFilters((prevFilters) => {
      let newFilters = { ...prevFilters };
      if (newFilters[filterType].includes(value)) {
        newFilters[filterType] = newFilters[filterType].filter(
          (item) => item !== value
        );
      } else {
        newFilters[filterType] = [...newFilters[filterType], value];
      }
      return newFilters;
    });

    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ level: [], tags: [], blooms: [] });
    setCurrentPage(1);
  };

  const filterQuestions = () => {
    let filteredQuestions = [...questions];

    if (filters.level.length > 0) {
      filteredQuestions = filteredQuestions.filter((question) =>
        filters.level.includes(question.level)
      );
    }

    if (filters.tags.length > 0) {
      filteredQuestions = filteredQuestions.filter((question) =>
        filters.tags.some((tag) => question.tags.includes(tag))
      );
    }

    if (filters.blooms.length > 0) {
      filteredQuestions = filteredQuestions.filter(question =>
        (filters.blooms.filter((filter) => { return filter.includes(question.blooms) })).length > 0
      );
    }
    console.log(filters.blooms);


    if (searchQuery) {
      filteredQuestions = filteredQuestions.filter((question) =>
        question.question.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setCurrentQuestions(filteredQuestions);
  };

  const getItemsPerPage = () => 10;

  const indexOfLastQuestion = currentPage * getItemsPerPage();
  const indexOfFirstQuestion = indexOfLastQuestion - getItemsPerPage();
  const currentQuestionsSlice = currentQuestions.slice(
    indexOfFirstQuestion,
    indexOfLastQuestion
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_7fr] gap-4 py-4">
      <FiltersSidebar
        filters={filters}
        toggleFilter={toggleFilter}
        clearFilters={clearFilters}
        availableTags={availableTags}
        availableBlooms={availableBlooms}
      />
      <div className="bg-white border px-8 py-4 pt-1 rounded-lg relative">
        <div className="flex flex-col">
          <div className="bg-white mt-2 rounded-lg">
            <div className="flex gap-6 my-4">
              {/* Total Questions Card */}
              {/* <div className="relative flex items-center justify-center min-w-[120px] min-h-[100px] rounded-xl bg-white shadow-md border border-gray-200  transition-all">
  <div className="flex flex-col items-center justify-center px-2">
    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#111933] bg-opacity-90 shadow-inner">
      <span className="text-white text-3xl font-bold">{currentQuestions.length}</span>
    </div>
    <p className="text-[#111933] text-base font-semibold mt-2 text-center">
      Total<br />Questions
    </p>
  </div>
</div> */}

              {/* Test Details Card */}
              <div className="flex-1 flex flex-col justify-between rounded-xl bg-white transition-all">
                <div className="flex items-start justify-between w-full">
                  <h1
                    className="text-3xl font-bold text-[#111933] truncate w-96"
                    title={test.test_name}
                  >
                    {test.test_name}
                  </h1>
                </div>

                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-medium text-[#111933] py-1">
                      {test.category}
                    </span>
                  </div>

                  <div className="flex justify-between items-center space-x-2">
                    <div className="flex flex-wrap items-center">
                      <span
                        className={`flex items-center px-3 py-1 rounded-xl text-sm  ${test.level === "Easy"
                          ? "bg-green-200 text-green-800"
                          : test.level === "Medium"
                            ? "bg-yellow-200 text-yellow-800"
                            : test.level === "Hard"
                              ? "bg-red-200 text-red-800"
                              : "bg-gray-200 text-gray-800"
                          }`}
                      >
                        {test.level}
                      </span>

                      {test.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-xl text-sm border  bg-gray-100 text-[#111933] ml-2 truncate"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {!isEditing && (
                      <button
                        onClick={handleEdit}
                        className="hover:text-[#111933] py-2 px-4 rounded-lg flex items-center font-medium border border-[#111933] bg-[#111933] hover:bg-white text-white transition"
                      >
                        Edit <FontAwesomeIcon className="ml-2" icon={faEdit} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Header
            searchQuery={searchQuery}
            setSearchQuery={(query) => {
              setSearchQuery(query);
              setCurrentPage(1); // Reset to page 1 when search query changes
            }}
            setIsModalOpen={setIsModalOpen}
            setIsSingleQuestionModalOpen={setIsSingleQuestionModalOpen}
            handleManualAdd={handleManualAdd}
            handleBulkUpload={handleBulkUpload}
          />
          <div className="space-y-2 flex-grow">
            <ToastContainer />
            {loading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
                <strong className="font-medium">Error: </strong>
                <span>{error}</span>
              </div>
            ) : currentQuestions.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
                <strong className="font-medium">No Results: </strong>
                <span>No questions found.</span>
              </div>
            ) : (
              <>
                {currentQuestionsSlice.map((question, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-400 hover:shadow-md hover:scale-y-102 transition-all cursor-pointer "
                    onClick={() => {
                      setSelectedQuestion(question);
                      setView("details");
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex-shrink-0 w-14 h-12 flex items-center justify-center  bg-[#111933] text-[#fff] rounded-l-xl font-semibold text-md">
                        {indexOfFirstQuestion + index + 1}
                      </span>
                      <div className="flex-1 flex justify-between items-start">
                        <p className="font-medium text-base text-[#111933]">
                          {question.question}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(question.question_id);
                          }}
                          className="text-[#111933] hover:text-[#111933] mr-6 flex items-center"
                        >
                          <FaTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {currentQuestions.length > 0 && (
                  <div className="flex justify-center absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <Pagination
                      count={Math.ceil(
                        currentQuestions.length / getItemsPerPage()
                      )}
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
                  </div>
                )}
              </>
            )}
            {deleting && (
              <div className="flex justify-center items-center mt-4">
                <Loader2 className="animate-spin" size={24} />
              </div>
            )}
            {deleteError && (
              <div className="text-red-500 text-center mt-4">{deleteError}</div>
            )}
            {view === "details" && selectedQuestion && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="z-[1000] bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
                  <TestQuestionDetails
                    selectedQuestion={selectedQuestion}
                    setSelectedQuestion={setSelectedQuestion}
                    setView={setView}
                  />
                </div>
              </div>
            )}
            {showConfirmModal && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                style={{ zIndex: 10000 }}
              >
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                  <p className="text-lg font-medium text-gray-900">
                    Are you sure you want to delete this question?
                  </p>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleCancelDelete}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default McqTestQuestionList;
