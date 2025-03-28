import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Pagination } from "@mui/material";
import { MdDownloading } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import FiltersSidebar from "../../../components/McqLibrary/FiltersSidebar";
import PreviewModal from "../../../components/staff/mcq/PreviewModal";
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal";
import bg from "../../../assets/bgpattern.svg";
import { ChevronRight } from "lucide-react";
import { withStyles } from '@mui/styles';
import Checkbox from '@mui/material/Checkbox';

const BLOOMS_ORDER = [
  "L1 - Remember",
  "L2 - Understanding",
  "L3 - Apply",
  "L4 - Analyze",
  "L5 - Evaluate",
  "L6 - Create",
];

const CustomCheckbox = withStyles({
  root: {
    color: '#fff',
    '&$checked': {
      color: '#fff',
    },
  },
  checked: {},
})((props) => <Checkbox color="default" {...props} />);

const SectionMcqLibrary = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filter, setFilter] = useState("");
  const [filters, setFilters] = useState({ level: [], tags: [], blooms: [] });
  const [availableTags, setAvailableTags] = useState([]);
  const [availableBlooms, setAvailableBlooms] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCurrentPage, setSelectedCurrentPage] = useState(1);
  const [questionsPerPage] = useState(10);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("contestToken");
        if (!token) {
          console.error("Unauthorized access. Please log in again.");
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/api/fetch-all-questions/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const sanitizedQuestions = response.data.questions.map((question) => {
          if (!question) return {};

          let tagsArray = [];
          if (question.tags) {
            if (typeof question.tags === "string") {
              tagsArray = question.tags.split(",").map((tag) => tag.trim());
            } else if (Array.isArray(question.tags)) {
              tagsArray = question.tags;
            }
          }

          return {
            ...question,
            tags: tagsArray.length > 0 ? tagsArray : ["No tags"],
          };
        });

        setQuestions(sanitizedQuestions);
        setFilteredQuestions(sanitizedQuestions);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError("Failed to fetch questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    const filteredByLevel =
      filters.level.length > 0
        ? questions.filter((q) => filters.level.includes(q.level))
        : questions;

    const tagsSet = new Set();
    const bloomsSet = new Set();
    filteredByLevel.forEach((question) => {
      if (question.tags) {
        question.tags.forEach((tag) => tagsSet.add(tag));
      }
      if (
        question.blooms &&
        (filters.level.length === 0 || filters.level.includes(question.level))
      ) {
        const bloomsArray =
          typeof question.blooms === "string"
            ? question.blooms.split(",").map((bloom) => bloom.trim())
            : Array.isArray(question.blooms)
              ? question.blooms
              : [];
        bloomsArray.forEach((bloom) => bloomsSet.add(bloom));
      }
    });

    if (filters.level.length === 0) {
      BLOOMS_ORDER.forEach((bloom) => bloomsSet.add(bloom));
    }

    const sortedBlooms = BLOOMS_ORDER.filter((bloom) => bloomsSet.has(bloom));

    setAvailableTags(Array.from(tagsSet));
    setAvailableBlooms(sortedBlooms);
  }, [questions, filters.level]);

  useEffect(() => {
    let filtered = questions;

    if (filter) {
      filtered = filtered.filter(
        (q) =>
          q.question.toLowerCase().includes(filter.toLowerCase()) ||
          q.options.some((option) =>
            option.toLowerCase().includes(filter.toLowerCase())
          )
      );
    }

    if (filters.level.length > 0) {
      filtered = filtered.filter((q) => filters.level.includes(q.level));
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter((q) =>
        q.tags.some((tag) => filters.tags.includes(tag))
      );
    }

    if (filters.blooms?.length > 0) {
      filtered = filtered.filter((q) => {
        const bloomsArray =
          typeof q.blooms === "string"
            ? q.blooms.split(",").map((bloom) => bloom.trim())
            : Array.isArray(q.blooms)
              ? q.blooms
              : [];

        return bloomsArray.some((bloom) => filters.blooms.includes(bloom));
      });
    }

    setFilteredQuestions(filtered);
    setCurrentPage(1);
  }, [filter, filters, questions]);

  const toggleQuestionSelection = (question) => {
    setSelectedQuestions((prevSelected) => {
      const newSelected = prevSelected.includes(question)
        ? prevSelected.filter((q) => q !== question)
        : [...prevSelected, question];

      if (newSelected.length !== prevSelected.length) {
        setSelectedCurrentPage(1);
      }

      return newSelected;
    });
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions([...filteredQuestions]);
      setSelectedCurrentPage(1);
    }
  };

  const toggleFilter = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((item) => item !== value)
        : [...prev[type], value],
    }));
  };

  const applyFilters = () => {
    setIsFiltersOpen(false);
    // Trigger filtering logic here if needed
  };

  const clearFilters = () => {
    setFilters({ level: [], tags: [], blooms: [] });
  };

  const handleFilterButtonClick = () => {
    if (
      filters.level.length > 0 ||
      filters.tags.length > 0 ||
      filters.blooms.length > 0
    ) {
      clearFilters();
    } else {
      setIsFiltersOpen(true);
    }
  };

  useEffect(() => {
    setSelectedCurrentPage(1);
  }, [selectedQuestions]);

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(
    indexOfFirstQuestion,
    indexOfLastQuestion
  );

  const indexOfLastSelectedQuestion = selectedCurrentPage * questionsPerPage;
  const indexOfFirstSelectedQuestion =
    indexOfLastSelectedQuestion - questionsPerPage;
  const currentSelectedQuestions = selectedQuestions.slice(
    indexOfFirstSelectedQuestion,
    indexOfLastSelectedQuestion
  );

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  const handleSubmit = () => {
    const formData = JSON.parse(
      sessionStorage.getItem("mcqAssessmentFormData")
    );
    const sections = JSON.parse(sessionStorage.getItem("sections"));

    sections[0].selectedQuestions.push(...selectedQuestions);

    sessionStorage.setItem("sections", JSON.stringify(sections));

    navigate("/mcq/combinedDashboard", {
      state: { selectedQuestions, formData },
    });
    toast.success("Questions added successfully");
  };

  return (
    <div
      className="min-h-screen p-8 py-20 pt-28"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}
    >
      <div className="h-14 pb-10 ml-4 hidden md:block">
        <div className="flex items-center gap-2 text-[#111933] text-sm">
          <span
            className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100"
            onClick={() => setIsConfirmModalOpen(true)}
          >
            Home
          </span>
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
            onClick={() => navigate("/mcq/details")}
          >
            Test Configuration
          </span>
          <span className="flex items-center -space-x-2">
            <ChevronRight size={15} />
            <ChevronRight size={15} />
          </span>
          <span
            onClick={() => window.history.back()}
            className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100"
          >
            Add Questions
          </span>
          <span className="flex items-center -space-x-2">
            <ChevronRight size={15} />
            <ChevronRight size={15} />
          </span>
          <span>Section Question Library</span>
        </div>
      </div>
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
      <div className="max-w-8xl px-4 md:px-6 bg-white border rounded-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mt-3 ml-3 py-2 text-[#00975]">
            Question Library
          </h1>
          <p className="text-[#00975] ml-3 ">
            Select and preview questions from your collection
          </p>
          <hr className="mt-7 border border-gray-400" />
        </div>

        {loading && (
          <p className="text-sm text-[#00975]">Loading questions...</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-4">
          <div className="relative md:mr-10">
            <button
              onClick={handleFilterButtonClick}
              className="md:hidden w-auto p-2 flex bg-[#111933] text-white py-2 rounded-lg mb-2"
            >
              {filters.level.length > 0 ||
                filters.tags.length > 0 ||
                filters.blooms.length > 0
                ? "Clear Filters"
                : "Filters"}
            </button>
            <div className={`rounded md:block hidden`}>
              <div className="mb-4"></div>
              <FiltersSidebar
                filters={filters}
                toggleFilter={toggleFilter}
                wFull={true}
                clearFilters={clearFilters}
                availableTags={availableTags}
                availableBlooms={availableBlooms}
              />
            </div>
          </div>

          <div className="col-span-2 rounded-lg w-full md:mr-4">
            <div className="sticky top-4 bg-white py-2 flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={toggleSelectAll}
                className="py-1 px-7 bg-[#111933] border-2 border-[#efeeee] shadow-blue-100 text-white rounded-lg hover:bg-[#111933] flex items-center justify-center gap-2 mb-2 md:mb-0"
              >
                {selectedQuestions.length === filteredQuestions.length
                  ? "Deselect All"
                  : "Select all"}
              </button>
              <div className="flex items-center border rounded-lg flex-grow md:ml-4">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="flex-grow md:px-3  py-2 text-sm  text-[#111933] md:ml-2"
                />
                <span className="text-sm text-gray-500 mr-3 md:ml-2">
                  {filteredQuestions.length} Questions
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {filteredQuestions.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700 mt-4">
                  <strong className="font-medium">No Results: </strong>
                  <span>No questions found.</span>
                </div>
              ) : (
                currentQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="flex items-center border  rounded-lg cursor-pointer transition-colors hover:border-gray-400"
                  >

                    <div className="bg-[#111933] text-white font-bold py-2 px-2 rounded-l-lg mr-2">
                    <CustomCheckbox
                      checked={selectedQuestions.includes(question)}
                      onChange={() => toggleQuestionSelection(question)}
                    />

                    </div>
                    <h3 className="font-medium text-sm md:text-base truncate py-3 px-3 text-black mb-2">
                      {question.question}
                    </h3>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-center mt-4">
              {filteredQuestions.length > 0 && (
                <Pagination
                  count={Math.ceil(filteredQuestions.length / questionsPerPage)}
                  page={currentPage}
                  onChange={(event, value) => setCurrentPage(value)}
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
            </div>

          </div>

          <div className="col-span-1 p-2 border rounded md:mr-4">
            <div className="bg-white p-4">
              <h2 className="text-md mb-4 text-[#111933]">
                Selected Questions
              </h2>
              {currentSelectedQuestions.length === 0 ? (
                <p className="text-sm text-gray-600">No questions selected</p>
              ) : (
                <ul>
                  {currentSelectedQuestions.map((question, selectedIndex) => (
                    <li
                      key={selectedIndex}
                      className="border border-gray-200 rounded-lg mb-2 flex items-center justify-between bg-white shadow-sm"
                    >
                      <div className="flex items-center truncate">
                        <span className="bg-[#111933] text-white font-bold py-3 px-3 rounded-l-lg mr-2">
                          {selectedIndex +
                            1 +
                            (selectedCurrentPage - 1) * questionsPerPage}
                        </span>
                        <span className="text-[#111933] text-sm truncate">
                          {question.question}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {selectedQuestions.length > questionsPerPage && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    count={Math.ceil(
                      selectedQuestions.length / questionsPerPage
                    )}
                    page={selectedCurrentPage}
                    onChange={(event, value) => setSelectedCurrentPage(value)}
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
            </div>
          </div>
        </div>
        <div className="w-full flex flex-col md:flex-row justify-between p-4 md:p-6 gap-4">
          <button
            onClick={handlePreview}
            className={`mt-4 py-2 px-14 rounded-lg text-sm bg-[#111933] text-white border border-gray-300 ${selectedQuestions.length === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
              }`}
            disabled={selectedQuestions.length === 0}
          >
            Preview Selected Questions
          </button>
          <button
            onClick={handleSubmit}
            className="mt-4 py-2 px-9 rounded-lg text-sm bg-[#111933] text-white border text-[#00975] hover:bg-opacity-80"
          >
            Save Selected Questions{" "}
            <MdDownloading className="size-5 inline-flex ml-2" />
          </button>
        </div>
      </div>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        selectedQuestions={selectedQuestions}
        setSelectedQuestions={setSelectedQuestions}
      />
      <ConfirmModal
        isConfirmModalOpen={isConfirmModalOpen}
        setIsConfirmModalOpen={setIsConfirmModalOpen}
        targetPath="/staffdashboard"
      />

      {isFiltersOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center md:hidden"
          onClick={() => setIsFiltersOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-4 w-full max-w-md h-3/4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between relative items-center mb-4">
              <button
                onClick={applyFilters}
                className="bg-[#111933] text-white py-2 px-4 rounded-lg"
              >
                Apply Filters
              </button>
              <button
                onClick={() => setIsFiltersOpen(false)}
                className="text-gray-600 right-0 absolute bottom-5 hover:text-gray-800"
              >
                &times;
              </button>
            </div>
            <FiltersSidebar
              filters={filters}
              toggleFilter={toggleFilter}
              wFull={true}
              clearFilters={clearFilters}
              availableTags={availableTags}
              availableBlooms={availableBlooms}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionMcqLibrary;
