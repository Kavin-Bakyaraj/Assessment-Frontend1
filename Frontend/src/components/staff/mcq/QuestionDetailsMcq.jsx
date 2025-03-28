import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IoClose } from "react-icons/io5";
import { RiCheckboxCircleFill } from "react-icons/ri";

const QuestionDetailsMcq = ({
  selectedQuestion,
  setSelectedQuestion,
  setSelectedQuestions,
  allQuestions,
  isLoading,
  isBulkUpload,
}) => {
  const [editedQuestion, setEditedQuestion] = useState(null);

  useEffect(() => {
    if (selectedQuestion) {
      setEditedQuestion({ ...selectedQuestion });
    } else {
      setEditedQuestion({
        question: "",
        options: ["", ""],
        correctAnswer: "",
        level: "",
        blooms: "",
        tags: [],
      });
    }
  }, [selectedQuestion]);

  const handleChange = (field, value) => {
    const repeatedCharRegex = /(.)\1{8,}/;
    if (repeatedCharRegex.test(value)) return;
    setEditedQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const toCamelCase = (str) => {
    if (!str) return "";
    return str.replace(/(^|\s)\S/g, (t) => t.toUpperCase());
  };

  const handleUpdateQuestion = () => {
    const { question, options, correctAnswer, level, blooms } = editedQuestion;

    if (!question.trim()) {
      toast.error("Question cannot be empty.");
      return;
    }

    const filledOptions = options.filter((opt) => opt.trim() !== "");
    if (filledOptions.length < 2) {
      toast.error("A question must have at least 2 options.");
      return;
    }

    if (!filledOptions.includes(correctAnswer)) {
      toast.error("Please select a correct answer from the available options.");
      return;
    }

    if (!level) {
      toast.error("Please select a difficulty level.");
      return;
    }

    if (!blooms) {
      toast.error("Please select a blooms level.");
      return;
    }

    const updatedQuestion = {
      ...editedQuestion,
      options: filledOptions,
    };

    setSelectedQuestions(
      allQuestions.map((q) =>
        isBulkUpload
          ? q.question === updatedQuestion.question
            ? updatedQuestion
            : q
          : q.question_id === updatedQuestion.question_id
          ? updatedQuestion
          : q
      )
    );
    setSelectedQuestion(null);
    toast.success("Question updated");
  };

  const addOption = () => {
    if (!editedQuestion) return;
    if ((editedQuestion.options || []).length < 4) {
      const newOptions = [...(editedQuestion.options || []), ""];
      handleChange("options", newOptions);
    } else {
      toast.warning("Maximum of 4 options allowed.");
    }
  };

  if (!editedQuestion) {
    return null;
  }

  const tagsArray = Array.isArray(editedQuestion.tags)
    ? editedQuestion.tags
    : editedQuestion.tags
    ? [editedQuestion.tags]
    : [];

  const bloomsLevels = [
    "N/A",
    "L1 - Remember",
    "L2 - Understanding",
    "L3 - Apply",
    "L4 - Analyze",
    "L5 - Evaluate",
    "L6 - Create",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-[60]">
      <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#111933]">Edit Question</h3>
          <button
            onClick={() => {
              setSelectedQuestion(null);
            }}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <IoClose className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#111933] mb-1">
              Question*
            </label>
            <textarea
              value={editedQuestion.question}
              onChange={(e) => handleChange("question", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              rows={3}
              placeholder="Enter question text"
              required
            />
          </div>
          <div className="flex w-full">
            <div className="w-1/2 pr-2">
              <label className="block text-sm font-medium text-[#111933] mb-1">
                Level*
              </label>
              <select
                value={editedQuestion.level}
                onChange={(e) => handleChange("level", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="w-1/2 pl-2">
            <label className="block text-sm font-medium text-[#111933] mb-1">
              Bloom's Taxonomy Level*
            </label>
            <select
              value={editedQuestion.blooms || "N/A"}
              onChange={(e) => handleChange("blooms", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              {bloomsLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111933] mb-1">
              Tags*
            </label>
            <input
              type="text"
              value={tagsArray.join(", ")}
              onChange={(e) =>
                handleChange(
                  "tags",
                  e.target.value.split(",").map((tag) => tag.trim())
                )
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="Add tags..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111933] mb-1">
              Options*
            </label>
            <div className="space-y-3">
              {editedQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={editedQuestion.correctAnswer === option}
                    onChange={() => handleChange("correctAnswer", option)}
                    className="mr-2 h-4 w-4 accent-[#111933]"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...editedQuestion.options];
                      if (!/(.)\1{8,}/.test(e.target.value)) {
                        newOptions[index] = e.target.value;
                        handleChange("options", newOptions);
                      }
                    }}
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
            {editedQuestion.options.length < 4 && (
              <button
                onClick={addOption}
                className="mt-2 text-[#111933] bg-white border border-[#111933] px-4 py-2 rounded-lg transition"
              >
                Add Option
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setSelectedQuestion(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateQuestion}
              disabled={isLoading}
              className="px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-opacity-90 text-sm"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetailsMcq;
