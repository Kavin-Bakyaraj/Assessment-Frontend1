import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { X, RotateCw, SquarePen, Save } from "lucide-react";
import 'react-toastify/dist/ReactToastify.css';
import bg from '../../../assets/bgpattern.svg';

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <p className="text-lg mb-4">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-blue-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestionsDisplay = () => {
  const { state } = useLocation();
  const { questions, formInputs } = state || {};
  const navigate = useNavigate();

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [editedQuestions, setEditedQuestions] = useState(questions || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentlyEditing, setCurrentlyEditing] = useState(null);
  const [levelReport, setLevelReport] = useState({});
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const bloomsLevels = [
    { value: "L1", label: "L1 - Remembering" },
    { value: "L2", label: "L2 - Understanding" },
    { value: "L3", label: "L3 - Applying" },
    { value: "L4", label: "L4 - Analyzing" },
    { value: "L5", label: "L5 - Evaluating" },
    { value: "L6", label: "L6 - Creating" },
  ];

  const MAX_WORDS = 150;

  const validateInput = (value) => {
    const words = value.trim().split(/\s+/);
    if (words.length > MAX_WORDS) {
      return false; // Exceeds word limit
    }

    if (/(\w)\1\1\1/.test(value)) {
      return false; // Contains more than three repeated letters
    }

    return true;
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).length;
  };

  useEffect(() => {
    if (questions && questions.length > 0) {
      const processedQuestions = questions.map(question => {
        const fixedOptions = question.options.map(option =>
          option.replace(/^[A-Z]\.\s+[A-Z]\.\s+/, "").replace(/^[A-Z]\.\s+/, "")
        );
        const limitedOptions = fixedOptions.slice(0, 4);
        let correctAnswer = question.correctAnswer.replace(/^[A-Z]\.\s+/, "");

        if (correctAnswer && !limitedOptions.includes(correctAnswer)) {
          const similarOption = limitedOptions.find(option =>
            option.includes(correctAnswer) || correctAnswer.includes(option)
          );
          if (similarOption) {
            correctAnswer = similarOption;
          } else if (limitedOptions.length > 0) {
            correctAnswer = limitedOptions[0];
          }
        }

        return {
          ...question,
          options: limitedOptions,
          correctAnswer: correctAnswer
        };
      });

      setEditedQuestions(processedQuestions);
    }
  }, [questions]);

  useEffect(() => {
    if (editedQuestions && editedQuestions.length > 0) {
      calculateLevelReport();
    }
  }, [editedQuestions]);

  const calculateLevelReport = () => {
    const totalQuestions = editedQuestions.length;
    const levelCounts = {};

    editedQuestions.forEach(question => {
      const level = question.level || "Unknown";
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    const report = {};
    for (const level in levelCounts) {
      const count = levelCounts[level];
      report[level] = ((count / totalQuestions) * 100).toFixed(2);
    }

    setLevelReport(report);
  };

  const handleRegenerate = async () => {
    setShowConfirmModal(true);
  };

  const confirmRegenerate = async () => {
    setShowConfirmModal(false);

    if (!formInputs) {
      return;
    }

    setIsRegenerating(true);

    try {
      const token = localStorage.getItem("contestToken");
      if (!token) {
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/mcq/api/generate-questions/`,
        formInputs,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.questions) {
        setSelectedQuestions([]);
        setEditingIndex(null);
        setCurrentlyEditing(null);

        const newQuestions = response.data.questions;
        navigate("/mcq/airesponse", {
          state: {
            questions: newQuestions,
            formInputs: formInputs
          },
          replace: true
        });
      }
    } catch (error) {
      console.error("Error regenerating questions:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSelectQuestion = (index) => {
    setSelectedQuestions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === editedQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(editedQuestions.map((_, index) => index));
    }
  };

  const handleEditQuestion = (index) => {
    setEditingIndex(index);
    setCurrentlyEditing({ ...editedQuestions[index] });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentlyEditing(null);
  };

  const handleSaveEdit = () => {
    if (!currentlyEditing) return;

    if (!currentlyEditing.correctAnswer || !currentlyEditing.options.includes(currentlyEditing.correctAnswer)) {
      return;
    }

    if (currentlyEditing.options.length < 2 || currentlyEditing.options.length > 4) {
      return;
    }

    const updatedQuestions = [...editedQuestions];
    updatedQuestions[editingIndex] = currentlyEditing;

    setEditedQuestions(updatedQuestions);
    setEditingIndex(null);
    setCurrentlyEditing(null);
  };

  const handleEditField = (field, value) => {
    if (validateInput(value)) {
      setCurrentlyEditing({
        ...currentlyEditing,
        [field]: value
      });
    }
  };

  const handleEditOption = (optionIndex, value) => {
    if (validateInput(value)) {
      const newOptions = [...currentlyEditing.options];
      newOptions[optionIndex] = value;

      if (currentlyEditing.options[optionIndex] === currentlyEditing.correctAnswer) {
        setCurrentlyEditing({
          ...currentlyEditing,
          options: newOptions,
          correctAnswer: value
        });
      } else {
        setCurrentlyEditing({
          ...currentlyEditing,
          options: newOptions
        });
      }
    }
  };

  const handleAddOption = () => {
    if (currentlyEditing.options.length >= 4) {
      return;
    }

    setCurrentlyEditing({
      ...currentlyEditing,
      options: [...currentlyEditing.options, ""]
    });
  };

  const handleRemoveOption = (optionIndex) => {
    if (currentlyEditing.options.length <= 2) {
      return;
    }

    const optionToRemove = currentlyEditing.options[optionIndex];
    const newOptions = currentlyEditing.options.filter((_, idx) => idx !== optionIndex);

    if (optionToRemove === currentlyEditing.correctAnswer) {
      setCurrentlyEditing({
        ...currentlyEditing,
        options: newOptions,
        correctAnswer: newOptions[0]
      });
    } else {
      setCurrentlyEditing({
        ...currentlyEditing,
        options: newOptions
      });
    }
  };

  const handleSaveQuestions = async () => {
    try {
      const token = localStorage.getItem("contestToken");
      const selected = selectedQuestions.map((index) => editedQuestions[index]);

      await axios.post(`${API_BASE_URL}/api/mcq/save-questions/`, {
        questions: selected,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setTimeout(() => {
        navigate('/mcq/QuestionsDashboard');
      }, 1500);
    } catch (error) {
      console.error("Error saving questions:", error);
    }
  };

  if (!questions || questions.length === 0) {
    return <p>No questions to display.</p>;
  }

  const getLevelColor = (level) => {
    const levelMap = {
      'L1': 'bg-teal-100 text-teal-800',
      'L2': 'bg-blue-100 text-blue-800',
      'L3': 'bg-indigo-100 text-indigo-800',
      'L4': 'bg-purple-100 text-purple-800',
      'L5': 'bg-pink-100 text-pink-800',
      'L6': 'bg-red-100 text-red-800',
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800',
      'Unknown': 'bg-gray-100 text-gray-800'
    };

    return levelMap[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      className="min-h-[90vh] flex flex-col items-center py-24 pt-28"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}
    >
      <div className="bg-white mt-3 md:mt-10 pb-5 shadow-lg rounded-3xl p-4 md:p-8 w-[90%] max-w-full md:min-h-[70vh]">

        <div className="space-y-6 w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                Generated Questions
              </h1>
              <h2 className="text-xl md:text-xl font-bold text-[#11193399]">Questions Preview</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-[#111933]">
                Total Questions: {editedQuestions.length}
              </div>
              {formInputs && (
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="px-4 py-2 flex items-center gap-2 bg-[#111933] text-white rounded-lg hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isRegenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <span>Regenerate</span>
                      <RotateCw size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <hr className="border-1 border-[#11193390]"/>

          {/* Select All and Selected Count */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 border border-[#111933] rounded-md hover:bg-gray-200 transition-colors"
            >
              {selectedQuestions.length === editedQuestions.length ? "Deselect All" : "Select All"}
            </button>
            <span className="text-sm text-[#111933]">
              {selectedQuestions.length} of {editedQuestions.length} questions selected
            </span>
          </div>

          {/* Table for Questions */}
          <div className="overflow-x-auto border border-gray-300 rounded-md">
            <table className="min-w-full bg-white">
              <thead className="bg-[#F0F0F0] text-[#111933]">
                <tr>
                  <th className="py-3 px-4 text-left relative">
                    <div className="flex items-center justify-between">
                      {/* <input
                        type="checkbox"
                        checked={selectedQuestions.length === editedQuestions.length && editedQuestions.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      /> */}
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
                    Correct Answer
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
                  <th className="py-3 px-4 text-center font-bold text-sm md:text-base">Edit</th>
                </tr>
              </thead>
              <tbody className="text-sm md:text-base">
                {editedQuestions.map((question, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="py-4 px-4 flex items-center justify-between">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(index)}
                        onChange={() => handleSelectQuestion(index)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {/* <p className="w-6 h-6 rounded-full bg-[#ffcc00] text-sm flex justify-center items-center">
                        {index + 1}
                      </p> */}
                    </td>
                    <td className="w-3/5 py-4 px-4 text-[#111933] truncate max-w-xs">{question.question}</td>
                    <td className="py-4 px-4 text-[#111933] text-center">{question.correctAnswer}</td>
                    <td className="py-4 px-4 text-[#111933] text-center">
                      <span className={`py-4 px-4 text-[#111933] text-center`}>
                        {question.level || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-4 flex justify-center">
                      <button
                        onClick={() => handleEditQuestion(index)}
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

          {/* Footer Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              onClick={() => navigate('/mcq/QuestionsDashboard')}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveQuestions}
              disabled={selectedQuestions.length === 0}
              className="flex items-center px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-[#2a3958] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors gap-2"
            >
              Save Selected Questions
              <Save size={16}/>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Panel (Unchanged) */}
      {editingIndex !== null && currentlyEditing && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-[60]">
    <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-[#111933]">Edit Question</h3>
        <button
          onClick={handleCancelEdit}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#111933] mb-1">
            Question*
          </label>
          <textarea
            value={currentlyEditing.question}
            onChange={(e) => handleEditField("question", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            rows={3}
            placeholder="Enter question text"
            required
          />
          <div className="text-sm text-end text-gray-500 mt-1">
            {countWords(currentlyEditing.question)} / {MAX_WORDS} words
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111933] mb-1">
            Bloom's Taxonomy Level*
          </label>
          <select
            value={currentlyEditing.level || ""}
            onChange={(e) => handleEditField("level", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            {bloomsLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#111933] mb-1">
            Options*
          </label>
          <div className="space-y-3">
            {currentlyEditing.options.map((option, optIndex) => (
              <div key={optIndex} className="flex items-center">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={option === currentlyEditing.correctAnswer}
                  onChange={() => handleEditField("correctAnswer", option)}
                  className="mr-2 h-4 w-4 accent-[#111933]"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleEditOption(optIndex, e.target.value)}
                  className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                />
                <button
                  onClick={() => handleRemoveOption(optIndex)}
                  className="ml-2 text-red-500 hover:text-red-700"
                  disabled={currentlyEditing.options.length <= 2}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {currentlyEditing.options.length < 4 && (
            <button
              onClick={handleAddOption}
              className="mt-2 text-[#111933] bg-white border border-[#111933] px-4 py-2 rounded-lg transition"
            >
              Add Option
            </button>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={handleCancelEdit}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={isRegenerating}
            className="px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-opacity-90 text-sm"
          >
            {isRegenerating ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={confirmRegenerate}
        onCancel={() => setShowConfirmModal(false)}
        message="This will generate a new set of questions using the same inputs. Any changes you've made will be lost. Continue?"
      />
    </div>
  );
};

export default QuestionsDisplay;
