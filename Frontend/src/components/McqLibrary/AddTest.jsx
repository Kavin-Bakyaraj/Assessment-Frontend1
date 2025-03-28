import React, { useEffect, useState } from 'react';
import Pagination from '@mui/material/Pagination';
import { Edit, Plus, Trash } from 'lucide-react';
import QuestionDetailsMcq from '../staff/mcq/QuestionDetailsMcq';
import { SlArrowRight } from "react-icons/sl";
import PreviewModal from '../staff/mcq/PreviewModal';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { AiFillCheckCircle } from "react-icons/ai";
import { FiDownload } from "react-icons/fi";
import { MdCancel, MdDownloading } from "react-icons/md";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DeleteIcon from '@mui/icons-material/Delete';
import { InputField, SelectField, TagInputField } from '../ui/InputField';
import * as XLSX from "xlsx";
import downloadSampleFile from '../../assets/SampleDoc/sample_document.xlsx';
import bg from '../../assets/bgpattern.svg';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const predefinedCategories = ["Scenario-Based Questions", "Logical Reasoning", "Mock Interview Questions", "Problem-Solving Questions", "Technical Questions", "Aptitude Questions", "Personality Questions"];

const AddTest = () => {
  const navigate = useNavigate();
  const [testName, setTestName] = useState("");
  const [testLevel, setTestLevel] = useState("");
  const [testTags, setTestTags] = useState([]);
  const [testTagsInput, setTestTagsInput] = useState("");
  const [showDownloadSample, setShowDownloadSample] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState([]);
  const [questions, setQuestions] = useState([{
    question: "",
    options: ["", ""],
    correctAnswer: "",
    level: "",
    blooms: "",
    tags: [],
    tagsInput: "",
    isVisible: true,
    isSaved: false // Add a flag to track if the question has been saved
  }]);
  const [showPopup, setShowPopup] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 4;

  // Modify to get only saved questions
  const savedQuestions = questions.filter(q => q.isSaved);

  // Update pagination to use saved questions only
  const totalPages = Math.ceil(savedQuestions.length / questionsPerPage);

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = savedQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const [bulkCurrentPage, setBulkCurrentPage] = useState(1);
  const bulkQuestionsPerPage = 10;

  const bulkTotalPages = Math.ceil(parsedQuestions.length / bulkQuestionsPerPage);

  const bulkIndexOfLastQuestion = bulkCurrentPage * bulkQuestionsPerPage;
  const bulkIndexOfFirstQuestion = bulkIndexOfLastQuestion - bulkQuestionsPerPage;
  const currentParsedQuestions = parsedQuestions.slice(bulkIndexOfFirstQuestion, bulkIndexOfLastQuestion);

  useEffect(() => {
    console.log(selectedQuestions);

  }, [selectedQuestions])

  const handleBulkPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= bulkTotalPages) {
      setBulkCurrentPage(newPage);
    }
  };

  const createTest = async () => {
    // Filter only saved questions for the API request
    const savedQuestionsForSubmit = questions.filter(q => q.isSaved);

    if (savedQuestionsForSubmit.length === 0) {
      toast.error("Please save at least one question before creating the test.");
      return;
    }

    for (const question of savedQuestionsForSubmit) {
      const filledOptions = question.options.filter(option => option.trim() !== "");
      if (!question.question || filledOptions.length < 2 || !question.correctAnswer) {
        toast.error("Please ensure all questions filled properly.");
        return;
      }
    }

    try {
      const questionsForApi = savedQuestionsForSubmit.map(q => ({
        question_id: uuidv4(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        level: q.level,
        blooms: q.blooms,
        tags: q.tags
      }));

      const response = await axios.post(`${API_BASE_URL}/api/create-test/`, {
        test_name: testName,
        level: testLevel,
        tags: testTags,
        category: selectedCategory === "Others" ? manualCategory : selectedCategory,
        questions: questionsForApi
      });
      toast.success(response.data.message);
      toast.success('Test created successfully');
      navigate(-1);
    } catch (error) {
      console.error("Error creating test:", error);
      toast.error('Error creating test');
    }
  };

  const clearForm = () => {
    setTestName("");
    setTestLevel("");
    setTestTags([]);
    setTestTagsInput("");
    setQuestions([{
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      level: "",
      blooms: "",
      tags: [],
      tagsInput: "",
      isVisible: true,
      isSaved: false
    }]);
    setFile(null);
    setParsedQuestions([]);
    setSelectedQuestions([]);
    setSelectedCategory("");
    setManualCategory("");
    toast.info('Form cleared');
  };

  const addQuestion = () => {
    const currentQuestion = questions[questions.length - 1];
    const filledOptions = currentQuestion.options.filter(option => option.trim() !== "");

    if (!currentQuestion.question || filledOptions.length < 2 || !currentQuestion.correctAnswer || !currentQuestion.level || !currentQuestion.blooms) {
      toast.error("Please fill all required fields before adding a new question.");
      return;
    }

    setQuestions([...questions, {
      question: "",
      options: ["", ""],
      correctAnswer: "",
      level: "",
      blooms: "",
      tags: [],
      tagsInput: "",
      isVisible: true,
      isSaved: false
    }]);
    setExpandedQuestion(questions.length);
    toast.success('Question added');
  };

  const deleteQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    toast.success('Question deleted');
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === "tags") {
      newQuestions[index].tagsInput = value;
      if (value.endsWith(',')) {
        const newTag = value.slice(0, -1).trim();
        if (newTag && !newQuestions[index].tags.includes(newTag)) {
          newQuestions[index].tags = [...newQuestions[index].tags, newTag];
        }
        newQuestions[index].tagsInput = '';
      }
    } else if (field === "options") {
      newQuestions[index].options = value;
    } else {
      newQuestions[index][field] = value;
    }
    setQuestions(newQuestions);
  };

  const handleTagKeyPress = (index, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newQuestions = [...questions];
      const newTag = newQuestions[index].tagsInput.trim();
      if (newTag && !newQuestions[index].tags.includes(newTag)) {
        newQuestions[index].tags = [...newQuestions[index].tags, newTag];
      }
      newQuestions[index].tagsInput = '';
      setQuestions(newQuestions);
    }
  };

  const handleTagBlur = (index) => {
    const newQuestions = [...questions];
    const newTag = newQuestions[index].tagsInput.trim();
    if (newTag && !newQuestions[index].tags.includes(newTag)) {
      newQuestions[index].tags = [...newQuestions[index].tags, newTag];
      newQuestions[index].tagsInput = '';
      setQuestions(newQuestions);
    }
  };

  const handleTestTagsBlur = () => {
    const newTag = testTagsInput.trim();
    if (newTag && !testTags.includes(newTag)) {
      setTestTags([...testTags, newTag]);
      setTestTagsInput('');
    }
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const levels = ["Easy", "Medium", "Hard"];

  const handleBulkUpload = () => {
    setShowPopup(false);
    setShowBulkUpload(true);
  };

  const onDrop = (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      toast.error("No file selected. Please upload a valid XLSX file.");
      return;
    }

    const file = acceptedFiles[0];
    if (!file.name.endsWith(".xlsx")) {
      toast.error("Please select a valid XLSX file.");
      return;
    }

    setFile(file);
    parseFile(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });

  const parseFile = (file) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headers = jsonData[0] || [];
      const dataRows = jsonData.slice(1).map((row) => {
        let rowObject = {};
        headers.forEach((header, index) => {
          rowObject[header] = row[index];
        });
        return rowObject;
      });

      // Required columns check
      const requiredColumns = ["Question", "Option1", "Option2", "Correct_Answer", "Level", "Tags", "Blooms"];
      const hasRequiredColumns = requiredColumns.every((col) => headers.includes(col));

      if (!hasRequiredColumns) {
        toast.error("Invalid file format. Ensure required columns exist.");
        return;
      }

      let validQuestions = [];
      let skippedCount = 0;

      dataRows.forEach((row, index) => {
        // Check if required fields exist
        if (!row.Question || !row.Option1 || !row.Option2 || !row.Correct_Answer || !row.Level || !row.Blooms) {
          toast.error(`Missing required fields in row ${index + 1}.`);
          skippedCount++;
          return;
        }

        // Fetch options
        const options = [row.Option1, row.Option2, row.Option3, row.Option4].filter(Boolean);

        // Ensure at least 2 options exist
        if (options.length < 2) {
          toast.error(`At least 2 options are required in row ${index + 1}.`);
          skippedCount++;
          return;
        }

        // Ensure correct_answer exists in options
        if (!options.includes(row.Correct_Answer)) {
          toast.error(`Correct answer must be one of the provided options in row ${index + 1}.`);
          skippedCount++;
          return;
        }

        // Convert tags into an array
        const formattedTags = row.Tags ? row.Tags.split(",").map((tag) => tag.trim()) : [];

        validQuestions.push({
          question: row.Question.trim(),
          options,
          correctAnswer: row.Correct_Answer,
          level: row.Level.trim(),
          blooms: row.Blooms.trim(),
          tags: formattedTags,
        });
      });

      if (validQuestions.length === 0) {
        toast.error("No valid questions found! Please check the file format.");
        return;
      }

      let message = `${validQuestions.length} questions were selected.`;
      if (skippedCount > 0) {
        message += ` ${skippedCount} questions were not selected due to an invalid format.`;
      }

      setParsedQuestions(validQuestions);
      setBulkCurrentPage(1);
      setIsPreviewModalOpen(true);
      toast.success(message);
    };
    console.log("parsedQuestions before modal:", parsedQuestions);
    reader.onerror = (error) => {
      console.error("File reading error:", error);
      toast.error("Error reading file");
    };

    reader.readAsBinaryString(file);
  };

  const handleBulkUploadSubmit = async () => {
    try {
      const questionsForApi = selectedQuestions.map(q => ({
        question_id: uuidv4(),
        question: q.question.toString(),
        options: q.options.map(option => option.toString()),
        correctAnswer: q.correctAnswer.toString(),
        level: q.level.toString(),
        blooms: q.blooms.toString(),
        tags: q.tags.map(tag => tag.toString())
      }));

      const payload = {
        test_id: uuidv4().toString(),
        test_name: testName.toString(),
        level: testLevel.toString(),
        tags: testTags.map(tag => tag.toString()),
        category: (selectedCategory === "Others" ? manualCategory : selectedCategory).toString(),
        questions: questionsForApi
      };

      const uploadResponse = await axios.post(`${API_BASE_URL}/api/bulk-upload-to-test/`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      toast.success(uploadResponse.data.message);
      navigate(-1);
    } catch (error) {
      console.error("Error uploading test:", error);
      toast.error('Error uploading test');
    }
  };


  const handleQuestionSelection = (index, isChecked) => {
    const question = parsedQuestions[bulkIndexOfFirstQuestion + index];
    const isAlreadySelected = selectedQuestions.some(q => q.question === question.question);

    if (isChecked && !isAlreadySelected) {
      setSelectedQuestions([...selectedQuestions, question]);
    } else if (!isChecked && isAlreadySelected) {
      setSelectedQuestions(selectedQuestions.filter(q => q.question !== question.question));
    }
  };

  const handleTestLevelChange = (e) => {
    setTestLevel(e.target.value);
  };

  const handleTestTagsChange = (e) => {
    setTestTagsInput(e.target.value);
    if (e.target.value.endsWith(',')) {
      const newTag = e.target.value.slice(0, -1).trim();
      if (newTag && !testTags.includes(newTag)) {
        setTestTags([...testTags, newTag]);
      }
      setTestTagsInput('');
    }
  };

  const handleTestTagsKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = testTagsInput.trim();
      if (newTag && !testTags.includes(newTag)) {
        setTestTags([...testTags, newTag]);
      }
      setTestTagsInput('');
    }
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error('Please upload a file.');
      return;
    }
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question.');
      return;
    }
    handleBulkUploadSubmit();
  };

  const testtoggleExpand = (index) => {
    setExpandedQuestions((prev) =>
      prev.includes(bulkIndexOfFirstQuestion + index) ? prev.filter((i) => i !== (bulkIndexOfFirstQuestion + index)) : [...prev, bulkIndexOfFirstQuestion + index]
    );
  };

  const removeTestTag = (tagIndex) => {
    const newTags = testTags.filter((_, i) => i !== tagIndex);
    setTestTags(newTags);
  };

  const handleDownloadSample = () => {
    const link = document.createElement('a');
    link.href = downloadSampleFile;
    link.download = 'sample_document.xlsx';
    link.click();
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const uniqueQuestions = [...new Map(parsedQuestions.map(q => [q.question, q])).values()];
      setSelectedQuestions(uniqueQuestions);
    } else {
      setSelectedQuestions([]);
    }
  };

  const [expandedQuestion, setExpandedQuestion] = useState(questions.length - 1);

  const toggleExpand = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const removeTag = (questionIndex, tagIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].tags = newQuestions[questionIndex].tags.filter((_, i) => i !== tagIndex);
    setQuestions(newQuestions);
  };

  const handleSaveQuestion = (index) => {
    const question = questions[index];
    const filledOptions = question.options.filter(option => option.trim() !== "");
  
    if (!question.question || filledOptions.length < 2 || !question.correctAnswer || !question.level || !question.blooms || question.tags.length === 0) {
      toast.error("Please fill in the question, at least two options, select a correct answer, difficulty level, blooms level, and add at least one tag.");
      return;
    }
  
    const isDuplicate = questions.some((q, i) =>
      i !== index &&
      q.isSaved && // Only check against saved questions
      q.question === question.question &&
      q.options.every((option, j) => option === question.options[j]) &&
      q.correctAnswer === question.correctAnswer
    );
  
    if (isDuplicate) {
      toast.error("Duplicate question found. Please modify the question or options.");
      return;
    }
  
    // Create a new array of questions with the current one marked as saved
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      isSaved: true
    };
  
    // Insert a new empty question at the beginning if we're at the last one
    if (index === questions.length - 1) {
      updatedQuestions.unshift({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        level: "",
        blooms: "",
        tags: [],
        tagsInput: "",
        isVisible: true,
        isSaved: false
      });
    }
  
    toast.success("Question saved successfully.");
  
    // Move the newly saved question to the top
    const savedQuestion = updatedQuestions.splice(index, 1)[0];
    updatedQuestions.unshift(savedQuestion);
  
    setQuestions(updatedQuestions);
    setExpandedQuestion(0); // Move to the new question at the top
  };
  
  

  const handlePreview = () => {
    setIsPreviewModalOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewModalOpen(false);
  };

  const validateInput = (value, maxWords, maxCharRepetition) => {
    const words = value.trim().split(/\s+/);
    if (words.length > maxWords) {
      return false;
    }
    const charCount = {};
    for (const char of value) {
      charCount[char] = (charCount[char] || 0) + 1;
      if (charCount[char] > maxCharRepetition) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="px-20 py-10 w-full min-h-screen rounded shadow-md pt-28"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 p-9 bg-opacity-50 popup z-[1000]">
          <div className="bg-white p-6 rounded shadow-md relative w-full max-w-2xl mt-10 popup">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-[#111933] text-left">
                Enter the Test Name
              </h2>
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FontAwesomeIcon className='p-4' icon={faTimes} />
              </button>
            </div>
            <form className='flex flex-col space-y-4 mt-4 popup-content'
              onSubmit={(e) => {
                e.preventDefault();
                const buttonType = e.nativeEvent.submitter.getAttribute("data-type");

                if (buttonType === "manual") {
                  setShowPopup(false);
                  setShowManualForm(true);
                } else if (buttonType === "bulkUpload") {
                  handleBulkUpload();
                } else {
                  console.log("Unknown button type");
                }
              }}>
              <div className="space-y-2">
                <label className="block text-[#111933] text-lg font-semibold mb-1">Test Name:</label>
                <p className='text-sm text-[#111933]'>Enter a unique and descriptive name for the test..</p>
                <input
                  required
                  type="text"
                  value={testName}
                  onChange={(e) => {
                    if (validateInput(e.target.value, 20, 8)) {
                      setTestName(e.target.value);
                    }
                  }}
                  className="text-sm shadow appearance-none border rounded w-full py-2 px-3 text-[#111933] leading-tight focus:outline-none focus:shadow-outline"
                  placeholder='Enter test name'
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[#111933] text-lg font-semibold mb-1">Test Level:</label>
                <p className='text-sm text-[#111933]'>Specify the difficulty level of the test, such as Beginner, Intermediate, or Advanced</p>
                <select
                  required
                  value={testLevel}
                  onChange={handleTestLevelChange}
                  className="text-sm shadow appearance-none border rounded w-full py-2 px-3 text-[#111933] leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Level</option>
                  {levels.map((level, idx) => (
                    <option key={idx} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[#111933] text-lg font-semibold mb-2">Test Tags:</label>
                <p className='text-sm text-[#111933]'>Add relevant tags to the test to improve searchability and organization.</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {testTags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="bg-blue-100 text-[#111933] px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        type="button" // Prevent form submission
                        onClick={() => removeTestTag(tagIndex)}
                        className="ml-2 text-[#111933] hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={testTagsInput}
                  onChange={(e) => {
                    if (validateInput(e.target.value, 30, 8)) {
                      setTestTagsInput(e.target.value);
                    }
                  }}
                  onKeyPress={handleTestTagsKeyPress}
                  onBlur={handleTestTagsBlur}
                  placeholder="Type and press Enter or comma to add tags"
                  className="text-sm shadow appearance-none border rounded w-full py-2 px-3 text-[#111933] leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[#111933] text-lg font-semibold mb-2">Select Category:</label>
                <p className='text-sm text-[#111933]'>Define the category under which the test falls, such as Mathematics, Science, Co</p>
                <select
                  required
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-sm shadow appearance-none border rounded w-full py-2 px-3 text-[#111933] leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Select Category</option>
                  {predefinedCategories.map((category, idx) => (
                    <option key={idx} value={category}>{category}</option>
                  ))}
                  <option value="Others">Others</option>
                </select>
                {selectedCategory === "Others" && (
                  <input
                    type="text"
                    value={manualCategory}
                    onChange={(e) => {
                      if (validateInput(e.target.value, 30, 8)) {
                        setManualCategory(e.target.value);
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") e.preventDefault(); // Prevent form submission
                    }}
                    placeholder="Enter category manually"
                    className="text-sm shadow appearance-none border rounded w-full py-2 px-3 text-[#111933] leading-tight focus:outline-none focus:shadow-outline mt-2"
                  />
                )}

              </div>

              <div className="flex justify-between">
                <button
                  type="submit"
                  data-type="manual"
                  className="text-[#111933] border border-[#111933] rounded-lg font-bold py-2 px-6 flex items-center"
                >
                  Manual
                </button>

                <button
                  type="submit"
                  data-type="bulkUpload"
                  className="bg-[#111933] rounded-lg text-white py-2 px-6"
                >
                  Bulk Upload
                </button>
              </div>
            </form>
          </div>

        </div>
      )}
      {showManualForm && (
        <div className="manual-upload-container p-10 my-6 bg-white shadow-xl rounded-lg">
          <h2 className="text-2xl font-bold text-[#111933] mb-2">Create Test</h2>
          <p className='text-[#111933]'>Choose how you’d like to add questions to your assessment. Select the method that works best for you to quickly build your test.</p>
          <hr className='border border-gray-300 my-6' />
          <div className="flex gap-x-5 items-end mb-10">
            <div className="flex-1 space-y-2">
              <label className="text-[#111933] text-lg font-semibold block">Test Name:</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => {
                  if (validateInput(e.target.value, 20, 8)) {
                    setTestName(e.target.value);
                  }
                }}
                className="shadow appearance-none border w-full rounded-xl py-3 px-3 text-[#111933] leading-tight focus:outline-none focus:shadow-outline text-sm"
              />
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-[#111933] text-lg font-semibold block">Test Level:</label>
              <select
                value={testLevel}
                onChange={handleTestLevelChange}
                className="shadow appearance-none border w-full rounded-xl py-3 px-3 text-[#111933] leading-tight focus:outline-none focus:shadow-outline text-sm"
              >
                <option value="">Select Level</option>
                {levels.map((level, idx) => (
                  <option key={idx} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-[#111933] text-lg font-semibold mb-2">Select Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="shadow appearance-none border rounded-xl w-full py-3 px-3 text-[#111933] leading-tight focus:outline-none focus:shadow-outline text-sm"
              >
                <option value="">Select Category</option>
                {predefinedCategories.map((category, idx) => (
                  <option key={idx} value={category}>{category}</option>
                ))}
                <option value="Others">Others</option>
              </select>
              {selectedCategory === "Others" && (
                <input
                  type="text"
                  value={manualCategory}
                  onChange={(e) => {
                    if (validateInput(e.target.value, 30, 8)) {
                      setManualCategory(e.target.value);
                    }
                  }}
                  placeholder="Enter category manually"
                  className="shadow appearance-none border rounded-xl w-full py-3 px-3 text-[#111933] leading-tight focus:outline-none focus:shadow-outline text-sm mt-2"
                />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <label className="text-[#111933] text-lg font-semibold">Test Tags:</label>
              <div className="inline-flex flex-wrap gap-2 ml-2 mb-2">
                {testTags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="bg-blue-100 text-[#111933] px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      onClick={() => removeTestTag(tagIndex)}
                      className="ml-2 text-[#111933] hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={testTagsInput}
                onChange={(e) => {
                  if (validateInput(e.target.value, 30, 8)) {
                    setTestTagsInput(e.target.value);
                  }
                }}
                onKeyPress={handleTestTagsKeyPress}
                onBlur={handleTestTagsBlur}
                placeholder="Type and press Enter or comma to add tags"
                className="shadow appearance-none border rounded-xl w-full py-3 px-3 text-[#111933] leading-tight focus:outline-none focus:shadow-outline text-sm"
              />
            </div>
          </div>

          {/* Question List */}

          <div className="flex items-stretch space-x-4">

            {/* Question Form */}
            <div className="w-3/4">
              <div className="">
                {questions.map((q, index) => (
                  index === expandedQuestion && (
                    <div key={index} className="p-6 shadow-md rounded-lg bg-white relative border border-gray-300">
                      {/* <button
                        onClick={() => deleteQuestion(index)}
                        className="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-600"
                        disabled={questions.length === 1}
                      >
                        <DeleteIcon />
                      </button> */}

                      <div className="w-full mb-4">
                        <label className="block text-md font-semibold text-[#111933] mb-3">
                          Question <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={q.question}
                          onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                          placeholder="Type your question here"
                          className="w-full h-[100px] p-4 text-sm rounded-lg border border-gray-300 shadow-sm overflow-y-auto resize-none focus:outline-none focus:ring-0"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-lg font-medium text-[#111933]">
                            Options <span className="text-red-500">*</span>
                          </label>

                          {q.options.length < 4 && (
                            <button
                              type="button"
                              onClick={() => handleQuestionChange(index, "options", [...q.options, ""])}
                              className="flex items-center text-[#111933] hover:text-gray-700"
                            >
                              <Plus className="w-4 h-4 mr-1" /> Add Option
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {q.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex flex-col space-y-1 mb-4 relative">
                              <div className="flex items-center space-x-2">
                                {/* Option Label (A, B, C, D) */}
                                <span className="p-2 px-4 rounded-md bg-[#111933] text-white">
                                  {`${String.fromCharCode(65 + optionIndex)}`}
                                </span>

                                <div className="flex items-center w-full border rounded-md p-2">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                                    className="flex-1 text-[#111933] outline-none focus:ring-0"
                                    placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                    required={optionIndex < 2}
                                  />

                                  {/* Always show the trash icon but disable it if options are less than or equal to 3 */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (q.options.length > 2) {
                                        const newOptions = q.options.filter((_, i) => i !== optionIndex);
                                        handleQuestionChange(index, "options", newOptions);
                                      }
                                    }}
                                    className={`text-red-500 hover:text-red-700 ${q.options.length < 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={q.options.length < 3}
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>


                      {/* Correct Answer, Difficulty Level, and Tags in one line */}
                      <div className="flex space-x-10">
                        <div className="flex-1">
                          <label className="block text-md font-semibold text-[#111933] mb-3">
                            Correct Answer <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={q.correctAnswer}
                            onChange={(e) => handleQuestionChange(index, "correctAnswer", e.target.value)}
                            className="w-full p-2 rounded-lg border"
                            required
                          >
                            <option value="">Select Correct Answer</option>
                            {q.options.map((option, optionIndex) => (
                              option && (
                                <option key={optionIndex} value={option}>
                                  Option {String.fromCharCode(65 + optionIndex)}: {option}
                                </option>
                              )
                            ))}
                          </select>
                        </div>

                        <div className="flex-1">
                          <label className="block text-md font-semibold text-[#111933] mb-3">
                            Difficulty Level <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={q.level}
                            onChange={(e) => handleQuestionChange(index, "level", e.target.value)}
                            className="w-full p-2 rounded-lg border"
                            required
                          >
                            <option value="">Select Level</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>

                        <div className="flex-1">
                          <label className="block text-md font-semibold text-[#111933] mb-3">
                            Blooms Level <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={q.blooms}
                            onChange={(e) => handleQuestionChange(index, "blooms", e.target.value)}
                            className="w-full p-2 rounded-lg border"
                            required
                          >
                            <option value="">Select Blooms level</option>
                            <option value="L1 - Remember">L1 - Remember</option>
                            <option value="L2 - Understanding">L2 - Understanding</option>
                            <option value="L3 - Apply">L3 - Apply</option>
                            <option value="L4 - Analyze">L4 - Analyze</option>
                            <option value="L5 - Evaluate">L5 - Evaluate</option>
                            <option value="L6 - Create">L6 - Create</option>
                          </select>
                        </div>

                        <div className="flex-1">
                          <label className="block text-md font-semibold text-[#111933] mb-3">Tags<span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={q.tagsInput}
                            onChange={(e) => handleQuestionChange(index, "tags", e.target.value)}
                            onKeyPress={(e) => handleTagKeyPress(index, e)}
                            onBlur={() => handleTagBlur(index)}
                            className="w-full p-2 rounded-lg border border-gray-300 shadow-sm "
                            placeholder="e.g., math, algebra, geometry"
                          />
                          <p className="mt-1 text-sm text-[#111933]">Separate tags with commas</p>

                          {/* Tags List */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {q.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="bg-blue-100 text-[#111933] px-2 py-1 rounded-full text-sm flex items-center"
                              >
                                {tag}
                                <button
                                  onClick={() => removeTag(index, tagIndex)}
                                  className="ml-2 text-[#111933] hover:text-blue-900"
                                >
                                  x
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Create Test Button (Only for the Last Question) */}

                      <div className="flex justify-end mt-5">
                        <button
                          onClick={() => {
                            handleSaveQuestion(index);

                          }}
                          className="py-2 px-4  rounded-lg bg-[#111933] text-white hover:bg-[#1f2b41]"
                        >
                          Saved
                        </button>
                      </div>

                    </div>
                  )
                ))}
              </div>
            </div>
            <div className="flex flex-1">
              <div
                className="p-4 shadow-md rounded-lg bg-white relative border border-gray-300 flex flex-col"
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-black">Question List</h3>
                </div>

                {/* Scrollable Question Items */}
                <div className="overflow-y-auto flex-grow" style={{ maxHeight: '380px' }}>
                  {currentQuestions.length > 0 ? (
                    currentQuestions.map((q, index) => (
                      <div
                        key={index}
                        className="border rounded-lg border-gray-300 mb-2 flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedQuestion(questions.findIndex(question =>
                          question.question === q.question &&
                          question.isSaved === true
                        ))}
                      >
                        <div className="flex items-center">
                          <span className="text-xs mr-2 w-10 h-10 rounded-l-lg flex items-center justify-center font-semibold bg-[#111933] text-[#fff]">
                            {indexOfFirstQuestion + index + 1}
                          </span>
                          <p className="text-sm font-semibold text-black truncate w-64">
                            {q.question}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No saved questions yet. Save a question to see it in the list.
                    </div>
                  )}
                </div>

                {/* Pagination Controls - Only show if there are saved questions */}
                {savedQuestions.length > 0 && (
                  <div className="flex justify-center">
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(event, value) => handlePageChange(value)}
                      siblingCount={1}
                      boundaryCount={0}
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
              </div>
            </div>

          </div>

          <div className='w-full flex items-center justify-end space-x-5'>
            {/* Create Test Button (Only for the Last Question) */}
            <div className="flex justify-center pr-3 mt-4">
              <button
                onClick={() => navigate(-1)}
                className="py-2 px-6 rounded-lg bg-white border border-[#111933] text-[#111933] font-semibold"
              >
                Cancel
              </button>
            </div>
            {questions.length > 0 && (
              <div className="flex justify-center pr-3 mt-4">
                <button
                  onClick={createTest}
                  className="py-2 px-6 rounded-lg bg-[#111933] border border-[#111933] text-white font-semibold"
                >
                  Create Test
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showBulkUpload && (
        <div className="my-4 bg-white p-8 rounded-xl">
          <div className='mb-4'>
            <h2 className="text-2xl font-bold text-[#111933] mb-4">Bulk Upload Test</h2>
            <p className='text-[#111933]'>Choose how you’d like to add questions to your assessment. Select the method that works best for you to quickly build your test.</p>
          </div>
          <hr className='border border-gray-400 my-4' />
          <div className='bg-white p-6 rounded-lg'>
            <div className="grid grid-cols-2 gap-5 justify-stretch items-end w-full">
              <InputField
                label="Test Name"
                required={true}
                value={testName}
                onChange={(val) => {
                  if (validateInput(val, 20, 8)) {
                    setTestName(val);
                  }
                }} />
              <SelectField label="Test Level" value={testLevel} onChange={(val) => setTestLevel(val)} options={levels} />
              <TagInputField
                label="Test Tags"
                tags={testTags}
                value={testTagsInput}
                onChange={setTestTagsInput}
                onKeyPress={handleTestTagsKeyPress}
                onBlur={handleTestTagsBlur}
                removeTag={removeTestTag}
                validateInput={validateInput}
              />
              <SelectField label="Select Category" value={selectedCategory} onChange={(val) => setSelectedCategory(val)} options={predefinedCategories} />

            </div>

            <div
              {...getRootProps()}
              className="border-dashed border border-gray-300 px-20 py-10 text-center flex flex-col items-center"
            >
              <input {...getInputProps()} />
              <>
                <p className='text-2xl mb-4 font-semibold'>Upload files as xlsx.</p>
                <p
                  disabled
                  className="bg-[#111933] text-white px-6 py-2 rounded-lg hover:bg-[#111933]/50 transition-colors"
                >
                  Upload Files
                </p>

              </>
            </div>

            {/* Display Uploaded File Name and Number of Saved Questions */}
            {file && (
              <div className="mt-4 mx-14 text-center">
                <p className="text-[#111933] text-md mb-2">
                  <strong>Uploaded File:</strong> <span className='bg-gray-200 border border-gray-300 p-1 rounded-lg'>{file.name}</span>
                </p>
                <p className="text-[#111933] text-md">
                  <strong>Questions Saved:</strong> {selectedQuestions.length} / {parsedQuestions.length} selected
                </p>
              </div>
            )}

            <div className="my-6">
              <h2 className='text-2xl text-[#111933] font-bold mb-2'>Instructions</h2>
              <p className='text-gray-500'>Easily add questions by uploading your prepared files as xlsx.</p>
              <hr className='my-4' />
              <ul className='space-y-2'>
                <li><AiFillCheckCircle className='text-green-500 text justify-center inline-flex mr-2' />Ensure your file is in XLSX format.</li>
                <li><AiFillCheckCircle className='text-green-500 text justify-center inline-flex mr-2' />Options should be labeled as option1, option2, ..., option4</li>
                <li><AiFillCheckCircle className='text-green-500 text justify-center inline-flex mr-2' />The correct answer should be specified in the correct answer column.</li>
                <li><AiFillCheckCircle className='text-green-500 text justify-center inline-flex mr-2' />Maximum file size allowed: 5MB</li>
                <li><AiFillCheckCircle className='text-green-500 text justify-center inline-flex mr-2' />Ensure all fields are properly filled.</li>
              </ul>
            </div>

            <div className="flex justify-between space-x-4 mt-4 items-center">
              <button
                onClick={handleDownloadSample}
                className="p-2 rounded-lg bg-white border-[#111933] border text-[#111933] font-semibold px-5"
              >
                Sample Document <FiDownload className='inline-flex text-xl ml-2' />
              </button>

              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => window.history.back()}
                  className="p-2 rounded-lg bg-white border-[#111933] border text-[#111933] font-semibold px-5 "
                >
                  Cancel <MdCancel className='inline-flex text-xl ml-2' />
                </button>
                <button
                  onClick={handleSubmit}
                  className="p-2 rounded-lg bg-[#111933] border-[#111933] border text-white px-5 "
                >
                  Submit <MdDownloading className='inline-flex text-xl ml-2' />
                </button>
                {file && <button
                  onClick={handlePreview}
                  className="p-2 rounded-lg bg-[#111933] border-[#111933] border text-white px-5 "
                >
                  Preview <Edit className='inline-flex text-xl ml-2' />
                </button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {parsedQuestions && (
        <PreviewModal
          isOpen={isPreviewModalOpen}
          onClose={handleClosePreview}
          selectedQuestions={parsedQuestions}
          setSelectedQuestions={setParsedQuestions}
          isBulkUpload={true}
          setBulkSelectedQuestions={setSelectedQuestions}
        />
      )}
    </div>
  );
};

export default AddTest;