import React from "react";
import { ChevronRight, Eye, Loader2 } from "lucide-react";
import Pagination from "@mui/material/Pagination";

import { Trash2 } from "lucide-react";

const QuestionsList = ({
  questions,
  loading,
  error,
  currentQuestions,
  setSelectedQuestion,
  currentPage,
  totalPages,
  setCurrentPage,
  handleDelete, // Ensure this prop is passed from the parent component
}) => {
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  return (
    <div className="bg-white px-8 shadow-sm rounded-b-lg">
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            <strong className="font-medium">Error: </strong>
            <span>{error}</span>
          </div>
        ) : (
          <>
            {currentQuestions.map((question, index) => (
              <div
                key={index}
                className="flex items-center bg-white hover:shadow-md hover:scale-y-102 transition-all duration-300 cursor-pointer mb-2 rounded-xl border border-gray-400"
              >
                <div className="text-center text-sm font-light text-[#fff] rounded-l-xl mr-4 py-4 px-4 bg-[#111933] w-12">
                  <strong>{index + 1 + (currentPage - 1) * 10}</strong>
                </div>
                <div
                  className="text-left text-sm font-medium text-[#111933] truncate w-7/12 capitalize flex-1"
                  onClick={() => setSelectedQuestion(question)}
                >
                  {question.question}
                </div>
                <div className="text-left text-sm ml-12 text-[#111933] w-3/12 inline-flex items-center space-x-2 min-w-0">
                  <strong>Answer:</strong>
                  <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                    {question.correctAnswer}
                  </span>
                </div>
                <div className="text-right ml-10 mr-5">
                  <Trash2
                    className="w-5 h-5 text-[#111933] cursor-pointer"
                    onClick={() => handleDelete(question.question_id)}
                  />
                </div>
              </div>
            ))}
            {questions.length > 10 && (
              <div className="flex justify-center mt-6 py-2">
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  sx={{
                    "& .MuiPaginationItem-root": {
                      color: "#111933",
                    },
                    "& .MuiPaginationItem-root.Mui-selected": {
                      backgroundColor: "#111933",
                      color: "#fff",
                    },
                    "& .MuiPaginationItem-root:hover": {
                      backgroundColor: "rgba(0, 9, 117, 0.4)",
                      color: "#fff",
                    },
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionsList;