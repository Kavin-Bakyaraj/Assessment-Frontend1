import React, { useState, useEffect } from "react";
import { X, RefreshCw, SquarePen, ChevronRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal";
import bg from "../../../assets/bgpattern.svg";

const AIResponseDisplay = () => {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    level: "",
    explanation: "",
  });
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

  const MAX_QUESTION_LENGTH = 150;
  const MAX_OPTION_LENGTH = 30;

  const location = useLocation();
  const navigate = useNavigate();
  const { questions: initialQuestions = [], formInputs = {} } =
    location.state || {};
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    if (initialQuestions.length === 0) {
      navigate("/mcq/aigenerator");
    } else {
      setQuestions(initialQuestions);
    }
  }, [initialQuestions, navigate]);

  const handleSelectQuestion = (index) => {
    setSelectedQuestions((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map((_, index) => index));
    }
  };

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question);
    setEditingQuestion({
      question: question.question || "",
      options: [...question.options] || ["", "", "", ""],
      correctAnswer: question.correctAnswer || "",
      level: question.level || "Remembering",
      explanation: question.explanation || "",
    });
  };

  const closeEditSidebar = () => {
    setSelectedQuestion(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingQuestion((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOptionChange = (index, value) => {
    if (value.length > MAX_OPTION_LENGTH) {
      return;
    }

    const newOptions = [...editingQuestion.options];
    newOptions[index] = value;
    setEditingQuestion((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const handleCorrectAnswerChange = (option) => {
    setEditingQuestion((prev) => ({
      ...prev,
      correctAnswer: option,
    }));
  };

  const handleSaveEdit = () => {
    if (!editingQuestion.question.trim()) {
      toast.error("Question text is required");
      return;
    }

    if (!editingQuestion.correctAnswer) {
      toast.error("Please select a correct answer");
      return;
    }

    const filledOptions = editingQuestion.options.filter((option) =>
      option.trim()
    );
    if (filledOptions.length < 2) {
      toast.error("At least two options are required");
      return;
    }

    if (!filledOptions.includes(editingQuestion.correctAnswer)) {
      toast.error("The correct answer must be one of the options");
      return;
    }

    const updatedQuestions = questions.map((q) =>
      q === selectedQuestion
        ? {
            ...selectedQuestion,
            question: editingQuestion.question,
            options: editingQuestion.options.filter((opt) => opt.trim()),
            correctAnswer: editingQuestion.correctAnswer,
            level: editingQuestion.level,
            explanation: editingQuestion.explanation,
          }
        : q
    );

    setQuestions(updatedQuestions);
    setSelectedQuestion(null);
    toast.success("Question updated successfully!");
  };

  const handleAddSelectedQuestions = () => {
    if (selectedQuestions.length === 0) {
      toast.warning("Please select at least one question");
      return;
    }

    const questionsToAdd = selectedQuestions.map((index) => questions[index]);

    const formData =
      JSON.parse(sessionStorage.getItem("mcqAssessmentFormData")) || {};
    const sections = JSON.parse(sessionStorage.getItem("sections")) || [];

    if (sections.length > 0) {
      sections[0].selectedQuestions.push(...questionsToAdd);
    }

    sessionStorage.setItem("sections", JSON.stringify(sections));

    navigate("/mcq/combinedDashboard", {
      state: { selectedQuestions: questionsToAdd, formData },
    });
    toast.success("Questions added successfully!");
  };

  const handleRegenerate = async () => {
    setIsRegenerateModalOpen(true);
  };

  const confirmRegenerate = async () => {
    setIsRegenerateModalOpen(false);
    if (!formInputs) {
      return;
    }

    setIsRegenerating(true);

    try {
      const token = localStorage.getItem("contestToken");
      if (!token) {
        return;
      }

      const modifiedFormInputs = {
        ...formInputs,
        regeneration_seed: `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}`,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/mcq/api/generate-questions/`,
        modifiedFormInputs,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.questions) {
        setSelectedQuestions([]);
        setSelectedQuestion(null);
        setEditingQuestion({
          question: "",
          options: ["", "", "", ""],
          correctAnswer: "",
          level: "",
          explanation: "",
        });

        const newQuestions = response.data.questions;
        setQuestions(newQuestions);
        navigate("/mcq/section/AIresponse", {
          state: {
            questions: newQuestions,
            formInputs: modifiedFormInputs,
          },
          replace: true,
        });
      }
    } catch (error) {
      console.error("Error regenerating questions:", error);
      toast.error("Failed to regenerate questions. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const getBadgeColor = (level) => {
    const colorMap = {
      Remembering: "bg-blue-100 text-blue-800",
      Understanding: "bg-green-100 text-green-800",
      Applying: "bg-yellow-100 text-yellow-800",
      Analyzing: "bg-purple-100 text-purple-800",
      Evaluating: "bg-pink-100 text-pink-800",
      Creating: "bg-red-100 text-red-800",
      L1: "bg-blue-100 text-blue-800",
      L2: "bg-green-100 text-green-800",
      L3: "bg-yellow-100 text-yellow-800",
      L4: "bg-purple-100 text-purple-800",
      L5: "bg-pink-100 text-pink-800",
      L6: "bg-red-100 text-red-800",
    };
    return colorMap[level] || "bg-gray-100 text-gray-800";
  };

  const handleRemoveOption = (index) => {
    if (editingQuestion.options.length <= 2) {
      toast.error("You must have at least 2 options.");
      return;
    }
  
    const newOptions = [...editingQuestion.options];
    const removedOption = newOptions.splice(index, 1)[0];
  
    setEditingQuestion((prev) => ({
      ...prev,
      options: newOptions,
      correctAnswer: removedOption === prev.correctAnswer ? "" : prev.correctAnswer,
    }));
  };
  
  const handleAddOption = () => {
    if (editingQuestion.options.length >= 4) {
      toast.error("You can have a maximum of 4 options.");
      return;
    }
  
    setEditingQuestion((prev) => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };
  
  const preventContinuousPress = (e) => {
    const input = e.target;
    const lastValue = input.value;

    if (lastValue && lastValue.slice(-1) === e.key) {
      e.preventDefault();
    }
  };

  return (
    <div
      className="py-20 pt-28 h-screen p-12"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}
    >
      <div className="h-14 pb-10">
        <div className="flex items-center gap-2 text-[#111933] text-sm">
          <span
            className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100 "
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
          <span>AI Generator Response</span>
        </div>
      </div>
      <div className="max-w-full mx-auto bg-white p-10 shadow-lg rounded-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
              Generated Questions
            </h1>
            <h2 className="text-xl md:text-xl font-bold text-[#11193399]">
              Questions Preview
            </h2>
          </div>

          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="text-sm text-[#111933]">
              Total Questions: {questions.length}
            </div>
            {formInputs && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="px-4 py-2 flex items-center gap-2 bg-[#111933] text-white rounded-lg hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {isRegenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Regenerate</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <hr className="border-1 border-[#11193390]" />

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 border border-[#111933] rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            {selectedQuestions.length === questions.length
              ? "Deselect All"
              : "Select All"}
          </button>
          <span className="text-sm text-[#111933]">
            {selectedQuestions.length} of {questions.length} questions selected
          </span>
        </div>

        {/* Table for Questions */}
        <div className="overflow-x-auto border border-gray-300 rounded-md">
          <table className="min-w-full bg-white">
            <thead className="bg-[#F0F0F0] text-[#111933]">
              <tr>
                <th className="py-3 px-4 text-left relative">
                  <div className="flex items-center justify-between">
                    <input
                      type="checkbox"
                      checked={
                        selectedQuestions.length === questions.length &&
                        questions.length > 0
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="h-full absolute right-0 top-0 w-[1px] py-3">
                      <span className="bg-gray-800 h-full w-full"></span>
                    </span>
                  </div>
                </th>
                <th className="py-3 px-4 text-left relative font-bold text-sm md:text-base">
                  Question
                  <span className="h-full absolute right-0 top-0 w-[1px] py-3">
                    <span className="bg-gray-800 h-full w-full"></span>
                  </span>
                </th>

                <th className="py-3 px-4 text-center relative font-bold text-sm md:text-base">
                  Blooms
                  <span className="h-full absolute right-0 top-0 w-[1px] py-3">
                    <span className="bg-gray-800 h-full w-full"></span>
                  </span>
                </th>
                <th className="py-3 px-4 text-center font-bold text-sm md:text-base">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody className="text-sm md:text-base">
              {questions.map((question, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(index)}
                      onChange={() => handleSelectQuestion(index)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="w-3/5 py-4 px-4 text-[#111933] truncate max-w-xs">
                    {question.question}
                  </td>
                  <td className="py-4 px-4 text-[#111933] text-center">
                    <span
                      className={`px-2 py-1 text-xs rounded ${getBadgeColor(
                        question.level
                      )}`}
                    >
                      {question.level || "N/A"}
                    </span>
                  </td>

                  <td className="py-4 px-4 flex justify-center">
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="text-[#111933] bg-white flex items-center px-4 py-1 rounded-lg hover:bg-gray-100"
                    >
                      <SquarePen className="text-xs" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t mt-4">
          <button
            onClick={() => navigate("/mcq/aigenerator")}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSelectedQuestions}
            disabled={selectedQuestions.length === 0}
            className="px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Add Selected Questions
          </button>
        </div>
      </div>

      {selectedQuestion && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-[60]">
    <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-[#111933]">Edit Question</h3>
        <button
          onClick={closeEditSidebar}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#111933] mb-1">
            Question*
            <span className="text-xs text-gray-500">
              (max {MAX_QUESTION_LENGTH} characters)
            </span>
          </label>
          <textarea
            name="question"
            value={editingQuestion.question}
            onChange={handleEditChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            rows={3}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder="Enter question text"
            required
          />
          <div className="text-xs text-right text-gray-500 mt-1">
            {editingQuestion.question.length}/{MAX_QUESTION_LENGTH}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111933] mb-1">
            Bloom's Taxonomy Level*
          </label>
          <select
            name="level"
            value={editingQuestion.level}
            onChange={handleEditChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="L1">Remembering - L1</option>
            <option value="L2">Understanding - L2</option>
            <option value="L3">Applying - L3</option>
            <option value="L4">Analyzing - L4</option>
            <option value="L5">Evaluating - L5</option>
            <option value="L6">Creating - L6</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111933] mb-1">
            Options*
            <span className="text-xs text-gray-500">
              (max {MAX_OPTION_LENGTH} characters each)
            </span>
          </label>
          <div className="space-y-3">
            {editingQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={editingQuestion.correctAnswer === option}
                  onChange={() => handleCorrectAnswerChange(option)}
                  className="mr-2 h-4 w-4 accent-[#111933]"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  onKeyPress={preventContinuousPress}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  maxLength={MAX_OPTION_LENGTH}
                />
                <button
                  onClick={() => handleRemoveOption(index)}
                  className="ml-2 text-red-500 hover:text-red-700"
                  disabled={editingQuestion.options.length <= 2}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Select the radio button for the correct answer
          </p>
        </div>

        {editingQuestion.options.length < 4 && (
          <button
            onClick={handleAddOption}
            className="mt-2 text-[#111933] bg-white border border-[#111933] px-4 py-2 rounded-lg transition"
          >
            Add Option
          </button>
        )}

       

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={closeEditSidebar}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveEdit}
            className="px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-opacity-90 text-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <ConfirmModal
        isConfirmModalOpen={isConfirmModalOpen}
        setIsConfirmModalOpen={setIsConfirmModalOpen}
        targetPath="/staffdashboard"
      />
      <ConfirmModal
        isConfirmModalOpen={isRegenerateModalOpen}
        setIsConfirmModalOpen={setIsRegenerateModalOpen}
        title="Confirm Regenerate"
        message="This will generate a new set of questions using the same inputs. Any changes you've made will be lost. Continue?"
        onConfirm={confirmRegenerate}
      />
    </div>
  );
};

export default AIResponseDisplay;
