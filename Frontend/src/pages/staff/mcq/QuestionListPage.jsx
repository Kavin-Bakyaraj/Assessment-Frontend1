import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import McqTestQuestionList from '../../../components/McqLibrary/McqTestQuestionList';
import TestQuestionDetails from '../../../components/McqLibrary/TestQuestionDetails';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEdit, faSave, faPlus, faUpload, faTimes, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import bg from '../../../assets/bgpattern.svg';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const QuestionListPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [test, setTest] = useState(location.state['test'] || {});
  const [view, setView] = useState('list'); // 'list', 'details'
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTest, setEditedTest] = useState({ ...test, tags: test?.tags || [] });
  const [originalTest, setOriginalTest] = useState({ ...test, tags: test?.tags || [] }); // Store original test data
  const [testTags, setTestTags] = useState(test?.tags || []);
  const [manualCategory, setManualCategory] = useState("");
  const [testTagsInput, setTestTagsInput] = useState("");
  const toastShownRef = useRef(false);

  const handleTestTagsChange = (e) => {
    const value = e.target.value;
    setTestTagsInput(value);
    if (value.endsWith(',')) {
      const newTag = value.slice(0, -1).trim();
      if (newTag && !testTags.includes(newTag)) {
        const updatedTags = [...testTags, newTag];
        setTestTags(updatedTags);
        setEditedTest({ ...editedTest, tags: updatedTags }); // Synchronize with editedTest
      }
      setTestTagsInput('');
    } else if (!toastShownRef.current) {
      toast.info('Press Enter to Add the Tag', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      toastShownRef.current = true;
    }
  };

  const handleTestTagsKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = testTagsInput.trim();
      if (newTag && !testTags.includes(newTag)) {
        const updatedTags = [...testTags, newTag];
        setTestTags(updatedTags);
        setEditedTest({ ...editedTest, tags: updatedTags }); // Synchronize with editedTest
      }
      setTestTagsInput('');
    }
  };

  const removeTestTag = (tagIndex) => {
    const newTags = testTags.filter((_, i) => i !== tagIndex);
    setTestTags(newTags);
    setEditedTest({ ...editedTest, tags: newTags }); // Synchronize with editedTest
  };

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setView('details');
  };

  const handleBack = () => {
    setView('list');
    setSelectedQuestion(null);
  };

  const handleEdit = () => {
    setOriginalTest({ ...editedTest }); // Store the current state as original before editing
    setIsEditing(true);
  };

  const fetchAllTests = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fetch-all-tests/`);
      const tests = response.data.tests;
      const currentTest = tests.find((t) => t._id === test._id);
      if (currentTest) {
        setTest(currentTest);
        setEditedTest(currentTest);
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
    }
  };

  useEffect(() => {
    fetchAllTests();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/update-test/${editedTest.test_id}/`,
        {
          test_name: editedTest.test_name,
          level: editedTest.level,
          tags: editedTest.tags,
          category: editedTest.category === "Others" ? manualCategory : editedTest.category,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        setTest(editedTest); // Update the test state with the edited values
        setIsEditing(false);
        setEditedTest({ ...editedTest, ...response.data });
        toast.success('Test details saved successfully');
        fetchAllTests(); // Fetch the latest data to ensure synchronization
      } else {
        setError('Failed to update test');
        toast.error('Failed to update test');
      }
    } catch (error) {
      setError('An error occurred while updating the test');
      toast.error('An error occurred while updating the test');
      console.error('Error updating test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedTest(originalTest); // Reset to original test data
    setIsEditing(false);
  };

  if (!test) {
    return <div>No test selected</div>;
  }

  return (
    <div className="flex flex-col py-10 relative px-24 pt-36"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}>
      {view === 'details' && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm flex items-start justify-center pt-4" style={{ zIndex: 1000 }}>
          <TestQuestionDetails
            selectedQuestion={selectedQuestion}
            setSelectedQuestion={(updatedQuestion) => {
              setSelectedQuestion(updatedQuestion);
              const updatedQuestions = editedTest.questions.map(q =>
                q.question_id === updatedQuestion.question_id ? updatedQuestion : q
              );
              setEditedTest({ ...editedTest, questions: updatedQuestions });
            }}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            testId={test.test_id}
            isLoading={loading}
            setIsLoading={setLoading}
            setView={setView}
          />
        </div>
      )}

      {isEditing && (
        <EditTestModal
          editedTest={editedTest}
          setEditedTest={setEditedTest}
          handleSave={handleSave}
          setIsEditing={handleCancelEdit} // Use the cancel handler
          testTags={testTags}
          setTestTags={setTestTags}
          testTagsInput={testTagsInput}
          setTestTagsInput={setTestTagsInput}
          handleTestTagsChange={handleTestTagsChange}
          handleTestTagsKeyPress={handleTestTagsKeyPress}
          removeTestTag={removeTestTag}
          manualCategory={manualCategory}
          setManualCategory={setManualCategory}
        />
      )}

      <div className='bg-white rounded-xl shadow-lg p-10'>
        <div className='flex justify-between items-center mb-4'>
          <h1 className='text-2xl text-[#111933] font-bold'>{editedTest.test_name}</h1>
        </div>

        <div className='flex justify-between items-center '>
          <p className='text-[#111933]'>
            Select and preview the test question from your collection.
          </p>
          <span className='text-lg text-[#111933]'>
            Total Questions: <span className='text-4xl mt-2 font-semibold text-[#111933]'> {editedTest.questions.length}</span>
          </span>
        </div>
        <hr className='border border-gray-300 my-4' />

        <McqTestQuestionList
          testId={test.test_id}
          test={test}
          questions={editedTest.questions || []}
          setSelectedQuestion={handleQuestionClick}
          currentQuestions={editedTest.questions || []}
          currentPage={currentPage}
          totalPages={1}
          setCurrentPage={setCurrentPage}
          setQuestions={() => { }}
          isEditing={isEditing}
          handleEdit={handleEdit}
          deleteSelectedQuestions={() => { }}
        />
      </div>

      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export default QuestionListPage;

const EditTestModal = ({ editedTest, setEditedTest, handleSave, setIsEditing, testTags, setTestTags, testTagsInput, setTestTagsInput, handleTestTagsChange, handleTestTagsKeyPress, removeTestTag, manualCategory, setManualCategory }) => {

  const preventConsecutiveCharacters = (value) => {
    const regex = /(.)\1{7,}/; // Regex to match 8 or more consecutive identical characters
    return !regex.test(value);
  };

  const handleInputChange = (e, setter) => {
    const value = e.target.value;
    if (preventConsecutiveCharacters(value)) {
      setter(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Test Details</h2>
          <button onClick={setIsEditing} className="text-gray-600 hover:text-gray-800">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="flex flex-col">
          <div className="flex flex-col mb-4">
            <input
              type="text"
              value={editedTest.test_name}
              onChange={(e) => handleInputChange(e, (value) => setEditedTest({ ...editedTest, test_name: value }))}
              className="text-2xl border rounded-lg px-3 py-2 bg-transparent outline-blue-400 text-[#111933] w-full mb-2"
              placeholder="Test Name"
            />
            <div className="flex flex-wrap items-center gap-2 my-2">
              {testTags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                  style={{ color: '#111933' }}
                >
                  {toCamelCase(tag)}
                  <button
                    onClick={() => removeTestTag(tagIndex)}
                    className="ml-2 text-blue-800 hover:text-blue-900"
                    style={{ color: '#111933' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={testTagsInput}
              onChange={(e) => handleInputChange(e, setTestTagsInput)}
              onKeyPress={handleTestTagsKeyPress}
              placeholder="Type and press Enter or comma to add tags"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              style={{ color: '#111933' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-6 items-start my-2">
            <div className="flex flex-col">
              <label className="text-gray-700 text-sm font-semibold mb-1" style={{ color: '#111933' }}>
                Test Level:
              </label>
              <select
                required
                value={editedTest.level}
                onChange={(e) => handleInputChange(e, (value) => setEditedTest({ ...editedTest, level: value }))}
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                style={{ color: '#111933' }}
              >
                <option value="">Select Level</option>
                {["Easy", "Medium", "Hard"].map((level, idx) => (
                  <option key={idx} value={level} style={{ color: '#111933' }}>{level}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-gray-700 text-sm font-semibold mb-1" style={{ color: '#111933' }}>
                Select Category:
              </label>
              <select
                required
                value={editedTest.category}
                onChange={(e) => {
                  const category = e.target.value;
                  if (preventConsecutiveCharacters(category)) {
                    setEditedTest({ ...editedTest, category: category });
                    if (category !== "Others") {
                      setManualCategory(""); // Clear manual category if a predefined category is selected
                    }
                  }
                }}
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                style={{ color: '#111933' }}
              >
                <option value="">Select Category</option>
                {["Math", "Science", "History", "Geography"].map((category, idx) => (
                  <option key={idx} value={category} style={{ color: '#111933' }}>{category}</option>
                ))}
                <option value="Others" style={{ color: '#111933' }}>Others</option>
              </select>
              {editedTest.category === "Others" && (
                <input
                  type="text"
                  value={manualCategory}
                  onChange={(e) => handleInputChange(e, setManualCategory)}
                  placeholder="Enter category manually"
                  className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-2"
                  style={{ color: '#111933' }}
                />
              )}
            </div>
          </div>
          <div className='flex justify-end'>
            <button
              onClick={handleSave}
              className="bg-[#111933] mt-2 text-white py-2 px-6 rounded-lg flex items-center space-x-2 shadow-md hover:bg-[#001d4a] transition duration-200 ease-in-out"
            >
              <p className="text-sm">Save Test Details</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function toCamelCase(str) {
  return str
    .split(' ') // Split the string into words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter and make the rest lowercase
    .join(' '); // Join the words back together with spaces
}

// Helper function to get the color class based on level
function getLevelColor(level) {
  switch (level.toLowerCase()) {
    case 'easy':
      return 'text-green-500';
    case 'medium':
      return 'text-yellow-500';
    case 'hard':
      return 'text-red-500';
    default:
      return 'text-[#111933]';
  }
}
