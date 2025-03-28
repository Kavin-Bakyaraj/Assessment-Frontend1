import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Pagination,
} from "@mui/material";
import QuestionModal from "../../../components/staff/mcq/QuestionModal";
import { jwtDecode } from "jwt-decode";
import ShareModal from "../../../components/staff/mcq/ShareModal";
import { ChevronRight, Trash2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StudentTable from "../../../components/staff/StudentTable";
import clockIcon from "../../../assets/icons/clock-icon.svg";
import markIcon from "../../../assets/icons/mark-icon-new.svg";
import markIconmarks from "../../../assets/icons/mark-icon.svg";
import questionIcon from "../../../assets/icons/question-icon.svg";
import trashIcon from "../../../assets/icons/trash-icon.png";
import doorIcon from "../../../assets/icons/door-icon.png";
import Loader from "../../../components/ui/multi-step-loader";
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal"; // Import the ConfirmModal component
import bg from '../../../assets/bgpattern.svg';

const loadingStates = [
  {
    text: "Loading details...",
  },
  {
    text: "Configuring test details...",
  },
  {
    text: "Loading questions...",
  },
  {
    text: "Assigning to student...",
  },
  {
    text: "Publishing Assessment...",
  },
];

const Mcq_Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filters, setFilters] = useState({
    collegename: [],
    dept: [],
    year: "",
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sharingLink, setSharingLink] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const itemsPerPage = 5;
  const initialFetch = useRef(true);
  const duplicateToastShown = useRef(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // State for modal
  const navigate = useNavigate();
  const location = useLocation();
  const { formData, sections } = location.state || {};
  const [dashboardStats, setDashboardStats] = useState({
    totalQuestions: 0,
    totalMarks: 0,
    totalDuration: "00:00:00",
    maximumMark: 0,
  });
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add state to store the questions and page before opening the dialog
  const [tempQuestions, setTempQuestions] = useState([]);
  const [tempPage, setTempPage] = useState(1);

  useEffect(() => {
    toast.dismiss(); // Clears all existing toasts when route changes
  }, [location.pathname]);

  useEffect(() => {
    // Reset to page 1 when questions change
    if (questions.length > 0) {
      setPage(1);
    }
  }, [questions.length]);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        handlePublish();
        setLoading(false);
      }, 10000); // 10000 milliseconds = 10 seconds

      // Cleanup function to clear the timer if the component unmounts or loading changes
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const showToast = (message, type = "info") => {
    toast[type](message);
  };

  const fetchQuestions = useCallback(async () => {
    try {
      const token = localStorage.getItem("contestToken");
      if (!token) {
        showToast("Unauthorized access. Please log in again.", "error");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/mcq/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedQuestions = response.data.questions.map((question) => ({
        ...question,
        correctAnswer:
          question.correctAnswer || question.answer || "No Answer Provided",
      }));

      const duplicateCount = response.data.duplicates_removed || 0;
      const previousQuestionCount = response.data.previousQuestionCount || 0;

      if (duplicateCount > 0 && !duplicateToastShown.current) {
        showToast(`${duplicateCount} duplicate questions removed.`, "warning");
        duplicateToastShown.current = true;
      }

      if (duplicateCount === 0) {
        duplicateToastShown.current = false;
      }

      setQuestions(fetchedQuestions);

      // Check if new questions were added
      if (fetchedQuestions.length > previousQuestionCount) {
        showToast("Questions Added Successfully", "success");
      }

      const totalMarks = localStorage.getItem("totalMarks");
      const duration = JSON.parse(localStorage.getItem("duration"));
      const passPercentage = localStorage.getItem("passPercentage");
      const totalQuestions = localStorage.getItem("totalQuestions");

      // Debugging: Log the duration object
      console.log("Duration object:", duration);

      // Ensure hours and minutes are strings
      const hours = String(duration?.hours || "00");
      const minutes = String(duration?.minutes || "00");

      setDashboardStats({
        totalQuestions: `${fetchedQuestions.length}/${totalQuestions || 0}`,
        totalMarks: totalMarks || 0,
        totalDuration: duration
          ? `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`
          : "00:00:00",
        maximumMark: passPercentage || 0,
      });
    } catch (error) {
      console.error(
        "Error fetching questions:",
        error.response?.data || error.message
      );
      showToast("Failed to load questions. Please try again.", "error");
    } finally {
      setIsLoading(false);
      setPage(1); // Reset to page 1 on error
    }
  }, [API_BASE_URL]);

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
    fetchQuestions();
  }, [API_BASE_URL, fetchQuestions]);

  const handleDeleteQuestion = async (questionId) => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem("contestToken");
      if (!token) {
        showToast("Unauthorized access. Please log in again.", "error");
        return;
      }

      const response = await axios.delete(
        `${API_BASE_URL}/api/mcq/delete-question/${questionId}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        setQuestions((prevQuestions) =>
          prevQuestions.filter((question) => question._id !== questionId)
        );

        // Update the totalQuestions count in dashboardStats
        setDashboardStats((prevStats) => {
          const [selected, total] = prevStats.totalQuestions
            .split("/")
            .map(Number);
          return {
            ...prevStats,
            totalQuestions: `${selected - 1}/${total}`,
          };
        });

        showToast("Question deleted successfully!", "success");
      } else {
        showToast(response.data.error || "Failed to delete question.", "error");
      }
    } catch (error) {
      console.error(
        "Error deleting question:",
        error.response?.data || error.message
      );
      showToast("Failed to delete question. Please try again.", "error");
    } finally {
      setIsDeleting(false);
      setPage(1); // Reset to page 1 on error
    }
  };

  const handlePublish = async () => {
    try {
      const token = localStorage.getItem("contestToken");
      if (!token) {
        toast.error("Unauthorized access. Please log in again.");
        return;
      }
      const decodedToken = jwtDecode(token);
      const contestId = decodedToken?.contestId;
      if (!contestId) {
        toast.error("Invalid contest token. Please log in again.");
        return;
      }

      const uniqueQuestions = Array.from(
        new Set(questions.map(JSON.stringify))
      ).map(JSON.parse);

      const selectedStudentDetails = students.filter((student) =>
        selectedStudents.includes(student.regno)
      );
      const selectedStudentEmails = selectedStudentDetails.map(
        (student) => student.email
      );

      const payload = {
        contestId,
        questions: uniqueQuestions,
        students: selectedStudents,
        studentEmails: selectedStudentEmails,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/mcq/publish/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        // Just pass the contestId, not the full URL
        setSharingLink(contestId);
        setShareModalOpen(true);
        toast.success("Assessment published successfully!");

        // Clear session storage
        sessionStorage.clear();
      } else {
        toast.error(

          `Failed to publish Assessment: ${response.data.message || "Unknown error."

          }`
        );
      }
    } catch (error) {
      console.error("Error publishing questions:", error);
      if (error.response) {
        toast.error(
          `Error: ${error.response.data.message || error.response.statusText}`
        );
      } else if (error.request) {
        toast.error("No response from the server. Please try again later.");
      } else {
        toast.error(
          "An error occurred while publishing questions. Please try again."
        );
      }
      setPage(1); // Reset to page 1 on error
    } finally {
      setPublishDialogOpen(false);
    }
  };

  const handleShareModalClose = () => {
    setShareModalOpen(false);
    navigate(`/staffdashboard`);
  };

  const handleAddQuestion = async () => {
    setIsModalOpen(true);
    await fetchQuestions();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Update the function to handle opening the publish dialog
  const handleOpenPublishDialog = () => {
    // Store the current questions and page before opening the dialog
    setTempQuestions([...questions]);
    setTempPage(page);
    setPublishDialogOpen(true);
  };

  // Update the function to handle closing the publish dialog
  const handleClosePublishDialog = () => {
    // Restore the questions and page when closing the dialog
    setQuestions(tempQuestions);
    setPage(tempPage);
    setPublishDialogOpen(false);
  };

  return (
    <div className="p-4 md:px-6 min-h-screen flex justify-center py-8 pt-28"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="w-full max-w-screen-2xl px-10 mx-auto">
        <div className="flex items-center gap-2 text-[#111933] text-sm">
          <span
            className="opacity-60 hover:scale-102 transition-all duration-100 cursor-pointer"
            onClick={() => setIsConfirmModalOpen(true)}
          >
            Home
          </span>
          <span className="flex items-center -space-x-2">
              <ChevronRight size={15} />
              <ChevronRight size={15} />
            </span>
          <span
            className="opacity-60 hover:scale-102 transition-all duration-100 cursor-pointer"
            onClick={() => navigate("/mcq/details")}
          >
            Assessment Overview
          </span>
          <span className="flex items-center -space-x-2">
              <ChevronRight size={15} />
              <ChevronRight size={15} />
            </span>
          <span
            className="opacity-60 hover:scale-102 transition-all duration-100 cursor-pointer"
            onClick={() => {
              localStorage.setItem("mcqAssessmentInitialStep", "2");
              navigate("/mcq/details");
            }}
          >
            Test Configuration
          </span>
          <span className="flex items-center -space-x-2">
              <ChevronRight size={15} />
              <ChevronRight size={15} />
            </span>
          <span className="opacity-60 hover:scale-102 transition-all duration-100 cursor-pointer">Add Question</span>
          <span className="flex items-center -space-x-2">
              <ChevronRight size={15} />
              <ChevronRight size={15} />
            </span>
          <span >Question Dashboard</span>
        </div>

        <div className="flex flex-col py-4 border-b my-6">
            <p className="text-2xl font-semibold text-[#111933]"> Question Preview </p>
            <p  className="opacity-70 text-[#111933]"> Review the selected questions for the exam before publishing. Ensure accuracy, modify questions if needed, and add or remove entries as required. </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-x-10 mb-8 mt-10 text-[#111933]">
          {[
            {
              label: "Total Questions",
              value: dashboardStats.totalQuestions,
              icon: questionIcon,
            },
            {
              label: "Total Marks",
              value: dashboardStats.totalMarks,
              icon: markIcon,
            },
            {
              label: "Total Duration",
              value: dashboardStats.totalDuration,
              icon: clockIcon,
            },
            {
              label: "Pass Percentage %",
              value: dashboardStats.maximumMark,
              icon: markIconmarks,
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white text-[#111933] shadow-md font-semibold rounded-lg p-5 relative flex flex-col items-center justify-center py-8"
            >
              <span className="absolute -top-4 -right-4 p-2 bg-white z-10 shadow-lg rounded-full">
                <img
                  src={item.icon || "/placeholder.svg"}
                  alt=""
                  className="w-6"
                />
              </span>
              <p className="text-xs">{item.label}</p>
              <p className="text-2xl">{item.value}</p>
            </div>
          ))}
        </div>

        {!isLoading && questions.length >= 0 && (
          <div className="mt-8 px-5 pt-4 pb-6 bg-white shadow-md text-[#111933] rounded-xl w-full max-w-full mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold mt-3">Question Preview</h2>
              <Button
                onClick={handleAddQuestion}
                variant="contained"
                style={{
                  backgroundColor: "#111933",
                  color: "white",
                  borderRadius: "6px",
                }}
              >
                Add Questions +
              </Button>
            </div>
            <hr className="border-t border-gray-700 w-full mb-5" />
            {isLoading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-4 border-[#FDC500] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading questions...</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {questions
                  .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                  .map((question, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-[#fafdff] shadow-sm rounded-lg p-4 py-2 border border-gray-200"
                    >
                      <p className="text-sm text-[#111933] flex-1 pr-4">
                        {question.question}
                      </p>
                      <div className="flex items-center min-w-fit">
                        <span className="text-sm font-semibold text-[#111933] mr-1">
                          Answer :
                        </span>
                        <span className="text-sm text-[#111933]">
                          {question.correctAnswer}
                        </span>
                        <button
                          onClick={() => handleDeleteQuestion(question._id)}
                          className="ml-4 p-2 text-red-600 hover:text-red-700 transition-colors"
                          disabled={isDeleting}
                        >
                          <img src={trashIcon} alt="" className="w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
            {questions.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  count={Math.ceil(questions.length / itemsPerPage)}
                  page={page}
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
              </div>
            )}
            {questions.length === 0 && (
              <div className="text-center mt-8">
                <p className="text-gray-600">
                  No questions available in the database.
                </p>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="text-center mt-16">
            <div className="w-8 h-8 border-4 border-[#FDC500] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        )}

        {!isLoading && questions.length > 0 && (
          <div className="flex justify-end mx-auto max-w-screen-full mt-6">
            <Button
              onClick={() => {
                const [selected, total] = dashboardStats.totalQuestions
                  .split("/")
                  .map(Number);
                if (selected < total) {
                  toast.warning(
                    "Insufficient questions to publish! Please add more questions."
                  );
                } else {
                  handleOpenPublishDialog();
                }
              }}
              variant="contained"
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#111933",
                color: "white",
                borderRadius: "8px",
              }}
            >
              Publish
              <img src={doorIcon} alt="" className="w-3 ml-2" />
            </Button>
          </div>
        )}

        {isModalOpen && (
          <QuestionModal
            showModal={isModalOpen}
            onClose={handleModalClose}
            handleCreateManually={() => navigate("/mcq/CreateQuestion")}
            handleBulkUpload={() => navigate("/mcq/bulkUpload")}
            handleMcqlibrary={() => navigate("/mcq/McqLibrary")}
            handleAi={() => navigate("/mcq/aigenerator")}
          />
        )}

        <Dialog
          open={publishDialogOpen}
          onClose={handleClosePublishDialog}
          fullWidth
          maxWidth="lg"
        >
          {/* <DialogTitle>Select Students</DialogTitle> */}
          <DialogContent>
            <StudentTable
              students={students}
              selectedStudents={selectedStudents}
              setSelectedStudents={setSelectedStudents}
              filters={filters}
              setFilters={setFilters}
              sortConfig={sortConfig}
              setSortConfig={setSortConfig}
              page={page}
              setPage={setPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              openFilterDialog={openFilterDialog}
              setOpenFilterDialog={setOpenFilterDialog}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleClosePublishDialog}
              color="primary"
              variant="outlined"
              sx={{ color: "#111933", borderColor: "#111933" }}
            >
              Cancel
            </Button>
            <Loader
              loadingStates={loadingStates}
              loading={loading}
              duration={2000}
            />
            <Button
              onClick={() => {
                if (selectedStudents.length === 0) {
                  toast.warning("Please select at least one student to publish.");
                } else {
                  setLoading(true);
                }
              }}
              color="primary"
              variant="outlined"
              sx={{
                color: "#fff",
                backgroundColor: "#111933",
                borderColor: "#111933",
                "&:disabled": {
                  backgroundColor: "#b0b8c1", // Lighter shade of gray
                  color: "#ffffff", // Keep text white
                  borderColor: "#b0b8c1",
                  cursor: "not-allowed", // Disable cursor
                },
              }}
              disabled={selectedStudents.length === 0} // Disable if no students selected
            >
              Confirm
            </Button>
          </DialogActions>

        </Dialog>

        <ShareModal
          open={shareModalOpen}
          onClose={handleShareModalClose}
          shareLink={sharingLink}
        />
        <ConfirmModal
          isConfirmModalOpen={isConfirmModalOpen}
          setIsConfirmModalOpen={setIsConfirmModalOpen}
          targetPath="/staffdashboard"
        />
      </div>
    </div>
  );
};

export default Mcq_Dashboard;
