import React, { useState, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";
import submiticon from "../../../assets/submit.svg";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal"; // Import the ConfirmModal component
import bg from '../../../assets/bgpattern.svg';

const AIInputForm = () => {
  const [formData, setFormData] = useState({
    topic: "",
    subtopic: "",
    selectedLevel: "",
    level: [],
    question_type: "Multiple Choice",
    num_questions: "",
  });

  const [loading, setLoading] = useState(false);
  const [isFormDisabled, setIsFormDisabled] = useState(false); // State to track form disable status
  const [totalQuestionsAllocated, setTotalQuestionsAllocated] = useState(0);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // State for modal
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const MAX_TOPIC_LENGTH = 50;
  const MAX_SUBTOPIC_LENGTH = 50;
  const MAX_QUESTIONS_PER_LEVEL = 10;
  const MAX_TOTAL_QUESTIONS = 60;

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
      if (!formData.level.some((l) => l.value === value)) {
        setFormData((prevData) => ({
          ...prevData,
          selectedLevel: value,
          level: [...prevData.level, { value: value, count: "" }],
        }));
      }
    } else if (name === "num_questions") {
      const numValue = value.replace(/[^0-9]/g, "");
      if (numValue === "" || parseInt(numValue) <= MAX_TOTAL_QUESTIONS) {
        setFormData((prevData) => ({
          ...prevData,
          num_questions: numValue,
        }));
      }
    } else if (name === "topic") {
      const limitedValue = value.slice(0, MAX_TOPIC_LENGTH);
      setFormData((prevData) => ({
        ...prevData,
        [name]: limitedValue,
      }));
    } else if (name === "subtopic") {
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
    let numCount = count === "" ? "" : parseInt(count) || 0;
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
      selectedLevel:
        prevData.selectedLevel === levelValue ? "" : prevData.selectedLevel,
    }));
  };

  const calculateRemainingQuestions = () => {
    if (!formData.num_questions) return "0";
    const totalQuestions = parseInt(formData.num_questions) || 0;
    const remaining = totalQuestions - totalQuestionsAllocated;
    return remaining.toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsFormDisabled(true); // Disable the form
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem("contestToken");
      if (!token) {
        setErrorMessage("Unauthorized access. Please log in again.");
        setLoading(false);
        setIsFormDisabled(false); // Re-enable the form
        return;
      }

      if (!formData.num_questions) {
        setErrorMessage("Please enter the number of questions.");
        setLoading(false);
        setIsFormDisabled(false); // Re-enable the form
        return;
      }

      const numQuestions = parseInt(formData.num_questions, 10);
      if (isNaN(numQuestions) || numQuestions <= 0) {
        setErrorMessage("Number of questions must be a positive number.");
        setLoading(false);
        setIsFormDisabled(false); // Re-enable the form
        return;
      }

      if (numQuestions > MAX_TOTAL_QUESTIONS) {
        setErrorMessage(
          `Total questions cannot exceed ${MAX_TOTAL_QUESTIONS}.`
        );
        setLoading(false);
        setIsFormDisabled(false); // Re-enable the form
        return;
      }

      const invalidLevel = formData.level.find((level) => level.count === "");
      if (invalidLevel) {
        const levelLabel = bloomLevels.find(
          (l) => l.value === invalidLevel.value
        )?.label;
        setErrorMessage(
          `Please specify the number of questions for ${levelLabel}.`
        );
        setLoading(false);
        setIsFormDisabled(false); // Re-enable the form
        return;
      }

      if (totalQuestionsAllocated !== numQuestions) {
        setErrorMessage(
          `The sum of questions (${totalQuestionsAllocated}) must equal the total number of questions (${numQuestions}).`
        );
        setLoading(false);
        setIsFormDisabled(false); // Re-enable the form
        return;
      }

      const levelExceedingLimit = formData.level.find(
        (level) => parseInt(level.count) > MAX_QUESTIONS_PER_LEVEL
      );
      if (levelExceedingLimit) {
        const levelLabel = bloomLevels.find(
          (l) => l.value === levelExceedingLimit.value
        )?.label;
        setErrorMessage(
          `${levelLabel} cannot have more than ${MAX_QUESTIONS_PER_LEVEL} questions.`
        );
        setLoading(false);
        setIsFormDisabled(false); // Re-enable the form
        return;
      }

      const requestData = {
        topic: formData.topic,
        subtopic: formData.subtopic,
        num_questions: numQuestions,
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

      setSuccessMessage("Questions generated successfully! Redirecting...");

      const { questions } = response.data;

      const formInputs = {
        topic: formData.topic,
        subtopic: formData.subtopic,
        num_questions: parseInt(formData.num_questions),
        question_type: "Multiple Choice",
        level_distribution: formData.level.map((level) => ({
          level: level.value,
          count: parseInt(level.count),
        })),
      };

      navigate("/mcq/section/AIresponse", {
        state: {
          questions,
          formInputs,
        },
      });
    } catch (error) {
      console.error("Error generating questions:", error);
      setErrorMessage(
        error.response?.data?.error ||
        "Failed to generate questions. Please try again later."
      );
    } finally {
      setLoading(false);
      setIsFormDisabled(false); // Re-enable the form
    }
  };

  return (
    <div className=" p-12 py-20 pt-28"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}>
      <div className="h-14 pb-10">
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
          <span>AI Generator</span>
        </div>
      </div>
      <div className="max-w-full mx-auto bg-white p-10 shadow-lg rounded-2xl">
        <h1 className="text-3xl font-bold mb-2 text-[#111933]">
          Question Generator AI
        </h1>
        <p className="text-md ml-1 mb-6">
          Enter the below details and click generate to generate the questions.
        </p>
        <hr className="mb-12 mt-6 border-1 border-gray-500" />
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-40 px-14"
        >
          <div className=" items-center justify-between">
            <label
              htmlFor="topic"
              className="block text-md font-semibold text-[#111933] w-1/3"
            >
              Topic *
            </label>
            <div className="w-full">
              <input
                type="text"
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                onKeyPress={(e) => {
                  if (formData.topic.length >= MAX_TOPIC_LENGTH) {
                    e.preventDefault();
                  }
                }}
                required
                placeholder="Enter the topic"
                maxLength={MAX_TOPIC_LENGTH}
                className="mt-1 block w-full text-sm px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isFormDisabled} // Disable the input field
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {formData.topic.length}/{MAX_TOPIC_LENGTH}
              </div>
            </div>
          </div>
          <div className=" items-center justify-between">
            <label
              htmlFor="subtopic"
              className="block text-md font-semibold text-[#111933] w-1/3"
            >
              Sub-Topic *
            </label>
            <div className="w-full">
              <input
                type="text"
                id="subtopic"
                name="subtopic"
                value={formData.subtopic}
                onChange={handleChange}
                onKeyPress={(e) => {
                  if (formData.subtopic.length >= MAX_SUBTOPIC_LENGTH) {
                    e.preventDefault();
                  }
                }}
                required
                placeholder="Enter the sub-topic"
                maxLength={MAX_SUBTOPIC_LENGTH}
                className="mt-1 block w-full text-sm px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isFormDisabled} // Disable the input field
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {formData.subtopic.length}/{MAX_SUBTOPIC_LENGTH}
              </div>
            </div>
          </div>

          <div className=" items-center justify-between">
            <label
              htmlFor="num_questions"
              className="block text-md font-semibold text-[#111933] w-1/3"
            >
              Total Questions *
            </label>
            <div className="w-full">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                id="num_questions"
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
                required
                placeholder={`Enter total no. of questions (max ${MAX_TOTAL_QUESTIONS})`}
                className="mt-1 block w-full text-sm px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isFormDisabled} // Disable the input field
              />
              {formData.num_questions &&
                parseInt(formData.num_questions) > MAX_TOTAL_QUESTIONS && (
                  <div className="text-xs text-red-500 mt-1">
                    Maximum {MAX_TOTAL_QUESTIONS} questions allowed
                  </div>
                )}
            </div>
          </div>

          <div className=" items-center justify-between">
            <label
              htmlFor="question_type"
              className="block text-md font-semibold text-[#111933] w-1/3"
            >
              Type of Questions *
            </label>
            <select
              id="question_type"
              name="question_type"
              value={formData.question_type}
              onChange={handleChange}
              className="mt-1 block w-full text-sm px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isFormDisabled} // Disable the input field
            >
              <option value="Multiple Choice">Multiple Choice</option>
            </select>
          </div>

          <div className=" items-center justify-between">
            <label className="block text-md font-semibold text-[#111933] w-1/3">
              Bloom's Taxonomy *
            </label>
            <div className="w-full">
              <select
                name="selectedLevel"
                value={formData.selectedLevel}
                onChange={handleChange}
                className="w-full text-sm text-center px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-[#111933] focus:border-[#111933] appearance-none"
                disabled={isFormDisabled} // Disable the input field
              >
                <option value="">Add a level +</option>
                {bloomLevels
                  .filter(
                    (level) =>
                      !formData.level.some((l) => l.value === level.value)
                  )
                  .map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
              </select>

              <div className="mt-3 space-y-3">
                {formData.level.map((level) => (
                  <div
                    key={level.value}
                    className="flex items-center justify-between p-3 border border-gray-300 rounded-md"
                  >
                    <span className="text-sm">
                      {bloomLevels.find((l) => l.value === level.value)?.label}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">
                          Max: {MAX_QUESTIONS_PER_LEVEL}
                        </span>
                        <input
                          type="number"
                          placeholder="No of questions"
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
                          className="w-40 text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                          disabled={isFormDisabled} // Disable the input field
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLevel(level.value)}
                        className="text-red-500 hover:text-red-700 text-xl px-2"
                        disabled={isFormDisabled} // Disable the button
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className=" items-center justify-between">
            <label
              htmlFor="num_questions"
              className="block text-md font-semibold text-[#111933] w-1/3"
            >
              Level *
            </label>
            <div className="w-full">
              <select
                required
                className="mt-1 block w-full text-sm px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isFormDisabled} // Disable the input field
              >
                <option value="Remembering">Easy</option>
                <option value="Understanding">Medium</option>
                <option value="Applying">Hard</option>
              </select>
            </div>
          </div>

          {formData.num_questions && formData.level.length > 0 && (
            <div className="col-span-2">
              {totalQuestionsAllocated > parseInt(formData.num_questions) && (
                <p className="text-red-500 text-sm">
                  You've allocated more questions ({totalQuestionsAllocated})
                  than the total ({formData.num_questions}).
                </p>
              )}
              {totalQuestionsAllocated < parseInt(formData.num_questions) && (
                <p className="text-yellow-600 text-sm">
                  You need to allocate {calculateRemainingQuestions()} more
                  question(s).
                </p>
              )}
              {totalQuestionsAllocated === parseInt(formData.num_questions) && (
                <p className="text-green-500 text-sm">
                  Perfect! All {formData.num_questions} questions have been
                  allocated.
                </p>
              )}

              {parseInt(formData.num_questions) > MAX_TOTAL_QUESTIONS && (
                <p className="text-red-500 text-sm mt-2">
                  Total questions cannot exceed {MAX_TOTAL_QUESTIONS}.
                </p>
              )}
            </div>
          )}

          <div className="col-span-2 flex justify-center mt-4">
            <button
              type="submit"
              className="text-white bg-[#111933] py-3 px-6 rounded-lg text-lg"
              disabled={
                loading ||
                (formData.num_questions &&
                  totalQuestionsAllocated !==
                  parseInt(formData.num_questions)) ||
                parseInt(formData.num_questions) > MAX_TOTAL_QUESTIONS
              }
            >
              {loading ? "Generating..." : "Generate Questions"}
            </button>
          </div>
        </form>

        {errorMessage && (
          <p className="mt-6 text-red-600 text-center">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="mt-6 text-green-600 text-center">{successMessage}</p>
        )}
      </div>
      <ConfirmModal
        isConfirmModalOpen={isConfirmModalOpen}
        setIsConfirmModalOpen={setIsConfirmModalOpen}
        targetPath="/staffdashboard"
      />
    </div>
  );
};

export default AIInputForm;
