import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LibraryModal from "../mcq/LibraryModal";
import CreateManuallyIcon from "../../../assets/createmanually.svg";
import BulkUploadIcon from "../../../assets/bulkupload.svg";
import QuestionLibraryIcon from "../../../assets/qlibrary.svg";
import AIGeneratorIcon from "../../../assets/aigenerator.svg";

const QuestionModal = ({
  onClose,
  handleCreateManually,
  handleBulkUpload,
  handleMcqlibrary,
  handleAi,
  handleQuestionLibrary,
  handleTestLibrary,
}) => {
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 sm:p-6">
      <div className="p-6 sm:p-8 pb-10 max-w-4xl w-full bg-white rounded-xl shadow-lg relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl sm:text-2xl text-[#111933] font-bold">Add and manage your questions</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <p className="text-sm text-[#111933] mb-4">Choose how you'd like to add questions to your assessment. Select the method that works best for you to quickly build your test.</p>
        <hr className="mb-6 border-gray-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {[ 
            { label: "Create Manually", desc: "Enter each question and its options directly.", icon: CreateManuallyIcon, action: () => navigate("/mcq/CreateQuestion") },
            { label: "Bulk Upload", desc: "Upload questions via CSV or Excel file.", icon: BulkUploadIcon, action: () => navigate("/mcq/bulkUpload") },
            { label: "Library", desc: "Choose from your saved  library.", icon: QuestionLibraryIcon, action: () => setIsLibraryModalOpen(true) },
            { label: "AI Generator", desc: "Generate questions using AI.", icon: AIGeneratorIcon, action: () => navigate("/mcq/aigenerator") },
          ].map((item, index) => (
            <button key={index} onClick={item.action} className="p-6 sm:p-10 bg-white border border-[#111933] rounded-lg cursor-pointer flex flex-col items-center text-center">
              <img src={item.icon || "/placeholder.svg"} alt={item.label} className="w-10 sm:w-12 h-10 sm:h-12 mb-3" />
              <h3 className="text-lg sm:text-xl font-semibold text-[#111933] mb-2">{item.label}</h3>
              <p className="text-xs sm:text-sm text-[#111933]">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
      {isLibraryModalOpen && <LibraryModal onClose={() => setIsLibraryModalOpen(false)} />}
    </div>
  );
};

export default QuestionModal;