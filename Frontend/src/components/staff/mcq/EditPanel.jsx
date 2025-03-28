import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditSlidePanel = ({ isOpen, onClose, question, onSave }) => {
  const [editedQuestion, setEditedQuestion] = useState({
    question: '',
    options: [],
    correctAnswer: '',
    blooms: ''
  });

  useEffect(() => {
    if (question) {
      setEditedQuestion({
        ...question,
        options: question.options || []
      });
    }
  }, [question, isOpen]);

  const optionLabels = ['A.', 'B.', 'C.', 'D.', 'E.', 'F.']; // Labels for options

  const handleSave = () => {
    // Validate question
    if (!editedQuestion.question.trim()) {
      toast.error('Please enter the question.');
      return;
    }

    // Validate correct answer selection
    if (!editedQuestion.correctAnswer.trim()) {
      toast.error('Please select a correct answer.');
      return;
    }

    // Validate options
    if (editedQuestion.options.some(option => !option.trim())) {
      toast.error('All options must be filled.');
      return;
    }

    onSave(editedQuestion);
  };

  const addOption = () => {
    if (editedQuestion.options.length >= 4) {
      toast.error('You can have a maximum of 4 options.');
      return;
    }
    setEditedQuestion({
      ...editedQuestion,
      options: [...editedQuestion.options, '']
    });
  };

  const removeOption = (index) => {
    if (editedQuestion.options.length <= 2) {
      toast.error('You must have at least 2 options.');
      return;
    }
    const newOptions = [...editedQuestion.options];
    newOptions.splice(index, 1);
    setEditedQuestion({
      ...editedQuestion,
      options: newOptions,
      correctAnswer: newOptions.includes(editedQuestion.correctAnswer)
        ? editedQuestion.correctAnswer
        : ''
    });
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-[60]"
          onClick={onClose}
        />
      )}

      {/* Slide Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-[70] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-[#111933]">Edit Question</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto h-[calc(100%-140px)]">
          <div className="space-y-6">
            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-[#111933] mb-1">
                Question*
              </label>
              <textarea
                value={editedQuestion.question}
                onChange={(e) => setEditedQuestion({...editedQuestion, question: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                rows={3}
                placeholder="Enter question text"
                required
              />
            </div>
             {/* Blooms Dropdown */}
             <div>
              <label className="block text-sm font-medium text-[#111933] mb-1">
                Blooms*
              </label>
              <select
                value={editedQuestion.blooms}
                onChange={(e) => setEditedQuestion({...editedQuestion, blooms: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">Select Blooms level</option>
                <option value="L1">L1 - Remember</option>
                <option value="L2">L2 - Understanding</option>
                <option value="L3">L3 - Apply</option>
                <option value="L4">L4 - Analyze</option>
                <option value="L5">L5 - Evaluate</option>
                <option value="L6">L6 - Create</option>
              </select>
            </div>

            {/* Options with Labels and Radio Buttons */}
            <div>
              <label className="block text-sm font-medium text-[#111933] mb-1">
                Options*
              </label>
              <div className="space-y-3">
                {editedQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center border px-2 rounded-lg">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={editedQuestion.correctAnswer === option}
                      onChange={() => setEditedQuestion({...editedQuestion, correctAnswer: option})}
                      className="mr-2 h-4 w-4 accent-[#111933]"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editedQuestion.options];
                        newOptions[index] = e.target.value;
                        setEditedQuestion({...editedQuestion, options: newOptions});
                      }}
                      className="flex-grow p-2  rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
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

           
          </div>
        </div>

        {/* Footer with Proper Button Alignment */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-opacity-90 text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </>
  );
};

export default EditSlidePanel;
