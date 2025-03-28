import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  ChevronRight,
  Delete,
  Plus,
  PlusCircleIcon,
  Trash,
  X,
} from "lucide-react";
import { IoClose } from "react-icons/io5";
import { FiEdit, FiDelete, FiTrash } from "react-icons/fi";
import { RiCheckboxCircleFill } from "react-icons/ri";
import QuestionModal from "../../../components/staff/McqSection/QuestionModal";
import ImportModal from "../../../components/McqLibrary/ImportModal";
import McqLibrary from "../../../components/staff/McqSection/McqLibraryModal";
import PublishDialog from "../../../components/staff/McqSection/PublishDialog";
import ShareModal from "../../../components/staff/McqSection/ShareModal";
import SelectTestQuestion from "../../../components/staff/McqSection/SelectTestQuestion";
import Modal from "../../../components/staff/McqSection/Modal";
import ManualUpload from "../../../components/staff/McqSection/ManualUpload";
import { jwtDecode } from "jwt-decode";
import LibraryModal from "../../../components/staff/mcq/McqLibraryModal";
import CreateManuallyIcon from "../../../assets/bulkupload1.png";
import BulkUploadIcon from "../../../assets/bulkupload2.png";
import QuestionLibraryIcon from "../../../assets/qlibrary1.png";
import AIGeneratorIcon from "../../../assets/aigenerator.svg";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AIGenerateModal from "../../../components/staff/McqSection/AIGenerateModal";
import MultiStepLoader from "../../../components/ui/multi-step-loader";
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal"; // Import the ConfirmModal component
import { PlusOneRounded } from "@mui/icons-material";
import { FaPlusCircle } from "react-icons/fa";
import bg from "../../../assets/bgpattern.svg";

const Mcq_CombinedDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData } = location.state;
  const [sections, setSections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(5);
  const [showImage, setShowImage] = useState(true);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [filters, setFilters] = useState({
    collegename: [],
    dept: [],
    year: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sharingLink, setSharingLink] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionsLocal, setSelectedQuestionsLocal] = useState([]);
  const [currentSectionQuestions, setCurrentSectionQuestions] = useState([]);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] = useState(false);
  const [visibleSections, setVisibleSections] = useState([]);
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [allSectionsSubmitted, setAllSectionsSubmitted] = useState(false);
  const [showDuration, setShowDuration] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // State for modal
  const loadingStates = [
    { text: "Preparing to publish..." },
    { text: "Gathering questions..." },
    { text: "Finalizing details..." },
    { text: "Publishing..." },
  ];

  useEffect(() => {
    const storedSections = JSON.parse(sessionStorage.getItem("sections")) || [];
    const storedStudents = JSON.parse(sessionStorage.getItem("students")) || [];
    const storedSelectedStudents =
      JSON.parse(sessionStorage.getItem("selectedStudents")) || [];

    if (
      formData.assessmentOverview.sectionDetails === "Yes" &&
      storedSections.length === 0
    ) {
      const defaultSection = {
        id: 1,
        sectionName: "Section 1",
        numQuestions: 10,
        durationHours: 0,
        durationMinutes: 0,
        sectionDuration: 0,
        markAllotment: 1,
        passPercentage: 50,
        timeRestriction: false,
        submitted: false,
        selectedQuestions: [],
        showDropdown: false,
      };
      setSections([defaultSection]);
      sessionStorage.setItem("sections", JSON.stringify([defaultSection]));
    } else {
      // Check for and remove duplicate questions
      const updatedSections = storedSections.map((section) => {
        const uniqueQuestionsMap = new Map();

        section.selectedQuestions.forEach((q) => {
          if (q.question_id) {
            uniqueQuestionsMap.set(q.question_id, q);
          } else {
            // If no question_id, use the question text as a key
            uniqueQuestionsMap.set(q.question, q);
          }
        });

        const uniqueQuestions = Array.from(uniqueQuestionsMap.values());

        if (uniqueQuestions.length !== section.selectedQuestions.length) {
          toast.warn(
            `Removed ${
              section.selectedQuestions.length - uniqueQuestions.length
            } duplicate questions from ${section.sectionName}.`
          );
        }

        return {
          ...section,
          selectedQuestions: uniqueQuestions,
        };
      });

      setSections(updatedSections);
      const allSubmitted = updatedSections.every(
        (section) => section.submitted
      );
      setAllSectionsSubmitted(allSubmitted);
      const sectionsWithTimeFormat = updatedSections.map((section) => ({
        ...section,
        durationHours: Math.floor(section.sectionDuration / 60) || 0,
        durationMinutes: section.sectionDuration % 60 || 0,
      }));
      setSections(sectionsWithTimeFormat);
    }

    setStudents(storedStudents);
    setSelectedStudents(storedSelectedStudents);
  }, [formData.assessmentOverview.sectionDetails]);

  useEffect(() => {
    let storedData = sessionStorage.getItem("assessmentOverview");
    if (!storedData) {
      const mcqData = sessionStorage.getItem("mcqAssessmentFormData");
      if (mcqData) {
        const parsedMcqData = JSON.parse(mcqData);
        if (parsedMcqData.assessmentOverview) {
          sessionStorage.setItem(
            "assessmentOverview",
            JSON.stringify(parsedMcqData.assessmentOverview)
          );
          storedData = JSON.stringify(parsedMcqData.assessmentOverview);
        }
      }
    }

    if (storedData) {
      const assessmentOverview = JSON.parse(storedData);
      if (
        assessmentOverview?.sectionDetails === "Yes" &&
        assessmentOverview?.timingType === "Section"
      ) {
        setShowDuration(true);
      } else {
        setShowDuration(false);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("sections", JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    sessionStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    const allSubmitted = sections.every((section) => section.submitted);
    setAllSectionsSubmitted(allSubmitted);
  }, [sections]);

  useEffect(() => {
    sessionStorage.setItem(
      "selectedStudents",
      JSON.stringify(selectedStudents)
    );
  }, [selectedStudents]);

  const handleAddSection = () => {
    if (sections.length >= 4) {
      toast.error("You cannot add more than 4 sections.");
      return;
    }

    // Check if the last section is submitted
    const lastSection = sections[0];
    if (!lastSection.submitted) {
      toast.error("Please submit the current section before adding a new one.");
      return;
    }

    const newSection = {
      id: Date.now(),
      sectionName: `Section ${sections.length + 1}`,
      numQuestions: 10,
      durationHours: 0,
      durationMinutes: 0,
      sectionDuration: 0,
      markAllotment: 1,
      passPercentage: 50,
      timeRestriction: false,
      submitted: false,
      selectedQuestions: [],
      showDropdown: false,
    };
    const updatedSections = [newSection, ...sections];
    setSections(updatedSections);
    setActiveSectionIndex(0); // Set activeSectionIndex to the new section
    setVisibleSections([]);
  };

  const handleQuestionAdded = (newQuestion) => {
    const updatedSections = sections.map((section, index) => {
      if (index === activeSectionIndex) {
        if (newQuestion.question_id) {
          const existingQuestionIds = new Set(
            section.selectedQuestions.map((q) => q.question_id)
          );
          if (!existingQuestionIds.has(newQuestion.question_id)) {
            return {
              ...section,
              selectedQuestions: [...section.selectedQuestions, newQuestion],
            };
          } else {
            console.error("Duplicate question detected:", newQuestion);
            toast.error(
              "Duplicate question. This question already exists in the section."
            );
            return section;
          }
        } else {
          return {
            ...section,
            selectedQuestions: [...section.selectedQuestions, newQuestion],
          };
        }
      }
      return section;
    });
    setSections(updatedSections);
    setActiveComponent(null);
  };

  const handleQuestionsGenerated = (questions) => {
    const updatedSections = sections.map((section, index) => {
      if (index === activeSectionIndex) {
        const existingQuestionIds = new Set(
          section.selectedQuestions.map((q) => q.question_id)
        );
        const newQuestions = questions.filter(
          (q) => !existingQuestionIds.has(q.question_id)
        );

        // Log the question IDs for debugging
        console.log("New Questions to Add:", newQuestions);

        if (newQuestions.length < questions.length) {
          console.error("Duplicate questions detected:", questions);
          toast.error("Some questions are duplicates and were not added.");
        }

        return {
          ...section,
          selectedQuestions: [...section.selectedQuestions, ...newQuestions],
        };
      }
      return section;
    });
    setSections(updatedSections);
    sessionStorage.setItem("sections", JSON.stringify(updatedSections));
  };

  const handleInputChange = (e, sectionIndex) => {
    const { name, value, type, checked } = e.target;

    const updatedSections = sections.map((section, index) => {
      if (index === sectionIndex) {
        if (name === "durationHours" || name === "durationMinutes") {
          const numValue = value.trim() === "" ? "" : parseInt(value) || 0;
          const isHours = name === "durationHours";
          const maxValue = isHours ? 23 : 59;

          const validValue =
            numValue === "" ? "" : Math.max(0, Math.min(numValue, maxValue));

          const hours = isHours ? validValue : section.durationHours;
          const minutes = isHours ? section.durationMinutes : validValue;
          const totalMinutes =
            hours !== "" && minutes !== "" ? hours * 60 + minutes : 0;

          return {
            ...section,
            [name]: validValue,
            sectionDuration: totalMinutes,
          };
        } else if (name === "passPercentage") {
          const numValue = value.trim() === "" ? "" : parseInt(value) || 0;
          const validValue =
            numValue === "" ? "" : Math.max(0, Math.min(numValue, 100));
          return {
            ...section,
            [name]: validValue,
          };
        } else if (name === "markAllotment") {
          // Allow empty input while typing
          if (value === "") {
            return { ...section, [name]: "" };
          }

          const numValue = parseInt(value) || 0;
          const validValue = Math.max(1, Math.min(numValue, 100));

          return {
            ...section,
            [name]: validValue,
          };
        } else if (name === "sectionName") {
          // Word limit: 10 words
          const words = value.trim().split(/\s+/);
          if (words.length > 10) {
            return { ...section, [name]: words.slice(0, 10).join(" ") };
          }

          // Character repetition limit: 8 times
          let validValue = "";
          const charCount = {};
          for (const char of value) {
            charCount[char] = (charCount[char] || 0) + 1;
            if (charCount[char] <= 8) {
              validValue += char;
            }
          }

          return {
            ...section,
            [name]: validValue,
          };
        }

        return {
          ...section,
          [name]: type === "checkbox" ? checked : value,
        };
      }
      return section;
    });

    setSections(updatedSections);
  };

  const handleDeleteSection = (sectionIndex) => {
    const updatedSections = sections.filter(
      (_, index) => index !== sectionIndex
    );
    setSections(updatedSections);
  };

  const handleAddQuestion = (sectionIndex) => {
    setActiveSectionIndex(sectionIndex); // Ensure activeSectionIndex is set correctly
    setIsModalOpen(true);
    setSelectedQuestionsLocal([]);
    setCurrentSectionQuestions([]);
    setQuestions([]);
    setShowImage(true);
    setCurrentPage(1);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleOptionSelect = (component, sectionIndex) => {
    setActiveSectionIndex(sectionIndex);
    setActiveComponent(component);
    handleModalClose();
  };

  const handleSaveQuestions = async (sectionIndex) => {
    const section = sections[sectionIndex];

    if (section.submitted) {
      toast.error("This section has already been submitted.");
      return;
    }

    // Validate all required fields
    if (!section.sectionName.trim()) {
      toast.error("Section name is required.");
      return;
    }

    if (!section.numQuestions || section.numQuestions <= 0) {
      toast.error("Number of questions must be greater than 0.");
      return;
    }

    if (!section.markAllotment || section.markAllotment <= 0) {
      toast.error("Marks per question must be greater than 0.");
      return;
    }

    // Validate duration
    if (formData.assessmentOverview.timingType === "Section") {
      const totalMinutes =
        parseInt(section.durationHours || 0) * 60 +
        parseInt(section.durationMinutes || 0);
      if (totalMinutes <= 0) {
        toast.error("Section duration must be specified.");
        return;
      }
    }

    const selectedQuestionCount = section.selectedQuestions.length;

    if (selectedQuestionCount < section.numQuestions) {
      toast.error(
        `You have selected ${selectedQuestionCount} questions, but the limit is ${section.numQuestions}. Please add more questions.`
      );
      return;
    }

    if (selectedQuestionCount > section.numQuestions) {
      toast.error(
        `You have selected ${selectedQuestionCount} questions, but the limit is ${section.numQuestions}. Please reduce the number of selected questions.`
      );
      return;
    }

    try {
      const formattedQuestions = section.selectedQuestions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer || q.answer,
      }));

      const response = await axios.post(
        `${API_BASE_URL}/api/mcq/save-assessment-questions/`,
        {
          sectionName: section.sectionName,
          numQuestions: section.numQuestions,
          sectionDuration: {
            hours: section.durationHours,
            minutes: section.durationMinutes,
          },
          markAllotment: section.markAllotment,
          passPercentage: section.passPercentage,
          timeRestriction: section.timeRestriction,
          questions: formattedQuestions,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("contestToken")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Section submitted successfully!");

        setTimeout(() => {
          setSections((prevSections) => {
            const updatedSections = prevSections.map((sec, index) =>
              index === sectionIndex ? { ...sec, submitted: true } : sec
            );

            const allSubmitted = updatedSections.every((sec) => sec.submitted);
            setAllSectionsSubmitted(allSubmitted);

            return updatedSections;
          });
        }, 500);
      } else {
        toast.error("Failed to submit section. Please try again.");
      }
    } catch (error) {
      console.error("Error saving questions:", error);

      if (error.response && error.response.status === 401) {
        toast.error("Unauthorized access. Please log in again.");
        navigate("/login");
      } else {
        toast.error(
          error.response?.data?.error ||
            "Failed to save questions. Please try again."
        );
      }
    }
  };

  const handlePublish = async () => {
    const submittedSections = sections.filter((section) => section.submitted);
    if (submittedSections.length < 2) {
      toast.error("You need at least 2 submitted sections to publish.");
      return;
    }

    const unsubmittedSections = sections.filter(
      (section) => !section.submitted
    );
    if (unsubmittedSections.length > 0) {
      toast.error(
        `Please submit all sections before publishing. Sections ${unsubmittedSections
          .map((s) => s.sectionName)
          .join(", ")} are not submitted.`
      );
      return;
    }

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
      if (!selectedStudents.length) {
        toast.error("Please select at least one student before publishing.");
        return;
      }

      const uniqueQuestions = Array.from(
        new Set(
          sections
            .flatMap((section) => section.selectedQuestions)
            .map(JSON.stringify)
        )
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

      // Show the loader and hide the table
      setIsLoading(true);

      // Introduce a 10-second delay
      await new Promise((resolve) => setTimeout(resolve, 10000));

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

      // Hide the loader and show the table
      setIsLoading(false);

      if (response.status === 200) {
        setSharingLink(
          `${import.meta.env.VITE_API_BASE_URL}/testinstructions/${contestId}`
        );
        setShareModalOpen(true);
        toast.success("Questions published successfully!");

        sessionStorage.clear();
      } else {
        toast.error(
          `Failed to publish questions: ${
            response.data.message || "Unknown error."
          }`
        );
      }
    } catch (error) {
      setIsLoading(false); // Ensure loader is hidden in case of error
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
    } finally {
      setPublishDialogOpen(false);
    }
  };

  const toggleQuestionsVisibility = (sectionIndex) => {
    setVisibleSections((prev) =>
      prev.includes(sectionIndex)
        ? prev.filter((index) => index !== sectionIndex)
        : [...prev, sectionIndex]
    );
  };

  const handleShareModalClose = () => {
    setShareModalOpen(false);
    navigate(`/staffdashboard`);
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error("Please select a valid CSV file.");
      setUploadStatus("Error: Please select a valid CSV file.");
      return;
    }

    if (!file.name.endsWith(".csv")) {
      toast.error("Error: Only CSV files are allowed.");
      setUploadStatus("Error: Only CSV files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Error: File size exceeds 5MB.");
      setUploadStatus("Error: File size exceeds 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/mcq-bulk-upload/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        toast.success(response.data.message);
        setUploadStatus("Success: File uploaded successfully.");

        // Log the response data to verify the questions
        console.log("Uploaded Questions:", response.data.questions);

        const updatedSections = sections.map((section, index) => {
          if (index === activeSectionIndex) {
            const existingQuestionIds = new Set(
              section.selectedQuestions.map((q) => q.question_id)
            );
            const newQuestions = response.data.questions.filter(
              (q) => !existingQuestionIds.has(q.question_id)
            );

            return {
              ...section,
              selectedQuestions: [
                ...section.selectedQuestions,
                ...newQuestions,
              ],
            };
          }
          return section;
        });

        // Log the updated sections to verify the state update
        console.log("Updated Sections:", updatedSections);

        setSections(updatedSections);
        setQuestions([]);
        setSelectedQuestionsLocal([]);
        setShowImage(true);
        setActiveComponent(null);
        setIsModalOpen(false);
      } else {
        toast.error("Error: Unable to upload file.");
        setUploadStatus("Error: Unable to upload file.");
      }
    } catch (err) {
      toast.error("Error: Unable to upload file.");
      setUploadStatus("Error: Unable to upload file.");
    }
  };

  const handleSelectQuestion = (index) => {
    setSelectedQuestionsLocal((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestionsLocal.length === questions.length) {
      setSelectedQuestionsLocal([]);
    } else {
      setSelectedQuestionsLocal(questions.map((_, index) => index));
    }
  };

  const handleSubmitBulkUpload = async () => {
    if (activeSectionIndex === null) {
      toast.error("Please select a section before adding questions.");
      return;
    }

    const selectedQuestions = selectedQuestionsLocal.map(
      (index) => questions[index]
    );

    const updatedSections = sections.map((section, index) => {
      if (index === activeSectionIndex) {
        const existingQuestionIds = new Set(
          section.selectedQuestions.map((q) => q.question_id)
        );
        const newQuestions = selectedQuestions.filter(
          (q) => !existingQuestionIds.has(q.question_id)
        );

        return {
          ...section,
          selectedQuestions: [...section.selectedQuestions, ...newQuestions],
        };
      }
      return section;
    });

    setSections(updatedSections);

    setQuestions([]);
    setSelectedQuestionsLocal([]);
    setShowImage(true);
    setActiveComponent(null);

    toast.success("Questions added successfully!");
  };

  const handleRemoveQuestion = (sectionIndex, questionIndex) => {
    const section = sections[sectionIndex];

    // Check if the section is submitted
    if (section.submitted) {
      toast.error("Cannot remove questions from a submitted section.");
      return;
    }

    const updatedSections = sections.map((section, index) =>
      index === sectionIndex
        ? {
            ...section,
            selectedQuestions: section.selectedQuestions.filter(
              (_, qIndex) => qIndex !== questionIndex
            ),
          }
        : section
    );
    setSections(updatedSections);
    toast.success("Question removed successfully!");
  };

  const handleEditQuestion = (sectionIndex, questionIndex) => {
    const section = sections[sectionIndex]; // Get the specific section

    if (section.submitted) {
      // Check if this section is submitted
      toast.error("Cannot edit questions from a submitted section.");
      return;
    }

    const question = section.selectedQuestions[questionIndex]; // Get the specific question
    setEditingQuestion({ sectionIndex, questionIndex, question });
    setIsPanelOpen(true);
  };

  const handleSaveEdit = (updatedQuestion) => {
    const { sectionIndex, questionIndex } = editingQuestion;
    const updatedSections = sections.map((section, sIndex) =>
      sIndex === sectionIndex
        ? {
            ...section,
            selectedQuestions: section.selectedQuestions.map((q, qIndex) =>
              qIndex === questionIndex ? updatedQuestion : q
            ),
          }
        : section
    );

    setSections(updatedSections);
    setIsPanelOpen(false);
    toast.success("Question edited successfully!");
  };

  const handleCancelEdit = () => {
    setIsPanelOpen(false);
  };

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
  }, [API_BASE_URL]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleLibraryButtonClick = () => {
    setIsLibraryModalOpen(true);
  };

  const handleLibraryModalClose = () => {
    setIsLibraryModalOpen(false);
  };

  const updateSection = (id, updatedSection) => {
    const updatedSections = sections.map((section) =>
      section.id === id ? updatedSection : section
    );
    setSections(updatedSections);
  };

  return (
    <div
      className="relative min-h-[calc(100vh-95px)] md:py-8  md:px-14"
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
      }}
    >
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={isLoading}
        duration={2500}
      />
      {!isLoading && (
        <div className="max-w-[1500px] mx-auto py-20">
          <div className="space-y-6">
            {formData.assessmentOverview.sectionDetails === "Yes" ? (
              <div className="px-4 md:px-0">
                {/* Breadcrumb with Add Section button aligned to the right */}
                <div className="h-14 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
                  <div className="hidden md:flex  items-center gap-2 text-[#111933] text-sm">
                    <span
                      className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100"
                      onClick={() => setIsConfirmModalOpen(true)}
                    >
                      Home
                    </span>
                    <span className="flex items-center -space-x-2">
                      <ChevronRight size={15} />
                      <ChevronRight size={15} />
                    </span>
                    <span
                      className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100"
                      onClick={() => navigate("/mcq/details")}
                    >
                      Assessment Overview
                    </span>
                    <span className="flex items-center -space-x-2">
                      <ChevronRight size={15} />
                      <ChevronRight size={15} />
                    </span>
                    <span
                      className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100"
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
                    <span>Add Sections</span>
                  </div>
                  <button
                    onClick={handleAddSection}
                    className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 w-full md:w-auto"
                  >
                    Add Section +
                  </button>
                </div>

                {sections.map((section, sectionIndex) => (
                  <div
                    key={section.id}
                    className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6 md:mb-8"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start mb-1 mt-3 md:mt-5 gap-2">
                      <h2 className="text-xl md:text-2xl font-bold text-[#111933]">
                        Section Configuration
                      </h2>
                    </div>

                    <p className="text-sm md:text-md text-[#111933] mb-4">
                      This section allows you to configure the structure and
                      conditions of the test
                    </p>
                    <hr className="border-t border-gray-300 my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-0 md:px-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm mb-2 font-medium">
                            Section Name*
                          </label>
                          <input
                            type="text"
                            name="sectionName"
                            value={section.sectionName}
                            onChange={(e) => handleInputChange(e, sectionIndex)}
                            placeholder="Enter the section name"
                            className={`w-full px-3 py-2 border rounded-md border-[#11193366] ${
                              section.submitted && "opacity-50"
                            }`}
                            disabled={section.submitted}
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-2 font-medium mt-4 md:mt-7">
                            Number of Questions*
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="numQuestions"
                            maxLength={3}
                            value={section.numQuestions}
                            onChange={(e) => {
                              const onlyNums = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              handleInputChange(
                                {
                                  target: {
                                    name: "numQuestions",
                                    value: onlyNums,
                                  },
                                },
                                sectionIndex
                              );
                            }}
                            placeholder="Enter the total number of questions"
                            className={`w-full px-3 py-2 border rounded-md border-[#11193366] ${
                              section.submitted && "opacity-50"
                            }`}
                            disabled={section.submitted}
                          />
                        </div>
                      </div>

                      <div className="space-y-7">
                        {showDuration && (
                          <div>
                            <label className="block text-sm font-medium">
                              Section Duration*
                            </label>
                            <div className="flex gap-2 mt-2">
                              <div className="flex relative w-1/2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  name="durationHours"
                                  min="0"
                                  max="23"
                                  value={section.durationHours || ""}
                                  onChange={(e) => {
                                    const onlyNums = e.target.value.replace(
                                      /[^0-9]/g,
                                      ""
                                    );
                                    handleInputChange(
                                      {
                                        target: {
                                          name: "durationHours",
                                          value: onlyNums,
                                        },
                                      },
                                      sectionIndex
                                    );
                                  }}
                                  placeholder=" "
                                  className={`w-full px-3 py-2 border rounded-md border-[#11193366] peer ${
                                    section.submitted && "opacity-50"
                                  }`}
                                  disabled={section.submitted}
                                />
                                <label
                                  className={`absolute left-2 bg-white px-1 text-gray-500 transition-all duration-200
                                  ${
                                    section.durationHours
                                      ? "text-xs -top-2"
                                      : "top-2 text-sm"
                                  }
                                  peer-focus:text-xs peer-focus:-top-2 peer-focus:text-blue-600 pointer-events-none`}
                                >
                                  Hours
                                </label>
                              </div>
                              <div className="flex relative w-1/2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  name="durationMinutes"
                                  min="0"
                                  max="59"
                                  value={section.durationMinutes || ""}
                                  onChange={(e) => {
                                    const onlyNums = e.target.value.replace(
                                      /[^0-9]/g,
                                      ""
                                    );
                                    handleInputChange(
                                      {
                                        target: {
                                          name: "durationMinutes",
                                          value: onlyNums,
                                        },
                                      },
                                      sectionIndex
                                    );
                                  }}
                                  placeholder=" "
                                  className={`w-full px-3 py-2 border rounded-md border-[#11193366] peer ${
                                    section.submitted && "opacity-50"
                                  }`}
                                  disabled={section.submitted}
                                />
                                <label
                                  className={`absolute left-2 bg-white px-1 text-gray-500 transition-all duration-200
                                  ${
                                    section.durationMinutes
                                      ? "text-xs -top-2"
                                      : "top-2 text-sm"
                                  }
                                  peer-focus:text-xs peer-focus:-top-2 peer-focus:text-blue-600 pointer-events-none`}
                                >
                                  Minutes
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium ">
                            Marks per Question*
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="markAllotment"
                            min="1"
                            max="100"
                            value={
                              section.markAllotment === ""
                                ? ""
                                : section.markAllotment
                            }
                            onChange={(e) => {
                              const onlyNums = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              );
                              handleInputChange(
                                {
                                  target: {
                                    name: "markAllotment",
                                    value: onlyNums,
                                  },
                                },
                                sectionIndex
                              );
                            }}
                            placeholder="Enter Marks"
                            className={`w-full px-3 py-2 border rounded-md border-[#11193366] mt-2 ${
                              section.submitted && "opacity-50"
                            }`}
                            disabled={section.submitted}
                          />
                        </div>
                      </div>
                    </div>

                    {visibleSections.includes(sectionIndex) &&
                      section.selectedQuestions.length > 0 && (
                        <div className="mt-4 overflow-x-auto">
                          <h3 className="text-md font-semibold text-[#111933] mb-2">
                            Questions:
                          </h3>
                          <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                              <tr>
                                <th className="py-2 px-4 border-b text-left">
                                  Question
                                </th>
                                {!section.submitted && (
                                  <th className="md:w-1/5 py-2 px-4 border-b text-center">
                                    Actions
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {section.selectedQuestions.map(
                                (question, qIndex) => (
                                  <tr key={qIndex}>
                                    <td className="py-2 px-4 border-b truncate max-w-0">
                                      {question.question}
                                    </td>
                                    {!section.submitted && (
                                      <td className="py-2 px-4 border-b whitespace-nowrap text-center">
                                        <button
                                          onClick={() =>
                                            handleEditQuestion(
                                              sectionIndex,
                                              qIndex
                                            )
                                          }
                                          className="text-blue-500 mr-2"
                                          disabled={section.submitted}
                                          title="Edit Question"
                                        >
                                          <FiEdit className="text-xl text-[#111933]" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleRemoveQuestion(
                                              sectionIndex,
                                              qIndex
                                            )
                                          }
                                          className="text-red-500"
                                          disabled={section.submitted}
                                          title="Delete Question"
                                        >
                                          <FiTrash className="text-xl" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                    <div className="flex flex-col md:flex-row mt-8 md:mt-14 ml-0 md:ml-12 mr-0 md:mr-8 mb-6 gap-4 md:gap-0">
                      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        {sectionIndex !== sections.length - 1 &&
                          !section.submitted && (
                            <button
                              onClick={() => handleDeleteSection(sectionIndex)}
                              className="border flex items-center justify-center duration-300 border-red-500 text-red-500 bg-red-100 font-semibold px-4 py-2 rounded-md hover:bg-red-600 hover:text-white space-x-2 w-full md:w-auto"
                            >
                              <span>Delete Section</span>
                              <span>
                                <Trash className="w-5 h-5" />
                              </span>
                            </button>
                          )}
                        {section.selectedQuestions.length > 0 && (
                          <button
                            onClick={() =>
                              toggleQuestionsVisibility(sectionIndex)
                            }
                            className="px-4 py-2 bg-[#111933] text-white rounded-md duration-300 hover:bg-[#111933d7] w-full md:w-auto"
                          >
                            {visibleSections.includes(sectionIndex)
                              ? `Hide Questions (${section.selectedQuestions.length})`
                              : `Show Questions (${section.selectedQuestions.length})`}
                          </button>
                        )}
                      </div>
                      <div className="ml-0 md:ml-auto flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        {!section.submitted && (
                          <button
                            onClick={() => handleAddQuestion(sectionIndex)}
                            className="px-4 py-2 flex border items-center justify-center border-gray-300 duration-300 rounded-md hover:bg-gray-50 w-full md:w-auto"
                          >
                            Add Questions{" "}
                            <FaPlusCircle className="w-5 h-4 ml-2" />
                          </button>
                        )}
                        <button
                          onClick={() => handleSaveQuestions(sectionIndex)}
                          className={`px-4 py-2 flex items-center justify-center bg-[#111933] text-white rounded-md hover:bg-[#2a3958] w-full md:w-auto ${
                            section.submitted
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          }`}
                          disabled={section.submitted}
                        >
                          Submit <ChevronRight className="w-5 h-4 ml-2" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {sections.length > 0 && (
                  <div className="flex justify-end mt-6 mr-0 md:mr-14 px-4 md:px-0 relative">
                    <button
                      onClick={() => setPublishDialogOpen(true)}
                      className={`px-4 py-2 w-full md:w-auto ${
                        sections.length >= 2 &&
                        sections.every((section) => section.submitted)
                          ? "bg-[#111933] hover:bg-[#2a3958]"
                          : "bg-gray-400 cursor-not-allowed"
                      } text-white rounded-md relative group`}
                      disabled={
                        sections.length < 2 ||
                        !sections.every((section) => section.submitted)
                      }
                    >
                      Publish
                      {(sections.length < 2 ||
                        !sections.every((section) => section.submitted)) && (
                        <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                          {sections.length < 2
                            ? "Add at least 2 sections to publish"
                            : "Submit all sections to publish"}
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Breadcrumb */}
                <div className="hidden  sm:flex gap-2 items-center ml-6 text-sm text-[#111933]">
                  <div
                    className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100"
                    onClick={() => navigate("/staffdashboard")}
                  >
                    Home
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="flex items-center -space-x-2">
                      <ChevronRight size={15} />
                      <ChevronRight size={15} />
                    </span>
                  </div>
                  <div
                    className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100"
                    onClick={() => navigate("/mcq/details")}
                  >
                    Assessment Overview
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="flex items-center -space-x-2">
                      <ChevronRight size={15} />
                      <ChevronRight size={15} />
                    </span>
                  </div>
                  <div
                    className="cursor-pointer opacity-60 hover:scale-102 transition-all duration-100"
                    onClick={() => {
                      localStorage.setItem("mcqAssessmentInitialStep", "2");
                      navigate("/mcq/details");
                    }}
                  >
                    Test Configuration
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="flex items-center -space-x-2">
                      <ChevronRight size={15} />
                      <ChevronRight size={15} />
                    </span>
                  </div>
                  <div>Add Questions</div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mt-4 sm:mt-5 md:ml-6">
                  <h3 className="text-xl sm:text-2xl text-[#131b35] font-bold mb-2 text-left">
                    Add and manage your questions
                  </h3>
                  <p className="text-xs sm:text-sm text-[#111933] mb-4 sm:mb-6 text-left">
                    Choose how you'd like to add questions to your assessment.
                    Select the method that works best for you to quickly build
                    your test.
                  </p>
                  <hr className="mb-4 sm:mb-6 border-gray-200" />
                  <div className="flex justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl">
                      <div className="bg-white border rounded-lg shadow-lg overflow-hidden">
                        <button
                          onClick={() => navigate("/mcq/CreateQuestion")}
                          className="p-6 sm:p-10 flex flex-col items-center w-full h-full"
                        >
                          <img
                            src={CreateManuallyIcon || "/placeholder.svg"}
                            alt="Create Manually"
                            className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4"
                          />
                          <h3 className="text-lg sm:text-xl font-semibold text-[#111933] mb-1 sm:mb-2">
                            Create Manually
                          </h3>
                          <p className="text-xs sm:text-sm text-[#111933] text-center">
                            Enter each question and its options directly.
                          </p>
                        </button>
                      </div>

                      <div className="bg-white border rounded-lg shadow-lg overflow-hidden">
                        <button
                          onClick={() => navigate("/mcq/bulkUpload")}
                          className="p-6 sm:p-10 flex flex-col items-center w-full h-full"
                        >
                          <img
                            src={BulkUploadIcon || "/placeholder.png"}
                            alt="Bulk Upload"
                            className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4"
                          />
                          <h3 className="text-lg sm:text-xl font-semibold text-[#111933] mb-1 sm:mb-2">
                            Bulk Upload
                          </h3>
                          <p className="text-xs sm:text-sm text-[#111933] text-center">
                            Upload questions via CSV or Excel file.
                          </p>
                        </button>
                      </div>

                      <div className="bg-white border rounded-lg shadow-lg overflow-hidden">
                        <button
                          onClick={() => setIsLibraryModalOpen(true)}
                          className="p-6 sm:p-10 flex flex-col items-center w-full h-full"
                        >
                          <img
                            src={QuestionLibraryIcon || "/placeholder.png"}
                            alt="Question Library"
                            className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4"
                          />
                          <h3 className="text-lg sm:text-xl font-semibold text-[#111933] mb-1 sm:mb-2">
                            Library
                          </h3>
                          <p className="text-xs sm:text-sm text-[#111933] text-center">
                            Choose from your saved question library.
                          </p>
                        </button>
                      </div>

                      <div className="bg-white border rounded-lg shadow-lg overflow-hidden">
                        <button
                          onClick={() => navigate("/mcq/aigenerator")}
                          className="p-6 sm:p-10 flex flex-col items-center w-full h-full"
                        >
                          <img
                            src={AIGeneratorIcon || "/placeholder.svg"}
                            alt="AI Generator"
                            className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4"
                          />
                          <h3 className="text-lg sm:text-xl font-semibold text-[#111933] mb-1 sm:mb-2">
                            AI Generator
                          </h3>
                          <p className="text-xs sm:text-sm text-[#111933] text-center">
                            Generate questions using AI.
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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

      {isModalOpen && (
        <QuestionModal
          onClose={handleModalClose}
          handleCreateManually={() =>
            handleOptionSelect("createManually", activeSectionIndex)
          }
          handleBulkUpload={() =>
            handleOptionSelect("bulkUpload", activeSectionIndex)
          }
          handleMcqlibrary={() =>
            handleOptionSelect("library", activeSectionIndex)
          }
          handleAi={() => handleOptionSelect("ai", activeSectionIndex)}
          handleQuestionLibrary={() =>
            handleOptionSelect("questionLibrary", activeSectionIndex)
          }
          handleTestLibrary={() =>
            handleOptionSelect("testLibrary", activeSectionIndex)
          }
        />
      )}

      {activeComponent === "bulkUpload" && (
        <ImportModal
          isModalOpen={true}
          setIsModalOpen={(value) =>
            setActiveComponent(value ? "bulkUpload" : null)
          }
          handleBulkUpload={handleFileUpload}
          uploadStatus={uploadStatus}
        />
      )}

      {/* {activeComponent === "questionLibrary" && (
      <Modal isOpen={true} onClose={() => setActiveComponent(null)}>
        <McqLibrary
          onClose={() => setActiveComponent(null)}
          onQuestionsSelected={(selected) => {
            const updatedSections = sections.map((section, index) =>
              index === activeSectionIndex
                ? { ...section, selectedQuestions: [...section.selectedQuestions, ...selected] }
                : section,
            );
            setSections(updatedSections);
            setActiveComponent(null);
          }}
        />
      </Modal>
    )}

    {activeComponent === "testLibrary" && (
      <Modal isOpen={true} onClose={() => setActiveComponent(null)}>
        <SelectTestQuestion
          onClose={() => setActiveComponent(null)}
          onQuestionsSelected={(selected) => {
            const updatedSections = sections.map((section, index) =>
              index === activeSectionIndex
                ? { ...section, selectedQuestions: [...section.selectedQuestions, ...selected] }
                : section,
            );
            setSections(updatedSections);
            setActiveComponent(null);
          }}
        />
      </Modal>
    )} */}

      {activeComponent === "createManually" && (
        <Modal isOpen={true} onClose={() => setActiveComponent(null)}>
          <ManualUpload
            onClose={() => setActiveComponent(null)}
            onQuestionAdded={handleQuestionAdded}
          />
        </Modal>
      )}

      {/* {activeComponent === "ai" && (
      <Modal isOpen={true} onClose={() => setActiveComponent(null)}>
        <AIGenerateModal
          isOpen={true}
          onClose={() => setActiveComponent(null)}
          onQuestionsGenerated={handleQuestionsGenerated}
        />
      </Modal>
    )} */}

      <PublishDialog
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        handlePublish={handlePublish}
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

      <ShareModal
        open={shareModalOpen}
        onClose={handleShareModalClose}
        shareLink={sharingLink}
      />

      {isLibraryModalOpen && <LibraryModal onClose={handleLibraryModalClose} />}

      {isPanelOpen && editingQuestion && (
        <EditQuestionPanel
          question={editingQuestion.question}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}
      <ConfirmModal
        isConfirmModalOpen={isConfirmModalOpen}
        setIsConfirmModalOpen={setIsConfirmModalOpen}
        targetPath="/staffdashboard"
      />
    </div>
  );
};

const EditQuestionPanel = ({ question, onSave, onCancel }) => {
  const [editedQuestion, setEditedQuestion] = useState({
    question: question.question || "",
    options: question.options || [],
    correctAnswer: question.correctAnswer || "",
    level: question.level || "Easy",
    tags: question.tags
      ? Array.isArray(question.tags)
        ? question.tags
        : [question.tags]
      : [],
    blooms: question.blooms || "",
  });

  const [originalQuestion, setOriginalQuestion] = useState({ ...question });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Update the original question whenever the question prop changes
    setOriginalQuestion({ ...question });
    setEditedQuestion({
      question: question.question || "",
      options: question.options || [],
      correctAnswer: question.correctAnswer || "",
      level: question.level || "Easy",
      tags: question.tags
        ? Array.isArray(question.tags)
          ? question.tags
          : [question.tags]
        : [],
      blooms: question.blooms || "",
    });
  }, [question]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedQuestion((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...editedQuestion.options];
    newOptions[index] = value;
    setEditedQuestion((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const handleSave = () => {
    if (!editedQuestion.question.trim()) {
      setError("Question cannot be empty.");
      return;
    }
    if (
      editedQuestion.options.length === 0 ||
      editedQuestion.options.some((option) => !option.trim())
    ) {
      setError("Options cannot be empty.");
      return;
    }
    onSave(editedQuestion);
    setIsEditing(false); // Switch back to preview mode after saving
  };

  const handleCancelEdit = () => {
    // Restore the original question data and exit editing mode
    setEditedQuestion({ ...originalQuestion });
    setIsEditing(false);
  };

  const addOption = () => {
    if (editedQuestion.options.length >= 4) {
      toast.error("You can have a maximum of 4 options.");
      return;
    }

    const newOptions = [...editedQuestion.options, ""];
    setEditedQuestion((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const handleRemoveOption = (index) => {
    if (editedQuestion.options.length <= 2) {
      toast.error("You must have at least 2 options.");
      return;
    }

    const newOptions = [...editedQuestion.options];
    const removedOption = newOptions.splice(index, 1)[0];

    setEditedQuestion((prev) => ({
      ...prev,
      options: newOptions,
      correctAnswer: removedOption === prev.correctAnswer ? "" : prev.correctAnswer,
    }));
  };

  const bloomsLevels = [
    "L1 - Remember",
    "L2 - Understanding",
    "L3 - Apply",
    "L4 - Analyze",
    "L5 - Evaluate",
    "L6 - Create",
  ];

  const toCamelCase = (str) => {
    return str.replace(/(^|\s)\S/g, (t) => t.toUpperCase());
  };

  const tagsArray = Array.isArray(editedQuestion.tags)
    ? editedQuestion.tags
    : editedQuestion.tags
    ? [editedQuestion.tags]
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-[60]">
      <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#111933]">Edit Question</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <IoClose className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#111933] mb-1">
              Question*
            </label>
            <textarea
              value={editedQuestion.question}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              rows={3}
              placeholder="Enter question text"
              required
            />
            <div className="text-xs text-right text-gray-500 mt-1">
              {editedQuestion.question.length}/150 words
            </div>
          </div>
          <div className="flex w-full">
            <div className="w-1/2 pr-2">
              <label className="block text-sm font-medium text-[#111933] mb-1">
                Level*
              </label>
              <select
                value={editedQuestion.level}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="w-1/2 pl-2">
              <label className="block text-sm font-medium text-[#111933] mb-1">
                Bloom's Taxonomy Level*
              </label>
              <select
                value={editedQuestion.blooms}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                {bloomsLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111933] mb-1">
              Tags*
            </label>
            <input
              type="text"
              value={tagsArray.join(", ")}
              onChange={(e) =>
                setEditedQuestion((prev) => ({
                  ...prev,
                  tags: e.target.value.split(",").map((tag) => tag.trim()),
                }))
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="Add tags..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111933] mb-1">
              Options*
            </label>
            <div className="space-y-3">
              {editedQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={editedQuestion.correctAnswer === option}
                    onChange={() =>
                      setEditedQuestion((prev) => ({
                        ...prev,
                        correctAnswer: option,
                      }))
                    }
                    className="mr-2 h-4 w-4 accent-[#111933]"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                    disabled={editedQuestion.options.length <= 2}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {editedQuestion.options.length < 4 && (
              <button
                onClick={addOption}
                className="mt-2 text-[#111933] bg-white border border-[#111933] px-4 py-2 rounded-lg transition"
              >
                Add Option
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#111933] text-white rounded-md hover:bg-opacity-90 text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Mcq_CombinedDashboard;
