import React from 'react';
import { ChevronLeft, ChevronRight, Edit2, Check } from 'lucide-react';
import { IoIosArrowForward } from "react-icons/io";

const PreviewTable = ({
  questions = [],
  selectedQuestions = [],
  currentPage,
  questionsPerPage = 5,
  totalQuestions,  // ✅ Accept total questions
  onSelectQuestion,
  onSelectAll,
  onPageChange,
  onSubmit,
  indexOfFirstQuestion,
  totalPages,
  onEdit,
}) => {

  const maxPagesToShow = 3;
  const emptyRows = questionsPerPage - questions.length;
  const handleEdit = (questionIndex) => {
    if (onEdit) {
      onEdit(questionIndex);
    }
  };
  const currentPageQuestions = questions.map((_, idx) => indexOfFirstQuestion + idx);
  const isAllSelected = currentPageQuestions.every(index => selectedQuestions.includes(index));

  const CustomCheckbox = ({ checked, onChange, isHeader = false }) => (
    <div
      className={`w-5 h-5 border rounded flex items-center justify-center cursor-pointer border-gray-300 ${checked ? 'bg-[#111933]' : 'bg-white'}`}
      onClick={onChange}
    >
      {checked && (
        <Check
          size={16}
          className={"text-white  "}
          strokeWidth={3}
        />
      )}
    </div>
  );

  const handleSelectAll = () => {
    if (selectedQuestions.length === totalQuestions) {
      // Deselect all
      onSelectAll(false);
    } else {
      // Select all
      onSelectAll(true);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
          onClick={() => onPageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis-start" className="w-8 h-8 flex items-center justify-center">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${currentPage === i
            ? 'bg-[#111933] text-white font-medium'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis-end" className="w-8 h-8 flex items-center justify-center">...</span>);
      }
      pages.push(
        <button
          key="last"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="w-full mx-auto p-6 font-urbanist">
      <div className="mb-4 text-[#111933]">
        <h2 className="text-xl font-bold mb-2">Question Preview</h2>
        <p className="text-sm">Preview and verify the extracted questions before proceeding</p>
      </div>

      <div className="rounded-lg overflow-hidden h-[450px] border">
        <table className="w-full bg-white rounded-lg border-collapse">
          <thead className="bg-[#F0F0F0] text-[#111933]">
            <tr>
              <th className="relative py-4 px-6 text-left w-28 border-b">
                <div className="flex items-center gap-3">
                  <CustomCheckbox
                    checked={questions.length > 0 && isAllSelected}
                    onChange={handleSelectAll}
                    isHeader={true}
                  />
                </div>
              </th>
              <th className="relative py-4 px-6 text-left border-b">
                <span className="font-bold">Question</span>
                <span
                  className="absolute top-1/2 -translate-y-1/2 left-0 h-3/4 w-[1px] bg-gray-200"
                  style={{ marginTop: "0.001rem", marginBottom: "2rem" }}
                ></span>
              </th>
              <th className="relative py-4 px-6 text-left border-b">
                <span className="font-bold">Correct Answer</span>
                <span
                  className="absolute top-1/2 -translate-y-1/2 left-0 h-3/4 w-[1px] bg-gray-200"
                  style={{ marginTop: "0.001rem", marginBottom: "2rem" }}
                ></span>
              </th>
              <th className="relative py-4 px-6 text-left border-b">
                <span className="font-bold">Blooms</span>
                <span
                  className="absolute top-1/2 -translate-y-1/2 left-0 h-3/4 w-[1px] bg-gray-200"
                  style={{ marginTop: "0.001rem", marginBottom: "2rem" }}
                ></span>
              </th>
              <th className="relative py-4 px-6 text-left border-b">
                <span className="font-bold">Edit</span>
                <span
                  className="absolute top-1/2 -translate-y-1/2 left-0 h-3/4 w-[1px] bg-gray-200"
                  style={{ marginTop: "0.001rem", marginBottom: "2rem" }}
                ></span>
              </th>
            </tr>
          </thead>
          <tbody className="h-[350px] bg-white">
            {questions.map((question, index) => {
              const actualIndex = indexOfFirstQuestion + index;
              return (
                <tr key={actualIndex} className="h-20 border-b">
                  <td className="py-4 px-6">
                    <CustomCheckbox
                      checked={selectedQuestions.includes(actualIndex)}
                      onChange={() => onSelectQuestion(actualIndex)}
                      isHeader={false}
                    />
                  </td>
                  <td className="py-4 px-6 break-words">{question.question}</td>
                  <td className="py-4 px-6">
                    <span className="font-medium">Answer: </span>
                    {question.correctAnswer}
                  </td>
                  <td className="py-4 px-6">{question.blooms}</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleEdit(actualIndex)}
                      className="p-2 rounded-lg border border-[#111933] text-[#111933] hover:bg-opacity-80 flex items-center gap-2"
                    >
                      <span>Edit</span>
                      <IoIosArrowForward />
                    </button>
                  </td>
                </tr>
              );
            })}
            {emptyRows > 0 &&
              Array(emptyRows)
                .fill(null)
                .map((_, index) => (
                  <tr key={`empty-${index}`} className="h-20 bg-white">
                    <td className="py-4 px-6"></td>
                    <td className="py-4 px-6"></td>
                    <td className="py-4 px-6"></td>
                    <td className="py-4 px-6"></td>
                    <td className="py-4 px-6"></td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex-1" />
        {totalPages > 1 && <div className="flex items-center gap-2 justify-center flex-1">
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {renderPagination()}
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>}
        <div className="flex-1 flex justify-end">
          <button
            onClick={onSubmit}
            className="bg-[#111933] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewTable;