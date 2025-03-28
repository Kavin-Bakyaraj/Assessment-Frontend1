import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from '@mui/material/Pagination';
import { MdDownloading } from "react-icons/md";
import { Search as SearchIcon } from "@mui/icons-material";
import FiltersSidebar from '../../../components/McqLibrary/FiltersSidebar';
import QuestionsList from '../../../components/McqLibrary/TestQuestionList';
import TotalQuestions from '../../../components/McqLibrary/TotalQuestions';
import PreviewModal from '../../../components/staff/mcq/PreviewModal';
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal"; // Import the ConfirmModal component
import bg from '../../../assets/bgpattern.svg';
import { ChevronRight } from 'lucide-react';

const BLOOMS_ORDER = [
  "L1 - Remember",
  "L2 - Understanding",
  "L3 - Apply",
  "L4 - Analyze",
  "L5 - Evaluate",
  "L6 - Create"
];

const McqLibrary = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filter, setFilter] = useState('');
  const [filters, setFilters] = useState({ level: [], tags: [], blooms: [] });
  const [availableTags, setAvailableTags] = useState([]);
  const [availableBlooms, setAvailableBlooms] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(10);
  const [selectedQuestionsPerPage] = useState(10);
  const [selectedCurrentPage, setSelectedCurrentPage] = useState(1);
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // State for modal
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('contestToken');
        if (!token) {
          alert('Unauthorized access. Please log in again.');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/api/fetch-all-questions/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sanitizedQuestions = response.data.questions.map(question => {
          let tagsArray = [];

          if (typeof question.tags === 'string') {
            tagsArray = question.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
          } else if (Array.isArray(question.tags)) {
            tagsArray = question.tags.map(tag => tag.trim()).filter(tag => tag.length > 0);
          }

          if (tagsArray.length === 0) {
            tagsArray = ["No tags"];
          }

          return {
            ...question,
            tags: tagsArray
          };
        });

        setQuestions(sanitizedQuestions);
        setFilteredQuestions(sanitizedQuestions);
        setError(null);

        const tagsSet = new Set();
        const bloomsSet = new Set();
        sanitizedQuestions.forEach(question => {
          question.tags.forEach(tag => tagsSet.add(tag));
          if (question.blooms) {
            bloomsSet.add(question.blooms);
          }
        });
        setAvailableTags(Array.from(tagsSet));
        setAvailableBlooms(Array.from(bloomsSet));
      } catch (error) {
        console.error('Error fetching questions:', error);
        setError('Failed to fetch questions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    const getFilteredQuestions = () => {
      return questions.filter(question => {
        const matchesSearch = question.question.toLowerCase().includes(filter.toLowerCase()) ||
          question.options.some(option => option.toLowerCase().includes(filter.toLowerCase()));

        const matchesLevel = filters.level.length === 0 ||
          filters.level.includes(question.level);

        const questionTags = typeof question.tags === 'string'
          ? question.tags.split(',').map(tag => tag.trim())
          : question.tags || [];
        const matchesTags = filters.tags.length === 0 ||
          filters.tags.some(tag => questionTags.includes(tag));

        const matchesBlooms = filters.blooms.length === 0 ||
          filters.blooms.includes(question.blooms);

        return matchesSearch && matchesLevel && matchesTags && matchesBlooms;
      });
    };

    const filteredQuestions = getFilteredQuestions();
    setFilteredQuestions(filteredQuestions);

    const tags = new Set();
    const blooms = new Set();

    filteredQuestions.forEach(question => {
      if (question.tags) {
        const questionTags = typeof question.tags === 'string'
          ? question.tags.split(',').map(tag => tag.trim())
          : question.tags;
        questionTags.forEach(tag => tags.add(tag));
      }
      if (question.blooms && (filters.level.length === 0 || filters.level.includes(question.level))) {
        blooms.add(question.blooms);
      }
    });

    if (filters.level.length === 0) {
      BLOOMS_ORDER.forEach(bloom => blooms.add(bloom));
    }

    const sortedBlooms = BLOOMS_ORDER.filter(bloom => blooms.has(bloom));

    setAvailableTags(Array.from(tags));
    setAvailableBlooms(sortedBlooms);
    setFilteredQuestions(filteredQuestions);
    setCurrentPage(1); // Reset to the first page when filtering
  }, [filter, filters, questions]);


  const toggleQuestionSelection = (question) => {
    setSelectedQuestions(prevSelected =>
      prevSelected.includes(question)
        ? prevSelected.filter(q => q !== question)
        : [...prevSelected, question]
    );
  };

  const toggleSelectAll = () => {
    setSelectedQuestions(selectAll ? [] : filteredQuestions);
    setSelectAll(!selectAll);
  };

  const toggleFilter = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setFilters({ level: [], tags: [], blooms: [] });
    setFilter('');
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("contestToken");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/mcq/save-questions/`,
        { questions: selectedQuestions },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      let toastMessage = "Questions added successfully!";
      let toastType = "success";

      if (response.data.duplicate_count > 0) {
        toastMessage = `${response.data.duplicate_count} duplicates found & removed!`;
        toastType = "warning";
      }

      setQuestions([]);
      setSelectedQuestions([]);

      navigate("/mcq/QuestionsDashboard", {
        state: { toastMessage, toastType },
      });
    } catch (error) {
      console.error("Error submitting questions:", error);
      toast.error("Failed to submit questions. Please try again.");
    }
  };

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  const selectedIndexOfLastQuestion = selectedCurrentPage * selectedQuestionsPerPage;
  const selectedIndexOfFirstQuestion = selectedIndexOfLastQuestion - selectedQuestionsPerPage;
  const selectedCurrentQuestions = selectedQuestions.slice(selectedIndexOfFirstQuestion, selectedIndexOfLastQuestion);
  const selectedTotalPages = Math.ceil(selectedQuestions.length / selectedQuestionsPerPage);

  const handleSelectedPageChange = (event, value) => {
    setSelectedCurrentPage(value);
  };

  const handlePreview = () => {
    if (selectedQuestions.length === 0) {
      toast.warning("Please select at least one question to preview.");
      return;
    }
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  useEffect(() => {
    const newTotalPages = Math.ceil(selectedQuestions.length / selectedQuestionsPerPage);
    if (selectedCurrentPage > newTotalPages) {
      setSelectedCurrentPage(newTotalPages > 0 ? newTotalPages : 1);
    }
  }, [selectedQuestions, selectedQuestionsPerPage]);

  return (
    <div className="min-h-screen p-8 py-16 pt-28"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}>
      <div className="h-14 px-8 pb-10 ml-7">
        <div className="flex items-center gap-2 text-[#111933] text-sm">
          <span className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100" onClick={() => setIsConfirmModalOpen(true)}>Home</span>
          <span className="flex items-center -space-x-2">
            <ChevronRight size={15} />
            <ChevronRight size={15} />
          </span>
          <span className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100" onClick={() => navigate("/mcq/details")}>
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
          <span>
            Question Library
          </span>
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
      <div className="max-w-8xl px-6 bg-white border rounded-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mt-3 ml-3 py-2 text-[#00975]">Question Library</h1>
          <p className="text-[#00975] ml-3 ">Select and preview questions from your collection</p>
          <hr className='mt-7 border border-gray-400' />
        </div>

        {loading && <p className="text-sm text-[#00975]">Loading questions...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-4 ml-5 gap-10">
          <FiltersSidebar
            filters={filters}
            toggleFilter={toggleFilter}
            clearFilters={clearFilters}
            wFull={true}
            availableTags={availableTags}
            availableBlooms={availableBlooms}
          />

          <div className="col-span-2 border rounded-lg w-auto">
            <div className="sticky top-4 bg-white p-2 flex items-center justify-between">
              <button
                onClick={toggleSelectAll}
                className="py-1 px-7 bg-[#111933] border-2 border-[#efeeee] shadow-blue-100 text-white rounded-lg hover:bg-[#111933] h-full flex items-center justify-center gap-2"
              >
                {selectAll ? 'Deselect All' : 'Select all'}
              </button>
              <div className="flex justify-end items-center rounded-lg flex-grow ml-4">
                <div className='relative rounded-3xl'>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border-2 rounded-lg py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full"
                  />
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <TotalQuestions totalQuestions={filteredQuestions.length} />
              </div>
            </div>
            {filteredQuestions.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700 mt-4">
                <strong className="font-medium">No Results: </strong>
                <span>No questions found.</span>
              </div>
            ) : (
              <QuestionsList
                questions={filteredQuestions}
                loading={loading}
                error={error}
                currentQuestions={currentQuestions}
                setSelectedQuestion={toggleQuestionSelection}
                selectedQuestions={selectedQuestions}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            )}
          </div>

          <div className="col-span-1 p-2 border rounded mr-4">
            <div className="bg-white p-4">
              <h2 className="text-md mb-4 text-[#111933]">Selected Questions</h2>
              {selectedCurrentQuestions.length === 0 ? (
                <p className="text-sm text-gray-600">No questions selected</p>
              ) : (
                <ul>
                  {selectedCurrentQuestions.map((question, index) => (
                    <li
                      key={index}
                      className="border border-gray-200 rounded-lg mb-2 flex items-center justify-between bg-white shadow-sm"
                    >
                      <div className="flex items-center">
                        <span className="bg-[#111933] text-white font-bold py-3 px-2 rounded-l-lg mr-2">
                          {index + 1 + (selectedCurrentPage - 1) * selectedQuestionsPerPage}
                        </span>
                        <span className="text-[#111933] text-sm">{question.question}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {selectedQuestions.length > selectedQuestionsPerPage && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    count={selectedTotalPages}
                    page={selectedCurrentPage}
                    onChange={handleSelectedPageChange}
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

        <div className="w-full flex justify-between p-6">
          {selectedQuestions.length > 0 && (
            <button
              onClick={handlePreview}
              className="mt-4 py-2 px-20 rounded-lg text-sm bg-[#111933] text-white border border-gray-300 hover:bg-opacity-80 ml-0"
            >
              Preview Selected Questions
            </button>
          )}
          {selectedQuestions.length > 0 && (
            <button
              onClick={handleSubmit}
              className="mt-4 py-2 px-9 rounded-lg text-sm bg-[#111933] text-white border hover:bg-opacity-80 mr-0"
            >
              Save Selected Questions <MdDownloading className="size-5 inline-flex ml-2" />
            </button>
          )}
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
    </div>
  );
};

export default McqLibrary;
