import React, { useState, useEffect } from "react";
import { X, Trash, Plus, ChevronRight } from "lucide-react";

const QuestionModal = ({
  isSingleQuestionModalOpen,
  setIsSingleQuestionModalOpen,
  initialQuestionData,
  onFinish,
}) => {
  const [error, setError] = useState("");
  const [questionList, setQuestionList] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [singleQuestionData, setSingleQuestionData] = useState(
    initialQuestionData || {
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      answer: "",
      level: "",
      blooms: "",
      tags: "",
    }
  );
  const [options, setOptions] = useState([
    "optionA",
    "optionB",
    "optionC",
    "optionD",
  ]);
  const [isModified, setIsModified] = useState(false);
  const [showToast, setShowToast] = useState(false); // State for toast message
  const [optionErrors, setOptionErrors] = useState({});
  const [tagInput, setTagInput] = useState("");
  const [isSaved, setIsSaved] = useState(false); // Track if the current question is saved
  const [isNewQuestion, setIsNewQuestion] = useState(true); // Track if creating a new question

  useEffect(() => {
    setIsModified(false);
    setIsSaved(false);
    setIsNewQuestion(currentQuestionIndex === -1);

    // Reset options when loading a question or clearing the form
    if (currentQuestionIndex >= 0) {
      // Find all option keys in the loaded question (optionA, optionB, etc.)
      const questionOptions = Object.keys(
        questionList[currentQuestionIndex]
      ).filter(
        (key) =>
          key.startsWith("option") &&
          typeof questionList[currentQuestionIndex][key] === "string" && // Ensure it's a string
          questionList[currentQuestionIndex][key]?.trim() !== ""
      );

      // If there are valid options, use them; otherwise, use default options
      if (questionOptions.length >= 2) {
        setOptions(questionOptions);
      } else {
        setOptions(["optionA", "optionB", "optionC", "optionD"]);
      }
    } else {
      // Default options for new questions
      setOptions(["optionA", "optionB", "optionC", "optionD"]);
    }
  }, [currentQuestionIndex, questionList]);

  const handleSingleQuestionInputChange = (e) => {
    const { name, value } = e.target;
    setSingleQuestionData((prev) => ({ ...prev, [name]: value }));
    setIsModified(true);
    setIsSaved(false);

    // Check for duplicate options in real-time
    const updatedOptions = {
      ...singleQuestionData,
      [name]: value, // Update the current field being typed
    };
    const filledOptions = options
      .map((option) => updatedOptions[option]?.trim())
      .filter((option) => option !== "" && option !== undefined);
    const uniqueOptions = new Set(filledOptions);

    // If there are duplicates, find which option is causing it
    if (
      filledOptions.length >= 2 &&
      uniqueOptions.size !== filledOptions.length
    ) {
      const duplicates = {};
      const seen = new Set();
      options.forEach((option) => {
        const optValue = updatedOptions[option]?.trim();
        if (optValue && seen.has(optValue)) {
          duplicates[option] = "This option is a duplicate.";
        } else if (optValue) {
          seen.add(optValue);
        }
      });
      setOptionErrors(duplicates);
    } else {
      setOptionErrors({}); // Clear all errors if no duplicates
    }
  };

  const validateOptions = () => {
    const filledOptions = options.filter(
      (option) => singleQuestionData[option]?.trim() !== ""
    );
    return filledOptions.length >= 2;
  };

  const handleSave = () => {
    // Check if the question is filled
    if (!singleQuestionData.question.trim()) {
      setError("Question is required.");
      return;
    }

    // Check if at least two options are filled
    if (!validateOptions()) {
      setError("At least two choices are required.");
      return;
    }

    // Check for duplicate options
    const filledOptions = options
      .map((option) => singleQuestionData[option]?.trim())
      .filter((option) => option !== "" && option !== undefined);
    const uniqueOptions = new Set(filledOptions);
    if (
      filledOptions.length >= 2 &&
      uniqueOptions.size !== filledOptions.length
    ) {
      setError("Options must be unique. Duplicate options are not allowed.");
      return;
    }

    // Check if difficulty level is selected
    if (!singleQuestionData.level) {
      setError("Difficulty level is required.");
      return;
    }

    // Check if blooms level is selected
    if (!singleQuestionData.blooms) {
      setError("Blooms level is required.");
      return;
    }

    // Check if correct answer is selected
    if (!singleQuestionData.answer) {
      setError("Correct answer is required.");
      return;
    }

    // Check if tags are filled
    if (!singleQuestionData.tags.trim()) {
      setError("Tags are required.");
      return;
    }

    // Get filled options values
    const filledOptionValues = options
      .map((optionKey) => singleQuestionData[optionKey]?.trim())
      .filter((optionValue) => optionValue !== "" && optionValue !== undefined);

    // Create a clean question object with the proper options format
    const cleanedQuestion = {
      question: singleQuestionData.question,
      answer: singleQuestionData.answer,
      level: singleQuestionData.level,
      blooms: singleQuestionData.blooms,
      tags: singleQuestionData.tags,
      // Create an array with 4 elements, padding with empty strings if needed
      options: [...filledOptionValues, "", "", "", ""].slice(0, 4),
    };

    // Only include the non-empty options as individual properties
    options.forEach((optionKey) => {
      const optionValue = singleQuestionData[optionKey]?.trim();
      if (optionValue) {
        cleanedQuestion[optionKey] = optionValue;
      }
    });

    // If all validations pass, save the question
    const updatedList = [...questionList];
    if (currentQuestionIndex >= 0) {
      updatedList[currentQuestionIndex] = cleanedQuestion;
    } else {
      updatedList.push(cleanedQuestion);
    }

    setQuestionList(updatedList);
    setError("");
    setOptionErrors({}); // Clear option-specific errors
    setIsModified(false);
    setIsSaved(true);
    setIsNewQuestion(false);

    // Clear the form after saving
    clearForm();
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

  const handleDeleteOption = (optionToDelete) => {
    // Don't allow deleting if only 2 options would remain
    if (options.length <= 2) return;

    // Get the current option values and filter out the deleted option
    const currentOptions = options.reduce((acc, key) => {
      if (key !== optionToDelete) {
        acc[key] = singleQuestionData[key] || "";
      }
      return acc;
    }, {});

    // Create new ordered options array (optionA, optionB, etc.)
    const orderedKeys = Object.keys(currentOptions);
    const newOptions = ["optionA", "optionB", "optionC", "optionD"].slice(
      0,
      orderedKeys.length
    );

    // Create updated question data with properly labeled options
    const updatedQuestionData = { ...singleQuestionData };

    // Clear all option fields first
    ["optionA", "optionB", "optionC", "optionD"].forEach((opt) => {
      updatedQuestionData[opt] = "";
    });

    // Set the values in their proper order
    orderedKeys.forEach((oldKey, index) => {
      const newKey = newOptions[index];
      updatedQuestionData[newKey] = currentOptions[oldKey];
    });

    // Update answer if the deleted option was selected as the answer
    if (singleQuestionData.answer === singleQuestionData[optionToDelete]) {
      updatedQuestionData.answer = "";
    }

    // Update state
    setOptions(newOptions);
    setSingleQuestionData(updatedQuestionData);
    setIsModified(true);
  };

  const handleAddOption = () => {
    // Maximum 4 options (A-D)
    if (options.length >= 4) return;

    // Find the next available option letter
    const availableLetters = ["A", "B", "C", "D"];
    const usedLetters = options.map((opt) => opt.replace("option", ""));

    // Find the first unused letter
    const nextLetter = availableLetters.find(
      (letter) => !usedLetters.includes(letter)
    );

    if (nextLetter) {
      const newOptionKey = `option${nextLetter}`;
      setOptions([...options, newOptionKey]);

      // Initialize the new option with empty string in question data
      setSingleQuestionData((prev) => ({
        ...prev,
        [newOptionKey]: "",
      }));

      setIsModified(true);
    }
  };

  const clearForm = () => {
    // Create a fresh question object with empty fields for all potential options
    const freshQuestion = {
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      answer: "",
      level: "",
      blooms: "",
      tags: "",
    };

    setSingleQuestionData(freshQuestion);
    setCurrentQuestionIndex(-1);
    setIsModified(false);
    setIsSaved(false);
    setIsNewQuestion(true);

    // Reset to default options
    setOptions(["optionA", "optionB", "optionC", "optionD"]);
  };

  const handleFinish = () => {
    if (isModified) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000); // Hide toast after 3 seconds
      return;
    }
    if (questionList.length === 0) {
      setError("Please save at least one question before finishing.");
      return;
    }
    setShowFinishConfirm(true);
  };

  const confirmFinish = () => {
    if (typeof onFinish === "function") {
      onFinish(questionList);
    } else {
      console.error("onFinish is not a function");
      setError("Finish function not provided.");
    }
    setIsSingleQuestionModalOpen(false);
  };

  const loadQuestionIntoForm = (question, index) => {
    setSingleQuestionData(question);
    setCurrentQuestionIndex(index);
    setIsNewQuestion(false);

    // Determine which options are being used in this question
    const usedOptions = Object.keys(question).filter(
      (key) => key.startsWith("option") && question[key]?.trim() !== ""
    );

    // Ensure we have at least the options that have data
    if (usedOptions.length >= 2) {
      setOptions(usedOptions);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-[95%] p-8 overflow-auto max-h-[90vh]">
        <div className="mb-1 flex justify-between items-start ">
          <div className="w-full ">
            <h2 className="text-3xl font-bold text-[#111933]">
              Create Questions
            </h2>
            <div className="mb-6 pb-4 text-lg border-b-2 text-[#111933]">
              Choose how you'd like to add questions to your assessment. Select
              the method that works best for you to quickly build your test.
            </div>
          </div>
          <button
            onClick={() => setIsSingleQuestionModalOpen(false)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-6 h-6 -mt-4 -mr-4" />
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Form */}
          <div className="col-span-8 border-2 p-6 rounded-lg">
            {/* Question Input */}
            <div className="mb-6">
              <label className="text-lg font-medium text-[#111933] mb-2 block">
                Question <span className="text-red-500">*</span>
              </label>
              <textarea
                name="question"
                value={singleQuestionData.question}
                onChange={handleSingleQuestionInputChange}
                placeholder="Enter your question here"
                className="w-full border rounded-lg p-4 text-[#111933] overflow-auto resize-none"
                rows={3}
                required
              />
            </div>

            {/* Options */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-lg font-medium text-[#111933]">
                  Options <span className="text-red-500">*</span>
                </label>
                {options.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center text-[#111933] hover:text-gray-700"
                    disabled={options.length >= 4}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {options.map((optionKey, index) => (
                  <div
                    key={optionKey}
                    className="flex flex-col space-y-1 mb-4 relative"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium bg-[#111933] rounded-md text-white p-2 px-3 w-10 text-center">
                        {optionKey.replace("option", "")}:
                      </span>
                      <div className="flex-1 border rounded-lg py-3 px-2 flex items-center">
                        <input
                          type="text"
                          name={optionKey}
                          value={singleQuestionData[optionKey] || ""}
                          placeholder={`Option ${optionKey.replace(
                            "option",
                            ""
                          )}`}
                          onChange={handleSingleQuestionInputChange}
                          className="flex-1 text-[#111933] outline-none focus:ring-0"
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteOption(optionKey)}
                            className="text-red-500 hover:text-red-700"
                            aria-label={`Delete option ${optionKey.replace(
                              "option",
                              ""
                            )}`}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {optionErrors[optionKey] && (
                      <span className="absolute -bottom-5 text-red-500 text-sm">
                        {optionErrors[optionKey]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty and Blooms Level Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-lg font-medium text-[#111933] mb-2 block">
                  Difficulty Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="level"
                  value={singleQuestionData.level}
                  onChange={handleSingleQuestionInputChange}
                  className="w-full border rounded-lg p-2 text-[#111933]"
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
                  value={singleQuestionData.blooms || ""}
                  onChange={handleSingleQuestionInputChange}
                  className="w-full border rounded-lg p-2 text-[#111933]"
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

            {/* Correct Answer and Tags Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-lg font-medium text-[#111933] mb-2 block">
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <select
                  name="answer"
                  value={singleQuestionData.answer}
                  onChange={handleSingleQuestionInputChange}
                  className="w-full border rounded-lg p-2 text-[#111933]"
                  required
                >
                  <option value="">Select the correct option</option>
                  {options.map(
                    (optionKey) =>
                      singleQuestionData[optionKey]?.trim() && (
                        <option
                          key={optionKey}
                          value={singleQuestionData[optionKey]}
                        >
                          {optionKey.replace("option", "")} -{" "}
                          {singleQuestionData[optionKey]}
                        </option>
                      )
                  )}
                </select>
              </div>
              <div>
                <label className="text-lg font-medium text-[#111933] mb-2 block">
                  Tags <span className="text-red-500">*</span>
                </label>
                <div className="relative border rounded-lg focus-within:ring-2 focus-within:ring-black transition-all h-10">
                  {/* Tags and input field container with fixed height */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 h-full overflow-y-auto">
                    {singleQuestionData.tags
                      .split(",")
                      .filter((tag) => tag.trim())
                      .map((tag, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center bg-[#111933] text-white text-xs px-1.5 py-0.5 rounded-md max-w-[120px] overflow-hidden"
                        >
                          <span className="truncate">{tag.trim()}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedTags = singleQuestionData.tags
                                .split(",")
                                .filter((t) => t.trim())
                                .filter((_, i) => i !== index)
                                .join(", ");
                              handleSingleQuestionInputChange({
                                target: { name: "tags", value: updatedTags },
                              });
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
                        if (
                          (e.key === "Enter" || e.key === ",") &&
                          e.target.value.trim()
                        ) {
                          e.preventDefault();
                          const newTag = e.target.value.trim();

                          // Get existing tags as array
                          const existingTags = singleQuestionData.tags
                            .split(",")
                            .map((t) => t.trim())
                            .filter((t) => t.length > 0);

                          // Check for 3-tag limit
                          if (existingTags.length >= 3) {
                            setError("Maximum of 3 tags allowed");
                            setTimeout(() => setError(""), 3000);
                            return;
                          }

                          // Check if tag already exists
                          if (!existingTags.includes(newTag)) {
                            // Add new tag to existing tags
                            const updatedTags =
                              existingTags.length > 0
                                ? `${singleQuestionData.tags}, ${newTag}`
                                : newTag;

                            handleSingleQuestionInputChange({
                              target: { name: "tags", value: updatedTags },
                            });
                          }

                          // Clear input
                          setTagInput("");
                        }
                      }}
                      className="flex-1 min-w-[100px] h-[26px] px-1 border-none outline-none text-[#111933] bg-transparent"
                      disabled={
                        singleQuestionData.tags
                          .split(",")
                          .filter((tag) => tag.trim()).length >= 3
                      }
                    />
                  </div>

                  {/* Floating label that appears at the border */}
                  <label
                    className={`absolute pointer-events-none transition-all duration-300
        ${
          tagInput ||
          document.activeElement?.name === "tagsInput" ||
          singleQuestionData.tags
            ? "top-0 left-2 transform -translate-y-1/2 scale-75 text-[#111933] bg-white px-1 z-10"
            : "top-1/2 left-2 transform -translate-y-1/2 text-gray-500"
        }
      `}
                  >
                    {singleQuestionData.tags
                      .split(",")
                      .filter((tag) => tag.trim()).length >= 3
                      ? "Maximum tags reached"
                      : "Enter tag and press Enter"}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Question List Sidebar */}
          <aside className="col-span-4 border-2 p-6 rounded-lg flex flex-col">
            <h3 className="font-semibold text-[#111933] mb-4">Question List</h3>
            <div
              className="flex-grow overflow-y-auto"
              style={{
                maxHeight: "400px",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <ul className="space-y-4 p-2">
                {questionList.map((q, index) => (
                  <li
                    key={index}
                    className={` bg-white border text-black rounded-lg flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition-shadow ${
                      currentQuestionIndex === index
                        ? "border-[#32ab24] border-2"
                        : ""
                    }`}
                    onClick={() => loadQuestionIntoForm(q, index)}
                  >
                    <div className="text-black font-medium rounded-md truncate flex-1  py-3">
                      <span className="rounded-l-xl px-4 py-8 bg-[#111933] text-white text-sm mr-2">
                        {index + 1}
                      </span>
                      <span className="font-medium">
                        {q.question || "No question text"}
                      </span>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-700 flex-shrink-0 mr-2"
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

        {/* Action Buttons */}
        <div className="flex justify-between mr-32 mt-4">
          <div className="flex items-center justify-between gap-80">
            {questionList.length > 0 && (
              <button
                type="button"
                className="py-2 px-4 bg-white border border-[#111933] font-semibold text-[#111933] rounded-md flex items-center justify-center gap-2"
                onClick={() => {
                  const prevIndex =
                    currentQuestionIndex > 0
                      ? currentQuestionIndex - 1
                      : questionList.length - 1;
                  if (prevIndex >= 0)
                    loadQuestionIntoForm(questionList[prevIndex], prevIndex);
                }}
              >
                <ChevronRight size={20} className="rotate-180" />
                Previous
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="py-2 px-4 border font-semibold bg-[#ffcc00b6] hover:bg-[#ffcc00] text-black rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                Object.keys(optionErrors).length > 0 ||
                !validateOptions() ||
                !singleQuestionData.question.trim() ||
                !singleQuestionData.level ||
                !singleQuestionData.blooms ||
                !singleQuestionData.answer ||
                !singleQuestionData.tags.trim()
              }
            >
              Save
            </button>

            <button
              type="button"
              className={`py-2 px-4 bg-[#111933] font-semibold text-white rounded-md flex items-center justify-center gap-2 ${
                isNewQuestion ? "opacity-50 cursor-not-allowed" : ""
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
              disabled={isNewQuestion}
            >
              Next <ChevronRight size={20} />
            </button>
          </div>

          <div className="mx-12">
            <button
              type="button"
              onClick={handleFinish}
              className="py-2 px-6 bg-green-200 text-green-900 border border-green-900 font-semibold rounded-md"
            >
              Finish
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-2 rounded-lg text-sm font-medium text-center shadow-sm bg-red-100 text-red-800">
            {error}
          </div>
        )}

        {/* Toast Message */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
            Save the question before finishing.
          </div>
        )}

        {/* Finish Confirmation Modal */}
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
                  className="px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-[#111933da]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionModal;
