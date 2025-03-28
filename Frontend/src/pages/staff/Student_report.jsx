import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUser, FaFilter, FaExclamationCircle, FaRegIdBadge, FaCodeBranch, FaBoxes, FaRegCalendarAlt, FaCheck, FaEye } from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";
import { FaRegBuilding, FaXmark, FaClock } from "react-icons/fa6";
import { TfiLayoutListThumbAlt, TfiLayoutListThumb } from "react-icons/tfi";
import { PiCalendarSlashFill } from "react-icons/pi";
import { CircularProgress, Pagination, Modal, Box, Typography, Button } from "@mui/material";
import UserImg from "../../assets/profile.svg";
import full_screen from "../../assets/Full_screen.svg";
import total_questions from "../../assets/Total_Questions.svg";
import total_marks from "../../assets/total_marks.svg";
import Correct from "../../assets/Correct.svg";
import Wrong from "../../assets/Wrong.svg";
import Loader from "../../layout/Loader";
import GoldBadge from "../../assets/badges/Gold.png";
import SilverBadge from "../../assets/badges/Silver.png";
import BronzeBadge from "../../assets/badges/Bronze.png";
import bg from '../../assets/bgpattern.svg';
import testno from '../../assets/Failed_to_fetch.jpg'; // Import the image

const StudentReport = ({ contestId: propContestId, regno: propRegNo, hideDetails }) => {
  const { contestId: paramContestId, regno: paramRegNo } = useParams();
  const contestId = propContestId || paramContestId;
  const regno = propRegNo || paramRegNo;

  const [testData, setTestData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);
  const [selectedSection, setSelectedSection] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const navigate = useNavigate();

  const TestSummaryCard = ({ title, value, icon }) => {
    return (
      <div className="relative bg-white p-4 border-2 border-gray-100 rounded-lg shadow-md flex flex-col items-center justify-center min-w-[170px] min-h-[100px]">
        <img src={icon} alt={title} className="absolute -top-2 -right-3 w-6 h-6" />
        <span className="font-semibold text-gray-700 mb-2">{title}</span>
        <div className="text-xl font-bold text-gray-900">{value}</div>
      </div>
    );
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/student/`);
        setStudents(response.data);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchStudentReport = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/mcq/student-report/${contestId}/${regno}/`);
        setTestData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch student report:", err);
        setError("Failed to fetch student report.");
        setLoading(false);
      }
    };
    fetchStudentReport();
  }, [contestId, regno]);

  console.log('testData', testData);

  if (loading) return <Loader />;
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img src={testno} alt="Error" className="w-64 h-64 object-cover" />
      <p className="text-2xl font-bold text-gray-800 mt-4">{error}</p>
    </div>
  );
  if (!testData) return <div>No data available.</div>;

  const matchedStudent = testData?.student_id
    ? students.find((student) => student.studentId === testData.student_id)
    : null;

  const studentName = matchedStudent ? matchedStudent.name : "Unknown Student";

  function formatTimeDifference(startTime, endTime) {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start.getTime() === end.getTime()) return "Invalid Duration";
      const diffInMilliseconds = Math.max(0, end - start);
      const hours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
      const minutes = Math.floor((diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffInMilliseconds % (1000 * 60)) / 1000);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    } catch (error) {
      console.error("Error calculating time difference:", error);
      return "Invalid Duration";
    }
  }

  const handleViewReport = (regno) => {
    navigate(`/studentstats/${matchedStudent?.regno}`);
  };

  const formatDuration = (duration) => {
    const hours = duration?.hours || 0;
    const minutes = duration?.minutes || 0;
    return `${hours > 0 ? `${hours} hr ` : ''}${minutes > 0 ? `${minutes} min` : ''}`.trim() || 'N/A';
  };

  const totalDuration = testData.is_section === "Yes" && testData.timing_type === "Section"
    ? testData.sections.reduce((acc, section) => {
      return {
        hours: acc.hours + (section.sectionDuration?.hours || 0),
        minutes: acc.minutes + (section.sectionDuration?.minutes || 0),
      };
    }, { hours: 0, minutes: 0 })
    : testData.duration;

  const {
    attended_questions,
    start_time,
    finish_time,
    fullscreen,
    correct_answers,
    total_questions,
    total_marks,
  } = testData;

  const notAnsweredQuestions = attended_questions.filter(
    (q) => q.userAnswer === null || q.userAnswer === "" || q.userAnswer.toLowerCase() === "notattended"
  ).length;

  // Map questions to sections based on numQuestions
  const questionSectionMap = [];
  let questionIndex = 0;
  if (testData?.is_section.toLowerCase() === "yes") {
    testData.sections.forEach((section) => {
      const numQuestions = parseInt(section.numQuestions, 10) || 0;
      for (let i = 0; i < numQuestions; i++) {
        if (questionIndex < attended_questions.length) {
          questionSectionMap.push({
            ...attended_questions[questionIndex],
            sectionName: section.sectionName,
          });
          questionIndex++;
        }
      }
    });
  } else {
    // For non-section-based tests, use the original questions
    questionSectionMap.push(...attended_questions.map(q => ({ ...q, sectionName: null })));
  }

  // Filter questions based on the selected section
  const filteredQuestions = questionSectionMap.filter((question) => {
    // If no section is selected or test is not section-based, show all questions
    if (!selectedSection || testData?.is_section.toLowerCase() !== "yes") {
      if (filter === "all") return true;
      if (filter === "answered")
        return question.userAnswer !== null && question.userAnswer !== "" && question.userAnswer.toLowerCase() !== "notattended";
      if (filter === "not_answered")
        return question.userAnswer === null || question.userAnswer === "" || question.userAnswer.toLowerCase() === "notattended";
      if (filter === "correct") return question.isCorrect;
      if (filter === "incorrect")
        return !question.isCorrect && question.userAnswer !== null && question.userAnswer !== "" && question.userAnswer.toLowerCase() !== "notattended";
      return false;
    }

    // Filter by selected section
    const matchesSection = question.sectionName === selectedSection.sectionName;
    if (!matchesSection) return false;

    if (filter === "all") return true;
    if (filter === "answered")
      return question.userAnswer !== null && question.userAnswer !== "" && question.userAnswer.toLowerCase() !== "notattended";
    if (filter === "not_answered")
      return question.userAnswer === null || question.userAnswer === "" || question.userAnswer.toLowerCase() !== "notattended";
    if (filter === "correct") return question.isCorrect;
    if (filter === "incorrect")
      return !question.isCorrect && question.userAnswer !== null && question.userAnswer !== "" && question.userAnswer.toLowerCase() !== "notattended";
    return false;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const answeredQuestions = attended_questions.length - notAnsweredQuestions;

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' }).toUpperCase()} ${date.getFullYear()} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`;
  };

  const handleOpenPopup = (question) => {
    setSelectedQuestion(question);
    setOpen(true);
  };

  const handleClosePopup = () => {
    setOpen(false);
    setSelectedQuestion(null);
  };

  return (
    <div
      id="report-preview"
      className="space-y-6 py-20 pt-28 px-8 min-h-screen flex flex-col"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}
    >
      <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-4 p-6">
        <div className="flex flex-col md:p-6 items-stretch bg-white rounded-lg shadow-md w-full max-w-3xl md:w-1/4 md:space-y-4 flex-shrink-0">
          <div className="min-w-[30%] text-[#111933] flex-1 flex flex-col items-center justify-center">
            <p className="text-5xl font-bold text-white bg-[#111933] w-28 h-28 rounded-full flex items-center justify-center">
              {matchedStudent?.name?.charAt(0).toUpperCase() || "S"}
            </p>
            <p className="text-3xl font-bold mt-3">{matchedStudent?.name || "Student"}</p>
            <p className="text-xs font-bold bg-gray-300 rounded-lg px-2 py-1">STUDENT</p>
          </div>
          <div className="flex-grow py-2">
            <div className="grid grid-cols-2 gap-y-4 ml-5">
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><FaRegBuilding /> College</span></p>
              <p className="text-black">: {matchedStudent?.collegename || "N/A"}</p>
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><FaCodeBranch /> Department</span></p>
              <p className="text-black">: {matchedStudent?.dept || "N/A"}</p>
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><FaRegIdBadge /> Register Number</span></p>
              <p className="text-black">: {matchedStudent?.regno?.toUpperCase() || "N/A"}</p>
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><MdOutlineMail /> Email</span></p>
              <p className="text-black">: {matchedStudent?.email || "N/A"}</p>
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><FaRegCalendarAlt /> Year</span></p>
              <p className="text-black">: {matchedStudent?.year || "N/A"}</p>
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><FaBoxes /> Section</span></p>
              <p className="text-black">: {matchedStudent?.section || "N/A"}</p>
            </div>
            <button
              className="w-full mt-20 px-3 py-2 text-[#111933] font-bold border border-[#111933] rounded-lg"
              onClick={() => handleViewReport(students.regno || students.registration_number)}
            >
              View Full Report
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col space-y-4">
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex-1 flex flex-col rounded-t-lg justify-between">
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <p className="text-2xl font-semibold mb-2">{testData?.contest_name}</p>
                  <p className="text-md text-black break-words text-justify mb-3">{testData?.description}</p>
                  <div className="flex gap-5 items-center mb-4">
                    <span className="block mt-4 text-sm font-bold rounded-full py-2 px-4 bg-[#fef5de] border border-[#ffcc00]">
                      {testData?.is_section.toLowerCase() === "yes" ? "Section Based" : "Non-Sectional"}
                    </span>
                    <span className="block mt-4 text-sm font-bold rounded-full py-2 px-4 bg-[#e1f9f0] border border-[#10b981]">
                      {formatDate(testData?.registrationStart)}
                    </span>
                    <span className="block mt-4 text-sm font-bold rounded-full py-2 px-4 bg-[#feeaea] border border-[#f87171]">
                      {formatDate(testData?.registrationEnd)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg w-full">
              <div className="flex justify-between items-center bg-white rounded-b-lg p-4 border-t">
                <div className="flex flex-col items-start ml-5 w-1/4 text-center">
                  <span className="text-xl font-bold">{formatDuration(totalDuration)}</span>
                  <span className="text-gray-500">Assessment Duration</span>
                </div>
                <div className="border-l border-gray-300 h-16" />
                <div className="flex flex-col items-start ml-5 w-1/4 text-center">
                  <span className="text-xl font-bold">{total_questions}</span>
                  <span className="text-gray-500">No of Questions</span>
                </div>
                <div className="border-l border-gray-300 h-16" />
                <div className="flex flex-col items-start ml-5 w-1/4 text-center">
                  <span className="text-xl font-bold">{total_marks}</span>
                  <span className="text-gray-500">Total Mark</span>
                </div>
                <div className="border-l border-gray-300 h-16" />
                <div className="flex flex-col items-start ml-5 w-1/4 text-center">
                  <span className="text-xl font-bold">{testData?.passPercentage}%</span>
                  <span className="text-gray-500">Pass Percentage</span>
                </div>
              </div>
            </div>
          </section>
          <section className="md:flex gap-4 flex-1 text-[#111933]">
            <div className="w-4/6 grid grid-cols-3 gap-4">
              <div className="bg-white flex-1 rounded-lg shadow-md md:flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{answeredQuestions}</p>
                  <span className="bg-blue-100 text-2xl p-2 rounded-full"><TfiLayoutListThumbAlt /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2">Attended</p>
                  <p className="text-xs text-gray-400">This represents the number of questions you have attempted.</p>
                </div>
              </div>
              <div className="bg-white flex-1 rounded-lg shadow-md md:flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{notAnsweredQuestions}</p>
                  <span className="bg-blue-100 text-2xl p-2 rounded-full"><TfiLayoutListThumb /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2">Not Attended</p>
                  <p className="text-xs text-gray-400">These are the questions you did not answer.</p>
                </div>
              </div>
              <div className="bg-white flex-1 rounded-lg shadow-md md:flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{correct_answers}</p>
                  <span className="bg-blue-100 text-2xl p-2 rounded-full"><FaCheck /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2">Correct Answers</p>
                  <p className="text-xs text-gray-400">The total count of questions you answered correctly.</p>
                </div>
              </div>
              <div className="bg-white flex-1 rounded-lg shadow-md md:flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{answeredQuestions - correct_answers}</p>
                  <span className="bg-blue-100 text-2xl p-2 rounded-full"><FaXmark /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2">Wrong Answers</p>
                  <p className="text-xs text-gray-400">These are the questions you attempted but answered incorrectly.</p>
                </div>
              </div>
              <div className="bg-white flex-1 rounded-lg shadow-md md:flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{fullscreen}</p>
                  <span className="bg-blue-100 text-2xl p-2 rounded-full"><PiCalendarSlashFill /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2">Fullscreen Breach</p>
                  <p className="text-xs text-gray-400">Indicates how many times you exited full screen.</p>
                </div>
              </div>
              <div className="bg-white flex-1 rounded-lg shadow-md md:flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{formatTimeDifference(start_time, finish_time)}</p>
                  <span className="bg-blue-100 text-2xl p-2 rounded-full"><FaClock /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2">Time Taken</p>
                  <p className="text-xs text-gray-400">Displays the total duration you have spent on the assessment.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
              <p className="text-lg font-semibold mb-4">Pass Percentage</p>
              <div className="relative w-32 h-32">
                <CircularProgress
                  variant="determinate"
                  value={100} // Full background bar
                  size={128}
                  thickness={12}
                  sx={{
                    color: '#6B8ABC',
                    position: 'absolute'
                  }}
                />
                <CircularProgress
                  variant="determinate"
                  value={testData?.percentageScored || 0} // White border bar
                  size={128}
                  thickness={12} // Slightly thicker to create border
                  sx={{
                    color: '#2CAFFE',
                    position: 'absolute',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-lg font-bold text-[#111933]">{(testData?.percentageScored).toFixed(1) || 0}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Certificate can be claimed only if you clear the pass percentage
              </p>
            </div>
          </section>
        </div>
      </div>

      {testData?.is_section.toLowerCase() === 'yes' && (
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-md text-[#111933] p-5">
            <p className="text-xl font-bold mb-4">Section Details</p>
            <div className="overflow-x-auto m-6 border-2 rounded-lg">
              <table className="min-w-full bg-white">
                <thead className="bg-[#F0F0F0] text-[#111933]">
                  <tr>
                    <th className="py-3 px-4 font-bold border-r">Section Name</th>
                    {testData?.timing_type !== "Overall" && <th className="py-3 px-4 font-bold border-r">Section Duration</th>}
                    <th className="py-3 px-4 font-bold border-r">No. of Questions</th>
                    <th className="py-3 px-4 font-bold border-r">Marks Per Question</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {testData?.sections?.map((section, index) => (
                    <tr
                      key={index}
                      className="border-t hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedSection(section);
                        setCurrentPage(1);
                      }}
                    >
                      <td className="py-3 px-4">{section?.sectionName || 'N/A'}</td>
                      {testData?.timing_type !== "Overall" && <td className="py-3 px-4">{formatDuration(section.sectionDuration)}</td>}
                      <td className="py-3 px-4">{section?.numQuestions || 0}</td>
                      <td className="py-3 px-4">{section?.markAllotment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!hideDetails && (
        <div className="bg-white p-4 w-full max-w-[97%] ml-5 rounded-xl shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 px-2 sm:px-4">
            <h2 className="text-[#111933] text-lg sm:text-xl font-bold mb-2 sm:mb-0">
              {testData?.is_section.toLowerCase() === "yes" && selectedSection
                ? `${selectedSection.sectionName} Questions`
                : "All Questions"}
            </h2>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <FaFilter className="text-lg sm:text-xl text-gray-500" />
              <select
                className="px-3 sm:px-4 py-1 sm:py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="answered">Answered</option>
                <option value="not_answered">Not Answered</option>
                <option value="correct">Correct</option>
                <option value="incorrect">Incorrect</option>
              </select>
            </div>
          </div>
          <div className="space-y-4 mt-4">
            <div className="bg-white border-2 rounded-xl overflow-x-auto mx-2 sm:mx-6">
              <div className="grid grid-cols-[1fr_150px_150px] min-w-[600px] gap-4 p-3 rounded-t-xl bg-[#F0F0F0] font-medium text-[#111933]">
                <p className="flex justify-start font-bold text-sm sm:text-base">Question</p>
                <p className="flex justify-center font-bold text-sm sm:text-base">Result</p>
                <p className="flex justify-center font-bold text-sm sm:text-base">View</p>
              </div>
              {currentQuestions.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-sm sm:text-base">No results found!!!</p>
                </div>
              )}
              {currentQuestions.map((question) => (
                <div
                  key={question.id}
                  className="grid grid-cols-[1fr_150px_150px] min-w-[600px] gap-4 p-3 sm:p-4 border-t hover:bg-gray-50"
                >
                  <p className="flex justify-start text-sm sm:text-base">{question.question}</p>
                  <p className={`flex justify-center ${question.isCorrect ? "text-green-600" : "text-red-600"} text-sm sm:text-base`}>
                    {question.isCorrect ? "Correct" : "Incorrect"}
                  </p>
                  <button
                    onClick={() => handleOpenPopup(question)}
                    className="flex justify-center text-[#111933] hover:underline"
                  >
                    <FaEye className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <Pagination
                count={Math.ceil(filteredQuestions.length / itemsPerPage)}
                page={currentPage}
                onChange={handlePageChange}
                sx={{
                  "& .MuiPaginationItem-root": { color: "#111933", fontSize: '0.875rem', sm: { fontSize: '1rem' } },
                  "& .MuiPaginationItem-root.Mui-selected": { backgroundColor: "#111933", color: "#fff" },
                  "& .MuiPaginationItem-root:hover": { backgroundColor: "rgba(0, 9, 117, 0.4)", color: "#fff" },
                }}
              />
            </div>
          </div>
        </div>
      )}
      <Modal
        open={open}
        onClose={handleClosePopup}
        aria-labelledby="question-popup"
        aria-describedby="question-details"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 600 },
            bgcolor: "background.paper",
            border: "1px solid #111933",
            boxShadow: 24,
            p: { xs: 2, sm: 4 },
            borderRadius: "12px",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Typography
            id="question-popup"
            variant="h6"
            component="h2"
            sx={{
              mb: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: { xs: "1rem", sm: "1.25rem" },
              color: "#111933",
              fontWeight: "bold",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 sm:h-8 sm:w-8 mr-2 text-[#111933]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Question Details
          </Typography>
          {selectedQuestion ? (
            <div id="question-details">
              <Typography
                variant="body1"
                sx={{
                  mb: 2,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  color: "#111933",
                }}
              >
                <strong className="font-semibold">Question:</strong>{" "}
                {selectedQuestion.question}
              </Typography>
              <div className="mb-2">
                <Typography
                  variant="body1"
                  component="span"
                  sx={{
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                    color: "#111933",
                    fontWeight: "semibold",
                  }}
                >
                  <strong>Options:</strong>
                </Typography>
                {selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                  <ul className="list-disc pl-6 mt-1">
                    {selectedQuestion.options.map((option, index) => (
                      <li
                        key={index}
                        className="text-sm sm:text-base text-gray-700"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, ml: 1 }}
                  >
                    No options available
                  </Typography>
                )}
              </div>
              <Typography
                variant="body1"
                sx={{
                  mb: 2,
                  color: "green",
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                }}
              >
                <strong className="font-semibold">Correct Answer:</strong>{" "}
                {selectedQuestion.correctAnswer}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 2,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  color: "#111933",
                }}
              >
                <strong className="font-semibold">Student Answer:</strong>{" "}
                {selectedQuestion.userAnswer === "notattended" || !selectedQuestion.userAnswer
                  ? "Not Answered"
                  : selectedQuestion.userAnswer}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  color: selectedQuestion.isCorrect ? "green" : "red",
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                }}
              >
                <strong className="font-semibold">Result:</strong>{" "}
                {selectedQuestion.isCorrect ? "Correct" : "Incorrect"}
              </Typography>
              <div className="flex justify-center">
                <Button
                  onClick={handleClosePopup}
                  variant="contained"
                  sx={{
                    mt: 2,
                    color: "white",
                    backgroundColor: "#111933",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    "&:hover": {
                      backgroundColor: "#0a0f2b",
                    },
                    borderRadius: "8px",
                    textTransform: "none",
                    px: 3,
                    py: 1,
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <Typography
              variant="body1"
              sx={{ textAlign: "center", color: "#111933", fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              No question selected
            </Typography>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default StudentReport;
