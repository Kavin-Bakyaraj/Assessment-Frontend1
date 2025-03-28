import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Pagination from '@mui/material/Pagination';
import { MdDownloading } from "react-icons/md";
import QuestionsList from '../../../components/McqLibrary/TestLibraryQuestionlist';
import PreviewModal from '../../../components/staff/mcq/PreviewModal';
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal"; // Import the ConfirmModal component
import bg from '../../../assets/bgpattern.svg';
import { ChevronRight } from 'lucide-react';

const SelectTestQuestion = () => {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(10);
  const [selectedCurrentPage, setSelectedCurrentPage] = useState(1);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const navigate = useNavigate();
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

        const response = await axios.get(`${API_BASE_URL}/api/fetch-all-tests/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sanitizedTests = response.data.tests.map(test => ({
          ...test,
          questions: test.questions.map(question => ({
            ...question,
            tags: Array.isArray(question.tags) ? question.tags : []
          }))
        }));

        // Find the "Backend" test and set it as the default selected test
        const defaultTest = sanitizedTests.find(test => test.test_name.toLowerCase() === 'backend');

        setTests(sanitizedTests);
        if (defaultTest) {
          setSelectedTest(defaultTest); // Set the default selected test if found
        }
        setError(null);
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
    if (selectedTest) {
      setSelectedQuestions(selectedTest.questions);
    } else {
      setSelectedQuestions([]); // Reset selected questions when no test is selected
    }
  }, [selectedTest]);

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = selectedTest ? selectedTest.questions.slice(indexOfFirstQuestion, indexOfLastQuestion) : [];
  const totalPages = selectedTest ? Math.ceil(selectedTest.questions.length / questionsPerPage) : 0;

  const selectedIndexOfLastQuestion = selectedCurrentPage * questionsPerPage;
  const selectedIndexOfFirstQuestion = selectedIndexOfLastQuestion - questionsPerPage;
  const selectedCurrentQuestions = selectedQuestions.slice(selectedIndexOfFirstQuestion, selectedIndexOfLastQuestion);
  const selectedTotalPages = Math.ceil(selectedQuestions.length / questionsPerPage);

  const handleSubmit = async () => {
    if (selectedQuestions.length === 0) {
      toast.warning("Please select a test with questions to save.");
      return;
    }

    const token = localStorage.getItem("contestToken");

    try {
      const allSelectedQuestions = selectedQuestions.map(q => ({
        question_id: q.question_id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        level: q.level,
        tags: q.tags,
      }));

      await axios.post(
        `${API_BASE_URL}/api/mcq/save-questions/`,
        { questions: allSelectedQuestions },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      toast.success("Questions added successfully!");
      setTests([]);
      setSelectedTest(null);
      setSelectedQuestions([]);
      navigate('/mcq/QuestionsDashboard');
    } catch (error) {
      console.error("Error submitting questions:", error);
      toast.error("Failed to submit questions. Please try again.");
    }
  };

  const handlePreview = () => {
    if (selectedQuestions.length === 0) {
      toast.warning("Please select a test with questions to preview.");
      return;
    }
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="min-h-screen p-8 py-20 pt-28"
    style={{
            backgroundColor: "#ecf2fe",
            backgroundImage: `url(${bg})`,
            backgroundSize: "cover",
            backgroundPosition:"top",
          }}>
      <div className="h-10 px-2 ">
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
          <span onClick={() => window.history.back()} className="ccursor-pointer opacity-60 hover:scale-102 transition-all duration-100">
            Add Questions
          </span>
          <span className="flex items-center -space-x-2">
            <ChevronRight size={15} />
            <ChevronRight size={15} />
          </span>
          <span>Test Library</span>
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
      <div className="max-w-8xl bg-white border rounded-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mt-3 ml-10 py-2 text-[#111933]">Test Library</h1>
          <p className="text-[#00975] ml-12">Select a test to view and submit all questions</p>
        </div>

        {loading && <p className="text-sm text-[#00975]">Loading questions...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-2 ml-5 border space-y-4">
            <div className="bg-white rounded-lg" style={{ borderRadius: '10px' }}>
              <div className='bg-[#111933] p-2 mb-1' style={{ borderRadius: '10px' }}>
                <p className="text-lg  text-center text-white">Test Name</p>
              </div>
              {tests.map((test, testIndex) => (
                <div
                  key={test.test_id}
                  className={`p-3 cursor-pointer border flex items-center transition-colors ${
                    selectedTest?.test_id === test.test_id
                      ? 'bg-[#111933] bg-opacity-10 text-[#111933]'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTest(test)}
                >
                  <input
                    type="checkbox"
                    checked={selectedTest?.test_id === test.test_id}
                    onChange={() => {
                      if (selectedTest?.test_id === test.test_id) {
                        setSelectedTest(null); // Unselect if already selected
                      } else {
                        setSelectedTest(test); // Select the test
                      }
                    }}
                    className="mr-2"
                  />
                  <h3 className="text-md font-medium flex-1">{test.test_name}</h3>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-7 border rounded-lg w-auto space-y-4">
            {selectedTest ? (
              <>
                <div className="sticky top-4 bg-white p-2 flex items-center justify-between">
                  <div className="flex items-center flex-grow ml-4">
                    <span className="text-md text-[#111933] mr-2">
                      Total questions: {selectedTest.questions.length}
                    </span>
                  </div>
                </div>
                <QuestionsList
                  questions={selectedTest.questions}
                  loading={loading}
                  error={error}
                  currentQuestions={currentQuestions}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                  selectedQuestions={selectedQuestions}
                />
              </>
            ) : (
              <div className="bg-white p-4 shadow rounded-lg">
                <p className="text-[#00975]">Please select a test to view questions.</p>
              </div>
            )}
          </div>

          <div className="col-span-3 p-2 border rounded mr-4">
            <div className="bg-white p-4">
              <h2 className="text-sm  mb-4 text-[#111933]">Selected Questions</h2>
              {selectedCurrentQuestions.length === 0 ? (
                <p className="text-sm text-gray-600">No questions selected</p>
              ) : (
                <ul>
                  {selectedCurrentQuestions.map((question, index) => (
                    <li
                      key={index}
                      className="border border-gray-200 rounded-lg mb-2 flex items-center justify-between bg-white shadow-sm"
                    >
                      <div className="flex items-center truncate">
                        <span className="bg-[#111933] text-white font-bold py-2 px-3 rounded-l-lg mr-2">
                          {index + 1 + (selectedCurrentPage - 1) * questionsPerPage}
                        </span>
                        <span className="text-[#111933] text-sm truncate">{question.question}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {selectedQuestions.length > questionsPerPage && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    count={selectedTotalPages}
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

        <div className='w-full flex justify-between p-6'>
          {selectedQuestions.length > 0 && (
            <button
              onClick={handlePreview}
              className="mt-4 py-2 px-9 rounded-lg text-sm bg-[#111933] text-white border hover:bg-opacity-80"
            >
              Preview Selected Questions
            </button>
          )}
          {selectedQuestions.length > 0 && (
            <button
              onClick={handleSubmit}
              className="mt-4 py-2 px-9 rounded-lg text-sm bg-[#111933] text-white border hover:bg-opacity-80"
            >
              Save Selected Questions <MdDownloading className='size-5 inline-flex ml-2' />
            </button>
          )}
        </div>
      </div>

      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
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

export default SelectTestQuestion;
