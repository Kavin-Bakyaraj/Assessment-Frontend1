import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateManuallyIcon from "../../../assets/bulkupload1.png";
import BulkUploadIcon from "../../../assets/bulkupload2.png";
import QuestionLibraryIcon from "../../../assets/qlibrary1.png";
import AIGeneratorIcon from "../../../assets/aigenerator.svg";
import TestLibraryIcon from "../../../assets/testlibrary(questiondashboard).svg";

const QuestionModal = ({ onClose, handleCreateManually, handleBulkUpload, handleMcqlibrary }) => {
  const [showLibraryOptions, setShowLibraryOptions] = useState(false);
  const navigate = useNavigate();

  const handleLibraryClick = () => {
    setShowLibraryOptions(true);
  };

  const handleQuestionLibrary = () => {
    navigate('/mcq/section/questionLibrary');
    onClose();
  };

  const handleTestLibrary = () => {
    navigate('/mcq/section/testLibrary');
    onClose();
  };

  const handleAIgenerator = () => {
    navigate('/mcq/section/AIgenerator');
  }

  const handlemanualupload = () => {
    navigate('/mcq/section/manual');
  }

  const handlebulkupload = () => {
    navigate('/mcq/section/bulkupload');
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="p-4 sm:p-6 md:p-10 pb-8 sm:pb-10 md:pb-14 w-full max-w-[90%] sm:max-w-3xl md:max-w-6xl max-h-[90vh] mx-auto bg-white rounded-xl shadow-lg relative overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl sm:text-2xl text-[#111933] font-bold mb-1 ml-4 sm:ml-6 md:ml-10 text-left">
            Add and manage your questions
          </h3>
          <button
            onClick={onClose}
            className="ml-auto text-gray-500 hover:text-gray-700 p-2"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#111933] mb-4 mx-4 sm:mx-6 md:mx-10 text-left">
          Choose how you'd like to add questions to your assessment. Select the method that works best for you to quickly build your test.
        </p>
        <hr className="mb-4 sm:mb-6 mx-4 sm:mx-6 md:mx-10 border-gray-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mx-4 sm:mx-10 md:mx-40">
          {showLibraryOptions ? (
            <>
              <button
                onClick={handleQuestionLibrary}
                className="p-6 sm:p-8 md:p-10 bg-white border border-[#111933] rounded-lg cursor-pointer flex flex-col items-center"
              >
                <img
                  src={QuestionLibraryIcon}
                  alt="Question Library"
                  className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-[#111933] mb-1 sm:mb-2">
                  Question Library
                </h3>
                <p className="text-xs sm:text-sm text-[#111933] text-center">
                  Pick from your saved library, organized by topic and ready to reuse.
                </p>
              </button>
              <button
                onClick={handleTestLibrary}
                className="p-6 sm:p-8 md:p-10 bg-white border border-[#111933] rounded-lg cursor-pointer flex flex-col items-center"
              >
                <img
                  src={TestLibraryIcon}
                  alt="Test Library"
                  className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-[#111933] mb-1 sm:mb-2">
                  Test Library
                </h3>
                <p className="text-xs sm:text-sm text-[#111933] text-center">
                  Pick from your saved test library, organized by topic and ready to reuse.
                </p>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlemanualupload}
                className="p-4 sm:p-5 md:p-5 bg-white border border-[#111933] rounded-xl cursor-pointer flex flex-col items-center shadow-lg"
              >
                <img
                  src={CreateManuallyIcon}
                  alt="Create Manually"
                  className="w-10 h-10 sm:w-8 sm:h-9 mb-3 sm:mb-5"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-[#111933] mb-1 sm:mb-2">
                  Create Manually
                </h3>
                <p className="text-xs sm:text-sm text-[#111933] text-center">
                  Enter each question and its options directly. Perfect for custom content!
                </p>
              </button>
              <button
                onClick={handlebulkupload}
                className="p-4 sm:p-5 md:p-5 bg-white border border-[#111933] rounded-xl cursor-pointer flex flex-col items-center shadow-lg"
              >
                <img
                  src={BulkUploadIcon}
                  alt="Bulk Upload"
                  className="w-10 h-10 sm:w-10 sm:h-10 mb-3 sm:mb-4"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-[#111933] mb-1 sm:mb-2">
                  Bulk Upload
                </h3>
                <p className="text-xs sm:text-sm text-[#111933] text-center">
                  Upload a CSV or Excel file with your questions and options for bulk addition.
                </p>
              </button>
              <button
                onClick={handleLibraryClick}
                className="p-4 sm:p-5 md:p-5 bg-white border border-[#111933] rounded-xl cursor-pointer flex flex-col items-center shadow-lg"
              >
                <img
                  src={QuestionLibraryIcon}
                  alt="Library"
                  className="w-1 h-1 sm:w-10 sm:h-10 mb-3 sm:mb-5"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-[#111933] mb-1 sm:mb-2">
                  Library
                </h3>
                <p className="text-xs sm:text-sm text-[#111933] text-center">
                  Pick from your saved questions library, organized by topic and ready to reuse.
                </p>
              </button>
              <button
                onClick={handleAIgenerator}
                className="p-4 sm:p-5 md:p-5 bg-white border border-[#111933] rounded-xl cursor-pointer flex flex-col items-center shadow-lg"
              >
                <img
                  src={AIGeneratorIcon}
                  alt="AI Generator"
                  className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-[#111933] mb-1 sm:mb-2">
                  AI Generator
                </h3>
                <p className="text-xs sm:text-sm text-[#111933] text-center">
                  Automatically generate questions based on your selected topic.
                </p>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;
