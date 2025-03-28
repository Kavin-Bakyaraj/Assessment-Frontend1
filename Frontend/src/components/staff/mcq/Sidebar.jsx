import React, { useState, useEffect } from "react";
import Legend from "./Legend";
import QuestionNumbers from "./QuestionNumbers";

export default function Sidebar({
  totalQuestions,
  currentIndex,
  selectedAnswers,
  reviewStatus,
  onQuestionClick,
  contestId = "default", // Add contestId prop with default value
}) {
  const length = totalQuestions || 0;
  const questionNumbers = Array.from({ length }, (_, i) => i + 1);

  // Initialize visitedQuestions state from sessionStorage or default to all false
  const [visitedQuestions, setVisitedQuestions] = useState(() => {
    const storedVisited = sessionStorage.getItem(`visitedQuestions_${contestId}`);
    return storedVisited 
      ? JSON.parse(storedVisited) 
      : Array(length).fill(false);
  });

  // Update question visited status when current question changes
  useEffect(() => {
    setVisitedQuestions(prev => {
      const newVisited = [...prev];
      if (!newVisited[currentIndex]) {
        newVisited[currentIndex] = true;
      }
      return newVisited;
    });
  }, [currentIndex]);

  // Save visitedQuestions to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(`visitedQuestions_${contestId}`, JSON.stringify(visitedQuestions));
  }, [visitedQuestions, contestId]);

  const getQuestionStatus = (index) => {
    if (reviewStatus[index]) return "review";
    if (index === currentIndex) return "current";
    if (selectedAnswers[index] !== undefined) return "answered";
    if (visitedQuestions[index]) return "notAttempted";
    return "notAnswered";
  };

  const questionStatuses = questionNumbers.map((_, i) => getQuestionStatus(i));

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
        <div className="ml-6">
        <Legend />
        </div>
        <hr className="text-gray-300 mt-5 mb-2" />
        <div className="ml-6">
        <QuestionNumbers
          questionNumbers={questionNumbers}
          questionStatuses={questionStatuses}
          onQuestionClick={onQuestionClick}
        />
        </div>
      </div>
    </div>
  );
}