import React, { useState } from "react";

export default function QuestionNumbers({
  questionNumbers,
  questionStatuses,
  onQuestionClick,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 30; // Changed from 50 to 30
  const totalPages = Math.ceil(questionNumbers.length / questionsPerPage);

  const handleClick = (index) => {
    onQuestionClick(index);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getPaginatedQuestions = () => {
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    return questionNumbers.slice(startIndex, endIndex);
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5; // Maximum number of page buttons to show
    
    // Always add first page
    items.push({
      page: 1,
      label: 1,
      isCurrent: currentPage === 1
    });
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      items.push({ page: null, label: '...', isCurrent: false });
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last as they're always shown
      items.push({
        page: i,
        label: i,
        isCurrent: currentPage === i
      });
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2 && totalPages > 3) {
      items.push({ page: null, label: '...', isCurrent: false });
    }
    
    // Add last page if there are more than 1 pages
    if (totalPages > 1) {
      items.push({
        page: totalPages,
        label: totalPages,
        isCurrent: currentPage === totalPages
      });
    }
    
    return items;
  };

  const paginatedQuestionNumbers = getPaginatedQuestions();
  const paginationItems = getPaginationItems();

  return (
    <div>
      <div className="grid grid-cols-6 gap-x-4 gap-y-4 mr-4">
        {paginatedQuestionNumbers.map((num, index) => {
          const actualIndex = (currentPage - 1) * questionsPerPage + index;
          return (
            <div
              key={num}
              className={`w-10 h-10 flex items-center justify-center border rounded-md text-center cursor-pointer ${
                questionStatuses[actualIndex] === "current"
                  ? "bg-[#FEF5DE] border border-[#FDC500] text-[#111933]"
                  : questionStatuses[actualIndex] === "review"
                  ? "bg-[#C4DBFF] border border-[#1D3150] text-[#111933]"
                  : questionStatuses[actualIndex] === "answered"
                  ? "bg-[#E1F9F0] text-[#111933] border border-[#34D399]"
                  : questionStatuses[actualIndex] === "notAttempted"
                  ? "bg-[#FEEAEA] border border-[#BC1C21] text-[#111933]"
                  : "border border-[#ffe078] text-[#111933]"
              }`}
              onClick={() => handleClick(actualIndex)}
            >
              {num}
            </div>
          );
        })}
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {/* Previous page button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#111933] disabled:opacity-50 hover:bg-gray-100"
            aria-label="Previous page"
          >
            ‹
          </button>
          
          {/* Page number buttons */}
          {paginationItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.page === null ? (
                // Ellipsis
                <span className="w-8 h-8 flex items-center justify-center text-[#111933]">
                  {item.label}
                </span>
              ) : (
                // Page button
                <button
                  onClick={() => handlePageChange(item.page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    item.isCurrent
                      ? "bg-[#111933] text-white font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                  aria-label={`Page ${item.label}`}
                  aria-current={item.isCurrent ? "page" : undefined}
                >
                  {item.label}
                </button>
              )}
            </React.Fragment>
          ))}
          
          {/* Next page button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#111933] disabled:opacity-50 hover:bg-gray-100"
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}