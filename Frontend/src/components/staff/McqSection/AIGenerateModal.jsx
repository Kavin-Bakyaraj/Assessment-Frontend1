import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SlArrowRight } from "react-icons/sl";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import submiticon from '../../../assets/submit.svg';

const AIGenerateModal = ({ onClose, onQuestionsGenerated }) => {
  const [formData, setFormData] = useState({
    topic: "",
    subtopic: "",
    selectedLevel: "",
    level: [],
    question_type: "Multiple Choice",
    num_questions: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [totalQuestionsAllocated, setTotalQuestionsAllocated] = useState(0);
  
  // Edit feature state
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    level: "",
    explanation: ""
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Constants for limits
  const MAX_TOPIC_LENGTH = 50;
  const MAX_SUBTOPIC_LENGTH = 50;
  const MAX_QUESTIONS_PER_LEVEL = 10;
  const MAX_TOTAL_QUESTIONS = 60;
  const MAX_QUESTION_LENGTH = 150;  // ~25 words
  const MAX_OPTION_LENGTH = 30;     // 30 characters per option

  // Calculate total questions allocated whenever level array changes
  useEffect(() => {
    const total = formData.level.reduce((sum, level) => {
      const count = parseInt(level.count) || 0;
      return sum + count;
    }, 0);
    setTotalQuestionsAllocated(total);
  }, [formData.level]);

  const bloomLevels = [
    { value: "Remembering", label: "Remembering - L1" },
    { value: "Understanding", label: "Understanding - L2" },
    { value: "Applying", label: "Applying - L3" },
    { value: "Analyzing", label: "Analyzing - L4" },
    { value: "Evaluating", label: "Evaluating - L5" },
    { value: "Creating", label: "Creating - L6" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "selectedLevel") {
      // Only add the level if it's not already in the list
      if (!formData.level.some((l) => l.value === value)) {
        setFormData((prevData) => ({
          ...prevData,
          selectedLevel: value,
          level: [...prevData.level, { value: value, count: "" }],
        }));
      }
    } else if (name === "num_questions") {
      // Limit to MAX_TOTAL_QUESTIONS and only allow numbers
      const numValue = value.replace(/[^0-9]/g, "");
      if (numValue === "" || parseInt(numValue) <= MAX_TOTAL_QUESTIONS) {
        setFormData((prevData) => ({
          ...prevData,
          num_questions: numValue,
        }));
      }
    } else if (name === "topic") {
      // Limit topic to MAX_TOPIC_LENGTH characters
      const limitedValue = value.slice(0, MAX_TOPIC_LENGTH);
      setFormData((prevData) => ({
        ...prevData,
        [name]: limitedValue,
      }));
    } else if (name === "subtopic") {
      // Limit subtopic to MAX_SUBTOPIC_LENGTH characters
      const limitedValue = value.slice(0, MAX_SUBTOPIC_LENGTH);
      setFormData((prevData) => ({
        ...prevData,
        [name]: limitedValue,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleLevelCountChange = (levelValue, count) => {
    // Convert to number or keep empty string
    let numCount = count === "" ? "" : parseInt(count) || 0;
    
    // Enforce MAX_QUESTIONS_PER_LEVEL limit
    if (numCount > MAX_QUESTIONS_PER_LEVEL) {
      numCount = MAX_QUESTIONS_PER_LEVEL;
    }
    
    setFormData((prevData) => {
      const updatedLevels = prevData.level.map((level) => {
        if (level.value === levelValue) {
          return { ...level, count: numCount };
        }
        return level;
      });
      return { ...prevData, level: updatedLevels };
    });
  };

  const removeLevel = (levelValue) => {
    setFormData((prevData) => ({
      ...prevData,
      level: prevData.level.filter((l) => l.value !== levelValue),
      selectedLevel: prevData.selectedLevel === levelValue ? "" : prevData.selectedLevel,
    }));
  };

  const calculateRemainingQuestions = () => {
    if (!formData.num_questions) return "0";
    const totalQuestions = parseInt(formData.num_questions) || 0;
    const remaining = totalQuestions - totalQuestionsAllocated;
    return remaining.toString();
  };

  const validateForm = () => {
    if (!formData.topic.trim()) {
      toast.error("Please enter a topic");
      return false;
    }
    
    if (!formData.subtopic.trim()) {
      toast.error("Please enter a subtopic");
      return false;
    }
    
    if (!formData.num_questions || parseInt(formData.num_questions) <= 0) {
      toast.error("Please enter a valid number of questions");
      return false;
    }
    
    if (parseInt(formData.num_questions) > MAX_TOTAL_QUESTIONS) {
      toast.error(`Total questions cannot exceed ${MAX_TOTAL_QUESTIONS}`);
      return false;
    }
    
    if (formData.level.length === 0) {
      toast.error("Please select at least one Bloom's Taxonomy level");
      return false;
    }

    // Check if all levels have been assigned a count
    const invalidLevel = formData.level.find(level => level.count === "");
    if (invalidLevel) {
      const levelLabel = bloomLevels.find(l => l.value === invalidLevel.value)?.label;
      toast.error(`Please specify the number of questions for ${levelLabel}`);
      return false;
    }

    // Check if total count matches num_questions
    if (totalQuestionsAllocated !== parseInt(formData.num_questions)) {
      toast.error(`The sum of questions (${totalQuestionsAllocated}) must equal the total number of questions (${formData.num_questions})`);
      return false;
    }

    // Check if any level exceeds MAX_QUESTIONS_PER_LEVEL
    const levelExceedingLimit = formData.level.find(level => parseInt(level.count) > MAX_QUESTIONS_PER_LEVEL);
    if (levelExceedingLimit) {
      const levelLabel = bloomLevels.find(l => l.value === levelExceedingLimit.value)?.label;
      toast.error(`${levelLabel} cannot have more than ${MAX_QUESTIONS_PER_LEVEL} questions`);
      return false;
    }

    return true;
  };

  const generateQuestions = async () => {
    if (!validateForm()) return false;

    setLoading(true);
    try {
      const token = localStorage.getItem("contestToken");
      if (!token) {
        toast.error("Unauthorized access. Please log in again.");
        setLoading(false);
        return false;
      }

      const requestData = {
        topic: formData.topic,
        subtopic: formData.subtopic,
        num_questions: parseInt(formData.num_questions),
        question_type: "Multiple Choice",
        level_distribution: formData.level.map((level) => ({
          level: level.value,
          count: parseInt(level.count),
        })),
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/mcq/api/generate-questions/`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.questions) {
        setGeneratedQuestions(response.data.questions);
        setSelectedQuestions([]);
        setShowPreview(true);
        toast.success("Questions generated successfully!");
        return true;
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error(
        error.response?.data?.error ||
        "Failed to generate questions. Please try again later."
      );
      return false;
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await generateQuestions();
  };

  const handleRegenerate = async () => {
    const confirmed = window.confirm("This will replace all current questions. Are you sure you want to regenerate?");
    if (confirmed) {
      setLoading(true);
      const success = await generateQuestions();
      setLoading(false);
    }
  };

  const handleSelectQuestion = (index) => {
    setSelectedQuestions(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === generatedQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(generatedQuestions.map((_, index) => index));
    }
  };

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question);
    setEditingQuestion({
      question: question.question || "",
      options: [...question.options] || ["", "", "", ""],
      correctAnswer: question.correctAnswer || "",
      level: question.level || "Remembering",
      explanation: question.explanation || ""
    });
  };

  const closeEditSidebar = () => {
    setSelectedQuestion(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    // Apply character limits
    if (name === "question" && value.length > MAX_QUESTION_LENGTH) {
      return;
    }
    
    setEditingQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    // Apply option character limit
    if (value.length > MAX_OPTION_LENGTH) {
      return;
    }
    
    const newOptions = [...editingQuestion.options];
    newOptions[index] = value;
    setEditingQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const handleCorrectAnswerChange = (option) => {
    setEditingQuestion(prev => ({
      ...prev,
      correctAnswer: option
    }));
  };

  const handleSaveEdit = () => {
    // Basic validation
    if (!editingQuestion.question.trim()) {
      toast.error("Question text is required");
      return;
    }
    
    if (!editingQuestion.correctAnswer) {
      toast.error("Please select a correct answer");
      return;
    }
    
    const filledOptions = editingQuestion.options.filter(option => option.trim());
    if (filledOptions.length < 2) {
      toast.error("At least two options are required");
      return;
    }
    
    if (!filledOptions.includes(editingQuestion.correctAnswer)) {
      toast.error("The correct answer must be one of the options");
      return;
    }

    // Update the question in the generated questions array
    const updatedQuestions = generatedQuestions.map(q => 
      q === selectedQuestion ? {
        ...selectedQuestion,
        question: editingQuestion.question,
        options: editingQuestion.options.filter(opt => opt.trim()),
        correctAnswer: editingQuestion.correctAnswer,
        level: editingQuestion.level,
        explanation: editingQuestion.explanation
      } : q
    );
    
    setGeneratedQuestions(updatedQuestions);
    setSelectedQuestion(null);
    toast.success("Question updated successfully!");
  };

  const handleAddSelectedQuestions = () => {
    if (selectedQuestions.length === 0) {
      toast.warning("Please select at least one question");
      return;
    }

    const questionsToAdd = selectedQuestions.map(index => generatedQuestions[index]);
    onQuestionsGenerated(questionsToAdd);
    toast.success("Questions added successfully!");
    onClose();
  };

  const getBadgeColor = (level) => {
    const colorMap = {
      "Remembering": "bg-blue-100 text-blue-800",
      "Understanding": "bg-green-100 text-green-800",
      "Applying": "bg-yellow-100 text-yellow-800",
      "Analyzing": "bg-purple-100 text-purple-800",
      "Evaluating": "bg-pink-100 text-pink-800",
      "Creating": "bg-red-100 text-red-800"
    };
    return colorMap[level] || "bg-gray-100 text-gray-800";
  };

  const preventContinuousPress = (e) => {
    const input = e.target;
    const lastValue = input.value;
    
    // Check if the last character is the same as the current key pressed
    if (lastValue && lastValue.slice(-1) === e.key) {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-lg p-8 max-w-5xl w-full my-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={24} className="text-gray-500" />
        </button>

        {!showPreview ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#111933]">Generate Questions with AI</h2>
            <p className="text-sm text-gray-600">
              Fill in the details below to generate questions based on your requirements
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topic* <span className="text-xs text-gray-500">(max {MAX_TOPIC_LENGTH} characters)</span>
                  </label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    onKeyPress={(e) => {
                      if (formData.topic.length >= MAX_TOPIC_LENGTH) {
                        e.preventDefault();
                      }
                    }}
                    maxLength={MAX_TOPIC_LENGTH}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter topic"
                    required
                  />
                  <div className="text-xs text-right text-gray-500 mt-1">
                    {formData.topic.length}/{MAX_TOPIC_LENGTH}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Topic* <span className="text-xs text-gray-500">(max {MAX_SUBTOPIC_LENGTH} characters)</span>
                  </label>
                  <input
                    type="text"
                    name="subtopic"
                    value={formData.subtopic}
                    onChange={handleChange}
                    onKeyPress={(e) => {
                      if (formData.subtopic.length >= MAX_SUBTOPIC_LENGTH) {
                        e.preventDefault();
                      }
                    }}
                    maxLength={MAX_SUBTOPIC_LENGTH}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter sub-topic"
                    required
                  />
                  <div className="text-xs text-right text-gray-500 mt-1">
                    {formData.subtopic.length}/{MAX_SUBTOPIC_LENGTH}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Questions* <span className="text-xs text-gray-500">(max {MAX_TOTAL_QUESTIONS})</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  name="num_questions"
                  value={formData.num_questions}
                  onChange={handleChange}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                      return;
                    }
                    const newValue = formData.num_questions + e.key;
                    if (parseInt(newValue) > MAX_TOTAL_QUESTIONS) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter number of questions (max ${MAX_TOTAL_QUESTIONS})`}
                  required
                />
                {formData.num_questions && parseInt(formData.num_questions) > MAX_TOTAL_QUESTIONS && (
                  <div className="text-xs text-red-500 mt-1">
                    Maximum {MAX_TOTAL_QUESTIONS} questions allowed
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bloom's Taxonomy Levels*
                </label>
                <select
                  name="selectedLevel"
                  value={formData.selectedLevel}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a level</option>
                  {bloomLevels
                    .filter((level) => !formData.level.some((l) => l.value === level.value))
                    .map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                </select>

                <div className="mt-4 space-y-3">
                  {formData.level.map((level) => (
                    <div
                      key={level.value}
                      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                    >
                      <span className="text-sm font-medium">
                        {bloomLevels.find((l) => l.value === level.value)?.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">Max: {MAX_QUESTIONS_PER_LEVEL}</span>
                        <input
                          type="number"
                          placeholder="Questions"
                          min="0"
                          max={MAX_QUESTIONS_PER_LEVEL}
                          value={level.count}
                          onChange={(e) => handleLevelCountChange(level.value, e.target.value)}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                              return;
                            }
                            const newValue = level.count + e.key;
                            if (parseInt(newValue) > MAX_QUESTIONS_PER_LEVEL) {
                              e.preventDefault();
                            }
                          }}
                          className="w-20 p-2 border rounded-lg text-center"
                        />
                        <button
                          type="button"
                          onClick={() => removeLevel(level.value)}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <X size={20} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allocation warning */}
              {formData.num_questions && formData.level.length > 0 && (
                <div>
                  {totalQuestionsAllocated > parseInt(formData.num_questions) && (
                    <p className="text-red-500 text-sm">
                      You've allocated more questions ({totalQuestionsAllocated}) than the total ({formData.num_questions}).
                    </p>
                  )}
                  {totalQuestionsAllocated < parseInt(formData.num_questions) && (
                    <p className="text-yellow-600 text-sm">
                      You need to allocate {calculateRemainingQuestions()} more question(s).
                    </p>
                  )}
                  {totalQuestionsAllocated === parseInt(formData.num_questions) && (
                    <p className="text-green-500 text-sm">
                      Perfect! All {formData.num_questions} questions have been allocated.
                    </p>
                  )}
                  
                  {parseInt(formData.num_questions) > MAX_TOTAL_QUESTIONS && (
                    <p className="text-red-500 text-sm mt-2">
                      Total questions cannot exceed {MAX_TOTAL_QUESTIONS}.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || 
                  (formData.num_questions && totalQuestionsAllocated !== parseInt(formData.num_questions)) ||
                  parseInt(formData.num_questions) > MAX_TOTAL_QUESTIONS}
                className="w-full flex items-center justify-center px-4 py-2 bg-[#111933] text-white rounded-lg hover:bg-[#2a3958] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Generate Questions</span>
                    <img src={submiticon} alt="submit" className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#111933]">Generated Questions Preview</h2>
              <div className="space-x-3">
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="text-sm px-4 py-1 border border-[#111933] rounded-md hover:bg-gray-100 transition-colors"
                >
                  {loading ? "Regenerating..." : "Regenerate"}
                </button>

              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                {selectedQuestions.length === generatedQuestions.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <span className="text-sm text-gray-600">
                {selectedQuestions.length} of {generatedQuestions.length} questions selected
              </span>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {generatedQuestions.map((question, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedQuestions.includes(index)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(index)}
                      onChange={() => handleSelectQuestion(index)}
                      className="mt-1.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Q{index + 1}. {question.question}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 shrink-0">
                          <span className={`text-xs px-2 py-1 rounded-full ${getBadgeColor(question.level)}`}>
                            {question.level || "L1"}
                          </span>
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="text-[#111933] border border-[#111933] flex items-center px-2 py-1 rounded-md hover:bg-gray-50"
                          >
                            Edit <SlArrowRight className="inline-flex ml-1 h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="pl-4 space-y-2">
                        {question.options.map((option, optIndex) => (
                          <p
                            key={optIndex}
                            className={`${
                              option === question.correctAnswer
                                ? "text-green-600 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelectedQuestions}
                disabled={selectedQuestions.length === 0}
                className="px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-[#2a3958] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add Selected Questions
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Question Edit Sidebar */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-[60]">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto p-6 shadow-lg">
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
              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question* <span className="text-xs text-gray-500">(max {MAX_QUESTION_LENGTH} characters)</span>
                </label>
                <textarea
                  name="question"
                  value={editingQuestion.question}
                  onChange={handleEditChange}
                  onKeyPress={preventContinuousPress}
                  className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  maxLength={MAX_QUESTION_LENGTH}
                  placeholder="Enter question text"
                  required
                />
                <div className="text-xs text-right text-gray-500 mt-1">
                  {editingQuestion.question.length}/{MAX_QUESTION_LENGTH}
                </div>
              </div>
              
              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options* <span className="text-xs text-gray-500">(max {MAX_OPTION_LENGTH} characters each)</span>
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
                        className="flex-grow p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        maxLength={MAX_OPTION_LENGTH}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Select the radio button for the correct answer</p>
              </div>
              
              {/* Bloom's Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bloom's Taxonomy Level*</label>
                <select
                  name="level"
                  value={editingQuestion.level}
                  onChange={handleEditChange}
                  className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Remembering">Remembering - L1</option>
                  <option value="Understanding">Understanding - L2</option>
                  <option value="Applying">Applying - L3</option>
                  <option value="Analyzing">Analyzing - L4</option>
                  <option value="Evaluating">Evaluating - L5</option>
                  <option value="Creating">Creating - L6</option>
                </select>
              </div>
              
  
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 ">
                <button
                  type="button"
                  onClick={closeEditSidebar}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGenerateModal;