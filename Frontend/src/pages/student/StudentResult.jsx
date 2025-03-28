import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  FaUser,
  FaFilter,
  FaUserCog,
  FaUniversity,
  FaRegAddressBook,
  FaMailBulk,
  FaSchool,
  FaDownload,
  FaEye,
  FaRegIdBadge,
  FaCodeBranch,
  FaBoxes,
  FaRegCalendarAlt,
  FaCheck,
} from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";
import { FaRegBuilding, FaXmark, FaClock } from "react-icons/fa6";
import { TfiLayoutListThumbAlt, TfiLayoutListThumb } from "react-icons/tfi";
import { PiCalendarSlashFill } from "react-icons/pi";
import { CircularProgress, Pagination, Modal, Box, Typography, Button } from "@mui/material";
import UserImg from "../../assets/profile.svg";
import Loader from "../../layout/Loader";
import GoldBadge from "../../assets/badges/Gold.png";
import SilverBadge from "../../assets/badges/Silver.png";
import BronzeBadge from "../../assets/badges/Bronze.png";
import { FaExclamationCircle } from "react-icons/fa";
import PptxGenJS from "pptxgenjs";
import { SHA256 } from 'crypto-js';
import "../../../public/fonts/JosefinSans-Light-normal.js";
import "../../../public/fonts/JosefinSans-Regular-normal.js";
import { jsPDF } from "jspdf";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import full_screen from "../../assets/Full_screen.svg";
import total_questions from "../../assets/Total_Questions.svg";
import total_marks from "../../assets/total_marks.svg";
import Correct from "../../assets/Correct.svg";
import Wrong from "../../assets/Wrong.svg";
import bg from '../../assets/bgpattern.svg';
import testno from '../../assets/Failed_to_fetch.jpg'; // Import the image

const StudentResult = () => {
  const { contestId, studentId } = useParams();
  const [testData, setTestData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);
  const [open, setOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  const TestSummaryCard = ({ title, value, icon }) => {
    return (
      <div className="relative bg-white p-4 border-2 border-gray-100 rounded-lg shadow-md flex flex-col items-center justify-center min-w-[150px] min-h-[100px]">
        <img src={icon} alt={title} className="absolute -top-2 -right-3 w-6 h-6" />
        <span className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">{title}</span>
        <div className="text-lg sm:text-xl font-bold text-gray-900">{value}</div>
      </div>
    );
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchStudentReport = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/mcq/student-report/${contestId}/${studentId}/`
        );
        setTestData(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch student report.");
        setLoading(false);
      }
    };

    const fetchStudents = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/student/`);
        setStudents(response.data);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };

    fetchStudentReport();
    fetchStudents();
  }, [contestId, studentId]);

  const handleDownloadCertificate = async () => {
    if (!testData || !students.length) {
      toast.error("Student or contest data is missing.");
      return;
    }

    const matchedStudent = students.find((s) => s.studentId === testData.student_id);
    if (!matchedStudent) {
      toast.error("Student not found.");
      return;
    }

    const studentName = matchedStudent.name || "Unknown Student";
    const contestName = testData.contest_name || "Unknown Contest";
    const studentId = testData.student_id;

    const uniqueId = SHA256(`${studentName}-${contestName}`).toString();

    let testDate = "Unknown Date";
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mcq/get_cert_date/`, {
        params: { student_id: studentId, contest_id: testData.contest_id },
      });

      if (response.data && response.data.finish_time) {
        testDate = new Date(response.data.finish_time).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch (error) {
      console.error("Error fetching test date:", error);
      toast.error("Failed to fetch test date.");
      return;
    }

    let correctAnswers = 0;
    try {
      const scoreResponse = await axios.get(
        `${API_BASE_URL}/api/mcq/get-score/${testData.contest_id}/${studentId}/`
      );
      if (scoreResponse.data && typeof scoreResponse.data.correct_answers === "number") {
        correctAnswers = scoreResponse.data.correct_answers;
      }
    } catch (error) {
      console.error("Error fetching correct answers:", error);
      toast.error("Failed to fetch correct answers.");
      return;
    }

    const totalQuestions = testData.attended_questions.length;
    const passPercentage = testData.passPercentage || 50;
    const scorePercentage = (correctAnswers / totalQuestions) * 100;

    if (scorePercentage < passPercentage) {
      toast.error(
        `You need at least ${passPercentage}% to pass the test. Your score is ${scorePercentage.toFixed(2)}%.`
      );
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/mcq/store-certificate/`, {
        uniqueId,
        studentName,
        contestName,
        studentId,
        testDate,
        correctAnswers,
      });
    } catch (error) {
      console.error("Error storing certificate data:", error);
      toast.error("Failed to store certificate data.");
      return;
    }

    const pdf = new jsPDF("l", "mm", "a4");
    const templateImage = "/cert_template_temp.png";
    const img = new Image();
    img.src = templateImage;
    img.onload = () => {
      pdf.addImage(img, "PNG", 0, 0, 297, 210);
      pdf.addFont("JosefinSans-Light", "JosefinSans", "normal");
      pdf.setFont("JosefinSans-Light");

      pdf.setFontSize(34);
      pdf.setFont("JosefinSans-Regular", "normal");
      pdf.text(studentName, 148, 100, { align: "center" });

      pdf.setFont("JosefinSans-Light", "normal");
      pdf.setFontSize(24);
      pdf.text(
        `For successfully completing ${contestName} on ${testDate}, achieving an outstanding score of ${correctAnswers}. This recognition is awarded in honor of exemplary performance, dedication, and commitment to excellence in the assessment.`,
        140,
        123,
        { align: "center", maxWidth: 600 }
      );

      const formattedDate = testDate.replace(/,/g, "").split(" ").join("-");
      const frontendBaseUrl = window.location.origin;
      const verifyLink = `${frontendBaseUrl}/verify-certificate/${uniqueId}/${formattedDate}/${correctAnswers}`;

      pdf.setTextColor(0, 0, 255);
      pdf.setFontSize(9);
      pdf.text(verifyLink, 1, 208);

      pdf.save(`${studentName}_Certificate.pdf`);

      Swal.fire({
        title: "Certificate Downloaded!",
        text: "Your certificate has been downloaded successfully.",
        icon: "success",
        allowOutsideClick: false,
        showConfirmButton: true,
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "custom-ok-button",
        },
        didOpen: () => {
          Swal.getPopup().classList.add("swal2-draggable");
          const style = document.createElement("style");
          style.innerHTML = `
            .custom-ok-button {
              background-color: #111933 !important;
              color: white !important;
            }
          `;
          document.head.appendChild(style);
        },
      });
    };
  };

  const handleOpenPopup = (question) => {
    setSelectedQuestion(question);
    setOpen(true);
  };

  const handleClosePopup = () => {
    setOpen(false);
    setSelectedQuestion(null);
  };

  if (loading) return <Loader />;
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img src={testno} alt="Error" className="w-64 h-64 object-cover" />
      <p className="text-2xl font-bold text-gray-800 mt-4">{error}</p>
    </div>
  );
  if (!testData) return <div>No data available.</div>;

  const matchedStudent = students.find((s) => s.studentId === testData.student_id);

  const {
    attended_questions,
    start_time,
    finish_time,
    fullscreen,
    tabswitchwarning,
    correct_answers,
    total_questions,
    total_marks,
  } = testData;

  const notAnsweredQuestions = attended_questions.filter(
    (q) => q.userAnswer === null || q.userAnswer === "" || q.userAnswer === "notattended"
  ).length;
  const answeredQuestions = attended_questions.length - notAnsweredQuestions;

  const questionSectionMap = [];
  let questionIndex = 0;
  if (testData?.is_section?.toLowerCase() === "yes") {
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
    questionSectionMap.push(...attended_questions.map(q => ({ ...q, sectionName: null })));
  }

  const filteredQuestions = questionSectionMap.filter((question) => {
    if (!selectedSection || testData?.is_section?.toLowerCase() !== "yes") {
      if (filter === "all") return true;
      if (filter === "answered")
        return question.userAnswer !== null && question.userAnswer !== "" && question.userAnswer !== "notattended";
      if (filter === "not_answered")
        return question.userAnswer === null || question.userAnswer === "" || question.userAnswer === "notattended";
      if (filter === "correct") return question.isCorrect;
      if (filter === "incorrect")
        return !question.isCorrect && question.userAnswer !== null && question.userAnswer !== "" && question.userAnswer !== "notattended";
      return false;
    }

    const matchesSection = question.sectionName === selectedSection.sectionName;
    if (!matchesSection) return false;

    if (filter === "all") return true;
    if (filter === "answered")
      return question.userAnswer !== null && question.userAnswer !== "" && question.userAnswer !== "notattended";
    if (filter === "not_answered")
      return question.userAnswer === null || question.userAnswer === "" || question.userAnswer === "notattended";
    if (filter === "correct") return question.isCorrect;
    if (filter === "incorrect")
      return !question.isCorrect && question.userAnswer !== null && question.userAnswer !== "" && question.userAnswer !== "notattended";
    return false;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  function formatTimeDifference(startTime, endTime) {
    try {
      const normalizeTimeString = (timeStr) => {
        if (!timeStr) return null;
        return timeStr.replace('Z', '').split('.')[0];
      };

      const normalizedStart = normalizeTimeString(startTime);
      const normalizedEnd = normalizeTimeString(endTime);

      if (!normalizedStart || !normalizedEnd) {
        console.error("Invalid time format provided:", { startTime, endTime });
        return "00:00:00";
      }

      if (endTime && endTime.length <= 8 && endTime.includes(':')) {
        return endTime;
      }

      let startHours = 0, startMinutes = 0, startSeconds = 0;
      let endHours = 0, endMinutes = 0, endSeconds = 0;

      if (normalizedStart.includes('T')) {
        const timePart = normalizedStart.split('T')[1];
        [startHours, startMinutes, startSeconds] = timePart.split(':').map(Number);
      }

      if (normalizedEnd.includes('T')) {
        const timePart = normalizedEnd.split('T')[1];
        [endHours, endMinutes, endSeconds] = timePart.split(':').map(Number);
      }

      let secondsDiff = (endHours * 3600 + endMinutes * 60 + endSeconds) -
        (startHours * 3600 + startMinutes * 60 + startSeconds);

      if (secondsDiff < 0) {
        secondsDiff += 24 * 3600;
      }

      secondsDiff = Math.min(secondsDiff, 86400);

      const hours = Math.floor(secondsDiff / 3600);
      const minutes = Math.floor((secondsDiff % 3600) / 60);
      const seconds = Math.floor(secondsDiff % 60);

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    } catch (error) {
      console.error("Error calculating time difference:", error);
      return "00:00:00";
    }
  }

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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' }).toUpperCase()} ${date.getFullYear()} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}`;
  };

  return (
    <div
      id="report-preview"
      className="space-y-4 py-6 px-2 sm:px-3 md:px-8 min-h-screen flex flex-col"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}
    >
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 sm:p-6">
        {/* Student Info Section */}
        <div className="flex flex-col p-4 sm:p-6 items-stretch bg-white rounded-lg shadow-md w-full md:w-1/4 md:space-y-4 flex-shrink-0">
          <div className="text-[#111933] flex-1 flex flex-col items-center justify-center">
            <p className="text-4xl sm:text-5xl font-bold text-white bg-[#111933] w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center">
              {matchedStudent?.name?.charAt(0).toUpperCase() || "S"}
            </p>
            <p className="text-xl sm:text-3xl font-bold mt-3">{matchedStudent?.name || "Student"}</p>
            <p className="text-xs font-bold bg-gray-300 rounded-lg px-2 py-1">STUDENT</p>
          </div>
          <div className="flex-grow py-2">
            <div className="grid grid-cols-2 gap-y-3 sm:gap-y-5 ml-3 sm:ml-5 text-sm sm:text-base">
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><FaRegBuilding /> College</span></p>
              <p className="text-black break-words">: {matchedStudent?.collegename || "N/A"}</p>
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><FaCodeBranch /> Department</span></p>
              <p className="text-black break-words">: {matchedStudent?.dept || "N/A"}</p>
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><FaRegIdBadge /> Register Number</span></p>
              <p className="text-black break-words">: {matchedStudent?.regno?.toUpperCase() || "N/A"}</p>
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><MdOutlineMail /> Email</span></p>
              <p className="text-black break-words">: {matchedStudent?.email || "N/A"}</p>
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><FaRegCalendarAlt /> Year</span></p>
              <p className="text-black break-words">: {matchedStudent?.year || "N/A"}</p>
              <p><span className="font-semibold text-gray-500 flex items-center gap-1"><FaBoxes /> Section</span></p>
              <p className="text-black break-words">: {matchedStudent?.section || "N/A"}</p>
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <button
              onClick={handleDownloadCertificate}
              className={`flex items-center ${testData.generateCertificate ? 'bg-[#111933] hover:shadow-xl' : 'bg-[#1b2b6180] cursor-not-allowed'}  text-white px-3 sm:px-4 py-2 rounded transition duration-300 text-sm sm:text-base`}
            >
              <FaDownload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Download Certificate
            </button>
          </div>
        </div>
        {/* Contest Details and Test Summary Section */}
        <div className="flex-1 flex flex-col space-y-4">
          {/* Contest Details Section */}
          <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex-1 flex flex-col rounded-t-lg justify-between">
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div className="w-full">
                  <p className="text-lg sm:text-2xl font-semibold mb-2">{testData?.contest_name}</p>
                  <p className="text-sm sm:text-md text-black break-words text-justify mb-3">{testData?.description}</p>
                  <div className="flex flex-wrap gap-3 sm:gap-5 items-center mb-4">
                    <span className="block mt-2 sm:mt-4 text-xs sm:text-sm font-bold rounded-full py-1 sm:py-2 px-3 sm:px-4 bg-[#fef5de] border border-[#ffcc00]">
                      {testData?.is_section?.toLowerCase() === "yes" ? "Section Based" : "Non-Sectional"}
                    </span>
                    <span className="block mt-2 sm:mt-4 text-xs sm:text-sm font-bold rounded-full py-1 sm:py-2 px-3 sm:px-4 bg-[#e1f9f0] border border-[#10b981] break-words">
                      {formatDate(testData?.registrationStart)}
                    </span>
                    <span className="block mt-2 sm:mt-4 text-xs sm:text-sm font-bold rounded-full py-1 sm:py-2 px-3 sm:px-4 bg-[#feeaea] border border-[#f87171] break-words">
                      {formatDate(testData?.registrationEnd)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg w-full">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white rounded-b-lg p-4 border-t">
                <div className="flex flex-col items-start md:ml-5 w-full md:w-1/4 text-center md:text-left mb-4 md:mb-0">
                  <span className="text-xl font-bold">{formatDuration(totalDuration)}</span>
                  <span className="text-gray-500">Assessment Duration</span>
                </div>
                <div className="border-t md:border-l md:border-t-0 border-gray-300 w-full md:h-16 md:w-0 mb-4 md:mb-0" />
                <div className="flex flex-col items-start md:ml-5 w-full md:w-1/4 text-center md:text-left mb-4 md:mb-0">
                  <span className="text-xl font-bold">{total_questions}</span>
                  <span className="text-gray-500">No of Questions</span>
                </div>
                <div className="border-t md:border-l md:border-t-0 border-gray-300 w-full md:h-16 md:w-0 mb-4 md:mb-0" />
                <div className="flex flex-col items-start md:ml-5 w-full md:w-1/4 text-center md:text-left mb-4 md:mb-0">
                  <span className="text-xl font-bold">{total_marks}</span>
                  <span className="text-gray-500">Total Mark</span>
                </div>
                <div className="border-t md:border-l md:border-t-0 border-gray-300 w-full md:h-16 md:w-0 mb-4 md:mb-0" />
                <div className="flex flex-col items-start md:ml-5 w-full md:w-1/4 text-center md:text-left">
                  <span className="text-xl font-bold">{testData?.passPercentage}%</span>
                  <span className="text-gray-500">Pass Percentage</span>
                </div>
              </div>
            </div>

          </section>
          {/* Test Summary Section */}
          <section className="flex flex-col md:flex-row gap-4 flex-1 text-[#111933]">
            <div className="w-full md:w-4/6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white flex-1 rounded-lg shadow-md flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-bold">{answeredQuestions}</p>
                  <span className="bg-blue-100 text-xl sm:text-2xl p-2 rounded-full"><TfiLayoutListThumbAlt /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2 text-sm sm:text-base">Attended</p>
                  <p className="text-xs text-gray-400">This represents the number of questions you have attempted.</p>
                </div>
              </div>
              <div className="bg-white flex-1 rounded-lg shadow-md flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-bold">{notAnsweredQuestions}</p>
                  <span className="bg-blue-100 text-xl sm:text-2xl p-2 rounded-full"><TfiLayoutListThumb /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2 text-sm sm:text-base">Not Attended</p>
                  <p className="text-xs text-gray-400">These are the questions you did not answer.</p>
                </div>
              </div>
              <div className="bg-white flex-1 rounded-lg shadow-md flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-bold">{correct_answers}</p>
                  <span className="bg-blue-100 text-xl sm:text-2xl p-2 rounded-full"><FaCheck /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2 text-sm sm:text-base">Correct Answers</p>
                  <p className="text-xs text-gray-400">The total count of questions you answered correctly.</p>
                </div>
              </div>
              <div className="bg-white flex-1 rounded-lg shadow-md flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-bold">{answeredQuestions - correct_answers}</p>
                  <span className="bg-blue-100 text-xl sm:text-2xl p-2 rounded-full"><FaXmark /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2 text-sm sm:text-base">Wrong Answers</p>
                  <p className="text-xs text-gray-400">These are the questions you attempted but answered incorrectly.</p>
                </div>
              </div>
              <div className="bg-white flex-1 rounded-lg shadow-md flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-bold">{fullscreen}</p>
                  <span className="bg-blue-100 text-xl sm:text-2xl p-2 rounded-full"><PiCalendarSlashFill /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2 text-sm sm:text-base">Fullscreen Breach</p>
                  <p className="text-xs text-gray-400">Indicates how many times you exited full screen.</p>
                </div>
              </div>
              <div className="bg-white flex-1 rounded-lg shadow-md flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-bold">{formatTimeDifference(start_time, finish_time)}</p>
                  <span className="bg-blue-100 text-xl sm:text-2xl p-2 rounded-full"><FaClock /></span>
                </div>
                <div>
                  <p className="font-semibold mb-2 text-sm sm:text-base">Time Taken</p>
                  <p className="text-xs text-gray-400">Displays the total duration you have spent on the assessment.</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-2/6 bg-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col items-center justify-center">
              <p className="text-base sm:text-lg font-semibold mb-4">Pass Percentage</p>
              <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={128}
                  thickness={4}
                  sx={{
                    color: '#e0e0e0',
                    position: 'absolute'
                  }}
                />
                <CircularProgress
                  variant="determinate"
                  value={testData?.percentageScored || 0}
                  size={128}
                  thickness={4}
                  sx={{
                    color: '#111933',
                    position: 'absolute',
                    "& .MuiCircularProgress-circle": {
                      strokeLinecap: "round",
                    },
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-lg sm:text-xl font-bold text-[#111933]">{(testData?.percentageScored).toFixed(1) || 0}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-8 text-center">
                Certificate can be claimed only if you clear the pass percentage
              </p>
            </div>

          </section>
        </div>
      </div>

      {/* Section Details Table */}
      {testData?.is_section?.toLowerCase() === 'yes' && (
        <div className="flex-1 sm:p-6">
          <div className="bg-white rounded-lg shadow-md text-[#111933] p-4 sm:p-5">
            <p className="text-lg sm:text-xl font-bold mb-4">Section Details</p>
            <div className="overflow-x-auto m-4 sm:m-6 border-2 rounded-lg">
              <table className="min-w-full bg-white">
                <thead className="bg-[#F0F0F0] text-[#111933]">
                  <tr>
                    <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r text-sm sm:text-base">Section Name</th>
                    {testData?.timing_type !== "Overall" && <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r text-sm sm:text-base">Section Duration</th>}
                    <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r text-sm sm:text-base">No. of Questions</th>
                    <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r text-sm sm:text-base">Marks Per Question</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {testData?.sections?.map((section, index) => (
                    <tr
                      key={index}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedSection(section);
                        setCurrentPage(1);
                      }}
                    >
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base">{section?.sectionName || 'N/A'}</td>
                      {testData?.timing_type !== "Overall" && <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base">{formatDuration(section.sectionDuration)}</td>}
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base">{section?.numQuestions || 0}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base">{section?.markAllotment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Question Details Section */}
      <div className="sm:p-6">
        <div className="bg-white p-4 w-full rounded-xl shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 px-2 sm:px-4">
            <h2 className="text-[#111933] text-lg sm:text-xl font-bold mb-2 sm:mb-0">
              {testData?.is_section?.toLowerCase() === "yes" && selectedSection
                ? `${selectedSection.sectionName} Questions`
                : "Question Details"}
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
      </div>

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
            width: { xs: '90%', sm: 600 },
            bgcolor: "background.paper",
            border: "1px solid #000",
            boxShadow: 24,
            p: { xs: 2, sm: 4 },
            borderRadius: "12px",
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: { xs: '1rem', sm: '1.25rem' } }}
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
          {selectedQuestion && (
            <>
              <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                <strong>Question:</strong> {selectedQuestion.question}
              </Typography>
              <div sx={{ mb: 2 }}>
                <strong>Options:</strong>
                {selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                  <ul className="list-disc pl-4">
                    {selectedQuestion.options.map((option, index) => (
                      <li key={index} className="text-sm sm:text-base">{option}</li>
                    ))}
                  </ul>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    No options available
                  </Typography>
                )}
              </div>
              <Typography variant="body1" sx={{ mb: 2, color: "green", fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                <strong>Correct Answer:</strong> {selectedQuestion.correctAnswer}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                <strong>Student Answer:</strong>{" "}
                {selectedQuestion.userAnswer === "notattended" ? "Not Answered" : selectedQuestion.userAnswer || "Not Answered"}
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 2, color: selectedQuestion.isCorrect ? "green" : "red", fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                <strong>Result:</strong> {selectedQuestion.isCorrect ? "Correct" : "Incorrect"}
              </Typography>
            </>
          )}
          <Button
            onClick={handleClosePopup}
            variant="contained"
            sx={{ mt: 2, color: "white", backgroundColor: "#111933", fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Close
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

export default StudentResult;
