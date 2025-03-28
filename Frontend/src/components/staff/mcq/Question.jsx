import React, { useState, useEffect } from "react";


// Utility function to shuffle an array
const shuffleArray = (array) => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

export default function Question({
  question,
  currentIndex,
  onAnswerSelect,
  selectedAnswers,
  onReviewMark,
  reviewStatus,
  shuffleOptions,
}) {
  const [selectedOption, setSelectedOption] = useState(
    selectedAnswers[currentIndex] || null
  );
  const [shuffledOptions, setShuffledOptions] = useState([]);



  // Shuffle options when the question changes
  useEffect(() => {
    if(shuffleOptions) {
      setShuffledOptions(shuffleArray(question.options));
    } else {
      setShuffledOptions(question.options);
    }
  }, [question]);

  // Update selected option when selectedAnswers changes
  useEffect(() => {
    setSelectedOption(selectedAnswers[currentIndex] || null);
  }, [selectedAnswers, currentIndex]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    onAnswerSelect(currentIndex, option); // Update selected answers in the parent component
  };


  return (
    <div className="flex-1 relative flex flex-col px-4 mb-40 md:px-14">
  <div className="flex justify-between items-center my-6">
    <h2 className="text-[#00296b] text-lg md:text-xl font-normal">
      Question {currentIndex + 1}
    </h2>
    <button
      className={`text-sm border rounded-full px-4 w-40 py-1 ${
        reviewStatus[currentIndex] ? "text-[#111933] bg-[#C4DBFF] border-[#1D3150]" : "text-red-500 border-red-500"
      }`}
      onClick={() => onReviewMark(currentIndex)}
    >
      {reviewStatus[currentIndex] ? "Marked for Review" : "Mark for Review"}
    </button>
  </div>

  <p className="text-lg font-normal mb-8">{question.text}</p>

  <div className="space-y-4 mb-12 flex-grow">
    {shuffledOptions.map((option, idx) => (
      <div
        key={idx}
        className="flex items-center cursor-pointer"
        onClick={() => handleOptionSelect(option)}
      >
        <button
          className={`w-14 h-14 flex items-center justify-center mr-4 border rounded-lg transition-colors text-lg font-semibold ${
            selectedOption === option ? "border-[#111933] bg-[#111933] text-white" : ""
          }`}
        >
          {String.fromCharCode(65 + idx)}
        </button>
        <span className={`flex-1 px-4 md:px-14 py-4 border rounded-lg transition-colors text-lg  font-normal ${
          selectedOption === option ? "border-[#111933] bg-[#111933] text-white" : ""
        }`}>
          {option}
        </span>
      </div>
    ))}
  </div>
</div>
  
  
  );
}