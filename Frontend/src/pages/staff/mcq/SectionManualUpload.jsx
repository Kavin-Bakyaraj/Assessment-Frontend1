import React, { useState, useEffect } from "react";
import { X, Plus, Trash, ChevronRight, Save } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal"; // Import the ConfirmModal component
import bg from '../../../assets/bgpattern.svg';
import { RiFlagFill } from "react-icons/ri";

const ManualUpload = () => {
  const [error, setError] = useState("");
  const [questionList, setQuestionList] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [singleQuestionData, setSingleQuestionData] = useState({
    question: "",
    options: ["", "", "", ""], // Array of strings for options
    answer: "",
    level: "",
    blooms: "",
    tags: "",
    question_id: "",
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // State for modal
  const [isModified, setIsModified] = useState(false);
  const [optionErrors, setOptionErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    setIsModified(false);
  }, [currentQuestionIndex]);

  const handleSingleQuestionInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("option")) {
      const optionIndex = name.charCodeAt(name.length - 1) - 65; // Convert 'A', 'B', etc. to 0, 1, etc.
      const newOptions = [...singleQuestionData.options];
      newOptions[optionIndex] = value;
      setSingleQuestionData((prev) => ({ ...prev, options: newOptions }));
    } else {
      setSingleQuestionData((prev) => ({ ...prev, [name]: value }));
    }
    setIsModified(true);

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
  };

  const validateOptions = () => {
    const filledOptions = singleQuestionData.options.filter(
      (option) => option.trim() !== ""
    );
    return filledOptions.length >= 2;
  };

  const handleSave = () => {
    if (!singleQuestionData.question.trim()) {
      toast.error("Question is required.");
      return;
    }

    if (!validateOptions()) {
      toast.error("At least two choices are required.");
      return;
    }

    const filledOptions = singleQuestionData.options.filter(
      (option) => option.trim() !== ""
    );
    const uniqueOptions = new Set(filledOptions);
    if (
      filledOptions.length >= 2 &&
      uniqueOptions.size !== filledOptions.length
    ) {
      toast.error("Options must be unique. Duplicate options are not allowed.");
      return;
    }

    if (!singleQuestionData.level) {
      toast.error("Difficulty level is required.");
      return;
    }

    if (!singleQuestionData.blooms) {
      toast.error("Blooms level is required.");
      return;
    }

    if (!singleQuestionData.answer) {
      toast.error("Correct answer is required.");
      return;
    }

    if (!singleQuestionData.tags.trim()) {
      toast.error("Tags are required.");
      return;
    }

    const updatedList = [...questionList];
    if (currentQuestionIndex >= 0) {
      updatedList[currentQuestionIndex] = singleQuestionData;
    } else {
      updatedList.push({ ...singleQuestionData, question_id: uuidv4() });
    }
    setQuestionList(updatedList);
    setError("");
    setOptionErrors({});
    setIsModified(false); // Set isModified to false after saving

    clearForm();
    toast.success("Question saved successfully!");
  };

  const handleDeleteQuestion = (index, e) => {
    e.stopPropagation();
    const updatedList = questionList.filter((_, i) => i !== index);
    setQuestionList(updatedList);
    if (currentQuestionIndex === index) {
      clearForm();
    } else if (currentQuestionIndex > index) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleDeleteOption = (index) => {
    if (singleQuestionData.options.length <= 2) return;
    const newOptions = singleQuestionData.options.filter((_, i) => i !== index);
    setSingleQuestionData((prev) => ({ ...prev, options: newOptions }));
  };

  const handleAddOption = () => {
    if (singleQuestionData.options.length >= 6) return;
    setSingleQuestionData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const clearForm = () => {
    setSingleQuestionData({
      question: "",
      options: ["", "", "", ""],
      answer: "",
      level: "",
      blooms: "",
      tags: "",
      question_id: "",
    });
    setCurrentQuestionIndex(-1);
    setIsModified(false);
  };

  const handleFinish = () => {
    if (isModified) {
      toast.warning("Save the question before finishing.");
      return;
    }
    if (questionList.length === 0) {
      toast.error("Please save at least one question before finishing.");
      return;
    }
    setShowFinishConfirm(true);
  };

  const confirmFinish = () => {
    const formData =
      JSON.parse(sessionStorage.getItem("mcqAssessmentFormData")) || {};
    const sections = JSON.parse(sessionStorage.getItem("sections")) || [];

    if (sections.length > 0) {
      sections[0].selectedQuestions.push(...questionList);
    }

    sessionStorage.setItem("sections", JSON.stringify(sections));

    navigate("/mcq/combinedDashboard", {
      state: { selectedQuestions: questionList, formData },
    });
    toast.success("Questions added successfully!");
  };

  const loadQuestionIntoForm = (question, index) => {
    setSingleQuestionData(question);
    setCurrentQuestionIndex(index);
  };

  const spareSave = () => {
    if (!isModified) return; // No changes to save

    const updatedList = [...questionList];

    if (currentQuestionIndex >= 0) {
      updatedList[currentQuestionIndex] = singleQuestionData;
    } else {
      updatedList.push({ ...singleQuestionData, question_id: uuidv4() });
    }

    setQuestionList(updatedList);
    setIsModified(false); // Reset modification flag
  };

  const validateForm = () => {
    if (!singleQuestionData.question.trim()) {
      toast.error("Question is required.");
      return false;
    }

    if (!validateOptions()) {
      toast.error("At least two choices are required.");
      return false;
    }

    if (!singleQuestionData.level) {
      toast.error("Difficulty level is required.");
      return false;
    }

    if (!singleQuestionData.blooms) {
      toast.error("Blooms level is required.");
      return false;
    }

    if (!singleQuestionData.answer) {
      toast.error("Correct answer is required.");
      return false;
    }

    if (!singleQuestionData.tags.trim()) {
      toast.error("Tags are required.");
      return false;
    }

    return true;
  };

  return (
    <div className=" p-12 py-20 pt-28"
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
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
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
          <span >
            Manual Upload
          </span>
        </div>
      </div>
      <div className="max-w-full mx-auto bg-white p-10 shadow-lg rounded-2xl">
        <h1 className="text-3xl font-bold mb-2 text-[#111933]">
          Manual Upload
        </h1>
        <p className="text-sm md:text-lg mb-6">
          Add a new question manually by filling in the details below.
        </p>
        <hr className="mb-12 mt-6 border-1 border-gray-500" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 border-2 p-6 rounded-lg">
            <div className="mb-6">
              <label className="text-lg font-medium text-[#111933] mb-2 block">
                Question <span className="text-red-500">*</span>
              </label>
              <textarea
                name="question"
                value={singleQuestionData.question}
                onChange={handleSingleQuestionInputChange}
                placeholder="Enter your question here"
                className="w-full border rounded-lg p-4 resize-none text-[#111933]"
                rows={4}
                required
              />
            </div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-lg font-medium text-[#111933]">
                  Options <span className="text-red-500">*</span>
                </label>
                {singleQuestionData.options.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center text-[#111933] hover:text-gray-700"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {singleQuestionData.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex flex-col space-y-1 mb-4 relative"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="p-2 px-4 rounded-md bg-[#111933] text-white">
                        {`${String.fromCharCode(65 + index)}`}
                      </span>
                      <div className="flex items-center w-full border rounded-md p-2">
                        <input
                          type="text"
                          name={`option${String.fromCharCode(65 + index)}`}
                          value={option}
                          placeholder="Enter option"
                          onChange={handleSingleQuestionInputChange}
                          className="flex-1 text-[#111933] outline-none focus:ring-0"
                        />
                        {singleQuestionData.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(index)}
                            className="text-red-500 hover:text-red-700"
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
                    </div>
                    {optionErrors[index] && (
                      <span className="absolute -bottom-5 text-red-500 text-sm">
                        {optionErrors[index]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-lg font-medium text-[#111933] mb-2 block">
                  Difficulty Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="level"
                  value={singleQuestionData.level}
                  onChange={handleSingleQuestionInputChange}
                  className="w-full border rounded-lg p-2 text-[#111933]/70"
                  required
                >
                  <option value="">Select difficulty level</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="text-lg font-medium text-[#111933] mb-2 block">
                  Blooms <span className="text-red-500">*</span>
                </label>
                <select
                  name="blooms"
                  value={singleQuestionData.blooms}
                  onChange={handleSingleQuestionInputChange}
                  className="w-full border rounded-lg p-2 text-[#111933]/70"
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
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-lg font-medium text-[#111933] mb-2 block">
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <select
                  name="answer"
                  value={singleQuestionData.answer}
                  onChange={handleSingleQuestionInputChange}
                  className="w-full border rounded-lg p-2 text-[#111933]/70"
                  required
                >
                  <option value="">Select the correct option</option>
                  {singleQuestionData.options.map(
                    (option, index) =>
                      option.trim() && (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      )
                  )}
                </select>
              </div>
              <div>
  <label className="text-lg font-medium text-[#111933] mb-2 block">
    Tags <span className="text-red-500">*</span>
  </label>
  <div className="relative border rounded-lg focus-within:ring-2 focus-within:ring-black transition-all">
    {/* Tags and input field container with fixed height */}
    <div className="flex flex-wrap items-center gap-1.5 p-2 h-[42px] overflow-y-auto">
      {singleQuestionData.tags.split(',')
        .filter(tag => tag.trim())
        .map((tag, index) => (
          <div 
            key={index} 
            className="inline-flex items-center bg-[#111933] text-white text-xs px-1.5 py-0.5 rounded-md max-w-[120px] overflow-hidden"
          >
            <span className="truncate">{tag.trim()}</span>
            <button 
              type="button"
              onClick={() => {
                const updatedTags = singleQuestionData.tags
                  .split(',')
                  .filter(t => t.trim())
                  .filter((_, i) => i !== index)
                  .join(', ');
                setSingleQuestionData(prev => ({ ...prev, tags: updatedTags }));
                setIsModified(true);
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
          if ((e.key === 'Enter' || e.key === ',') && e.target.value.trim()) {
            e.preventDefault();
            const newTag = e.target.value.trim();
            
            // Get existing tags as array
            const existingTags = singleQuestionData.tags
              .split(',')
              .map(t => t.trim())
              .filter(t => t.length > 0);
            
            // Check for 3-tag limit
            if (existingTags.length >= 3) {
              toast.info("Maximum of 3 tags allowed", {
                position: "top-right",
                autoClose: 2000
              });
              return;
            }
            
            // Check if tag already exists
            if (!existingTags.includes(newTag)) {
              // Add new tag to existing tags
              const updatedTags = existingTags.length > 0
                ? `${singleQuestionData.tags}, ${newTag}`
                : newTag;
                
              setSingleQuestionData(prev => ({ ...prev, tags: updatedTags }));
              setIsModified(true);
            }
            
            // Clear input
            e.target.value = '';
            setTagInput('');
          }
        }}
        className="flex-1 min-w-[100px] h-[26px] px-1 border-none outline-none text-[#111933] bg-transparent"
        disabled={singleQuestionData.tags.split(',').filter(tag => tag.trim()).length >= 3}
      />
    </div>
    
    {/* Floating label that appears at the border */}
    <label 
      className={`absolute pointer-events-none transition-all duration-300
        ${(tagInput || document.activeElement?.name === "tagsInput" || singleQuestionData.tags) 
          ? "top-0 left-2 transform -translate-y-1/2 scale-75 text-[#111933] bg-white px-1 z-10"
          : "top-1/2 left-2 transform -translate-y-1/2 text-gray-500"
        }
      `}
    >
      {singleQuestionData.tags.split(',').filter(tag => tag.trim()).length >= 3 
        ? "Maximum tags reached" 
        : "Enter tag and press Enter"}
    </label>
  </div>
</div>
            </div>
          </div>
          <aside className="col-span-4 border-2 p-6 rounded-lg flex flex-col">
            <div className="mb-4">
              <h3 className="font-semibold text-[#111933]">
                Question List ({questionList.length})
              </h3>
            </div>

            <div
              className="flex-grow overflow-y-auto"
              style={{
                maxHeight: "400px",
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E1 #F1F5F9",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <ul className="space-y-4 p-2">
                {questionList.map((q, index) => (
                  <li
                    key={index}
                    className={` bg-white border text-black rounded-lg flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition-shadow ${
                      currentQuestionIndex === index
                        ? "border-[#32ab24] border-2 rounded-xl"
                        : ""
                      }`}
                    onClick={() => loadQuestionIntoForm(q, index)}
                  >
                    <span className="rounded-l-lg bg-[#111933] text-white py-4 px-[15px] text-sm mr-2">
                      {index + 1}
                    </span>
                    <div className="text-black font-medium truncate flex-1 mr-2">
                      {/* <span className="rounded-full bg-[#111933] text-white py-2 px-[10px] text-sm mr-2">
                        {index + 1}
                      </span> */}
                      <span className="font-medium">
                        {q.question || "No question text"}
                      </span>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-700 mr-2 flex-shrink-0"
                      onClick={(e) => handleDeleteQuestion(index, e)}
                      aria-label="Delete question"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
        <div className="flex justify-between mt-4">
          <div className="flex items-center justify-between gap-80">
            <button
              type="button"
              className={`py-2 px-4 bg-white border border-[#111933] font-semibold text-[#111933] rounded-md flex items-center justify-center gap-2
                ${
                  isModified
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100 cursor-pointer"
                }`}
              onClick={() => {
                const prevIndex =
                  currentQuestionIndex > 0
                    ? currentQuestionIndex - 1
                    : questionList.length - 1;
                if (prevIndex >= 0)
                  loadQuestionIntoForm(questionList[prevIndex], prevIndex);
              }}
              disabled={isModified} // Disable the button if there are unsaved changes
            >
              <ChevronRight size={20} className="rotate-180" />
              Previous
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="w-full md:w-auto py-2 px-4 border bg-[#ffcc00]/40 border-[#ffcc00] font-semibold text-[#111933] rounded-lg flex items-center justify-center gap-2 hover:bg-[#ffcc00]/50 transition-colors"
              disabled={Object.keys(optionErrors).length > 0}
            >
              {" "}
              <Save size={18} />
              Save
            </button>

            <button
              type="button"
              className={`py-2 px-4 bg-[#111933] font-semibold text-white rounded-md flex items-center justify-center gap-2
                ${
                  isModified
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#1a2333] cursor-pointer"
                }`}
              onClick={() => {
                const nextIndex =
                  currentQuestionIndex < questionList.length - 1
                    ? currentQuestionIndex + 1
                    : -1;
                if (nextIndex >= 0)
                  loadQuestionIntoForm(questionList[nextIndex], nextIndex);
                else clearForm();
              }}
              disabled={isModified} // Disable the button if there are unsaved changes
            >
              Next <ChevronRight size={20} />
            </button>
          </div>

          <div className="mx-40">
            <button
              type="button"
              onClick={handleFinish}
              className="w-full md:w-auto py-2 px-4 bg-[#E1F9F0] border border-[#004434] font-semibold text-[#004434] rounded-lg flex items-center justify-center gap-2 hover:bg-[#d0f4e6] transition-colors"
            >
              <RiFlagFill size={18} />
              Finish
            </button>
          </div>
        </div>

        {showFinishConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-[#111933] mb-4">
                Finish Adding Questions?
              </h3>
              <p className="text-gray-600 mb-6">
                You have added {questionList.length} question(s). Are you sure
                you want to finish?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmFinish}
                  className="px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-[#111933d3]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
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

export default ManualUpload;
