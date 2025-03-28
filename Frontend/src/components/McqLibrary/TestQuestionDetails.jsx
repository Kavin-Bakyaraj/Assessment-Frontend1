import React, { useState, useEffect } from 'react';
import { X, CheckCircleIcon } from 'lucide-react';
import { getLevelBadgeColor, renderTags } from '../../lib/utils';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { IoClose } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { RiCheckboxCircleFill } from "react-icons/ri";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const TestQuestionDetails = ({
  selectedQuestion,
  setSelectedQuestion,
  testId,
  isLoading,
  setIsLoading,
  setView,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [originalQuestion, setOriginalQuestion] = useState(null);

  useEffect(() => {
    if (isEditing && !originalQuestion) {
      setOriginalQuestion(JSON.parse(JSON.stringify(selectedQuestion)));
    }
  }, [isEditing, selectedQuestion, originalQuestion]);

  const handleChange = (field, value) => {
    console.log(`Updating ${field} to`, value); // Debugging line
    setSelectedQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setSelectedQuestion(originalQuestion);
    setOriginalQuestion(null);
    setIsEditing(false);
  };

  const handleQuestionUpdate = async (questionId) => {
    setIsLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/edit_question_in_test/${testId}/${questionId}/`,
        selectedQuestion,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.status === 200) {
        toast.success('Question updated successfully!');
        setOriginalQuestion(null);
        setSelectedQuestion(response.data); // Update with the response data
        setIsEditing(false);
        setView('list');
        window.location.reload();
      } else {
        toast.error('Failed to update the question.');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('An error occurred while updating the question.');
    } finally {
      setIsLoading(false);
    }
  };

  const toCamelCase = (str) => {
    if (!str) return '';
    return str.replace(/(^|\s)\S/g, (t) => t.toUpperCase());
  };

  const tagsArray = Array.isArray(selectedQuestion.tags)
    ? selectedQuestion.tags
    : selectedQuestion.tags
      ? [selectedQuestion.tags]
      : [];

  const addOption = () => {
    const newOptions = [...selectedQuestion.options, ""];
    handleChange("options", newOptions);
  };

  const bloomsLevels = [
    "L1 - Remember",
    "L2 - Understanding",
    "L3 - Apply",
    "L4 - Analyze",
    "L5 - Evaluate",
    "L6 - Create",
  ];

  // Helper function to check for repeated characters
  const hasRepeatedCharacters = (str) => {
    const regex = /(.)\1{8,}/;
    return regex.test(str);
  };

  // Handler for question input change
  const handleQuestionChange = (e) => {
    const value = e.target.value;
    if (!hasRepeatedCharacters(value)) {
      handleChange("question", value);
    }
  };

  // Handler for option input change
  const handleOptionChange = (optIndex, e) => {
    const value = e.target.value;
    if (!hasRepeatedCharacters(value)) {
      const newOptions = [...selectedQuestion.options];
      newOptions[optIndex] = value;
      handleChange("options", newOptions);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-[60]">
      <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#111933]">Edit Question</h3>
          <button
            onClick={() => {
              setSelectedQuestion(null);
              setIsEditing(false);
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
              value={selectedQuestion.question}
              onChange={handleQuestionChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              rows={3}
              placeholder="Enter question text"
              required
            />
          </div>
          <div className="flex w-full justify-between">
            <div className="w-1/2 mr-2">
              <label className="block text-sm font-medium text-[#111933] mb-1">
                Level*
              </label>
              <select
                value={selectedQuestion.level || ""}
                onChange={(e) => handleChange("level", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="w-1/2 ml-2">
              <label className="block text-sm font-medium text-[#111933] mb-1">
                Bloom's Taxonomy Level*
              </label>
              <select
                value={selectedQuestion.blooms || ""}
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
              {selectedQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={selectedQuestion.correctAnswer === option}
                    onChange={() => handleChange("correctAnswer", option)}
                    className="mr-2 h-4 w-4 accent-[#111933]"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
            {selectedQuestion.options.length < 4 && (
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
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => handleQuestionUpdate(selectedQuestion.question_id)}
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

export default TestQuestionDetails;
