import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { MdOutlinePublish } from "react-icons/md";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Pagination,
  MenuItem,
  IconButton,
  Typography,
  Chip,
  Skeleton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import { BiBookOpen } from "react-icons/bi";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import { parseISO, isAfter } from "date-fns";
import CloseIcon from "@mui/icons-material/Close";
import { IoCloseCircleOutline } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { TbFileSearch, TbReload } from "react-icons/tb";
import {
  FaCheckCircle,
  FaCheck,
  FaUser,
  FaEnvelope,
  FaMobileAlt,
  FaPhone,
  FaFontAwesomeFlag,
  FaFile,
  FaPhoneAlt,
  FaEye,
} from "react-icons/fa";
import { FaCircleXmark, FaXmark } from "react-icons/fa6";
import heroImg from "../../../assets/View_Test.svg";
import Questions from "../../../assets/Questions.svg";
import Section from "../../../assets/Section.svg";
import Total from "../../../assets/total_marks.svg";
import Percentage from "../../../assets/percentage.svg";
import StudentTable from "../../../components/staff/StudentTable";
import DownloadContestData from "../../../components/staff/report/DownloadContestData";
import bg from "../../../assets/bgpattern.svg";

function formatDateTime(dateString) {
  const date = new Date(dateString);

  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");

  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert to 12-hour format (0 becomes 12)

  return `${day} ${month} ${year}, ${hours}:${minutes} ${period}`;
}

// Add these new state variables for dialog pagination

const RulesAndRegulations = ({ assessmentOverview }) => {
  const parseGuidelines = (guidelines) => {
    if (!guidelines) return [];

    const lines = guidelines.split("\n");
    const items = lines.map((line) => {
      const match = line.match(/^(\d+\.|\d+\)|\*|\-|\+)\s(.*)/);
      if (match) {
        return { type: match[1], content: match[2] };
      }
      return { type: "", content: line };
    });

    return items;
  };

  const items = parseGuidelines(assessmentOverview?.guidelines);

  return (
    <section className="flex rounded-lg">
      <div className=" flex-[2] mr-12 space-y-4">
        <p className="text-2xl font-semibold text-[#111933] mb-2">
          {" "}
          Rules and Regulations{" "}
        </p>
        <hr className="border-gray-300 ml-6 border-[1px] mb-3" />
        <p className="text-md font-semibold ml-6 text-[#111933] mb-2">
          Instructions: Read carefully; contact the Department for
          clarifications.
        </p>
        {items.length > 0 ? (
          <ul className="list-disc list-inside ml-7">
            {items.map((item, index) => (
              <li
                key={index}
                className="text-md text-black break-words ml-3 text-justify"
              >
                {item.content}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-md text-black break-words p-1 text-justify">
            {assessmentOverview?.guidelines}
          </p>
        )}
      </div>
    </section>
  );
};

const ViewTest = () => {
  const [testDetails, setTestDetails] = useState(null); // Added state variable
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isResultsPublished, setIsResultsPublished] = useState(false);
  const themeButtonStyle =
    "px-5 p-2 rounded-xl bg-transparent border-[#111933] border-[1px] mx-2 hover:bg-[#b6c5f7]";

  const [showDownload, setShowDownload] = useState(false);
  const { contestId } = useParams();
  const [dialogPage, setDialogPage] = useState(0);
  const [dialogRowsPerPage, setDialogRowsPerPage] = useState(10);

  const { studentId } = useParams();
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [openFilterDialog, setOpenFilterDialog] = useState(false);

  const [popup, setPopup] = useState("some popup message");
  const [showPopup, setShowPopup] = useState(false);
  const [popupFunction, setPopupFunction] = useState();
  const [page, setPage] = useState(0);

  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filters, setFilters] = useState({
    collegename: [],
    dept: [],
    year: [],
    status: "",
    searchText: "",
  });
  const [dialogFilters, setDialogFilters] = useState({
    collegename: "",
    dept: "",
    year: "",
  });
  const [staff_details, setStaffDetails] = useState({
    full_name: "",
    email: "",
    phone_no: "",
  });

  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [dialogStudents, setDialogStudents] = useState([]);
  const [filteredDialogStudents, setFilteredDialogStudents] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showPublishPopup, setShowPublishPopup] = useState(false);
  const [showClosePopup, setShowClosePopup] = useState(false); // New state for close popup
  const [showDeleteStudentPopup, setShowDeleteStudentPopup] = useState(false); // New state for delete student popup
  const [studentToDelete, setStudentToDelete] = useState(null); // State to track the student to delete
  const [switchStates, setSwitchStates] = useState({
    fullScreen: false,
    mobileAccess: false,
    resultVisibility: false,
    shuffleQuestions: false,
    shuffleOptions: false,
  });

  // Assuming `response` contains your fetched data
  useEffect(() => {
    if (testDetails && testDetails.testConfiguration) {
      const { testConfiguration } = testDetails;
      setSwitchStates({
        fullScreen: testConfiguration.fullScreenMode || false,
        mobileAccess: testConfiguration.deviceRestriction || false, // Assuming true means restricted (no mobile access)
        resultVisibility: testConfiguration.resultVisibility === "Host Control", // Convert string to boolean
        shuffleQuestions: testConfiguration.shuffleQuestions || false,
        shuffleOptions: testConfiguration.shuffleOptions || false,
      });
    }
  }, [testDetails]); // Dependency on testDetails ensures this runs when testDetails updates

  const { testConfiguration, student_details, sections } = testDetails || {};

  const Switch = ({ checked, disabled = false }) => {
    return (
      <label
        className="relative inline-flex items-center"
        style={{ cursor: "default" }} // No pointer cursor
      >
        <input
          type="checkbox"
          checked={checked}
          className="sr-only peer"
          disabled={disabled}
        />
        <div className="w-9 h-5 bg-gray-200 rounded-full relative peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#111933]"></div>
      </label>
    );
  };

  // Calculate totalQuestions after sections is defined
  const totalQuestions =
    sections?.reduce(
      (total, section) => total + (parseInt(section.numQuestions, 10) || 0),
      0
    ) || 0;

  const assessmentOverview = testDetails?.assessmentOverview || {};
  const isRegistrationPeriodOver = assessmentOverview?.registrationEnd
    ? isAfter(new Date(), parseISO(assessmentOverview.registrationEnd))
    : false;
  const isOverallStatusClosed = testDetails?.Overall_Status === "closed";
  const hasCompletedStudents = () => {
    return students.some(
      (student) => student.status.toLowerCase() === "completed"
    );
  };
  const handleSwitchChange = (id) => {
    setSwitchStates((prevStates) => ({
      ...prevStates,
      [id]: !prevStates[id],
    }));
  };

  const handlePublish = async () => {
    try {
      setIsPublished(true);

      console.log("Contest ID:", contestId);
      console.log(
        "API URL:",
        `${API_BASE_URL}/api/mcq/publish-result/${contestId}/`
      );

      const response = await axios.post(
        `${API_BASE_URL}/api/mcq/publish-result/${contestId}/`
      );
      if (response.status === 200) {
        setIsResultsPublished(true);
        toast.success("Results published successfully!");
        setShowPublishPopup(false);
      } else {
        toast.error("Failed to publish results. Please try again.");
      }
    } catch (error) {
      console.error("Error publishing results:", error);
      toast.error(
        "An error occurred while publishing the results. Please try again."
      );
    } finally {
      setIsPublished(false);
    }
  };

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/contests/${contestId}/`,
          { withCredentials: true } // Allow cookies to be sent
        );
        const data = response.data;
        setTestDetails(data);
        setIsResultsPublished(data.isResultsPublished || false);

        const updatedStudents = (data.student_details || []).map((student) => ({
          ...student,
          year: student.year || "N/A",
          status: student.status || "Unknown",
        }));
        setStudents(updatedStudents);
        setFilteredStudents(updatedStudents);

        // Set staff details if available in the response
        if (data.staff_details) {
          setStaffDetails(data.staff_details);
        }

        const passPercentage = data.testConfiguration?.passPercentage;
        if (passPercentage !== undefined) {
          sessionStorage.setItem("passPercentage", passPercentage);
        }
      } catch (err) {
        setError("Failed to fetch test details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestDetails();
  }, [contestId, API_BASE_URL]);

  // 1. Update the fetchAllStudents function to filter by staff's college and department
  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/student/`);
        const allStudents = response.data.map((student) => ({
          ...student,
          year: student.year || "N/A",
        }));

        // Filter students based on staff's college and department
        if (staff_details) {
          // Get the staff's college and department
          const staffCollege = staff_details.collegename || "";
          const staffDept = staff_details.dept || "";

          // Filter students to only show those from the same college and department
          const filteredStudents = allStudents.filter((student) => {
            return (
              (!staffCollege || student.collegename === staffCollege) &&
              (!staffDept || student.dept === staffDept)
            );
          });

          setDialogStudents(filteredStudents);
          setFilteredDialogStudents(filteredStudents);
        } else {
          // If staff details not available, use all students
          setDialogStudents(allStudents);
          setFilteredDialogStudents(allStudents);
        }
      } catch (error) {
        console.error("Failed to fetch all students:", error);
      }
    };

    if (publishDialogOpen) fetchAllStudents();
  }, [publishDialogOpen, API_BASE_URL, staff_details]);
  const [contestStatus, setContestStatus] = useState(null);
  // const [contestAttendees, setContestAttendees] = useState(null);

  // Fetch all MCQ contests and get the status of the specific contestId
  useEffect(() => {
    const fetchMcqContests = async () => {
      try {
        const [mcqResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/mcq`, { withCredentials: true }),
        ]);

        console.log("MCQ Response Data:", mcqResponse.data);

        // Access the correct array from the response
        const contests = mcqResponse.data.assessments || [];

        const selectedContest = contests.find(
          (contest) => contest.contestId === contestId
        );

        if (selectedContest) {
          setContestStatus(selectedContest.status);
          console.log("status:", selectedContest.status);
          // setContestAttendees(selectedContest.assignedCount);
          // console.log("Attendees:", selectedContest.assignedCount);
        } else {
          console.warn("Contest not found for the given contestId.");
        }
      } catch (error) {
        console.error("Error fetching MCQ contests:", error);
      }
    };

    if (contestId) fetchMcqContests();
  }, [contestId, API_BASE_URL]);

  const handleInputChange = (e, field, section) => {
    const { value, checked, type } = e.target;
    setTestDetails((prevDetails) => {
      const updatedDetails = { ...prevDetails };
      if (section) {
        updatedDetails[section] = {
          ...updatedDetails[section],
          [field]: type === "checkbox" ? checked : value,
        };
      } else {
        updatedDetails[field] = value;
      }
      return updatedDetails;
    });
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid date";

    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    return new Intl.DateTimeFormat("en-US", options)
      .format(date)
      .replace(",", "")
      .toUpperCase();
  };

  const handleSave = async () => {
    try {
      console.log("Updated Test Data:", testDetails);
      await axios.put(
        `${API_BASE_URL}/api/contests/${contestId}/`,
        testDetails
      );

      setLoading(true);

      await axios.put(
        `${API_BASE_URL}/api/contests/${contestId}/`,
        testDetails
      );
      toast.success("Test details updated successfully");

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setTimeout(() => { }, 1500);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadContestData = () => {
    const completedStudents = students.filter(
      (student) => student.status === "Completed"
    );

    if (completedStudents.length === 0) {
      toast.info(
        "No students have completed the assessment. Download is not available."
      );
    } else {
      setShowDownload(true);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  // Update the useEffect hook that applies filters to handle department and college filtering

  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...students];

      // Apply department filter based on staff role and selected departments
      if (filters.dept.length > 0) {
        filtered = filtered.filter((student) =>
          filters.dept.some((dept) =>
            student.dept?.toLowerCase().includes(dept.toLowerCase())
          )
        );
      } else if (
        staff_details.role !== "Admin" &&
        staff_details.role !== "Principal" &&
        staff_details.dept
      ) {
        // If no dept filter is set and staff is not Admin/Principal, filter by staff's department
        const staffDept = Array.isArray(staff_details.dept)
          ? staff_details.dept
          : [staff_details.dept];
        filtered = filtered.filter((student) =>
          staffDept.some(
            (dept) => student.dept?.toLowerCase() === dept?.toLowerCase()
          )
        );
      }

      // Apply college filter based on staff role and selected college
      if (filters.collegename.length > 0) {
        filtered = filtered.filter((student) =>
          filters.collegename.some((college) =>
            student.collegename?.toLowerCase().includes(college.toLowerCase())
          )
        );
      } else if (staff_details.role !== "Admin" && staff_details.collegename) {
        // If no college filter is set and staff is not Admin, filter by staff's college
        filtered = filtered.filter(
          (student) =>
            student.collegename?.toLowerCase() ===
            staff_details.collegename?.toLowerCase()
        );
      }

      // Apply year filter
      if (filters.year.length > 0) {
        filtered = filtered.filter((student) =>
          filters.year.includes(student.year)
        );
      }

      // Apply text search
      if (filters.searchText) {
        const lowerQuery = filters.searchText.toLowerCase();
        filtered = filtered.filter(
          (student) =>
            student.name?.toLowerCase().includes(lowerQuery) ||
            student.regno?.toLowerCase().includes(lowerQuery)
        );
      }

      setFilteredStudents(filtered);
      if (
        Object.values(filters).some((value) =>
          Array.isArray(value) ? value.length > 0 : Boolean(value)
        )
      ) {
        setPage(0);
      }
    };

    applyFilters();
  }, [filters, students, staff_details]);
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(filteredStudents.map((student) => student.regno));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleStudentSelect = (regno) => {
    setSelectedStudents((prev) =>
      prev.includes(regno)
        ? prev.filter((id) => id !== regno)
        : [...prev, regno]
    );
  };

  const handleStudentRemove = (regno) => {
    setStudentToDelete(regno);
    setShowDeleteStudentPopup(true);
  };

  const confirmStudentRemove = async () => {
    try {
      // Send delete request to backend with credentials
      await axios.delete(
        `${API_BASE_URL}/api/remove_student/${contestId}/${studentToDelete}/`,
        {
          withCredentials: true, // Ensure cookies are sent with the request
        }
      );

      // Update the state to remove the student from the list
      setTestDetails((prevDetails) => {
        const updatedDetails = { ...prevDetails };
        updatedDetails.visible_to = updatedDetails.visible_to.filter(
          (studentRegno) => studentRegno !== studentToDelete
        );
        updatedDetails.student_details = updatedDetails.student_details.filter(
          (student) => student.regno !== studentToDelete
        );
        return updatedDetails;
      });

      setStudents((prevStudents) =>
        prevStudents.filter((student) => student.regno !== studentToDelete)
      );
      setFilteredStudents((prevFilteredStudents) =>
        prevFilteredStudents.filter(
          (student) => student.regno !== studentToDelete
        )
      );

      // Show a toast notification for feedback
      toast.success(`Student removed successfully`);

      // Close the popup
      setShowDeleteStudentPopup(false);
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Failed to remove student");
    }
  };

  const handleAddStudent = async () => {
    try {
      // Create a new Set from the current visible_to array and add new selected students
      const updatedVisibleTo = new Set([
        ...(testDetails?.visible_to || []),
        ...selectedStudents,
      ]);

      // Create the updated test details
      const updatedTestDetails = {
        ...testDetails,
        visible_to: Array.from(updatedVisibleTo),
      };

      // Update the API first
      await axios.put(
        `${API_BASE_URL}/api/contests/${contestId}/`,
        updatedTestDetails
      );

      // After successful API update, update the local state
      setTestDetails(updatedTestDetails);

      // Fetch the updated student details for the newly added students
      const newStudentDetails = await Promise.all(
        selectedStudents.map(async (regno) => {
          try {
            const response = await axios.get(
              `${API_BASE_URL}/api/student/${regno}/`
            );
            return {
              ...response.data,
              status: "Yet to Start",
              year: response.data.year || "N/A",
            };
          } catch (error) {
            console.error(
              `Error fetching details for student ${regno}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out any null values and add only valid student details
      const validNewStudents = newStudentDetails.filter(
        (student) => student !== null
      );

      // Update the students state with new students
      setStudents((prevStudents) => {
        const existingRegnos = new Set(prevStudents.map((s) => s.regno));
        const uniqueNewStudents = validNewStudents.filter(
          (s) => !existingRegnos.has(s.regno)
        );
        return [...prevStudents, ...uniqueNewStudents];
      });

      // Update filtered students as well
      setFilteredStudents((prevFiltered) => {
        const existingRegnos = new Set(prevFiltered.map((s) => s.regno));
        const uniqueNewStudents = validNewStudents.filter(
          (s) => !existingRegnos.has(s.regno)
        );
        return [...prevFiltered, ...uniqueNewStudents];
      });

      // Show success message
      toast.success("Students added successfully");
      window.location.reload();
      // Clear selection and close dialog
      setSelectedStudents([]);
      setPublishDialogOpen(false);
    } catch (error) {
      console.error("Error adding students:", error);
      toast.error("Failed to add students. Please try again.");
    }
  };

  const handleCloseSession = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/mcq/close-session/${contestId}/`);
      toast.success("Session closed successfully.");
      navigate("/staffdashboard", {
        state: {
          toastMessage: "Assessment session has been closed.",
          testStatus: "closed",
        },
      });
    } catch (error) {
      console.error("Error closing session:", error);
      toast.error("Failed to close the session. Please try again.");
    }
  };

  const testSettings = [
    {
      id: "fullScreen",
      title: "Full Screen Mode",
      description: "Force the test to run in full-screen mode.",
    },
    {
      id: "mobileAccess",
      title: "Mobile Access Restriction",
      description: "Restrict test access on mobile devices.",
    },
    {
      id: "resultVisibility",
      title: "Host Result Publishing",
      description: "Control when results are published.",
    },
    {
      id: "shuffleQuestions",
      title: "Shuffling of Questions",
      description: "Randomize the order of questions.",
    },
    {
      id: "shuffleOptions",
      title: "Shuffle Options",
      description: "Randomize the order of answer choices.",
    },
  ];

  const handleDeleteContest = async () => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/mcq/delete-contest/${contestId}/`
      );
      toast.success("Contest deleted successfully.");
      navigate("/staffdashboard", {
        state: {
          toastMessage: "Assessment has been deleted.",
        },
      });
    } catch (error) {
      console.error("Error deleting contest:", error);
      toast.error("Failed to delete the contest. Please try again.");
    }
  };

  const handleReassign = async (student) => {
    console.log(student);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/mcq/reassign/${contestId}/${student.studentId}/`
      );
      if (response.status === 200) {
        toast.success("Student reassigned successfully");
        window.location.reload();
      } else {
        toast.error("Failed to reassign student. Please try again.");
      }
    } catch (error) {
      console.error("Error reassigning student:", error);
      toast.error("Student not completed the test");
    }
  };

  if (error) return <div>{error}</div>;

  const handleViewClick = (student) => {
    if (student.status.toLowerCase() === "yet to start") {
      setModalOpen(true);
    } else if (student.status.toLowerCase() === "started") {
      setModalOpen(true);
    } else {
      navigate(`${student.studentId}`);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handlePageChange = (event, newPage) => {
    console.log("Changing to page:", newPage);
    setPage(newPage - 1);
  };

  const indexOfLastStudent = (page + 1) * rowsPerPage;
  const indexOfFirstStudent = page * rowsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );

  const handleFilterDialogOpen = () => {
    setOpenFilterDialog(true);
  };

  const handleFilterDialogClose = () => {
    setOpenFilterDialog(false);
  };
  // Update the OrganizerDetails component to fetch and display the phone number correctly

  // Update the OrganizerDetails component to fetch and display the phone number correctly

  const OrganizerDetails = ({ staffDetailsProp }) => {
    const [staff_details, setStaffDetails] = useState({
      full_name: "",
      email: "",
      phone_no: "",
    });

    useEffect(() => {
      if (staffDetailsProp) {
        setStaffDetails({
          full_name: staffDetailsProp.full_name || "N/A",
          email: staffDetailsProp.email || "N/A",
          phone_no: staffDetailsProp.phone_no || "N/A",
        });
      }
    }, [staffDetailsProp]);

    return (
      <div className="w-full h-full flex flex-col justify-start items-start text-[#111933]">
        {/* Heading */}
        <p className="text-[#111933] text-xl font-bold mb-1">
          Organizers Details
        </p>
        <p className="text-sm text-gray-500 mb-3">
          Contact information of the exam organizers.
        </p>

        <hr className="w-full border-gray-300 mb-4" />

        {/* Organizer Details */}
        <div className="flex flex-col gap-y-5 w-full">
          <p className="text-md">
            <strong>Name :</strong> {staff_details.full_name}
          </p>
          <p className="text-md">
            <strong>Email : </strong>
            {staff_details.email}
          </p>
          <p className="text-md">
            <strong>Contact No : </strong>
            {staff_details.phone_no}
          </p>
        </div>
      </div>
    );
  };

  const toggleFilter = (filterType, value) => {
    setFilters((prevFilters) => {
      let newFilters = { ...prevFilters };
      if (filterType === "collegename") {
        newFilters.collegename = newFilters.collegename.includes(value)
          ? newFilters.collegename.filter((college) => college !== value)
          : [...newFilters.collegename, value];
      } else if (filterType === "dept") {
        newFilters.dept = newFilters.dept.includes(value)
          ? newFilters.dept.filter((dept) => dept !== value)
          : [...newFilters.dept, value];
      } else if (filterType === "year") {
        newFilters.year = newFilters.year.includes(value)
          ? newFilters.year.filter((year) => year !== value)
          : [...newFilters.year, value];
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      collegename: [],
      dept: [],
      year: [],
      status: "",
      searchText: "",
    });
    setOpenFilterDialog(false);
  };

  const applyFilters = () => {
    setOpenFilterDialog(false);
  };

  return (
    <div className="min-h-screen relative">
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
      <div
        className={`w-screen h-screen bg-[#0000005a] fixed ${showPopup ? "flex" : "hidden"
          } items-center justify-center z-10 px-10`}
      >
        <div className="h-fit p-4 rounded-xl bg-white flex flex-col text-center min-w-[300px] w-1/2 max-w-[70%]">
          <i className="bi bi-exclamation-diamond-fill text-rose-700 text-7xl"></i>
          <p className="text-3xl mt-8"> Warning </p>
          <p className="text-xl mt-1 w-[90%] self-center"> {popup} </p>
          <div className="flex space-x-2 mt-8">
            <button
              className="px-5 p-2 rounded-lg flex-1 bg-[#11193361] border-[#111933] border-[1px] hover:bg-[#11193390]"
              onClick={() => popupFunction()}
            >
              Okay
            </button>
            <button
              className={`${themeButtonStyle} rounded-lg flex-1 m-0`}
              onClick={() => setShowPopup(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {showDeletePopup && (
        <div className="fixed inset-0 bg-[#0000005a] flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 w-[600px] max-w-full rounded-xl shadow-lg text-center">
            <div className="text-red-600 mb-4">
              <svg
                className="w-14 h-14 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-red-600">Warning</h2>
            <p className="text-lg text-gray-700 mt-2">
              Are you sure you want to delete the assessment?
            </p>
            <p className="text-sm text-red-500 mt-2">
              <strong>Note:</strong> This action cannot be undone.
            </p>
            <div className="flex justify-center mt-6 space-x-32">
              <button
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-lg transition"
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                onClick={() => {
                  handleDeleteContest();
                  setShowDeletePopup(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showPublishPopup && (
        <div className="fixed inset-0 bg-[#0000005a] flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 w-[600px] max-w-full rounded-xl shadow-lg text-center">
            <div className="flex items-center justify-center space-x-3">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="text-2xl font-semibold">Confirm Publish</h2>
            </div>
            <p className="text-md text-gray-700 mt-4">
              Are you sure you want to publish the assessment? Once published,
              it will be visible to all participants.
            </p>
            <p className="text-sm text-red-500 mt-2">
              <strong>Note:</strong> This action cannot be undone.
            </p>
            <div className="flex justify-center mt-6 space-x-44">
              <button
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-lg transition"
                onClick={() => setShowPublishPopup(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-[#111933] hover:bg-blue-900 text-white rounded-lg transition"
                onClick={() => {
                  handlePublish();
                  setShowPublishPopup(false);
                }}
              >
                Yes, Publish
              </button>
            </div>
          </div>
        </div>
      )}
      {showClosePopup && (
        <div className="fixed inset-0 bg-[#0000005a] flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 w-[600px] max-w-full rounded-xl shadow-lg text-center">
            {/* Warning Icon */}
            <div className="text-red-600 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Warning Message */}
            <h2 className="text-2xl font-semibold text-red-600">Warning</h2>
            <p className="text-lg text-gray-700 mt-2">
              Are you sure you want to close the assessment?
            </p>
            <p className="text-sm text-red-500 mt-2">
              <strong>Note:</strong> This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="flex justify-center mt-6 space-x-40">
              <button
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-lg transition"
                onClick={() => setShowClosePopup(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                onClick={() => {
                  handleCloseSession();
                  setShowClosePopup(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteStudentPopup && (
        <div className="fixed inset-0 bg-[#0000005a] flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 w-[600px] max-w-full rounded-xl shadow-lg text-center">
            <div className="text-red-600 mb-4">
              <svg
                className="w-14 h-14 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-red-600">Warning</h2>
            <p className="text-lg text-gray-700 mt-2">
              Are you sure you want to delete this student?
            </p>
            <p className="text-sm text-red-500 mt-2">
              <strong>Note:</strong> This action cannot be undone.
            </p>
            <div className="flex justify-center mt-6 space-x-32">
              <button
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-lg transition"
                onClick={() => setShowDeleteStudentPopup(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                onClick={confirmStudentRemove}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className=" py-10 pt-16 px-20 min-h-full"
        style={{
          backgroundColor: "#ecf2fe",
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "top",
        }}
      >
        <div className="flex gap-4 mb-4 mt-16">
          {/* Column 1: Progress Details and Rules and Regulations */}
          <div className="w-3/4 flex flex-col space-y-4">
            {/* Progress Details */}
            <section className="bg-white rounded-lg shadow-md p-6">
              <div className="flex-1 flex flex-col rounded-t-lg justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    {loading ? (
                      <Skeleton variant="text" width={200} height={30} />
                    ) : (
                      <p className="text-2xl font-semibold mb-2">
                        {assessmentOverview?.name}
                      </p>
                    )}
                    {loading ? (
                      <Skeleton variant="text" width={400} height={20} />
                    ) : (
                      <p className="text-md text-black break-words text-justify mb-3">
                        {assessmentOverview?.description}
                      </p>
                    )}
                    {/* Start and End Time */}
                    <div className="flex  gap-5 items-center mb-4">
                      {loading ? (
                        <Skeleton variant="text" width={200} height={20} />
                      ) : (
                        <span className="block mt-4 text-sm font-bold rounded-full py-2 px-4 bg-[#fef5de] border border-[#ffcc00]">
                          {sections?.length > 0
                            ? "Section Based"
                            : "Non-Sectional"}
                        </span>
                      )}
                      {loading ? (
                        <Skeleton variant="text" width={200} height={20} />
                      ) : (
                        <span className="block mt-4 text-sm font-bold rounded-full py-2 px-4 bg-[#e1f9f0] border border-[#10b981]">
                          {formatDate(assessmentOverview?.registrationStart)}
                        </span>
                      )}
                      {loading ? (
                        <Skeleton variant="text" width={200} height={20} />
                      ) : (
                        <span className="block mt-4 text-sm font-bold rounded-full py-2 px-4 bg-[#feeaea] border border-[#f87171]">
                          {formatDate(assessmentOverview?.registrationEnd)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg w-full">
                <div className="flex justify-between items-center bg-white rounded-b-lg p-4 border-t">
                  {/* Total Duration */}
                  <div className="flex flex-col items-start ml-5 w-1/4 text-center">
                    {loading ? (
                      <Skeleton variant="text" width={100} height={20} />
                    ) : (
                      <>
                        <span className="text-xl font-bold">
                          {sections?.length > 0
                            ? assessmentOverview.timingType === "Overall"
                              ? `${testConfiguration?.duration?.hours || 0
                              } hr ${testConfiguration?.duration?.minutes || 0
                              } min`
                              : (() => {
                                const totalDuration = sections.reduce(
                                  (total, section) =>
                                    total +
                                    (section.sectionDuration
                                      ? section.sectionDuration.hours * 60 +
                                      section.sectionDuration.minutes
                                      : 0),
                                  0
                                );
                                const hours = Math.floor(totalDuration / 60);
                                const minutes = totalDuration % 60;
                                return `${hours} hr ${minutes} min`;
                              })()
                            : `${testConfiguration?.duration?.hours || 0} hr ${testConfiguration?.duration?.minutes || 0
                            } min`}
                        </span>
                        <span className="text-gray-500">
                          Assessment Duration
                        </span>
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-l border-gray-300 h-16" />

                  {/* No of Questions */}
                  <div className="flex flex-col items-start ml-5 w-1/4 text-center">
                    {loading ? (
                      <Skeleton variant="text" width={100} height={20} />
                    ) : (
                      <>
                        <span className="text-xl font-bold">
                          {sections?.length > 0
                            ? sections.reduce(
                              (total, section) =>
                                total +
                                (parseInt(section.numQuestions, 10) || 0),
                              0
                            )
                            : testConfiguration?.questions || 0}
                        </span>
                        <span className="text-gray-500">No of Questions</span>
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-l border-gray-300 h-16" />

                  {/* Total Marks */}
                  <div className="flex flex-col items-start ml-5 w-1/4 text-center">
                    {loading ? (
                      <Skeleton variant="text" width={100} height={20} />
                    ) : (
                      <>
                        <span className="text-xl font-bold">
                          {student_details?.length || 0}
                        </span>
                        <span className="text-gray-500">Total Mark</span>
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-l border-gray-300 h-16" />

                  {/* Pass Percentage */}
                  <div className="flex flex-col items-start ml-5 w-1/4 text-center">
                    {loading ? (
                      <Skeleton variant="text" width={100} height={20} />
                    ) : (
                      <>
                        <span className="text-xl font-bold">
                          {testConfiguration?.passPercentage}%
                        </span>
                        <span className="text-gray-500">Pass Percentage</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Rules and Regulations */}
            <section className="bg-white rounded-lg shadow-md p-6 h-full">
              <RulesAndRegulations assessmentOverview={assessmentOverview} />
            </section>
          </div>

          {/* Column 2: Test Setting and Organizer's Details */}
          <div className="w-1/4 flex flex-col space-y-4">
            {/* Test Setting */}
            <section className="bg-white rounded-lg shadow-md p-6 flex-1">
              <h2 className="text-lg font-semibold mb-2">Test Setting</h2>
              <p className="text-sm text-gray-600 mb-6">
                Security measures to ensure fair exam conduct
              </p>
              <div className="space-y-4 border-t border-gray-300 pt-2">
                {testSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-md">{setting.title}</h3>
                      <p className="text-xs text-gray-500">
                        {setting.description}
                      </p>
                    </div>
                    <Switch checked={switchStates[setting.id]} />
                  </div>
                ))}
              </div>
            </section>

            {/* Organizer's Details */}
            <section className="bg-white rounded-lg shadow-md p-6 flex-1">
              <OrganizerDetails staffDetailsProp={staff_details} />
            </section>
          </div>
        </div>

        {sections?.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="font-bold text-2xl mb-2 text-[#111933]">
              Section Details
            </h1>
            <section className="w-full">
              <div className="border-2 rounded-lg w-full">
                <table className="min-w-full bg-transparent rounded-lg overflow-hidden">
                  <thead className="bg-[#f0f0f0] text-[#111933]">
                    <tr>
                      {[
                        "Section Name",
                        "No. of Questions",
                        ...(assessmentOverview.timingType === "Section"
                          ? ["Duration (mins)"]
                          : []),
                        "Mark Allotment"
                      ].map((title, index) => (
                        <th
                          key={index}
                          className={`relative font-normal py-4 px-6 text-center ${index === 0 ? "rounded-tl-lg" : ""
                            } ${index ===
                              (assessmentOverview.timingType === "Section"
                                ? 4
                                : 3)
                              ? "rounded-tr-lg"
                              : ""
                            }`}
                        >
                          {title}
                          {index !==
                            (assessmentOverview.timingType === "Section"
                              ? 4
                              : 3) && (
                              <span className="absolute right-0 top-1/2 transform -translate-y-1/2 h-1/2 border-r border-[#111933]"></span>
                            )}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {sections?.map((section, index) => {
                      // Calculate total minutes for the section
                      const totalMinutes = section.sectionDuration
                        ? section.sectionDuration.hours * 60 +
                        section.sectionDuration.minutes
                        : 0;

                      // Convert total minutes to hours and minutes
                      const hours = Math.floor(totalMinutes / 60);
                      const minutes = totalMinutes % 60;

                      // Format the duration as hrs:mins
                      const duration = `${hours} hrs ${minutes} mins`;

                      return (
                        <tr
                          key={index}
                          className="border-b border-gray-300 hover:bg-gray-100"
                        >
                          <td className="py-3 px-6 text-center">
                            {section.sectionName}
                          </td>
                          <td className="py-3 px-6 text-center">
                            {section.numQuestions}
                          </td>
                          {assessmentOverview.timingType === "Section" && (
                            <td className="py-3 px-6 text-center">
                              {duration}
                            </td>
                          )}
                          <td className="py-3 px-6 text-center">
                            {section.markAllotment}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {student_details && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <Box
              mb={2}
              display="flex"
              sx={{
                alignItems: "center",
                justifyContent: "space-between", // Ensures equal distribution
                width: "100%", // Ensures the container takes full width
              }}
            >
              <h2 className="text-2xl font-bold text-[#111933] flex-1">
                Assigned Students
              </h2>
              <TextField
                variant="outlined"
                name="searchText"
                value={filters.searchText || ""}
                onChange={handleFilterChange}
                placeholder="Search" // Empty placeholder to maintain spacing
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "gray", mr: 1 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    height: "40px",
                    padding: "0 12px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "gray",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "darkgray",
                  },
                  // Remove label-specific styles since we're not using a floating label
                  flex: "1 1 0",
                  maxWidth: "33%",
                }}
              />

              <div className="flex justify-end items-center space-x-2 flex-1">
                {[
                  {
                    label: "Filter",
                    icon: <FilterListIcon />,
                    onClick: handleFilterDialogOpen,
                  },
                  ...(!isRegistrationPeriodOver && !isOverallStatusClosed
                    ? [
                      {
                        label: "Add Student",
                        icon: <AddIcon />,
                        onClick: () => setPublishDialogOpen(true),
                      },
                    ]
                    : []),
                ].map((btn, index) => (
                  <button
                    key={index}
                    className="bg-transparent border-[#111933] text-sm text-nowrap text-[#111933] font-medium py-1 px-5 border rounded-lg flex text-center items-center"
                    onClick={btn.onClick}
                  >
                    <span>{btn.label}</span>
                    <span className="ml-2">{btn.icon}</span>
                  </button>
                ))}
              </div>
            </Box>

            <Dialog
              open={openFilterDialog}
              onClose={handleFilterDialogClose}
              fullWidth
              maxWidth="md"
              PaperProps={{
                style: {
                  width: '730px',
                  height: '660px',
                  borderRadius: 26,
                  backgroundColor: '#fff',
                },
              }}
              BackdropProps={{
                className: "fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm",
              }}
              TransitionProps={{ unmountOnExit: true }}
            >
              <DialogTitle sx={{ fontWeight: "bold", mb: 1, color: "#111933", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Filter Options
                <IconButton onClick={handleFilterDialogClose} sx={{ color: "#111933" }}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ paddingTop: 0, paddingBottom: 0 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold", color: "#111933" }}>
                  Institution
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  {["SNSCT", "SNSCE", "SNS Spine", "SNS Nursing", "SNS Pharmacy", "SNS Health Science", "SNS Academy", "SNS Physiotherapy"].map(
                    (college) => (
                      <Chip
                        key={college}
                        label={college}
                        clickable
                        onClick={() => toggleFilter("collegename", college)}
                        sx={{
                          cursor: "pointer",
                          backgroundColor: filters.collegename.includes(college) ? "#111933" : "#fff",
                          color: filters.collegename.includes(college) ? "#fff" : "#202224",
                          width: '140px',
                          height: '35px',
                          display: 'flex',
                          border: '1px solid #202224',
                          fontSize: '18px',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '17px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      />
                    )
                  )}
                </Box>

                <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: "bold", color: "#111933" }}>
                  Year
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  {["I", "II", "III", "IV"].map((year) => (
                    <Chip
                      key={year}
                      label={year}
                      clickable
                      onClick={() => toggleFilter("year", year)}
                      sx={{
                        cursor: "pointer",
                        backgroundColor: filters.year.includes(year) ? "#111933" : "#fff",
                        color: filters.year.includes(year) ? "#fff" : "#111933",
                        width: '140px',
                        height: '35px',
                        display: 'flex',
                        border: '1px solid #202224',
                        fontSize: '18px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '17px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        "&:hover": {
                          backgroundColor: "#111933",
                          color: "#fff",
                        },
                      }}
                    />
                  ))}
                </Box>

                <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: "bold", color: "#111933" }}>
                  Department
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  {["AI&ML", "IT", "CSE", "AI&DS", "Mech", "EEE", "ECE", "CSD", "CST", "AERO", "MCT", "CIVIL", "Others"].map(
                    (dept) => (
                      <Chip
                        key={dept}
                        label={dept}
                        clickable
                        onClick={() => toggleFilter("dept", dept)}
                        sx={{
                          cursor: "pointer",
                          backgroundColor: filters.dept.includes(dept) ? "#111933" : "#fff",
                          color: filters.dept.includes(dept) ? "#fff" : "#111933",
                          width: '140px',
                          height: '35px',
                          display: 'flex',
                          border: '1px solid #202224',
                          fontSize: '18px',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '17px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      />
                    )
                  )}
                </Box>
                <p className="text-gray-500">*You can choose multiple Order type</p>
              </DialogContent>
              <DialogActions sx={{ display: "flex", justifyContent: "center", paddingTop: 0, paddingBottom: 5, gap: 4 }}>
                <Button
                  onClick={clearFilters}
                  variant="outlined"
                  sx={{
                    color: "#111933",
                    borderColor: "#111933",
                    borderRadius: '10px',
                    fontSize: '16px',
                    width: '196px',
                    height: '40px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: "nowrap",
                    gap: '8px',
                  }}
                >
                  Clear Filter
                  <div className="rounded-full border border-[#111933] p-[2px]">
                    <IoCloseCircleOutline className="text-[#111933]" />
                  </div>
                </Button>
                <Button
                  onClick={applyFilters}
                  variant="contained"
                  sx={{
                    backgroundColor: "#111933",
                    color: "#fff",
                    borderRadius: '10px',
                    width: '196px',
                    height: '40px',
                    fontSize: '16px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    gap: '8px',
                    "&:hover": {},
                  }}
                >
                  Apply Filters
                  <div className="rounded-full border border-white ">
                    <FaCheckCircle className="text-white" />
                  </div>
                </Button>
              </DialogActions>
            </Dialog>

            <TableContainer
              component={Paper}
              sx={{
                borderRadius: "10px",
                border: "1px solid rgba(17, 25, 51, 0.2)", // Lighter border effect
              }}
            >
              <Table>
                <TableHead
                  sx={{ backgroundColor: "#f0f0f0", color: "#111933" }}
                >
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "#111933",
                        textAlign: "center",
                        padding: "15px 0px",
                      }}
                    >
                      <p className="border-r-[1px] border-[#111933] font-semibold w-full">
                        Name
                      </p>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#111933",
                        textAlign: "center",
                        padding: "15px 0px",
                      }}
                    >
                      <p className="border-r-[1px] border-[#111933] w-full font-semibold">
                        Registration Number
                      </p>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#111933",
                        textAlign: "center",
                        padding: "15px 0px",
                      }}
                    >
                      <p className="border-r-[1px] border-[#111933] w-full font-semibold">
                        Department
                      </p>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#111933",
                        textAlign: "center",
                        padding: "15px 0px",
                      }}
                    >
                      <p className="border-r-[1px] border-[#111933] w-full font-semibold">
                        College Name
                      </p>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#111933",
                        textAlign: "center",
                        padding: "15px 0px",
                      }}
                    >
                      <p className="border-r-[1px] border-[#111933] w-full font-semibold">
                        Year
                      </p>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#111933",
                        textAlign: "center",
                        padding: "15px 0px",
                      }}
                    >
                      <p className="border-r-[1px] border-[#111933] w-full font-semibold">
                        Status
                      </p>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#111933",
                        textAlign: "center",
                        padding: "15px 0px",
                      }}
                    >
                      <p className="font-semibold">Actions</p>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading
                    ? Array.from({ length: rowsPerPage }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={7}>
                          <Skeleton
                            variant="rectangular"
                            width="100%"
                            height={40}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                    : currentStudents.map((student) => (
                      <TableRow key={student.regno}>
                        <TableCell
                          sx={{ position: "relative", textAlign: "center" }}
                        >
                          <span>{student.name}</span>
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {student.regno}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {student.dept}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {student.collegename}
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          {student.year}
                        </TableCell>
                        <TableCell
                          sx={{ textAlign: "center", padding: "4px" }}
                        >
                          <Box
                            component="span"
                            sx={{
                              padding: "3px 12px",
                              maxWidth: "125px",
                              borderRadius: "9999px", // Fully rounded
                              display: "inline-block", // Ensures it takes only necessary width
                              bgcolor:
                                student.status === "yet to start" &&
                                  (isRegistrationPeriodOver ||
                                    isOverallStatusClosed)
                                  ? "#feeaea" // Light red for "incomplete"
                                  : student.status === "Completed"
                                    ? "#e1f9f0" // Light green for "Completed"
                                    : student.status === "LimitCompleted"
                                      ? "#d1e3ff" // Light blue for "LimitCompleted"
                                      : student.status === "started"
                                        ? "#e1f9f0" // Light blue for "LimitCompleted"
                                        : student.status === "yet to start"
                                          ? "#fef5de" // Light yellow for "yet to start"
                                          : "transparent", // Default background
                              color: "black",
                            }}
                          >
                            {student.status === "yet to start" &&
                              (isRegistrationPeriodOver ||
                                isOverallStatusClosed)
                              ? "Not Attempted"
                              : student.status === "LimitCompleted"
                                ? "Limit Exceeded"
                                : student.status === "started"
                                  ? "Yet to complete"
                                  : student.status}
                          </Box>
                        </TableCell>
                        <TableCell
                          sx={{
                            display: "flex",
                            textAlign: "center",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Tooltip title="View">
                            <button
                              className=""
                              onClick={() => handleViewClick(student)}
                            >
                              <TbFileSearch className="text-[#111933] text-2xl" />
                            </button>
                          </Tooltip>

                          {!isRegistrationPeriodOver &&
                            !isOverallStatusClosed && (
                              <>
                                <span className="mx-3 text-2xl"></span>
                                <Tooltip title="Delete">
                                  <button
                                    onClick={() =>
                                      handleStudentRemove(student.regno)
                                    }
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                    className="text-[#111933] mb-1"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      viewBox="0 0 18 20"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M16.6645 3.07789C16.9223 3.07789 17.1696 3.17994 17.352 3.3616C17.5343 3.54327 17.6367 3.78965 17.6367 4.04656C17.6367 4.30347 17.5343 4.54985 17.352 4.73151C17.1696 4.91317 16.9223 5.01523 16.6645 5.01523H15.6923L15.6894 5.084L14.7823 17.7455C14.7474 18.2343 14.5278 18.6917 14.1679 19.0257C13.808 19.3596 13.3345 19.5453 12.8427 19.5453H4.92977C4.43797 19.5453 3.96442 19.3596 3.60452 19.0257C3.24462 18.6917 3.02511 18.2343 2.99019 17.7455L2.08311 5.08497L2.08116 5.01523H1.10894C0.851092 5.01523 0.603803 4.91317 0.421476 4.73151C0.239149 4.54985 0.136719 4.30347 0.136719 4.04656C0.136719 3.78965 0.239149 3.54327 0.421476 3.3616C0.603803 3.17994 0.851092 3.07789 1.10894 3.07789H16.6645ZM10.8312 0.171875C11.089 0.171875 11.3363 0.273931 11.5186 0.455592C11.701 0.637253 11.8034 0.883638 11.8034 1.14055C11.8034 1.39745 11.701 1.64384 11.5186 1.8255C11.3363 2.00716 11.089 2.10922 10.8312 2.10922H6.94227C6.68442 2.10922 6.43714 2.00716 6.25481 1.8255C6.07248 1.64384 5.97005 1.39745 5.97005 1.14055C5.97005 0.883638 6.07248 0.637253 6.25481 0.455592C6.43714 0.273931 6.68442 0.171875 6.94227 0.171875H10.8312Z"
                                        fill="currentColor"
                                      />
                                    </svg>
                                  </button>
                                </Tooltip>
                              </>
                            )}
                          {!isRegistrationPeriodOver &&
                            !isOverallStatusClosed &&
                            (student.status.toLowerCase() === "completed" ||
                              student.status.toLowerCase() ===
                              "limitcompleted") && (
                              <>
                                <span className="mx-3 text-2xl"></span>
                                <Tooltip title="Reassign this test to the student">
                                  <button
                                    className=""
                                    onClick={() => handleReassign(student)}
                                  >
                                    <TbReload className="text-[#111933] text-2xl" />
                                  </button>
                                </Tooltip>
                              </>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filters.searchText === "" && (
              <div className="flex justify-center mt-6">
                <Pagination
                  count={Math.ceil(filteredStudents.length / rowsPerPage)}
                  page={page + 1}
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
          </div>
        )}

        <div className="flex justify-between">
          <div className="flex">
            {!isRegistrationPeriodOver && !isOverallStatusClosed && (
              <>
                <button
                  className={themeButtonStyle}
                  onClick={() => navigate(`/mcq/edit-test/${contestId}`)}
                >
                  Edit Test
                </button>

                {/* <button
                  className={`${themeButtonStyle} inline-flex items-center`}
                  onClick={() => setShowClosePopup(true)} // Show the close popup
                >
                  Close Assessment <FaXmark className="ml-2" />
                </button> */}
              </>
            )}
            {!isRegistrationPeriodOver &&
              !isOverallStatusClosed &&
              contestStatus !== "Completed" && (
                <button
                  className={`${themeButtonStyle} inline-flex items-center`}
                  onClick={() => setShowClosePopup(true)} // Show the close popup
                >
                  Close Assessment <FaXmark className="ml-2" />
                </button>
              )}

            <div className="flex">
              <button
                className={`${themeButtonStyle} inline-flex items-center`}
                onClick={() => setShowDeletePopup(true)}
              >
                Delete Assessment <MdDelete className="ml-2" />
              </button>
              <button
                className={themeButtonStyle}
                onClick={handleDownloadContestData}
              >
                Download Contest Data
              </button>
            </div>
          </div>
          {testConfiguration &&
            testConfiguration.resultVisibility === "Host Control" && (
              <button
                className={`px-7 p-1 rounded-lg border-[1px] mx-2 flex items-center ${isResultsPublished || !hasCompletedStudents()
                  ? "bg-gray-400 border-gray-400 cursor-not-allowed"
                  : "bg-[#111933] border-[#111933] text-white hover:bg-[#12204b]"
                  }`}
                onClick={() => setShowPublishPopup(true)}
                disabled={isResultsPublished || !hasCompletedStudents()}
              >
                <span className="mr-2">
                  {isResultsPublished ? "Results Published" : "Publish Results"}
                </span>
                <MdOutlinePublish />
              </button>
            )}

          <Dialog
            open={publishDialogOpen}
            onClose={() => setPublishDialogOpen(false)}
            fullWidth
            maxWidth="lg"
          >
            <DialogContent>
              <StudentTable
                students={dialogStudents}
                selectedStudents={selectedStudents}
                setSelectedStudents={setSelectedStudents}
                filters={dialogFilters}
                setFilters={setDialogFilters}
                sortConfig={sortConfig}
                setSortConfig={setSortConfig}
                page={dialogPage} // Use the dialog-specific page state
                setPage={setDialogPage} // Use the dialog-specific page setter
                rowsPerPage={dialogRowsPerPage} // Use the dialog-specific rowsPerPage state
                setRowsPerPage={setDialogRowsPerPage} // Use the dialog-specific rowsPerPage setter
                openFilterDialog={openFilterDialog}
                setOpenFilterDialog={setOpenFilterDialog}
                testDetails={testDetails}
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setPublishDialogOpen(false)}
                sx={{ color: "#111933" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStudent}
                sx={{ backgroundColor: "#111933" }}
                variant="contained"
              >
                Add
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={modalOpen}
            onClose={handleCloseModal}
            PaperProps={{
              sx: {
                width: 500,
                minHeight: 200,
                bgcolor: "#ffffff",
                boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.2)",
                p: 4,
                textAlign: "center",
                borderRadius: "16px",
                animation: "fadeIn 0.4s ease-out",
              },
            }}
          >
            <Box
              sx={{
                fontSize: 40,
                color: "#111933",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <FaCircleXmark />
            </Box>
            <DialogTitle
              id="status-popup"
              sx={{ fontWeight: 700, color: "#2c3e50", fontSize: "24px" }}
            >
              No Report Available
            </DialogTitle>
            <DialogContent>
              <Typography
                id="status-description"
                sx={{ fontSize: "15px", color: "#4b5563", lineHeight: 1.6 }}
              >
                The report for this student is not available yet.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center" }}>
              <Button
                onClick={handleCloseModal}
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
                  "&:hover": { bgcolor: "#24356e", color: "#fff" },
                  transition: "all 0.2s ease",
                }}
              >
                OK
              </Button>
            </DialogActions>
          </Dialog>
          {modalOpen && (
            <div className="fixed inset-0 backdrop-blur-sm z-40"></div>
          )}

          {showDownload && (
            <DownloadContestData
              contestId={contestId}
              contestName={assessmentOverview?.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewTest;
