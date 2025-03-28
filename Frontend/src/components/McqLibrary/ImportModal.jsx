import React, { useState } from 'react';
import { X, Upload, Download } from 'lucide-react';
import correct from '../../assets/icons/correcticon.png';
import downloadSampleFile from '../../assets/SampleDoc/sample_document.xlsx';

const ImportModal = ({ isModalOpen, setIsModalOpen, handleBulkUpload, uploadStatus, handlePreview, handleSubmit }) => {
  const [dragging, setDragging] = useState(false);

  const handleDownloadSample = () => {
    const link = document.createElement('a');
    link.href = downloadSampleFile;
    link.download = 'sample_document.xlsx';
    link.click();
  };


  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    handleBulkUpload({ target: { files } });
  };

  const handleClick = (e) => {
    // Only trigger if the click is directly on the container, not bubbled from children
    if (e.target === e.currentTarget) {
      document.getElementById('fileInput').click();
    }
  };

  const handleLabelClick = (e) => {
    e.stopPropagation(); // Prevent the click from bubbling to the parent div
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-[#111933]">Upload Questions</h1>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-[#A0A0A0] text-sm mb-6">
          Easily add questions to your library by uploading files in{' '}
          <span className="font-medium text-[#111933] opacity-60">xlsx format.</span>
        </p>
        <hr className="border-t border-gray-400 my-4" />

        <div
          className={`border-2 border-dashed ${dragging ? 'border-blue-500' : 'border-gray-300'} rounded-lg p-10 flex flex-col items-center mb-6 w-full cursor-pointer`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <p className="text-[#111933] text-xl mb-4">Upload files only in xlsx format.</p>
          <label
            htmlFor="fileInput"
            className="bg-[#111933] text-white px-6 py-2 rounded-md cursor-pointer flex items-center gap-2"
            onClick={handleLabelClick} // Add this to stop propagation
          >
            Upload <Upload size={20} />
          </label>
          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept=".csv, .xlsx"
            onChange={handleBulkUpload}
          />
        </div>

        <div className="p-6 rounded-lg bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Instructions</h2>
          <p className="text-[#A0A0A0] mb-2 text-sm">
            Easily add questions by uploading your prepared files as{' '}
            <span className="font-medium text-[#111933] opacity-60">xlsx.</span>
          </p>
          <hr className="border-t border-gray-400 my-4" />
          <ul className="text-sm text-[#111933] space-y-2">
            <li className="flex items-center gap-2">
              <img src={correct} alt="Checkmark" className="w-4 h-4" />
              Ensure your file is in XLSX format.
            </li>
            <li className="flex items-center gap-2">
              <img src={correct} alt="Checkmark" className="w-4 h-4" />
              Options should be labeled as option1, option2, ..., option4.
            </li>
            <li className="flex items-center gap-2">
              <img src={correct} alt="Checkmark" className="w-4 h-4" />
              The correct answer should be specified in the correct answer column.
            </li>
            <li className="flex items-center gap-2">
              <img src={correct} alt="Checkmark" className="w-4 h-4" />
              Ensure all required fields are properly filled.
            </li>
          </ul>
        </div>

        <div className="flex justify-between space-x-4 mt-4">
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-2 border border-[#111933] text-[#111933] px-6 py-2 rounded-md cursor-pointer"
          >
            Sample Document <Download size={18} />
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsModalOpen(false);
                toggleModal('isPreviewModalOpen', false); // Close PreviewModal if open
              }}
              className="p-2 rounded-lg bg-white border-[#111933] border text-[#111933] font-semibold px-5"
            >
              Cancel
            </button>
            <button
              onClick={handlePreview}
              className="p-2 rounded-lg bg-[#111933] border-[#111933] border text-white px-5"
            >
              Preview
            </button>
            <button
              onClick={handleSubmit}
              className="p-2 rounded-lg bg-[#111933] border-[#111933] border text-white px-5"
            >
              Submit
            </button>
          </div>
        </div>

        {uploadStatus && (
          <div className={`mt-4 p-3 rounded-md ${uploadStatus.startsWith("Success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {uploadStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;