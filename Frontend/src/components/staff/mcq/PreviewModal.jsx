import React, { useState } from "react";
import Pagination from "@mui/material/Pagination";
import { SlArrowRight } from "react-icons/sl";
import QuestionDetailsMcq from "../../../components/staff/mcq/QuestionDetailsMcq";
import { toast, ToastContainer } from "react-toastify";
import { Fax } from "@mui/icons-material";
import { Edit, X } from "lucide-react";

const PreviewModal = ({
  isOpen,
  onClose,
  selectedQuestions,
  setSelectedQuestions,
  isBulkUpload,
  setBulkSelectedQuestions,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  if (!isOpen) return null;

  const questionsArray = Array.isArray(selectedQuestions)
    ? selectedQuestions
    : [];
  const questionsPerPage = 5;
  const totalPages = Math.ceil(questionsArray.length / questionsPerPage);
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = questionsArray.slice(
    indexOfFirstQuestion,
    indexOfLastQuestion
  );

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleCheckboxChange = (questionIndex) => {
    const globalIndex = questionIndex; // Use global index directly
    setSelectedQuestionIds((prev) =>
      prev.includes(globalIndex)
        ? prev.filter((id) => id !== globalIndex)
        : [...prev, globalIndex]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      // Select all questions across all pages
      setSelectedQuestionIds(questionsArray.map((_, idx) => idx));
    } else {
      setSelectedQuestionIds([]);
    }
  };

  const handleSaveSelectedQuestions = async () => {
    const filteredQuestions = questionsArray.filter((_, index) =>
      selectedQuestionIds.includes(index)
    );
    if (filteredQuestions.length === 0) {
      toast.warning("Select at least 1 question");
      return;
    }
    setBulkSelectedQuestions(filteredQuestions);
    toast.success("Saved selected questions to submit");
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-7xl relative">
        <h2 className="text-2xl font-bold mb-1 text-[#111933] text-left">
          Question Preview
        </h2>
        <h4 className="text-gray-500 mb-6 text-left">
          Select and preview question from your collection
        </h4>
        <div className="overflow-x-auto border border-gray-300 rounded-md">
          <table className="min-w-full bg-white">
            <thead className="py-3 bg-[#F0F0F0]">
              <tr className="bg-[#F0F0F0] text-[#111933]">
                {isBulkUpload && (
                  <th className="flex items-center justify-between py-4 px-4 border-r relative text-left">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedQuestionIds.length === questionsArray.length
                      }
                      className="accent-[#111933]"
                    />
                    <span className="h-full flex right-0 top-0 w-[1px] absolute py-3">
                      {" "}
                      <span className="bg-gray-800 h-full w-full"></span>{" "}
                    </span>
                  </th>
                )}
                <th className="py-3 relative px-4 text-left">
                  Question{" "}
                  <span className="h-full flex right-0 top-0 w-[1px] absolute py-3">
                    {" "}
                    <span className="bg-gray-800 h-full w-full"></span>{" "}
                  </span>{" "}
                </th>
                {/* <th className="py-3 relative px-4 text-center">
                  Correct Answer{" "}
                  <span className="h-full flex right-0 top-0 w-[1px] absolute py-3">
                    {" "}
                    <span className="bg-gray-800 h-full w-full"></span>{" "}
                  </span>{" "}
                </th> */}
                <th className="py-3 relative px-4 text-center">
                  Blooms{" "}
                  <span className="h-full flex right-0 top-0 w-[1px] absolute py-3">
                    {" "}
                    <span className="bg-gray-800 h-full w-full"></span>{" "}
                  </span>{" "}
                </th>
                <th className="py-3 relative px-4 text-center">Edit </th>
              </tr>
            </thead>
            <tbody>
              {currentQuestions.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-4 text-red-500 font-semibold"
                  >
                    No valid questions found. Please upload a correctly
                    formatted file.
                  </td>
                </tr>
              ) : (
                currentQuestions.map((question, index, array) => {
                  const globalIndex = indexOfFirstQuestion + index;
                  return (
                    <tr key={globalIndex} className="border-t hover:bg-gray-50">
                      {isBulkUpload && (
                        <td className="py-4 px-4 flex items-center justify-between">
                          <input
                            type="checkbox"
                            checked={selectedQuestionIds.includes(globalIndex)}
                            onChange={() => handleCheckboxChange(globalIndex)}
                            className="accent-[#111933]"
                          />
                          {/* <p className='w-6 h-6 rounded-full bg-[#111933] text-white text-sm flex justify-center items-center'>{globalIndex + 1}</p> */}
                        </td>
                      )}
                      <td className="py-4 px-4 text-[#111933]">
                        {question.question}
                      </td>
                      {/* <td className="py-4 px-4 text-[#111933] text-center">
                        {question.correctAnswer}
                      </td> */}
                      <td className="py-4 px-4 text-[#111933] text-center">
                        {question.blooms || "N/A"}
                      </td>
                      <td className="py-4 px-4 flex justify-center">
                        <button
                          onClick={() => setSelectedQuestion(question)}
                          className="text-[#111933] bg-white flex items-center px-4 py-1 rounded-lg"
                        >
                          <Edit className="text-xs" size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            className="mt-4 flex justify-center"
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
        )}

        {isBulkUpload ? (
          <div className="flex justify-center space-x-5">
            <button
              onClick={onClose}
              className="mt-4 flex py-2 px-10 rounded-lg font-semibold text-sm bg-[#111933] text-white border border-[#111933] hover:bg-opacity-80"
            >
              Close
            </button>
            {selectedQuestionIds.length > 0 && (
              <button
                onClick={handleSaveSelectedQuestions}
                className="mt-4 flex py-2 px-10 rounded-lg font-semibold text-sm bg-[#111933] text-[#fff] border border-[#111933] hover:bg-opacity-80"
              >
                Save Selected Questions
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onClose}
            className="absolute p-1 top-3.5 right-3.5 bg-[#111933] text-white rounded-full text-xs"
          >
            <X size={18} />
          </button>
        )}
      </div>
      {selectedQuestion && (
        <QuestionDetailsMcq
          selectedQuestion={selectedQuestion}
          setSelectedQuestion={setSelectedQuestion}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          setSelectedQuestions={setSelectedQuestions}
          allQuestions={questionsArray} // Pass full list of questions
          isBulkUpload={isBulkUpload}
        />
      )}
    </div>
  );
};

export default PreviewModal;
