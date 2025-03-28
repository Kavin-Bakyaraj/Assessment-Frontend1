
import React, { useState, useEffect } from "react";

const shuffleArray = (array) => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

export default function SectionBasedQuestion({
  sections,
  currentSectionIndex,
  currentQuestionIndex,
  onNext,
  onPrevious,
  onFinish,
  onAnswerSelect,
  selectedAnswers,
  onReviewMark,
  reviewStatus,
  sectionTimes,
  submittedSections,
}) {
  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalQuestions = currentSection?.questions.length || 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isLastSection = currentSectionIndex === sections.length - 1;
  const isSectionFinished = sectionTimes?.[currentSectionIndex]?.isFinished;
  const isSectionSubmitted = submittedSections?.[currentSectionIndex] || false;
  
  // Use submitted status to determine if section is editable
  const isEditable = !isSectionSubmitted && !isSectionFinished;

  // Add this: selected option state
  const [selectedOption, setSelectedOption] = useState(
    selectedAnswers[currentSectionIndex]?.[currentQuestionIndex]
  );
  
  // Add this: shuffled options state
  const [shuffledOptions, setShuffledOptions] = useState([]);
  
  // Add this: update selected option when changing questions
  useEffect(() => {
    setSelectedOption(selectedAnswers[currentSectionIndex]?.[currentQuestionIndex]);
  }, [currentSectionIndex, currentQuestionIndex, selectedAnswers]);
  
  // Add this: shuffle options when question changes
  useEffect(() => {
    if (currentQuestion?.options) {
      // Create a stable random seed based on questionId to ensure consistent shuffling
      const questionId = `${currentSectionIndex}-${currentQuestionIndex}`;
      const seededShuffleArray = (array) => {
        const shuffledArray = [...array];
        // Simple deterministic shuffle based on questionId
        // This ensures the order is consistent for the same question
        const seed = questionId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        
        // Shuffle with seed
        for (let i = shuffledArray.length - 1; i > 0; i--) {
          const j = Math.floor(((i + 1) * seed) % (i + 1));
          [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
      };
      
      setShuffledOptions(seededShuffleArray(currentQuestion.options));
    } else {
      setShuffledOptions([]);
    }
  }, [currentSectionIndex, currentQuestionIndex, currentQuestion]);

  // Modify the handleOptionSelect function to check submission status
  const handleOptionSelect = (option) => {
    if (!isEditable) {
      // If section is submitted or finished, prevent changes
      return;
    }
    
    setSelectedOption(option);
    onAnswerSelect(currentSectionIndex, currentQuestionIndex, option);
  };

  // Add a message banner for submitted sections
  const SubmittedBanner = () => {
    if (isSectionSubmitted) {
      return (
        <div className="bg-gray-100  border-green-500 p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                This section has been submitted and cannot be edited.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Add this for the popup state
  const [showPopup, setShowPopup] = useState(false);
  
  // Add these functions for popup handling
  const closePopup = () => setShowPopup(false);
  
  const confirmFinish = () => {
    closePopup();
    onFinish();
  };

  return (
    <div className="flex-1 relative flex flex-col px-4 md:px-14">
      <div className="flex justify-between items-center my-6">
        <h2 className="text-[#111933] text-lg md:text-xl font-normal">
          Question {currentQuestionIndex + 1}
        </h2>
        <button
          className={`text-sm border rounded-lg px-5 py-1 w-40 ${
            !isEditable 
              ? "text-gray-400 border-gray-400 cursor-not-allowed"
              : reviewStatus[currentSectionIndex]?.[currentQuestionIndex]
              ? "text-[#111933] border-[#111933] bg-[#C4DBFF]"
              : "text-red-500 border-red-500"
          }`}
          onClick={() => isEditable && onReviewMark(currentSectionIndex, currentQuestionIndex)}
          disabled={!isEditable}
        >
          {reviewStatus[currentSectionIndex]?.[currentQuestionIndex] ? "Marked for Review" : "Mark for Review"}
        </button>
      </div>

      {/* Add submitted banner */}
      <SubmittedBanner />

      <p className="text-lg font-normal mb-8">{currentQuestion?.text}</p>

      <div className="space-y-4 mb-12 flex-grow">
        {shuffledOptions.map((option, idx) => (
          <div
            key={idx}
            className={`flex items-center ${isEditable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onClick={() => handleOptionSelect(option)}
          >
            <button
              className={`w-[54px] h-[52px] flex items-center justify-center mr-4 border rounded-lg transition-colors text-lg font-semibold ${
                selectedOption === option ? "border-[#111933] bg-[#111933] text-white" : ""
              } ${!isEditable ? 'opacity-50' : ''}`}
              disabled={!isEditable}
            >
              {String.fromCharCode(65 + idx)}
            </button>
            <span className={`flex-1 px-4 md:px-14 py-3 border rounded-lg transition-colors text-lg font-normal ${
              selectedOption === option ? "border-[#00296b] bg-[#111933] text-white" : ""
            } ${!isEditable ? 'opacity-50' : ''}`}>
              {option}
            </span>
          </div>
        ))}
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-[600px] p-6 rounded-xl shadow-lg">
            <h3 className="text-[#111933] text-lg font-bold mb-4">
              MCT Mock Test
            </h3>
            <p className="text-center text-sm mb-4">
              You have gone through all the questions. <br />
              Either browse through them once again or finish your assessment.
            </p>
            <div className="grid grid-cols-6 gap-2 mb-6">
              {Array.from({ length: totalQuestions }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-10 h-10 flex items-center justify-center rounded-md text-white ${
                    selectedAnswers[currentSectionIndex]?.[idx] ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
            <div className="flex justify-center items-center mb-4">
              <div className="relative w-24 h-24">
                <svg className="absolute inset-0 w-full h-full">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="38"
                    stroke="#E0E0E0"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="38"
                    stroke="#111933"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="238"
                    strokeDashoffset={`${
                      238 - (Object.keys(selectedAnswers[currentSectionIndex] || {}).length / totalQuestions) * 238
                    }`}
                    style={{
                      transform: "rotate(-90deg)",
                      transformOrigin: "center",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[#111933] font-bold text-xl">
                    {Object.keys(selectedAnswers[currentSectionIndex] || {}).length}/{totalQuestions}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                className="border border-red-500 text-red-500 px-6 py-2 rounded-full"
                onClick={closePopup}
              >
                Close
              </button>
              <button
                className="bg-[#fdc500] text-[#111933] px-6 py-2 rounded-full"
                onClick={confirmFinish}
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}