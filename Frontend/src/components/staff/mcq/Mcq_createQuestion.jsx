import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { RiFlagFill } from "react-icons/ri";
import { v4 as uuidv4 } from "uuid";
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal";
import bg from '../../../assets/bgpattern.svg';

const Mcq_createQuestion = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("");
  const [level, setLevel] = useState("");
  const [blooms, setBlooms] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [questionList, setQuestionList] = useState([]);
  const [isNewQuestion, setIsNewQuestion] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [showFinishPopup, setShowFinishPopup] = useState(false);
  const [optionErrors, setOptionErrors] = useState({});
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showQuestionList, setShowQuestionList] = useState(true);
  const formRef = useRef(null);

  const [singleQuestionData, setSingleQuestionData] = useState({
    question: "",
    options: ["", "", "", ""],
    answer: "",
    level: "",
    blooms: "",
    tags: [],
    question_id: "",
  });

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      if (isMobile) {
        setShowQuestionList(false);
      } else {
        setShowQuestionList(true);
      }
    };

    checkMobileView();
    window.addEventListener("resize", checkMobileView);

    return () => {
      window.removeEventListener("resize", checkMobileView);
    };
  }, []);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const handleSingleQuestionInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("option")) {
      const optionIndex = name.charCodeAt(name.length - 1) - 65; // Convert 'A', 'B', etc. to 0, 1, etc.
      const newOptions = [...singleQuestionData.options];
      newOptions[optionIndex] = value;
      setSingleQuestionData((prev) => ({ ...prev, options: newOptions }));
    } else if (name === "tags") {
      // Handle tags as an array
      const tagsArray = value.split(",").map((tag) => tag.trim());
      setSingleQuestionData((prev) => ({ ...prev, tags: tagsArray }));
      // Also update the main tags state to keep them in sync
      setTags(tagsArray);
    } else {
      setSingleQuestionData((prev) => ({ ...prev, [name]: value }));
    }
    setHasUnsavedChanges(true);

    // Check for duplicate options
    if (name.startsWith("option")) {
      const filledOptions = singleQuestionData.options.filter(
        (option) => option.trim() !== ""
      );
      const uniqueOptions = new Set(filledOptions);

      if (
        filledOptions.length >= 2 &&
        uniqueOptions.size !== filledOptions.length
      ) {
        const duplicates = {};
        const seen = new Set();
        filledOptions.forEach((option, index) => {
          if (seen.has(option)) {
            duplicates[index] = "This option is a duplicate.";
          } else if (option) {
            seen.add(option);
          }
        });
        setOptionErrors(duplicates);
      } else {
        setOptionErrors({});
      }
    }
  };

  // Clear local storage and reset state when the component mounts
  useEffect(() => {
    localStorage.removeItem("mcqCreateQuestionFormData");
    localStorage.removeItem("mcqQuestionList");
    localStorage.removeItem("mcqCurrentQuestionIndex");
    resetFormForNewQuestion();
  }, []);

  const handleInputChange = (setter) => (e) => {
    let inputText = e.target.value;
    const words = inputText.split(/\s+/).filter(Boolean);
    let processedWords = [];

    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      if (word.length > 25) {
        word = word.substring(0, 25);
      }
      processedWords.push(word);
    }

    const processedText = processedWords.join(" ");

    if (inputText.endsWith(" ") && processedWords.length < 30) {
      setter(processedText + " ");
    } else {
      setter(processedText);
    }

    setHasUnsavedChanges(true);
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
    setHasUnsavedChanges(true);

    const filledOptions = updatedOptions.filter(
      (option) => option.trim() !== ""
    );
    const uniqueOptions = new Set(filledOptions);

    if (
      filledOptions.length >= 2 &&
      uniqueOptions.size !== filledOptions.length
    ) {
      const duplicates = {};
      const seen = new Set();
      filledOptions.forEach((option, index) => {
        if (seen.has(option)) {
          duplicates[index] = "This option is a duplicate.";
        } else if (option) {
          seen.add(option);
        }
      });
      setOptionErrors(duplicates);
    } else {
      setOptionErrors({});
    }
  };

  const handleTagChange = (e) => {
    setTags(e.target.value.split(",").map((tag) => tag.trim()));
    setHasUnsavedChanges(true);
  };

  const handleNavigation = (navigateFunction) => {
    if (hasUnsavedChanges) {
      toast.info(
        <div className="flex flex-col items-center w-full">
          <div className="text-blue-600 mb-3 md:mb-4">
            <svg
              className="w-8 h-8 md:w-12 md:h-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-base md:text-lg font-medium text-[#111933] mb-4 md:mb-6 text-center px-2">
            Are you sure you want to leave without saving?
          </p>
          <div className="flex justify-center gap-3 md:gap-8 w-full">
            <button
              className="px-4 md:px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm md:text-base"
              onClick={() => {
                navigateFunction();
                toast.dismiss();
              }}
            >
              Yes
            </button>
            <button
              className="px-4 md:px-8 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium text-sm md:text-base"
              onClick={() => toast.dismiss()}
            >
              No
            </button>
          </div>
        </div>,
        {
          position: "top-center",
          className:
            "!fixed !top-1/2 !left-1/2 !transform !-translate-x-1/2 !-translate-y-1/2",
          style: {
            background: "white",
            padding: "16px 20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            width: "auto",
            minWidth: "280px",
            maxWidth: "90vw",
            margin: 0,
            zIndex: 9999,
          },
        }
      );
    } else {
      navigateFunction();
    }
  };

  const handleFinish = () => {
    setShowFinishPopup(true);
  };

  const confirmFinish = async () => {
    if (questionList.length === 0) {
      toast.error("Please add at least one question before finishing");
      return;
    }

    try {
      const token = localStorage.getItem("contestToken");
      if (!token) {
        toast.error("Unauthorized access. Please log in again.");
        return;
      }

      const questionsData = {
        questions: questionList.map((q) => ({
          question: q.question,
          options: q.options.filter((opt) => opt.trim() !== ""),
          correctAnswer: q.correctAnswer,
          level: q.level,
          blooms: q.blooms,
          tags: q.tags || [],
        })),
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/mcq/save-questions/`,
        questionsData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        setHasUnsavedChanges(false);
        localStorage.removeItem("mcqCreateQuestionFormData");
        localStorage.removeItem("mcqQuestionList");
        localStorage.removeItem("mcqCurrentQuestionIndex");

        toast.success("Contest finished successfully!");
        navigate("/mcq/QuestionsDashboard");
      }
    } catch (error) {
      console.error("Error saving questions:", error);
      toast.error("Failed to save questions. Please try again.");
    }
  };

  const loadQuestionIntoForm = (questionData) => {
    setIsNewQuestion(false);
    setQuestion(questionData.question || "");
    const questionOptions = questionData.options || [];
    const optionsToFill = [...questionOptions];
    while (optionsToFill.length < 4) {
      optionsToFill.push("");
    }
    setOptions(optionsToFill.slice(0, 4));
    setAnswer(questionData.correctAnswer || "");
    setLevel(questionData.level || "");
    setBlooms(questionData.blooms || "");
    setTags(questionData.tags || []);
    setHasUnsavedChanges(false);

    // Ensure tags are correctly set
    const tagsArray = questionData.tags || [];
    setTags(tagsArray);
    setSingleQuestionData((prev) => ({ ...prev, tags: tagsArray }));

    setHasUnsavedChanges(false);

    // Scroll to top of form on mobile
    if (isMobileView && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // In the resetFormForNewQuestion function
  const resetFormForNewQuestion = (clearStorage = true) => {
    setIsNewQuestion(true);
    setQuestion("");
    setOptions(["", "", "", ""]);
    setAnswer("");
    setLevel("");
    setBlooms("");
    setTags([]);
    setSingleQuestionData((prev) => ({ ...prev, tags: [] }));
    setHasUnsavedChanges(false);
    setOptionErrors({});

    if (clearStorage) {
      localStorage.removeItem("mcqCreateQuestionFormData");
    }
  };

  const handleSaveClick = () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const filledOptions = options.filter((option) => option.trim() !== "");
    if (filledOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }

    if (!answer) {
      toast.error("Please select the correct answer");
      return;
    }

    if (!level) {
      toast.error("Please select the difficulty level");
      return;
    }

    if (!blooms) {
      toast.error("Please select the Blooms level");
      return;
    }

    if (Object.keys(optionErrors).length > 0) {
      toast.error("Please fix the duplicate options before saving.");
      return;
    }

    const updatedQuestion = {
      question,
      options: filledOptions,
      correctAnswer: answer,
      level,
      blooms,
      tags: singleQuestionData.tags, // Ensure tags are saved correctly
    };

    let newQuestionList;

    if (isNewQuestion) {
      // Check for duplicates only when adding a new question
      const isDuplicate = questionList.some(
        (q) => q.question === updatedQuestion.question
      );
      if (isDuplicate) {
        toast.error("This question is already saved.");
        return;
      }

      // Add new question
      newQuestionList = [...questionList, updatedQuestion];
      setCurrentQuestionIndex(newQuestionList.length);
      toast.success("Question saved successfully!");
    } else {
      // Update existing question
      newQuestionList = [...questionList];
      newQuestionList[currentQuestionIndex] = updatedQuestion;
      toast.success("Question updated successfully!");
      resetFormForNewQuestion(false);
    }

    setQuestionList(newQuestionList);
    setHasUnsavedChanges(false);

    // If it was a new question, reset the form for another new question
    if (isNewQuestion) {
      resetFormForNewQuestion(false);
    }

    // Show question list on mobile after saving
    if (isMobileView) {
      setShowQuestionList(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      loadQuestionIntoForm(questionList[prevIndex]);
    } else if (currentQuestionIndex === 0) {
      loadQuestionIntoForm(questionList[0]);
    }
  };

  const handleNextQuestion = () => {
    if (hasUnsavedChanges) {
      setShowSavePopup(true);
    } else {
      if (currentQuestionIndex < questionList.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        loadQuestionIntoForm(questionList[nextIndex]);
      } else {
        setCurrentQuestionIndex(questionList.length);
        resetFormForNewQuestion();
      }
    }
  };

  const handleDeleteOption = (index) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    toast.success("Option deleted successfully!");
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const handleDeleteQuestion = (index, e) => {
    if (e) {
      e.stopPropagation();
    }

    const newQuestionList = questionList.filter((_, i) => i !== index);
    setQuestionList(newQuestionList);
    localStorage.setItem("mcqQuestionList", JSON.stringify(newQuestionList));

    // If the deleted question is the current one, keep the form as is
    if (currentQuestionIndex === index) {
      setIsNewQuestion(true);
    } else if (currentQuestionIndex > index) {
      // Adjust the current question index if necessary
      setCurrentQuestionIndex((prev) => prev - 1);
    }

    // Prevent the form from being updated with the deleted question's data
    if (currentQuestionIndex >= newQuestionList.length) {
      setCurrentQuestionIndex(newQuestionList.length - 1);
    }

    // Clear all input fields after deleting a question
    resetFormForNewQuestion(false);

    toast.success("Question deleted successfully!");
  };

  const toggleQuestionList = () => {
    setShowQuestionList(!showQuestionList);
  };

  const renderOptions = () => {
    // For mobile view, render options in a single column
    if (isMobileView) {
      return (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="text-lg font-medium text-[#111933]">
              Choices 
            </label>
            {options.length < 4 && (
              <button
                className="text-[#111933] hover:text-gray-700 flex items-center gap-1"
                onClick={handleAddOption}
              >
                <Plus size={16} /> Add Option
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {options.map((option, index) => (
              <div className="flex flex-col items-stretch w-full" key={index}>
                <div className="flex items-center relative">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#111933] text-white font-medium rounded-lg mr-2 p-0  md:p-0">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder="Enter option"
                    className="flex-grow border border-gray-300 rounded-lg p-2 md:pr-10 text-[#111933] focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      className="absolute right-2 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteOption(index)}
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 18 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16.6645 3.07789C16.9223 3.07789 17.1696 3.17994 17.352 3.3616C17.5343 3.54327 17.6367 3.78965 17.6367 4.04656C17.6367 4.30347 17.5343 4.54985 17.352 4.73151C17.1696 4.91317 16.9223 5.01523 16.6645 5.01523H15.6923L15.6894 5.084L14.7823 17.7455C14.7474 18.2343 14.5278 18.6917 14.1679 19.0257C13.808 19.3596 13.3345 19.5453 12.8427 19.5453H4.92977C4.43797 19.5453 3.96442 19.3596 3.60452 19.0257C3.24462 18.6917 3.02511 18.2343 2.99019 17.7455L2.08311 5.08497L2.08116 5.01523H1.10894C0.851092 5.01523 0.603803 4.91317 0.421476 4.73151C0.239149 4.54985 0.136719 4.30347 0.136719 4.04656C0.136719 3.78965 0.239149 3.54327 0.421476 3.3616C0.603803 3.17994 0.851092 3.07789 1.10894 3.07789H16.6645ZM10.8312 0.171875C11.089 0.171875 11.3363 0.273931 11.5186 0.455592C11.701 0.637253 11.8034 0.883638 11.8034 1.14055C11.8034 1.39745 11.701 1.64384 11.5186 1.8255C11.3363 2.00716 11.089 2.10922 10.8312 2.10922H6.94227C6.68442 2.10922 6.43714 2.00716 6.25481 1.8255C6.07248 1.64384 5.97005 1.39745 5.97005 1.14055C5.97005 0.883638 6.07248 0.637253 6.25481 0.455592C6.43714 0.273931 6.68442 0.171875 6.94227 0.171875H10.8312Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {optionErrors[index] && (
                  <span className="text-red-500 text-sm p-2">
                    {optionErrors[index]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // For desktop view, render options in two columns
    const leftColumnOptions = options.slice(0, 2);
    const rightColumnOptions = options.slice(2);

    const renderOptionInput = (option, index) => (
      <div className="flex flex-col items-stretch w-full mb-3" key={index}>
        <div className="flex items-center relative">
          <div className="flex items-center justify-center w-10 h-10 bg-[#111933] text-white font-medium rounded-lg mr-2">
            {String.fromCharCode(65 + index)}
          </div>
          <input
            type="text"
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder="Enter option"
            className="flex-grow border border-gray-300 rounded-lg p-2 pr-10 text-[#111933] focus:outline-none focus:ring-2 focus:ring-black transition-all"
          />
          {options.length > 2 && (
            <button
              className="absolute right-2 text-red-500 hover:text-red-700"
              onClick={() => handleDeleteOption(index)}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 18 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.6645 3.07789C16.9223 3.07789 17.1696 3.17994 17.352 3.3616C17.5343 3.54327 17.6367 3.78965 17.6367 4.04656C17.6367 4.30347 17.5343 4.54985 17.352 4.73151C17.1696 4.91317 16.9223 5.01523 16.6645 5.01523H15.6923L15.6894 5.084L14.7823 17.7455C14.7474 18.2343 14.5278 18.6917 14.1679 19.0257C13.808 19.3596 13.3345 19.5453 12.8427 19.5453H4.92977C4.43797 19.5453 3.96442 19.3596 3.60452 19.0257C3.24462 18.6917 3.02511 18.2343 2.99019 17.7455L2.08311 5.08497L2.08116 5.01523H1.10894C0.851092 5.01523 0.603803 4.91317 0.421476 4.73151C0.239149 4.54985 0.136719 4.30347 0.136719 4.04656C0.136719 3.78965 0.239149 3.54327 0.421476 3.3616C0.603803 3.17994 0.851092 3.07789 1.10894 3.07789H16.6645ZM10.8312 0.171875C11.089 0.171875 11.3363 0.273931 11.5186 0.455592C11.701 0.637253 11.8034 0.883638 11.8034 1.14055C11.8034 1.39745 11.701 1.64384 11.5186 1.8255C11.3363 2.00716 11.089 2.10922 10.8312 2.10922H6.94227C6.68442 2.10922 6.43714 2.00716 6.25481 1.8255C6.07248 1.64384 5.97005 1.39745 5.97005 1.14055C5.97005 0.883638 6.07248 0.637253 6.25481 0.455592C6.43714 0.273931 6.68442 0.171875 6.94227 0.171875H10.8312Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}
        </div>
        {optionErrors[index] && (
          <span className="text-red-500 text-sm p-2">
            {optionErrors[index]}
          </span>
        )}
      </div>
    );

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="text-lg font-medium text-[#111933]">Choices <span className="text-red-500">*</span></label>
          {options.length < 4 && (
            <button
              className="text-[#111933] hover:text-gray-700 flex items-center gap-1"
              onClick={handleAddOption}
            >
              <Plus size={16} /> Add Option
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            {leftColumnOptions.map((option, index) =>
              renderOptionInput(option, index)
            )}
          </div>
          <div>
            {rightColumnOptions.map((option, index) =>
              renderOptionInput(option, index + 2)
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render breadcrumb navigation
  const renderBreadcrumbs = () => {
    return (
      <div className="hidden md:block">
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

          
            <span>Create Questions</span>
         
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-10 md:py-20 md:pt-28 px-4 md:px-14"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={true}
        pauseOnHover={true}
        theme="light"
        style={{
          top: "20px",
          right: "20px",
          transform: "none",
        }}
        toastStyle={{
          background: "white",
          color: "black",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      />
      <div className="h-auto md:pb-5 overflow-x-auto">
        {renderBreadcrumbs()}
      </div>
      <div className="max-w-[1500px] mx-auto bg-white p-4 md:p-8 rounded-xl shadow-lg">
        <header className="mb-4 flex justify-between items-center">
          <h2 className="text-xl md:text-3xl font-bold text-[#111933]">
            Create Questions
          </h2>

          {isMobileView && (
            <button
              onClick={toggleQuestionList}
              className="flex items-center gap-1 bg-[#111933] text-white py-2 px-3 rounded-lg text-sm"
            >
              {showQuestionList ? "Hide Questions" : "Show Questions"}
              {showQuestionList ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>
          )}
        </header>

        <div className="mb-6 pb-4 text-sm md:text-lg border-b-2 text-[#111933]">
          Choose how you'd like to add questions to your assessment. Select the
          method that works best for you to quickly build your test.
        </div>

        {/* Mobile Question List Toggle */}
        {isMobileView && showQuestionList && (
          <div className="mb-6 border-2 p-4 rounded-xl bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-[#111933]">
                Question List ({questionList.length})
              </h3>
              <button onClick={toggleQuestionList} className="text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div
              className="max-h-[300px] overflow-y-auto pr-1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E1 #F1F5F9",
              }}
            >
              {questionList.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No questions added yet
                </div>
              ) : (
                <ul className="space-y-3">
                  {questionList.map((q, index) => (
                    <li
                      key={index}
                      className={`p-3 bg-white border rounded-lg flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition-all ${currentQuestionIndex === index
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200"
                        }`}
                      onClick={() => {
                        setCurrentQuestionIndex(index);
                        loadQuestionIntoForm(q);
                        if (isMobileView) {
                          setShowQuestionList(false);
                        }
                      }}
                    >
                      <div className="flex items-center w-full">
                        <span className="rounded-md bg-[#111933] py-2 px-3 text-white text-sm mr-3">
                          {index + 1}
                        </span>
                        <span className="flex-1 text-black font-medium truncate">
                          {q.question || "No question text"}
                        </span>
                      </div>
                      <button
                        className="ml-2 text-red-500 hover:text-red-700 p-1"
                        onClick={(e) => handleDeleteQuestion(index, e)}
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 18 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M16.6645 3.07789C16.9223 3.07789 17.1696 3.17994 17.352 3.3616C17.5343 3.54327 17.6367 3.78965 17.6367 4.04656C17.6367 4.30347 17.5343 4.54985 17.352 4.73151C17.1696 4.91317 16.9223 5.01523 16.6645 5.01523H15.6923L15.6894 5.084L14.7823 17.7455C14.7474 18.2343 14.5278 18.6917 14.1679 19.0257C13.808 19.3596 13.3345 19.5453 12.8427 19.5453H4.92977C4.43797 19.5453 3.96442 19.3596 3.60452 19.0257C3.24462 18.6917 3.02511 18.2343 2.99019 17.7455L2.08311 5.08497L2.08116 5.01523H1.10894C0.851092 5.01523 0.603803 4.91317 0.421476 4.73151C0.239149 4.54985 0.136719 4.30347 0.136719 4.04656C0.136719 3.78965 0.239149 3.54327 0.421476 3.3616C0.603803 3.17994 0.851092 3.07789 1.10894 3.07789H16.6645ZM10.8312 0.171875C11.089 0.171875 11.3363 0.273931 11.5186 0.455592C11.701 0.637253 11.8034 0.883638 11.8034 1.14055C11.8034 1.39745 11.701 1.64384 11.5186 1.8255C11.3363 2.00716 11.089 2.10922 10.8312 2.10922H6.94227C6.68442 2.10922 6.43714 2.00716 6.25481 1.8255C6.07248 1.64384 5.97005 1.39745 5.97005 1.14055C5.97005 0.883638 6.07248 0.637253 6.25481 0.455592C6.43714 0.273931 6.68442 0.171875 6.94227 0.171875H10.8312Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <main
            ref={formRef}
            className="col-span-1 md:col-span-8 border-2 p-4 md:p-6 rounded-xl bg-white shadow-sm"
          >
            <div className="mb-6">
              <label className="text-lg font-medium text-[#111933] mb-2 block">
                Question <span className="text-red-500">*</span>
              </label>
              <textarea
                value={question}
                onChange={handleInputChange(setQuestion)}
                className="w-full border rounded-lg p-4 text-[#111933] focus:outline-none focus:ring-2 focus:ring-black transition-all overflow-y-auto resize-none"
                placeholder="Enter your question here"
                rows={3}
              />
            </div>

            {renderOptions()}

            <div className="mb-6 flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <label className="text-lg font-medium text-[#111933] mb-2 block">
                  Select Correct Answer <span className="text-red-500">*</span>
                </label>
                <select
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full border rounded-lg p-2 text-[#111933]/70 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                >
                  <option value="">Select the correct option</option>
                  {options
                    .filter((option) => option.trim() !== "")
                    .map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-lg font-medium text-[#111933] mb-2 block">
                  Difficulty Level<span className="text-red-500">*</span>
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full border rounded-lg p-2 text-[#111933]/70 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                >
                  <option value="">Select difficulty level</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="mb-6 flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <label className="text-lg font-medium text-[#111933] mb-2 block">
                  Blooms <span className="text-red-500">*</span>
                </label>
                <select
                  value={blooms}
                  onChange={(e) => setBlooms(e.target.value)}
                  className="w-full border rounded-lg p-2 text-[#111933]/70 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                >
                  <option value="">Select Blooms level</option>
                  <option value="L1 - Remember">L1 - Remember</option>
                  <option value="L2 - Understanding">L2 - Understanding</option>
                  <option value="L3 - Apply">L3 - Apply</option>
                  <option value="L4 - Analyze">L4 - Analyze</option>
                  <option value="L5 - Evaluate">L5 - Evaluate</option>
                  <option value="L6 - Create">L6 - Create</option>
                </select>
              </div>
              <div className="flex-1">
  <label className="text-lg font-medium text-[#111933] mb-2 block">
    Tags <span className="text-red-500">*</span>
  </label>
  <div className="relative border rounded-lg focus-within:ring-2 focus-within:ring-black transition-all">
    {/* Tags and input field container with fixed height */}
    <div className="flex flex-wrap items-center gap-1 p-2 h-full overflow-y-auto">
      {singleQuestionData.tags.map((tag, index) => (
        <div 
          key={index} 
          className="inline-flex items-center bg-[#111933] text-white text-xs px-1.5 py-0.5 rounded-md max-w-[120px] overflow-hidden"
        >
          <span className="truncate">{tag}</span>
          <button 
            type="button"
            onClick={() => {
              const newTags = singleQuestionData.tags.filter((_, i) => i !== index);
              setSingleQuestionData(prev => ({ ...prev, tags: newTags }));
              setTags(newTags);
              setHasUnsavedChanges(true);
            }}
            className="ml-1 flex-shrink-0 hover:text-red-300 focus:outline-none"
          >
            <X size={10} />
          </button>
        </div>
      ))}
      
      {/* Input field with fixed height */}
      <input
        type="text"
        name="tagsInput"
        value={tagInput || ""}
        onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !singleQuestionData.tags.includes(newTag)) {
              if (singleQuestionData.tags.length >= 3) {
                toast.info("Maximum of 3 tags allowed", {
                  position: "top-right",
                  autoClose: 2000
                });
                return;
              }
              
              const newTags = [...singleQuestionData.tags, newTag];
              setSingleQuestionData(prev => ({ ...prev, tags: newTags }));
              setTags(newTags);
              setTagInput('');
              setHasUnsavedChanges(true);
            }
          }
        }}
        className="flex-1 min-w-[100px] h-[26px] px-1 border-none outline-none text-[#111933] bg-transparent"
        disabled={singleQuestionData.tags.length >= 3}
      />
    </div>
    
    {/* Floating label that appears at the border */}
    <label 
      className={`absolute pointer-events-none transition-all duration-300
        ${(tagInput || document.activeElement?.name === "tagsInput" || singleQuestionData.tags.length > 0) 
          ? "top-0 left-2 transform -translate-y-1/2 scale-75 text-[#111933] bg-white px-1 z-10"
          : "top-1/2 left-2 transform -translate-y-1/2 text-gray-500"
        }
      `}
    >
      {singleQuestionData.tags.length >= 3 
        ? "Maximum tags reached" 
        : "Enter tag and press Enter"}
    </label>
  </div>
</div>
            </div>
          </main>

          {!isMobileView && (
            <aside className="col-span-1 md:col-span-4 border-2 p-4 md:p-6 rounded-xl bg-white shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[#111933]">
                  Question List ({questionList.length})
                </h3>
              </div>
              <div
                className="flex-grow overflow-y-auto pr-1"
                style={{
                  maxHeight: "500px",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#CBD5E1 #F1F5F9",
                }}
              >
                {questionList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No questions added yet
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {questionList.map((q, index) => (
                      <li
                        key={index}
                        className={`p- bg-white border rounded-lg flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition-all ${currentQuestionIndex === index
                            ? "border-black ring-2 ring-gray-200"
                            : "border-gray-200"
                          }`}
                        onClick={() => {
                          setCurrentQuestionIndex(index);
                          loadQuestionIntoForm(q);
                        }}
                      >
                        <div className="flex items-center w-full">
                          <span className="rounded-l-md bg-[#111933] py-2 px-3 text-white text-sm mr-3">
                            {index + 1}
                          </span>
                          <span className="flex-1 text-black font-medium truncate">
                            {q.question || "No question text"}
                          </span>
                        </div>
                        <button
                          className="ml-2 text-red-500 hover:text-red-700 p-1"
                          onClick={(e) => handleDeleteQuestion(index, e)}
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 18 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16.6645 3.07789C16.9223 3.07789 17.1696 3.17994 17.352 3.3616C17.5343 3.54327 17.6367 3.78965 17.6367 4.04656C17.6367 4.30347 17.5343 4.54985 17.352 4.73151C17.1696 4.91317 16.9223 5.01523 16.6645 5.01523H15.6923L15.6894 5.084L14.7823 17.7455C14.7474 18.2343 14.5278 18.6917 14.1679 19.0257C13.808 19.3596 13.3345 19.5453 12.8427 19.5453H4.92977C4.43797 19.5453 3.96442 19.3596 3.60452 19.0257C3.24462 18.6917 3.02511 18.2343 2.99019 17.7455L2.08311 5.08497L2.08116 5.01523H1.10894C0.851092 5.01523 0.603803 4.91317 0.421476 4.73151C0.239149 4.54985 0.136719 4.30347 0.136719 4.04656C0.136719 3.78965 0.239149 3.54327 0.421476 3.3616C0.603803 3.17994 0.851092 3.07789 1.10894 3.07789H16.6645ZM10.8312 0.171875C11.089 0.171875 11.3363 0.273931 11.5186 0.455592C11.701 0.637253 11.8034 0.883638 11.8034 1.14055C11.8034 1.39745 11.701 1.64384 11.5186 1.8255C11.3363 2.00716 11.089 2.10922 10.8312 2.10922H6.94227C6.68442 2.10922 6.43714 2.00716 6.25481 1.8255C6.07248 1.64384 5.97005 1.39745 5.97005 1.14055C5.97005 0.883638 6.07248 0.637253 6.25481 0.455592C6.43714 0.273931 6.68442 0.171875 6.94227 0.171875H10.8312Z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between mt-6 md:mt-4">
          <div className="md:w-2/3 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 mb-4 md:mb-0">
          <button
  onClick={handlePreviousQuestion}
  className={`w-full md:w-auto py-2 px-4 bg-white border border-[#111933] font-semibold text-[#111933] rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors ${
    questionList.length === 0 ? "hidden" : ""
  }`}
>
  <ArrowLeft size={18} />
  Previous
</button>

            <button
              onClick={handleSaveClick}
              className="w-full md:w-auto py-2 px-4 border bg-[#ffcc00]/40 border-[#ffcc00] font-semibold text-[#111933] rounded-lg flex items-center justify-center gap-2 hover:bg-[#ffcc00]/50 transition-colors"
            >
              <Save size={18} />
              Save
            </button>

            <button
              onClick={handleNextQuestion}
              className="w-full md:w-auto bg-[#111933] text-white py-2 px-4 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-[#1e293b] transition-colors"
            >
              Next <ArrowRight size={18} />
            </button>
          </div>

          <div className="flex justify-center md:justify-end">
            <button
              onClick={handleFinish}
              className="w-full md:w-auto py-2 px-4 bg-[#E1F9F0] border border-[#004434] font-semibold text-[#004434] rounded-lg flex items-center justify-center gap-2 hover:bg-[#d0f4e6] transition-colors"
            >
              <RiFlagFill size={18} />
              Finish
            </button>
          </div>
        </div>
      </div>

      {showSavePopup && (
        <div className="fixed inset-0 bg-[#0000005a] flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 md:p-8 w-[90%] md:w-[400px] max-w-full rounded-xl shadow-lg text-center">
            <div className="text-blue-600 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-[#111933]">
              Are you sure you want to leave without saving?
            </h2>
            <div className="flex justify-center mt-6 md:mt-8 space-x-4">
              <button
                className="px-4 md:px-8 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                onClick={() => setShowSavePopup(false)}
              >
                No
              </button>
              <button
                className="px-4 md:px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                onClick={() => {
                  confirmFinish();
                  setShowSavePopup(false);
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinishPopup && (
        <div className="fixed inset-0 bg-[#0000005a] flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 md:p-8 w-[90%] md:w-[400px] max-w-full rounded-xl shadow-lg text-center">
            <div className="text-[#111933] mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-[#111933]">
              Are you sure you want to finish?
            </h2>
            <div className="flex justify-center mt-6 md:mt-8 space-x-4">
              <button
                className="px-4 md:px-8 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                onClick={() => setShowFinishPopup(false)}
              >
                No
              </button>
              <button
                className="px-4 md:px-8 py-2 bg-[#111933] hover:bg-[#111933dc] text-white rounded-lg transition-colors"
                onClick={() => {
                  confirmFinish();
                  setShowFinishPopup(false);
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isConfirmModalOpen={isConfirmModalOpen}
        setIsConfirmModalOpen={setIsConfirmModalOpen}
        targetPath="/staffdashboard"
      />
    </div>
  );
};

export default Mcq_createQuestion;
