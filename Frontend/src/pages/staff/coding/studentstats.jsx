import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { FaDownload } from "react-icons/fa";
import { useRef } from "react";
import {
  CircularProgress,
  Box,
  Typography,
  Pagination,
  Button,
  Modal,
} from "@mui/material";
import {
  Assessment,
  CheckCircle,
  Cancel,
  WatchLater,
  Search,
} from "@mui/icons-material";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import {
  FaUserCog,
  FaUniversity,
  FaRegAddressBook,
  FaMailBulk,
} from "react-icons/fa";
import Vector from "../../../assets/icons/eos-icons_role-binding-outlined.png";
import { FaList } from "react-icons/fa";
import { FaCheck } from "react-icons/fa6";
import Section from "../../../assets/icons/ic_baseline-6-ft-apart.png";
import Year from "../../../assets/icons/fluent-mdl2_calendar-year.png";
import Group from "../../../assets/icons/Group 8933.png";
import { HiOutlineBuildingOffice } from "react-icons/hi2";
import { TbSitemap } from "react-icons/tb";
import { FaCircleXmark } from "react-icons/fa6";
import { LuDownload } from "react-icons/lu";
import { FaEye } from "react-icons/fa";
import ProfileBg from "../../../assets/profilebg.svg";
import ProfileImg from "../../../assets/profile-studentstats.svg";
import GoldBadge from "../../../assets/badges/Gold.png";
import SilverBadge from "../../../assets/badges/Silver.png";
import BronzeBadge from "../../../assets/badges/Bronze.png";
import Loader from "../../../layout/Loader";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactDOM from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import StudentReport from "../Student_report";
import { PiListChecksBold } from "react-icons/pi";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import bg from "../../../assets/bgpattern.svg";

const EnhancedStudentDashboard = () => {
  const [openPopup, setOpenPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const { regno } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef(null);
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(
    location.state?.currentPage || 1
  );
  const assessmentsPerPage = 5;

  // First, let's add debugging in the useEffect to see the exact structure
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const codingResponse = await axios.get(
          `${API_BASE_URL}/staff/studentstats/${regno}/`
        );
        const mcqResponse = await axios.get(
          `${API_BASE_URL}/staff/mcq_stats/${regno}/`
        );

        if (codingResponse.status === 200 && mcqResponse.status === 200) {
          console.log("Raw coding response:", codingResponse.data);
          console.log("Raw mcq response:", mcqResponse.data);

          // Ensure we're extracting student data correctly
          setStudentData({
            coding: {
              ...codingResponse.data,
              student: codingResponse.data.student || {},
            },
            mcq: {
              ...mcqResponse.data,
              student: mcqResponse.data.student || {},
            },
          });
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [regno, API_BASE_URL]);

  useEffect(() => {
    navigate(location.pathname, { state: { currentPage }, replace: true });
  }, [currentPage, navigate, location.pathname]);

  if (loading) {
    return <Loader message="Loading student data..." />;
  }

  if (!studentData) {
    return (
      <div className="text-center text-xl text-red-500">
        Error: Unable to load student data.
      </div>
    );
  }

  const getBadgeImage = (overallScore) => {
    if (overallScore >= 80) {
      return GoldBadge;
    } else if (overallScore >= 50) {
      return SilverBadge;
    } else {
      return BronzeBadge;
    }
  };

  const handleDownloadReport = async (
    contestStatus,
    contestId,
    studentId,
    studentName,
    setLoading
  ) => {
    if (contestStatus !== "Completed") {
      toast.warning(
        "The contest is not completed. You can download the report once it is completed."
      );
      return;
    }

    if (!contestId || !studentId) {
      console.error("Invalid contestId or studentId");
      return;
    }

    setLoading(true);

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "-9999px";
    document.body.appendChild(container);

    try {
      ReactDOM.render(
        <StudentReport
          contestId={contestId}
          regno={studentId}
          hideDetails={true}
        />,
        container
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const canvas = await html2canvas(container, { scale: 1.5 });
      const imgData = canvas.toDataURL("image/jpeg", 0.8);

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Student-Report of ${studentName}.pdf`);
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download report. Please try again.");
    } finally {
      document.body.removeChild(container);
      setLoading(false);
    }
  };

  const { coding, mcq } = studentData;
  const {
    student,
    time_stats,
    performance: codingPerformance,
    assessments: codingAssessments,
  } = coding || {};
  const { performance: mcqPerformance, assessments: mcqAssessments } =
    mcq || {};
  // Debug the student object
  console.log("Student object for rendering:", student);
  console.log("Student section value:", student.section);

  const completedTests =
    (codingPerformance?.completed_tests || 0) +
    (mcqPerformance?.completed_tests || 0);
  const allAssessments = [
    ...(codingAssessments || []),
    ...(mcqAssessments || []),
  ].reverse();

  const attended = allAssessments.filter(
    (assessment) => assessment.contestStatus === "started"
  ).length;
  const unAttended = allAssessments.filter(
    (assessment) => assessment.contestStatus === "Yet to Start"
  ).length;
  const totalTests = completedTests + attended + unAttended;
  const passedTests = allAssessments.filter(
    (assessment) =>
      assessment.contestStatus === "Completed" && assessment.percentage >= 50
  ).length;

  const handleViewReport = (contestStatus, assessmentId, studentId) => {
    if (contestStatus === "Completed") {
      navigate(`/viewtest/${assessmentId}/${studentId}`, {
        state: { currentPage },
      });
    } else {
      setPopupMessage(
        "The student status is not completed. After completion, you can view the report."
      );
      setOpenPopup(true);
    }
  };

  const averageScore = mcqPerformance?.average_score || 0;
  const badgeImage = getBadgeImage(averageScore);

  const StatCard = ({ icon: Icon, label, value }) => (
    <div className="bg-white w-[30%] h-full shadow-[0_0_15px_rgba(0,0,0,0.1)] rounded-lg px-6 py-12 relative text-center">
      <span className="p-1 absolute -right-3 -top-3 shadow-[0_0_15px_rgba(0,0,0,0.1)] bg-white rounded-full">
        <Icon className="text-[#FFCC00]" />
      </span>
      <p className="m-0 text-xs font-semibold text-[#111933] mb-3">{label}</p>
      <p className="m-0 text-3xl font-semibold text-[#111933]">{value}</p>
    </div>
  );

  // Update the handleDownloadProfile function with these improvements

  const handleDownloadProfile = async () => {
    try {
      if (!profileRef.current) return;

      // Clone the element to modify it before capturing
      const cloneElement = profileRef.current.cloneNode(true);

      // Create a proper wrapper with good styling
      const wrapper = document.createElement("div");
      wrapper.style.backgroundColor = "white";
      wrapper.style.padding = "10px"; // Minimal padding
      wrapper.style.width = "100%"; // Full width
      wrapper.style.boxSizing = "border-box"; // Include padding in width calculation
      wrapper.style.fontFamily = "Arial, sans-serif";
      wrapper.appendChild(cloneElement);

      // Remove any download buttons from the PDF
      const buttons = wrapper.querySelectorAll("button");
      buttons.forEach((button) => button.remove());

      // Make XAxis labels visible for PDF
      const xAxisTicks = wrapper.querySelectorAll(
        ".recharts-xaxis .recharts-cartesian-axis-tick text"
      );
      xAxisTicks.forEach((tick) => {
        tick.style.opacity = "1"; // Make visible
        tick.style.fontSize = "9px"; // Smaller font for better fit
        tick.setAttribute("dy", "10");
        tick.setAttribute("text-anchor", "end");
        tick.setAttribute("transform", "rotate(-45)");
      });

      // Fix profile image display for PDF rendering - important for base64 images
      const profileImageContainer = wrapper.querySelector(
        ".bg-\\[\\#0C1A3C\\]"
      );
      const profileImage = profileImageContainer?.querySelector("img");

      if (profileImage && student?.profileImage) {
        // For base64 images: create a new image to ensure proper loading
        const newImg = document.createElement("img");
        newImg.src = student.profileImage;
        newImg.className = profileImage.className;
        newImg.style.width = "100%";
        newImg.style.height = "100%";
        newImg.style.objectFit = "cover";

        // Replace the original image with the new one
        if (profileImage.parentNode) {
          profileImage.parentNode.replaceChild(newImg, profileImage);
        }

        // Wait for the new image to load
        await new Promise((resolve) => {
          if (newImg.complete) {
            resolve();
          } else {
            newImg.onload = resolve;
            setTimeout(resolve, 1000); // Fallback timeout
          }
        });
      }

      document.body.appendChild(wrapper);
      wrapper.style.position = "absolute";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";

      // Use better settings for html2canvas
      const canvas = await html2canvas(wrapper, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: "white",
        logging: false, // Turn off logging
      });

      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Calculate if we need to split into multiple pages (if height exceeds A4)
      let positionY = 10; // Start position
      const maxHeight = 277; // A4 height minus margins

      if (imgHeight > maxHeight) {
        // Split into multiple pages
        let remainingHeight = imgHeight;
        while (remainingHeight > 0) {
          const chunkHeight = Math.min(remainingHeight, maxHeight);
          pdf.addImage(imgData, "JPEG", 10, positionY, imgWidth, chunkHeight);
          remainingHeight -= chunkHeight;
          positionY = 10; // Reset Y position for new page
          if (remainingHeight > 0) {
            pdf.addPage(); // Add new page if more content remains
          }
        }
      } else {
        // Single page, centered vertically
        const yPosition = (297 - imgHeight) / 2; // A4 height is 297mm
        pdf.addImage(imgData, "JPEG", 10, yPosition, imgWidth, imgHeight);
      }

      pdf.save(`${student?.name || "Student"}_Profile.pdf`);

      toast.success("Student report downloaded successfully!");
    } catch (error) {
      console.error("Error generating profile PDF:", error);
      toast.error("Failed to download student report. Please try again.");
    }
  };

  const indexOfLastAssessment = currentPage * assessmentsPerPage;
  const indexOfFirstAssessment = indexOfLastAssessment - assessmentsPerPage;
  const currentAssessments = allAssessments.slice(
    indexOfFirstAssessment,
    indexOfLastAssessment
  );

  const filteredAssessments = allAssessments.filter((assessment) =>
    assessment.name.toLowerCase().includes(search.toLowerCase())
  );

  const pageAssessments = search
    ? filteredAssessments.slice(0, assessmentsPerPage) // Show first page of search results
    : allAssessments.slice(
        (currentPage - 1) * assessmentsPerPage,
        currentPage * assessmentsPerPage
      );

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearch(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const totalPages = search
    ? Math.ceil(filteredAssessments.length / assessmentsPerPage)
    : Math.ceil(allAssessments.length / assessmentsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  console.log(student);

  const RecentTestStats = ({ assessments = [] }) => {
    const completedTests = assessments
      .filter((test) => test.contestStatus === "Completed")
      .slice(0, 5); // Updated to 5 tests

    if (completedTests.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center">
          <p className="text-2xl font-semibold text-[#111933]">
            No Tests Completed Yet.
          </p>
        </div>
      );
    }

    // Process data for the line graph
    const graphData = completedTests.map((test, index) => ({
      name: test.name,
      percentage: Math.round(test.percentage),
      id: index,
    }));

    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
        <div className="mb-4">
          <h3 className="text-2xl font-semibold mb-2 text-[#111933]">
            Recent Test Stats
          </h3>
          <p className="text-sm text-[#111933]">
            Review your Test Marks Summary to analyze your performance.
          </p>
        </div>

        <div className="flex-1 h-64 -ml-8">
          {completedTests.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={graphData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="id"
                  tick={false}
                  axisLine={{ stroke: "#111933" }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  axisLine={{ stroke: "#111933" }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#111933" }}
                />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#111933"
                  strokeWidth={3}
                  dot={{
                    r: 6,
                    fill: "#111933",
                    strokeWidth: 2,
                    stroke: "#111933",
                  }}
                  activeDot={{ r: 8, fill: "#111933" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
                          <p className="font-medium text-sm">
                            {payload[0].payload.name}
                          </p>
                          <p className="text-sm text-gray-700">{`Score: ${payload[0].value}%`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">Not enough data to display graph</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen py-14 px-16"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}
    >
      <div className="container-lg pt-16 max-w-full mx-auto">
        <div ref={profileRef}>
          <div className="mb-8 grid grid-cols-1 md:grid-cols-[22%,78%] space-x-8">
            <div className="rounded-lg w-full">
              <div className="flex flex-col bg-white items-center py-8 mb-5 rounded-lg px-10 shadow-md relative">
                <div className="bg-[#0C1A3C] w-32 h-32 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                  {student &&
                  (student.profileImage || student.profilePicture) ? (
                    <img
                      src={student.profileImage || student.profilePicture}
                      alt={student?.name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        e.target.parentNode.innerHTML = `<span class="text-5xl font-bold text-white">${
                          student?.name?.charAt(0).toUpperCase() || "N"
                        }</span>`;
                      }}
                    />
                  ) : (
                    <span className="text-5xl font-bold text-white">
                      {student?.name?.charAt(0).toUpperCase() || "N"}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-[#111933] mb-3">
                  {student?.name || "NA"}
                </h2>
                <p className="text-xs bg-gray-200 text-[#111933] font-semibold px-2 py-0.5 rounded mb-6">
                  STUDENT
                </p>
              </div>

              <div className="space-y-4 bg-white p-7 rounded-lg shadow-md ">
                <div className="flex items-center">
                  <span className="text-gray-500 w-6 flex justify-center">
                    <HiOutlineBuildingOffice />
                  </span>
                  <span className="text-sm text-gray-500 w-28 ml-2">
                    College
                  </span>
                  <span className="text-sm text-[#111933]">
                    : {student?.collegename || "NA"}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-gray-500 w-6 flex justify-center">
                    <TbSitemap />
                  </span>
                  <span className="text-sm text-gray-500 w-28 ml-2">
                    Department
                  </span>
                  <span className="text-sm text-[#111933]">
                    : {student?.dept || "NA"}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-gray-500 w-6 flex justify-center">
                    <img src={Vector} alt="Resgistor No" />
                  </span>
                  <span className="text-sm text-gray-500 w-28 ml-2">
                    Register No.
                  </span>
                  <span className="text-sm text-[#111933]">
                    : {student?.regno?.toUpperCase() || "NA"}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-gray-500 w-6 flex justify-center">
                    <img src={Section} alt="Section" />
                  </span>
                  <span className="text-sm text-gray-500 w-28 ml-2">
                    Section
                  </span>
                  <span className="text-sm text-[#111933]">
                    :{" "}
                    {student && student.section
                      ? student.section.toUpperCase()
                      : mcq && mcq.student && mcq.student.section
                      ? mcq.student.section.toUpperCase()
                      : "A"}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-gray-500 w-6 flex justify-center">
                    <img src={Year} alt="Year" />
                  </span>
                  <span className="text-sm text-gray-500 w-28 ml-2">
                    Year of Study
                  </span>
                  <span className="text-sm text-[#111933]">
                    : {student?.year || "NA"}
                  </span>
                </div>
                <hr className="my-4 border-t-1 border-solid border-[#AAAAAA]" />
                <div className="flex items-center">
                  <span className="text-gray-500 w-6 flex justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                  </span>
                  <span className="text-sm text-gray-500 w-28 ml-2">
                    E-mail
                  </span>
                  <div
                    className="text-sm text-[#111933] truncate max-w-[180px]"
                    title={student?.email || "NA"}
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    : {student?.email || "NA"}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 w-6 flex justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </span>
                  <span className="text-sm text-gray-500 w-28 ml-2">
                    Contact
                  </span>
                  <span className="text-sm text-[#111933]">
                    : {student?.phone || "NA"}
                  </span>
                </div>
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleDownloadProfile}
                    className="px-4 py-2 flex items-center gap-2 bg-[#111933] text-white rounded-lg hover:bg-[#11193380] hover:text-[#111933] transition-all"
                  >
                    <FaDownload size={16} />
                    <span>Download Student Report</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="flex space-x-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-4  md:w-[50] md:h-40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#111933]">
                        {totalTests}
                      </span>
                      <span className="bg-[#E6EAF5] p-2 rounded-full text-[#111933]">
                        <FaList className="w-6 h-6" />
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#111933]">
                      Tests Assigned
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      This represents the number of assessments you have
                      attempted
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-4  md:w-[50] md:h-40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#111933]">
                        {completedTests}
                      </span>
                      <span className="bg-[#E6EAF5] p-2 rounded-full text-[#111933]">
                        <PiListChecksBold className="w-6 h-6" />
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#111933]">
                      Tests Completed
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tests will be available as per status update
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-4  md:w-[50] md:h-40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#111933]">
                        {attended}
                      </span>
                      <span className="bg-[#E6EAF5] p-2 rounded-full text-[#111933]">
                        <FaCheck className="w-6 h-6" />
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#111933]">
                      Test in Progress
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      The total started assessments you previously started
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-4  md:w-[50] md:h-40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#111933]">
                        {unAttended}
                      </span>
                      <span className="bg-[#E6EAF5] p-2 rounded-md text-[#111933]">
                        <HourglassEmptyIcon />
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#111933]">
                      Yet to Start
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      These are the assessments you have not attempted
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-4  md:w-[50] md:h-40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#111933]">
                        {passedTests}
                      </span>
                      <span className="bg-[#E6EAF5] p-2 rounded-md text-[#111933]">
                        <CheckCircle />
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#111933]">
                      Tests Passed
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      You need to have a score above the pass mark
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-4  md:w-[50] md:h-40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-[#111933]">
                        {time_stats?.formatted_time}
                      </span>
                      <span className="bg-[#E6EAF5] p-2 rounded-full text-[#111933]">
                        <FaCheck className="w-6 h-6" />
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#111933]">
                      Time spent
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      The total time spent in portal.
                    </p>
                  </div>
                </div>
                <div className="w-2/5 flex">
                  <div className="flex-1 bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="relative h-40 w-40 flex items-center justify-center ml-16 mt-5">
                        {/* Background CircularProgress */}
                        <CircularProgress
                          variant="determinate"
                          value={100} // Full circle for background
                          size={150}
                          sx={{
                            color: "#e0e0e0", // Light gray color for background
                            position: "absolute",
                          }}
                        />
                        {/* Foreground CircularProgress */}
                        <CircularProgress
                          variant="determinate"
                          value={averageScore}
                          size={150}
                          sx={{
                            color: "#111933",
                            position: "absolute",
                            "& .MuiCircularProgress-circle": {
                              strokeLinecap: "round",
                            },
                          }}
                        />
                      </div>
                    </div>

                    <div className=" mt-10">
                      <span className="text-2xl font-bold text-[#111933]">
                        {Math.round(averageScore)}%
                      </span>
                      <p className="text-sm font-medium text-[#111933]">
                        Overall Pass Percentage
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Certificate can be claimed only if you clear the pass
                        percentage
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold text-[#111933] mb-6">
                    Test Performance Graph
                  </h2>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={allAssessments
                          .filter((test) => test.contestStatus === "Completed")
                          .slice(0, 10)
                          .map((test, index) => ({
                            name: test.name,
                            percentage: Math.round(test.percentage || 0),
                            id: index,
                          }))}
                        margin={{ top: 20, right: 30, left: 0, bottom: -30 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e0e0e0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fontSize: 10,
                            fill: "#111933",
                            opacity: 1, // Make it visible on the webpage
                          }}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          interval={0} // Show all ticks
                          dx={-10} // Adjust the x-position of the tick labels
                          dy={10} // Adjust the y-position of the tick labels
                        />

                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          axisLine={{ stroke: "#111933" }}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#111933" }}
                          interval={0} // Ensure all ticks are shown
                        />
                        <Line
                          type="monotone"
                          dataKey="percentage"
                          stroke="#111933"
                          strokeWidth={3}
                          dot={{
                            r: 6,
                            fill: "#111933",
                            strokeWidth: 2,
                            stroke: "#111933",
                          }}
                          activeDot={{ r: 8, fill: "#ffcc00" }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
                                  <p className="font-medium text-sm">
                                    {payload[0].payload.name}
                                  </p>
                                  <p className="text-sm text-gray-700">{`Score: ${payload[0].value}%`}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-8 lg:px-10 rounded-2xl shadow-md mt-8">
          <h2 className="text-2xl font-bold text-[#111933] mb-3">
            Assessment Details
          </h2>
          <p className="text-sm mb-5 text-[#111933]">
            Track the assessments report also view, and download.
          </p>
          <div className="relative rounded-3xl flex-1 mb-5">
            <input
              type="text"
              placeholder="Search..."
              className="border-2 text-sm rounded-lg py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full"
              value={search}
              onChange={handleSearch}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="space-y-4">
            {pageAssessments.length === 0 && (
              <div className="text-center p-5">
                No Such Assessments Found!!!
              </div>
            )}

            {pageAssessments.map((assessment, index) => (
              <React.Fragment key={index}>
                <div className="lg:flex justify-between items-center text-center p-4 lg:p-1 rounded-lg hover:bg-blue-50">
                  <h3 className="text-normal font-medium text-[#111933]">
                    {assessment.name}
                  </h3>
                  <div className="flex items-center lg:justify-end justify-center space-x-4 mt-2 lg:m-0">
                    <button
                      className="text-sm flex items-center space-x-2 font-medium border border-[#111933] text-[#111933] rounded px-4 py-2 hover:bg-[#FFCC00] hover:border-[#FFCC00] hover:text-[#111933]"
                      onClick={() =>
                        handleViewReport(
                          assessment.contestStatus,
                          assessment.contestId,
                          studentData.mcq.student.student_id
                        )
                      }
                    >
                      View Report
                      <FaEye className="ml-2" />
                    </button>
                    <button
                      className="text-sm flex items-center font-medium bg-[#111933] border-[#111933] text-white border hover:border-[#FFCC00] rounded px-4 py-2 hover:bg-[#FFCC00] hover:text-[#111933]"
                      onClick={() =>
                        handleDownloadReport(
                          assessment.contestStatus,
                          assessment.contestId,
                          mcq.student.student_id,
                          mcq.student.name,
                          setLoading
                        )
                      }
                      disabled={loading}
                    >
                      {loading ? (
                        <div
                          className="loader"
                          style={{ display: "inline-block" }}
                        >
                          <div className="loading-ring"></div>
                        </div>
                      ) : (
                        <>
                          Download <LuDownload className="ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <hr />
              </React.Fragment>
            ))}
          </div>
        </div>

        <Modal
          open={openPopup}
          onClose={() => setOpenPopup(false)}
          aria-labelledby="status-popup"
          aria-describedby="status-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) scale(1)",
              width: 500,
              minHeight: 200,
              bgcolor: "#ffffff",
              boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.2)",
              p: 4,
              textAlign: "center",
              borderRadius: "16px",
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            <Box
              sx={{
                fontSize: 40,
                color: "#111933",
                mb: 5,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <FaCircleXmark />
            </Box>
            <Typography
              id="status-popup"
              variant="h5"
              component="h2"
              sx={{ fontWeight: 700, color: "#2c3e50", mb: 1 }}
            >
              Status Update
            </Typography>
            <Typography
              id="status-description"
              sx={{
                fontSize: "15px",
                color: "#4b5563",
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              The report is currently unavailable as the student has not yet
              completed the assessment.
            </Typography>
            <Button
              onClick={() => setOpenPopup(false)}
              variant="contained"
              sx={{
                bgcolor: "#111933",
                color: "#fff",
                fontWeight: 600,
                textTransform: "none",
                px: 3,
                py: 1,
                borderRadius: "12px",
                fontSize: "16px",
                boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.15)",
                "&:hover": { bgcolor: "#111933", color: "#fff" },
                transition: "all 1s ease",
              }}
            >
              Close
            </Button>
          </Box>
        </Modal>

        <style jsx global>{`
          @keyframes fadeIn {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.9);
            }
            100% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
        `}</style>

        {totalPages > 1 && (
          <div className="relative flex justify-center mt-6">
            <small className="absolute text-md left-5 text-gray-400 font-semibold">
              Show data {currentPage} to {totalPages} of{" "}
              {search ? filteredAssessments.length : allAssessments.length}{" "}
              entries
            </small>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, value) => setCurrentPage(value)}
              sx={{
                "& .MuiPaginationItem-root": { color: "#000975" },
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
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
};

export default EnhancedStudentDashboard;
