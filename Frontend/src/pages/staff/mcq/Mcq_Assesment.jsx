import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import ConfirmModal from "../../../components/staff/mcq/ConfirmModal"; // Import the ConfirmModal component
import bg from "../../../assets/bgpattern.svg";

const McqAssessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentDateTime = new Date();

  // Get step from URL query parameters
  const urlParams = new URLSearchParams(location.search);
  const stepParam = urlParams.get("step");

  // Add 5 minutes to current time
  currentDateTime.setMinutes(currentDateTime.getMinutes() + 5);
  const currentDateTimeFormatted = `${currentDateTime.getFullYear()}-${(
    currentDateTime.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${currentDateTime
      .getDate()
      .toString()
      .padStart(2, "0")}T${currentDateTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${currentDateTime
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

  const [currentStep, setCurrentStep] = useState(
    stepParam ? parseInt(stepParam, 10) : 1
  );
  const [contestId, setContestId] = useState(null);
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [formData, setFormData] = useState({
    assessmentOverview: {
      name: "",
      description: "",
      registrationStart: currentDateTimeFormatted,
      registrationEnd: "",
      guidelines: `1. Students must join 15 minutes before the test starts.
2. Ensure a stable internet connection during the test.
3. Use only approved devices to attempt the test.
4. Maintain silence and avoid distractions.`,
      sectionDetails: "No",
      timingType: "Overall", // Default timing type
    },
    testConfiguration: {
      totalMarks: "",
      questions: "",
      duration: { hours: "", minutes: "" },
      fullScreenMode: false,
      faceDetection: false,
      deviceRestriction: false,
      noiseDetection: false,
      passPercentage: "",
      shuffleQuestions: false,
      shuffleOptions: false,
      resultVisibility: "",
      sectionDetails: "",
      generateCertificate: false, // New field for certificate generation
    },
  });

  const [errors, setErrors] = useState({});
  const [initialFormData, setInitialFormData] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // State for modal

  useEffect(() => {
    // Load form data from session storage on component mount
    const savedFormData = sessionStorage.getItem("mcqAssessmentFormData");
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      setFormData(parsedData);
      setInitialFormData(parsedData); // Store initial data for comparison
    }
  }, []);

  const hasFormChanged = () => {
    if (!initialFormData) return true; // If no initial data, consider it changed
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  };

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 1) {
      const {
        name,
        description,
        registrationStart,
        registrationEnd,
        guidelines,
      } = formData.assessmentOverview;
      if (!name) newErrors.name = true;
      if (!description) newErrors.description = true;
      if (!registrationEnd) newErrors.registrationEnd = true;
      if (!guidelines) newErrors.guidelines = true;
      // Removed required validation for sectionDetails and timingType
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (currentStep === 2) {
      const {
        totalMarks,
        questions,
        duration,
        passPercentage,
        resultVisibility,
      } = formData.testConfiguration;
      const { registrationStart, registrationEnd } =
        formData.assessmentOverview;

      const totalDuration = calculateTotalDuration(
        duration.hours,
        duration.minutes
      );
      const startDate = new Date(registrationStart);
      const endDate = new Date(registrationEnd);
      const timeDifference = (endDate - startDate) / (1000 * 60);

      if (formData.assessmentOverview.sectionDetails === "Yes") {
        if (!passPercentage) newErrors.passPercentage = true;
        if (!resultVisibility) newErrors.resultVisibility = true;
        if (totalDuration > timeDifference) newErrors.duration = true;
      } else {
        if (!totalMarks) newErrors.totalMarks = true;
        if (!questions) newErrors.questions = true;
        if (!duration.hours && !duration.minutes) newErrors.duration = true;
        if (!passPercentage) newErrors.passPercentage = true;
        if (!resultVisibility) newErrors.resultVisibility = true;
        if (totalDuration > timeDifference) newErrors.duration = true;
      }

      // Validate full screen restrictions
      if (
        formData.testConfiguration.fullScreenMode &&
        !formData.testConfiguration.fullScreenModeCount
      ) {
        newErrors.fullScreenModeCount = true;
      }
      if (
        formData.testConfiguration.faceDetection &&
        !formData.testConfiguration.faceDetectionCount
      ) {
        newErrors.faceDetectionCount = true;
      }
      if (
        formData.testConfiguration.noiseDetection &&
        !formData.testConfiguration.noiseDetectionCount
      ) {
        newErrors.noiseDetectionCount = true;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    return true;
  };

  const calculateTotalDuration = (hours, minutes) => {
    return Number.parseInt(hours) * 60 + Number.parseInt(minutes);
  };

  const handleInputChange = (e, step) => {
    const { name, type, checked } = e.target;

    // Create updated form data first
    const updatedFormData = { ...formData };

    // Update the form data
    updatedFormData[step] = {
      ...updatedFormData[step],
      [name]: type === "checkbox" ? checked : e.target.value,
    };

    // Handle adding or removing fullScreenModeCount
    if (name === "fullScreenMode") {
      if (checked) {
        updatedFormData[step].fullScreenModeCount = "1";
      } else {
        updatedFormData[step].fullScreenModeCount = "";
      }
    }

    // Handle faceDetection toggle
    if (name === "faceDetection") {
      if (checked) {
        updatedFormData[step].faceDetectionCount = "1";
      } else {
        updatedFormData[step].faceDetectionCount = "";
      }
    }

    // Handle noiseDetection toggle
    if (name === "noiseDetection") {
      if (checked) {
        updatedFormData[step].noiseDetectionCount = "1";
      } else {
        updatedFormData[step].noiseDetectionCount = "";
      }
    }

    // Update state
    setFormData(updatedFormData);

    // Save the updated form data to session storage immediately
    sessionStorage.setItem(
      "mcqAssessmentFormData",
      JSON.stringify(updatedFormData)
    );
  };

  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken"))
    ?.split("=")[1];

  // Replace the handleChange function with this updated version
  const handleChange = (e, step) => {
    const { name, value, type, checked } = e.target;

    // Create updated form data first
    const updatedFormData = { ...formData };

    if (name === "duration") {
      // Ensure hours do not exceed 23 and minutes do not exceed 59
      const hours = Math.min(
        23,
        Math.max(0, Number.parseInt(value.hours) || 0)
      );
      const minutes = Math.min(
        59,
        Math.max(0, Number.parseInt(value.minutes) || 0)
      );
      updatedFormData[step] = {
        ...updatedFormData[step],
        duration: { hours, minutes },
      };
    } else if (type === "checkbox") {
      updatedFormData[step] = {
        ...updatedFormData[step],
        [name]: checked,
      };
    } else {
      if (name === "passPercentage") {
        // Ensure pass percentage does not exceed 100
        updatedFormData[step] = {
          ...updatedFormData[step],
          [name]: Math.min(100, Math.max(0, Number.parseInt(value) || 0)),
        };
      } else {
        updatedFormData[step] = {
          ...updatedFormData[step],
          [name]: value,
        };
      }
    }

    // Handle the special case for shuffleType
    if (name === "shuffleType") {
      updatedFormData.testConfiguration.shuffleQuestions =
        value === "questions" || value === "both";
      updatedFormData.testConfiguration.shuffleOptions =
        value === "options" || value === "both";
    }

    // Update state
    setFormData(updatedFormData);

    // Save the updated form data to session storage immediately
    sessionStorage.setItem(
      "mcqAssessmentFormData",
      JSON.stringify(updatedFormData)
    );

    // Save the assessmentOverview data to session storage if timingType changes
    if (name === "timingType") {
      sessionStorage.setItem(
        "assessmentOverview",
        JSON.stringify(updatedFormData.assessmentOverview)
      );
    }

    // Clear the error for the specific field when the user starts typing
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      const { registrationStart, registrationEnd } =
        formData.assessmentOverview;
      const startDate = new Date(registrationStart);
      const endDate = new Date(registrationEnd);
      const now = new Date();

      if (startDate < now) {
        toast.warning("Assessment start time cannot be in the past.");
        return;
      }

      if (endDate <= startDate) {
        toast.warning("Assessment end time must be greater than start time.");
        return;
      }
    }

    if (currentStep === 2) {
      const { duration } = formData.testConfiguration;
      const { registrationStart, registrationEnd } =
        formData.assessmentOverview;

      const totalDuration = calculateTotalDuration(
        duration.hours,
        duration.minutes
      );
      const startDate = new Date(registrationStart);
      const endDate = new Date(registrationEnd);
      const timeDifference = (endDate - startDate) / (1000 * 60);

      if (totalDuration > timeDifference) {
        toast.warning(
          "Duration is greater than the time difference between assessment start and end times."
        );
        return;
      }
    }

    if (validateStep()) {
      if (currentStep === 2) {
        const generatedContestId = Math.random().toString(36).substr(2, 9);
        setContestId(generatedContestId);
        try {
          // Only save if there are actual changes
          if (hasFormChanged()) {
            if (formData.testConfiguration.sectionDetails === "Yes") {
              await saveSectionDataToMongoDB(generatedContestId);
            } else {
              await saveDataToMongoDB(generatedContestId);
            }
          }

          const response = await axios.post(
            `${API_BASE_URL}/api/mcq/start-contest/`,
            { contestId: generatedContestId },
            {
              headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
              },
            }
          );
          const token = response.data.token;
          localStorage.setItem("contestToken", token);
          localStorage.setItem(
            "totalMarks",
            formData.testConfiguration.totalMarks
          );
          localStorage.setItem(
            "duration",
            JSON.stringify(formData.testConfiguration.duration)
          );
          localStorage.setItem(
            "passPercentage",
            formData.testConfiguration.passPercentage
          );
          localStorage.setItem(
            "totalQuestions",
            formData.testConfiguration.questions
          );

          // Only clear session storage after successful navigation
          navigate(
            "/mcq/combinedDashboard",
            {
              state: {
                formData,
                sectionDetails: formData.testConfiguration.sectionDetails,
              },
            },
            () => {
              // Clear session storage after successful navigation
              sessionStorage.removeItem("mcqAssessmentFormData");
            }
          );

          toast.success("Contest started successfully!");
        } catch (error) {
          console.error("Error starting contest:", {
            message: error.message,
            data: error.response?.data,
            status: error.response?.status,
          });
          toast.error("Failed to start the contest. Please try again.");
        }
        return;
      }
      if (currentStep < steps.length) {
        setCurrentStep((prev) => prev + 1);
      }
    } else {
      toast.warning("Please fill in all required fields before proceeding.");
    }
  };

  const previousStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const saveDataToMongoDB = async (contestId) => {
    const payload = {
      contestId,
      assessmentOverview: formData.assessmentOverview,
      testConfiguration: {
        ...formData.testConfiguration,
        duration: {
          hours: formData.testConfiguration.duration.hours || 0,
          minutes: formData.testConfiguration.duration.minutes || 0,
        },
      },
    };

    delete payload.testConfiguration.shuffleType;

    try {
      const response = await fetch(`${API_BASE_URL}/api/mcq/save-data/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (response.ok) {
        console.log("Data saved successfully with Contest ID:", contestId);
      } else {
        console.error("Failed to save data");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const saveSectionDataToMongoDB = async (contestId) => {
    const payload = {
      contestId,
      assessmentOverview: formData.assessmentOverview,
      testConfiguration: {
        ...formData.testConfiguration,
        duration: {
          hours: formData.testConfiguration.duration.hours || 0,
          minutes: formData.testConfiguration.duration.minutes || 0,
        },
      },
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/mcq/save-section-data/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        }
      );

      if (response.ok) {
        console.log(
          "Section data saved successfully with Contest ID:",
          contestId
        );
      } else {
        console.error("Failed to save section data");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const steps = [
    "Assessment Overview",
    "Test Configuration",
    "Structure Setup",
  ];

  return (
    <div className="h-screen overflow-auto px-4 py-10 pt-24 md:px-16" style={{
      backgroundColor: "#ecf2fe",
      backgroundImage: `url(${bg})`,
      backgroundSize: "cover",
      backgroundPosition: "top",
    }}>
      <div className="w-full h-full">
        <div className="h-14 py-4">
          <div className="flex items-center gap-2 text-[#111933] text-sm">
            <span
              className={`${currentStep >= 1
                ? " opacity-60 hover:scale-102 transition-all duration-100"
                : ""
                } cursor-pointer`}
              onClick={() => setIsConfirmModalOpen(true)}
            >
              Home
            </span>
            <span className="flex items-center -space-x-2">
              <ChevronRight size={15} />
              <ChevronRight size={15} />
            </span>
            <span
              className={`${currentStep === 2
                ? "opacity-60 hover:scale-102 transition-all duration-100"
                : ""
                } cursor-pointer`}
              onClick={() => setCurrentStep(1)}
            >
              Assessment Overview
            </span>
            {currentStep === 2 && (
              <>
                <span className="flex items-center -space-x-2">
                  <ChevronRight size={15} />
                  <ChevronRight size={15} />
                </span>
                <span>Test Configuration</span>
              </>
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-white rounded-md md:p-3 lg:px-10 mt-2 overflow-auto">
            {currentStep === 1 && (
              <div className="mb-2 min-h-[70vh] flex flex-col justify-center">
                <h2 className="text-2xl font-bold mb-2 text-left text-[#111933]">
                  Assessment Overview
                </h2>
                <p className="text-sm font-normal mb-4 text-left text-[#111933]">
                  This section captures essential information about the test.
                  Ensure clarity and completeness.
                </p>
                <hr className="mb-6 border-gray-200" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-28 px-5">
                  <div className="space-y-6">
                    <div>
                      <label className="text-md font-semibold text-[#111933] mb-2 flex ">
                        Assessment Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="name"
                          maxLength="30"
                          value={formData.assessmentOverview.name}
                          onChange={(e) =>
                            handleChange(e, "assessmentOverview")
                          }
                          className={`block w-full h-12 py-2 px-4 bg-white border rounded-md ${errors.name ? "border-red-500" : ""
                            }`}
                          placeholder="Enter the assessment name"
                          title="Enter the name of the assessment"
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          {formData.assessmentOverview.name.length}/30
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-md font-semibold text-[#111933] mb-2 flex items-center">
                        Assessment Start *
                      </label>

                      <div className="relative">
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DateTimePicker
                            value={
                              formData.assessmentOverview.registrationStart
                                ? dayjs(
                                  formData.assessmentOverview
                                    .registrationStart
                                )
                                : dayjs(currentDateTimeFormatted)
                            }
                            onChange={(newValue) => {
                              if (newValue) {
                                const formattedDate =
                                  newValue.format("YYYY-MM-DDTHH:mm");
                                handleChange(
                                  {
                                    target: {
                                      name: "registrationStart",
                                      value: formattedDate,
                                    },
                                  },
                                  "assessmentOverview"
                                );
                              }
                            }}
                            disablePast
                            ampm
                            className="block w-full"
                            slotProps={{
                              textField: {
                                className: `block w-full h-12 py-2 px-4 bg-white border rounded-md ${errors.registrationStart
                                  ? "border-red-500"
                                  : ""
                                  }`,
                                title:
                                  "Select the start date and time for the assessment",
                              },
                            }}
                          />
                        </LocalizationProvider>
                      </div>
                    </div>
                    <div>
                      <label className="text-md font-semibold text-[#111933] mb-2 flex items-center">
                        Assessment End *
                      </label>

                      <div className="relative">
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DateTimePicker
                            value={
                              formData.assessmentOverview.registrationEnd
                                ? dayjs(
                                  formData.assessmentOverview.registrationEnd
                                )
                                : null
                            }
                            minDateTime={
                              formData.assessmentOverview.registrationStart
                                ? dayjs(
                                  formData.assessmentOverview
                                    .registrationStart
                                )
                                : dayjs(currentDateTimeFormatted)
                            }
                            onChange={(newValue) => {
                              if (newValue) {
                                const formattedDate =
                                  newValue.format("YYYY-MM-DDTHH:mm");
                                const startDateTime = dayjs(
                                  formData.assessmentOverview
                                    .registrationStart ||
                                  currentDateTimeFormatted
                                );
                                if (newValue.isAfter(startDateTime)) {
                                  handleChange(
                                    {
                                      target: {
                                        name: "registrationEnd",
                                        value: formattedDate,
                                      },
                                    },
                                    "assessmentOverview"
                                  );
                                } else {
                                  toast.warning(
                                    "End date cannot be before the start date"
                                  );
                                }
                              }
                            }}
                            disablePast
                            ampm
                            className="block w-full"
                            slotProps={{
                              textField: {
                                className: `block w-full h-12 py-2 px-4 bg-white border rounded-md ${errors.registrationEnd ? "border-red-500" : ""
                                  }`,
                                title:
                                  "Select the end date and time for the assessment",
                              },
                            }}
                          />
                        </LocalizationProvider>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-md font-semibold text-[#111933] block">
                        Is the assessment Section Based? *
                      </label>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.assessmentOverview.sectionDetails === "Yes"}
                          onChange={(e) =>
                            handleChange(
                              {
                                target: {
                                  name: "sectionDetails",
                                  value: e.target.checked ? "Yes" : "No",
                                },
                              },
                              "assessmentOverview"
                            )
                          }
                          className="sr-only peer"
                        />
                        <div
                          className={`w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${formData.assessmentOverview.sectionDetails === "Yes"
                            ? "bg-[#111933] peer-checked:after:translate-x-full peer-checked:after:border-white"
                            : "bg-gray-300"
                            }`}
                        ></div>
                      </label>
                    </div>

                    {formData.assessmentOverview.sectionDetails === "Yes" && (
                      <div>
                        <div className="flex mb-2 items-center justify-start gap-x-3">
                          {/* Radio Button for Overall */}
                          <label className="flex items-center cursor-pointer gap-x-2">
                            <input
                              type="radio"
                              name="timingType"
                              value="Overall"
                              checked={formData.assessmentOverview.timingType === "Overall"}
                              onChange={(e) =>
                                handleChange(
                                  {
                                    target: {
                                      name: "timingType",
                                      value: "Overall",
                                    },
                                  },
                                  "assessmentOverview"
                                )
                              }
                              className="h-5 w-5 text-[#111933] border-gray-300 focus:ring-[#111933] accent-[#111933]"
                            />
                            <span
                              className={`text-md text-gray-400 px-2 py-1 rounded-md duration-300`}
                            >
                              Overall Timing
                            </span>
                          </label>

                          {/* Radio Button for Section Based */}
                          <label className="flex items-center cursor-pointer gap-x-2">
                            <input
                              type="radio"
                              name="timingType"
                              value="Section"
                              checked={formData.assessmentOverview.timingType === "Section"}
                              onChange={(e) =>
                                handleChange(
                                  {
                                    target: {
                                      name: "timingType",
                                      value: "Section",
                                    },
                                  },
                                  "assessmentOverview"
                                )
                              }
                              className="h-5 w-5 text-[#111933] border-gray-300 focus:ring-[#111933] accent-[#111933]"
                            />
                            <span
                              className={`text-md text-gray-400 px-2 py-1 rounded-md duration-300`}
                            >
                              Section Based Timing
                            </span>
                          </label>
                        </div>
                        <span className="text-sm text-gray-500 font-normal">
                          (Choose the timing type for the assessment)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-11">
                    <div>
                      <label className="text-md font-semibold text-[#111933] mb-2 flex items-center">
                        Description *
                      </label>
                      <div className="relative">
                        <textarea
                          name="description"
                          value={formData.assessmentOverview.description}
                          onChange={(e) => {
                            let inputText = e.target.value;
                            const words = inputText
                              .split(/\s+/)
                              .filter(Boolean);
                            let processedWords = [];
                            for (
                              let i = 0;
                              i < Math.min(words.length, 30);
                              i++
                            ) {
                              let word = words[i];
                              if (word.length > 25) {
                                word = word.substring(0, 25);
                              }
                              processedWords.push(word);
                            }
                            const processedText = processedWords.join(" ");

                            // If the last character in the original input was a space, preserve it
                            // This allows typing the next word
                            if (
                              inputText.endsWith(" ") &&
                              processedWords.length < 30
                            ) {
                              handleChange(
                                {
                                  target: {
                                    name: "description",
                                    value: processedText + " ",
                                  },
                                },
                                "assessmentOverview"
                              );
                            } else {
                              handleChange(
                                {
                                  target: {
                                    name: "description",
                                    value: processedText,
                                  },
                                },
                                "assessmentOverview"
                              );
                            }
                          }}
                          rows={4}
                          className={`block w-full p-5 rounded-md border ${errors.description ? "border-red-500" : ""
                            } resize-none`}
                          style={{ userSelect: "none", overflowY: "auto" }}
                          placeholder="Provide a brief overview of the assessment (max 30 words)"
                          title="Provide a brief overview of the assessment"
                        />
                        <span className="absolute right-2 bottom-2 text-gray-500 text-sm">
                          {
                            formData.assessmentOverview.description
                              .split(/\s+/)
                              .filter(Boolean).length
                          }
                          /30 words
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-md font-semibold text-[#111933] mb-2 flex items-center">
                        Guidelines and Rules *
                      </label>
                      <textarea
                        name="guidelines"
                        value={formData.assessmentOverview.guidelines}
                        onChange={(e) => {
                          let inputText = e.target.value;
                          const words = inputText
                            .split(/(\s+)/)
                            .filter(Boolean);
                          let processedWords = [];
                          for (
                            let i = 0;
                            i < Math.min(words.length, 200);
                            i++
                          ) {
                            let word = words[i];
                            if (!/\s/.test(word) && word.length > 25) {
                              word = word.substring(0, 25);
                            }
                            processedWords.push(word);
                          }
                          const processedText = processedWords.join("");
                          handleChange(
                            {
                              target: {
                                name: "guidelines",
                                value: processedText,
                              },
                            },
                            "assessmentOverview"
                          );
                        }}
                        rows={4}
                        className={`block w-full p-4 rounded-md border ${errors.guidelines ? "border-red-500" : ""
                          } resize-none`}
                        style={{ userSelect: "none", overflowY: "auto" }}
                        title="Provide guidelines and rules for the assessment"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex-1"></div>
                      {currentStep < 3 && (
                        <button
                          onClick={nextStep}
                          className="pl-3 pr-2 py-1 gap-1 bg-[#111933] text-white rounded-md flex items-center"
                          title="Go to the next step"
                        >
                          Next <ChevronRight size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {currentStep === 2 && (
              <div className="min-h-[70vh] flex flex-col justify-center">
                <h2 className="text-2xl font-bold mb-2 text-left text-[#111933]">
                  Test Configuration
                </h2>
                <p className="text-sm font-normal mb-4 text-left text-[#111933]">
                  This section captures essential information about the test.
                  Ensure clarity and completeness.
                </p>
                <hr className="my-6 border-gray-200" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-28">
                  <div>
                    {/* Left Side */}
                    {formData.assessmentOverview.sectionDetails === "No" && (
                      <div className="flex-cols-2 items-center mb-4">
                        <label className="text-md py-2 font-semibold text-[#111933] flex-1 flex items-center">
                          Number of Questions *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          name="questions"
                          maxLength={3}
                          value={formData.testConfiguration.questions}
                          onChange={(e) => {
                            const onlyNums = e.target.value.replace(
                              /[^0-9]/g,
                              ""
                            );
                            handleChange(
                              {
                                target: { name: "questions", value: onlyNums },
                              },
                              "testConfiguration"
                            );
                          }}
                          className={`w-full h-12 py-2 px-4 border rounded-md ${errors.questions ? "border-red-500" : ""
                            }`}
                          placeholder="Enter number"
                          required
                          title="Enter the number of questions"
                        />
                      </div>
                    )}
                    {formData.assessmentOverview.timingType === "Overall" && (
                      <div className="flex-cols-2 items-center mb-4">
                        <label className="text-md font-semibold py-2 text-[#111933] flex-1 flex items-center">
                          Duration *
                        </label>
                        <div className="w-full flex items-center space-x-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              name="hours"
                              value={formData.testConfiguration.duration.hours}
                              onChange={(e) => {
                                const onlyNums = e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                );
                                handleChange(
                                  {
                                    target: {
                                      name: "duration",
                                      value: {
                                        hours: onlyNums,
                                        minutes:
                                          formData.testConfiguration.duration
                                            .minutes,
                                      },
                                    },
                                  },
                                  "testConfiguration"
                                );
                              }}
                              className={`w-full h-12 p-2 border rounded-md text-sm text-center bg-transparent ${errors.duration ? "border-red-500" : ""
                                }`}
                              placeholder=""
                              title="Enter the hours for the test duration"
                            />
                            <label
                              className={`absolute text-sm pointer-events-none transition-all duration-300
            ${formData.testConfiguration.duration.hours !== "" ||
                                  document.activeElement?.name === "hours"
                                  ? "top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-1 text-xs bg-white z-10 text-[#111933]"
                                  : "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500"
                                }
          `}
                            >
                              Hours
                            </label>
                          </div>
                          <span className="font-bold">:</span>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              name="minutes"
                              value={
                                formData.testConfiguration.duration.minutes
                              }
                              onChange={(e) => {
                                let onlyNums = e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                );
                                if (Number.parseInt(onlyNums) > 59) {
                                  onlyNums = "59";
                                }
                                handleChange(
                                  {
                                    target: {
                                      name: "duration",
                                      value: {
                                        hours:
                                          formData.testConfiguration.duration
                                            .hours,
                                        minutes: onlyNums,
                                      },
                                    },
                                  },
                                  "testConfiguration"
                                );
                              }}
                              className={`w-full h-12 p-2 border rounded-md text-sm text-center bg-transparent ${errors.duration ? "border-red-500" : ""
                                }`}
                              placeholder=""
                              title="Enter the minutes for the test duration"
                            />
                            <label
                              className={`absolute text-sm pointer-events-none transition-all duration-300
            ${formData.testConfiguration.duration.minutes !== "" ||
                                  document.activeElement?.name === "minutes"
                                  ? "top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-1 text-xs bg-white z-10 text-[#111933]"
                                  : "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500"
                                }
          `}
                            >
                              Minutes
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                    {formData.assessmentOverview.sectionDetails === "No" && (
                      <div className="flex-cols-2 items-center mb-4">
                        <label className="text-md py-2 font-semibold text-[#111933] flex-1 flex items-center">
                          Total Marks *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          name="totalMarks"
                          maxLength={3}
                          value={formData.testConfiguration.totalMarks}
                          onChange={(e) => {
                            const onlyNums = e.target.value.replace(
                              /[^0-9]/g,
                              ""
                            );
                            handleChange(
                              {
                                target: { name: "totalMarks", value: onlyNums },
                              },
                              "testConfiguration"
                            );
                          }}
                          className={`w-full h-12 py-2 px-4 border rounded-md ${errors.totalMarks ? "border-red-500" : ""
                            }`}
                          placeholder="Enter the total marks"
                          required
                          title="Enter the total marks"
                        />
                      </div>
                    )}
                    <div className="flex-cols-2 items-center mb-4">
                      <label className="text-md py-2 font-semibold text-[#111933] flex-1 flex items-center">
                        Pass Percentage *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="passPercentage"
                        maxLength={3}
                        value={formData.testConfiguration.passPercentage}
                        onChange={(e) => {
                          const onlyNums = e.target.value.replace(
                            /[^0-9]/g,
                            ""
                          );
                          handleChange(
                            {
                              target: {
                                name: "passPercentage",
                                value: onlyNums,
                              },
                            },
                            "testConfiguration"
                          );
                        }}
                        className={`w-full h-12 py-2 px-4 border rounded-md ${errors.passPercentage ? "border-red-500" : ""
                          }`}
                        placeholder="Enter the pass percentage"
                        required
                        title="Enter the pass percentage"
                      />
                    </div>

                    {/* Conditionally render Enable Shuffle */}
                    {formData.assessmentOverview.sectionDetails === "Yes" &&
                      formData.assessmentOverview.timingType === "Overall" && (
                        <div className="flex-cols-2 items-center mb-7">
                          <div className="flex justify-between items-center py-2 mt-6">
                            <label className="text-md font-semibold text-[#111933]">
                              Enable Shuffle *
                            </label>
                            <Tooltip title="Manage the result visibility">
                              <Info
                                style={{ width: "14px", height: "14px" }}
                                className="text-[#111933] cursor-pointer"
                              />
                            </Tooltip>
                          </div>
                          <div className="flex space-x-4">
                            <label className="flex items-center ml-2 space-x-3">
                              <input
                                type="radio"
                                name="shuffleType"
                                value="questions"
                                checked={
                                  formData.testConfiguration.shuffleType ===
                                  "questions"
                                }
                                onChange={(e) =>
                                  handleChange(e, "testConfiguration")
                                }
                                className="form-radio text-[#111933] accent-[#111933]"
                              />
                              <span className="text-sm">Questions</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="shuffleType"
                                value="options"
                                checked={
                                  formData.testConfiguration.shuffleType ===
                                  "options"
                                }
                                onChange={(e) =>
                                  handleChange(e, "testConfiguration")
                                }
                                className="form-radio ml-24 text-[#111933] accent-[#111933]"
                              />
                              <span className="text-sm">Options</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="shuffleType"
                                value="both"
                                checked={
                                  formData.testConfiguration.shuffleType ===
                                  "both"
                                }
                                onChange={(e) =>
                                  handleChange(e, "testConfiguration")
                                }
                                className="form-radio ml-24 text-[#111933] accent-[#111933]"
                              />
                              <span className="text-sm">Both</span>
                            </label>
                          </div>
                        </div>
                      )}

                    {/* Conditionally render Result Visibility */}
                    {formData.assessmentOverview.sectionDetails === "Yes" &&
                      formData.assessmentOverview.timingType === "Section" && (
                        <div className="flex-cols-2 items-center mb-8">
                          <div className="flex justify-between items-center py-2 mt-6">
                            <label className="text-md font-semibold text-[#111933]">
                              Result Visibility *
                            </label>
                            <Tooltip title="Manage the result visibility">
                              <Info
                                style={{ width: "14px", height: "14px" }}
                                className="text-[#111933] cursor-pointer"
                              />
                            </Tooltip>
                          </div>
                          <div className="flex space-x-4">
                            <label className="flex items-center space-x-3 ml-2">
                              <input
                                type="radio"
                                name="resultVisibility"
                                value="Host Control"
                                checked={
                                  formData.testConfiguration
                                    .resultVisibility === "Host Control"
                                }
                                onChange={(e) =>
                                  handleChange(e, "testConfiguration")
                                }
                                className="form-radio text-[#111933] accent-[#111933]"
                              />
                              <span className="text-sm">Host Control</span>
                            </label>
                            <label className="flex items-center space-x-2 ">
                              <input
                                type="radio"
                                name="resultVisibility"
                                value="Immediate release"
                                checked={
                                  formData.testConfiguration
                                    .resultVisibility === "Immediate release"
                                }
                                onChange={(e) =>
                                  handleChange(e, "testConfiguration")
                                }
                                className="form-radio ml-[77px] text-[#111933] accent-[#111933]"
                              />
                              <span className="text-sm">Immediate release</span>
                            </label>
                          </div>
                        </div>
                      )}

                    {/* Conditionally render Enable Shuffle */}
                    {formData.assessmentOverview.sectionDetails === "Yes" &&
                      formData.assessmentOverview.timingType === "Section" && (
                        <div className="flex-cols-2 items-center mb-7">
                          <div className="flex justify-between items-center py-2 mt-6">
                            <label className="text-md font-semibold text-[#111933]">
                              Enable Shuffle *
                            </label>
                            <Tooltip title="Manage the result visibility">
                              <Info
                                style={{ width: "14px", height: "14px" }}
                                className="text-[#111933] cursor-pointer"
                              />
                            </Tooltip>
                          </div>
                          <div className="flex space-x-4">
                            <label className="flex items-center ml-2 space-x-3">
                              <input
                                type="radio"
                                name="shuffleType"
                                value="questions"
                                checked={
                                  formData.testConfiguration.shuffleType ===
                                  "questions"
                                }
                                onChange={(e) =>
                                  handleChange(e, "testConfiguration")
                                }
                                className="form-radio text-[#111933] accent-[#111933]"
                              />
                              <span className="text-sm">Questions</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="shuffleType"
                                value="options"
                                checked={
                                  formData.testConfiguration.shuffleType ===
                                  "options"
                                }
                                onChange={(e) =>
                                  handleChange(e, "testConfiguration")
                                }
                                className="form-radio ml-24 text-[#111933] accent-[#111933]"
                              />
                              <span className="text-sm">Options</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="shuffleType"
                                value="both"
                                checked={
                                  formData.testConfiguration.shuffleType ===
                                  "both"
                                }
                                onChange={(e) =>
                                  handleChange(e, "testConfiguration")
                                }
                                className="form-radio ml-24 text-[#111933] accent-[#111933]"
                              />
                              <span className="text-sm">Both</span>
                            </label>
                          </div>
                        </div>
                      )}
                  </div>
                  <div>
                    {/* Right Side */}
                    <div>
                      <Tooltip title="Select the Proctoring Method">
                        <h3 className="text-md py-2 font-semibold text-[#111933] flex-1 flex items-center">
                          Proctoring & Certificate Enablement
                        </h3>
                      </Tooltip>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-14">
                          {[
                            {
                              label: "Full Screen Mode",
                              name: "fullScreenMode",
                            },
                            {
                              label: "Device Restriction",
                              name: "deviceRestriction",
                            },
                          ].map((item) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between border rounded-md h-12 py-2 px-4"
                            >
                              <span className="font-medium text-[#111933] flex items-center">
                                {item.label}
                              </span>
                              <label
                                className="relative inline-flex items-center cursor-pointer"
                                title={`Toggle ${item.label}`}
                              >
                                <input
                                  type="checkbox"
                                  name={item.name}
                                  checked={
                                    formData.testConfiguration[item.name] ||
                                    false
                                  }
                                  onChange={(e) =>
                                    handleInputChange(e, "testConfiguration")
                                  }
                                  className="sr-only peer"
                                />
                                <div
                                  className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${formData.testConfiguration[item.name]
                                    ? "bg-[#111933]"
                                    : "bg-gray-200"
                                    }`}
                                ></div>
                              </label>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col space-y-14">
                          <div className="flex items-center">
                            <div
                              className={`relative w-full border rounded-md transition-all duration-300 ${formData.testConfiguration.fullScreenMode
                                ? "border-[#111933] bg-white shadow-sm"
                                : "border-gray-200 bg-gray-50"
                                }`}
                            >
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                name="fullScreenModeCount"
                                value={
                                  formData.testConfiguration
                                    .fullScreenModeCount || ""
                                }
                                onChange={(e) => {
                                  let value = e.target.value.replace(
                                    /[^0-9]/g,
                                    ""
                                  );
                                  if (value !== "") {
                                    const numValue = parseInt(value, 10);
                                    if (numValue < 1) value = "1";
                                    if (numValue > 100) value = "100";
                                  }
                                  setFormData((prev) => ({
                                    ...prev,
                                    testConfiguration: {
                                      ...prev.testConfiguration,
                                      fullScreenModeCount: value,
                                    },
                                  }));
                                  sessionStorage.setItem(
                                    "mcqAssessmentFormData",
                                    JSON.stringify({
                                      ...formData,
                                      testConfiguration: {
                                        ...formData.testConfiguration,
                                        fullScreenModeCount: value,
                                      },
                                    })
                                  );
                                }}
                                className={`w-full h-12 py-2 px-4 bg-transparent rounded-md transition-all duration-300 focus:outline-none ${errors.fullScreenModeCount
                                  ? "border-red-500"
                                  : formData.testConfiguration.fullScreenMode
                                    ? "text-[#111933]"
                                    : "text-gray-400"
                                  }`}
                                title="Enter the number of restrictions for Full Screen Mode (1-100)"
                                disabled={
                                  !formData.testConfiguration.fullScreenMode
                                }
                                aria-disabled={
                                  !formData.testConfiguration.fullScreenMode
                                }
                              />
                              <label
                                className={`absolute transition-all duration-300 pointer-events-none
    ${formData.testConfiguration.fullScreenModeCount ||
                                    (formData.testConfiguration.fullScreenMode &&
                                      document.activeElement ===
                                      document.querySelector('[name="fullScreenModeCount"]'))
                                    ? "top-0 left-2 transform -translate-y-1/2 px-1 text-xs bg-white"
                                    : "top-1/2 left-3 transform -translate-y-1/2"
                                  }
    ${formData.testConfiguration.fullScreenMode
                                    ? "text-[#111933]"
                                    : "text-gray-400"
                                  }
  `}
                              >
                                Enter the threshold (1-100)
                              </label>

                              {!formData.testConfiguration.fullScreenMode && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <Tooltip title="Toggle fullscreen mode to set threshold">
                                    <Info
                                      style={{ width: "14px", height: "14px" }}
                                      className="text-gray-400"
                                    />
                                  </Tooltip>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between h-12 py-2 px-4 border rounded-md">
                            <Tooltip title="Toggle to generate certificate">
                              <label className="text-md font-semibold text-[#111933] mr-4 items-center">
                                Generate Certificate
                              </label>
                            </Tooltip>
                            <label
                              className="relative inline-flex items-center cursor-pointer"
                              title="Toggle to generate certificate"
                            >
                              <input
                                type="checkbox"
                                name="generateCertificate"
                                checked={
                                  formData.testConfiguration
                                    .generateCertificate || false
                                }
                                onChange={(e) =>
                                  handleInputChange(e, "testConfiguration")
                                }
                                className="sr-only peer"
                              />
                              <div
                                className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#111933] ${formData.testConfiguration.generateCertificate
                                  ? "bg-[#111933]"
                                  : "bg-gray-200"
                                  }`}
                              ></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conditionally render Result Visibility */}
                    {formData.assessmentOverview.timingType === "Overall" && (
                      <div className="flex-cols-2 items-center mb-8">
                        <div className="flex justify-between items-center py-2 mt-6">
                          <label className="text-md font-semibold text-[#111933]">
                            Result Visibility *
                          </label>
                          <Tooltip title="Manage the result visibility">
                            <Info
                              style={{ width: "14px", height: "14px" }}
                              className="text-[#111933] cursor-pointer"
                            />
                          </Tooltip>
                        </div>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-3 ml-2">
                            <input
                              type="radio"
                              name="resultVisibility"
                              value="Host Control"
                              checked={
                                formData.testConfiguration.resultVisibility ===
                                "Host Control"
                              }
                              onChange={(e) =>
                                handleChange(e, "testConfiguration")
                              }
                              className="form-radio text-[#111933] accent-[#111933]"
                            />
                            <span className="text-sm">Host Control</span>
                          </label>
                          <label className="flex items-center space-x-2 ">
                            <input
                              type="radio"
                              name="resultVisibility"
                              value="Immediate release"
                              checked={
                                formData.testConfiguration.resultVisibility ===
                                "Immediate release"
                              }
                              onChange={(e) =>
                                handleChange(e, "testConfiguration")
                              }
                              className="form-radio ml-[77px] text-[#111933] accent-[#111933]"
                            />
                            <span className="text-sm">Immediate release</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Conditionally render Enable Shuffle */}
                    {formData.assessmentOverview.sectionDetails === "No" && (
                      <div className="flex-cols-2 items-center mb-7">
                        <div className="flex justify-between items-center py-2 mt-6">
                          <label className="text-md font-semibold text-[#111933]">
                            Enable Shuffle *
                          </label>
                          <Tooltip title="Manage the result visibility">
                            <Info
                              style={{ width: "14px", height: "14px" }}
                              className="text-[#111933] cursor-pointer"
                            />
                          </Tooltip>
                        </div>
                        <div className="flex space-x-4">
                          <label className="flex items-center ml-2 space-x-3">
                            <input
                              type="radio"
                              name="shuffleType"
                              value="questions"
                              checked={
                                formData.testConfiguration.shuffleType ===
                                "questions"
                              }
                              onChange={(e) =>
                                handleChange(e, "testConfiguration")
                              }
                              className="form-radio text-[#111933] accent-[#111933]"
                            />
                            <span className="text-sm">Questions</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="shuffleType"
                              value="options"
                              checked={
                                formData.testConfiguration.shuffleType ===
                                "options"
                              }
                              onChange={(e) =>
                                handleChange(e, "testConfiguration")
                              }
                              className="form-radio ml-24 text-[#111933] accent-[#111933]"
                            />
                            <span className="text-sm">Options</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="shuffleType"
                              value="both"
                              checked={
                                formData.testConfiguration.shuffleType ===
                                "both"
                              }
                              onChange={(e) =>
                                handleChange(e, "testConfiguration")
                              }
                              className="form-radio ml-24 text-[#111933] accent-[#111933]"
                            />
                            <span className="text-sm">Both</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  {currentStep > 1 && (
                    <button
                      onClick={previousStep}
                      className="pl-2 pr-3 py-1 gap-1 border border-[#111933] text-[#111933] rounded-md flex items-center"
                      title="Go to the previous step"
                    >
                      <ChevronRight size={20} className="rotate-180" />
                      Previous
                    </button>
                  )}
                  {currentStep < 3 && (
                    <button
                      onClick={nextStep}
                      className="bg-[#111933] pl-3 pr-2 py-1 gap-1 text-white rounded-md flex items-center ml-auto"
                      title="Go to the next step"
                    >
                      Next <ChevronRight size={20} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        isConfirmModalOpen={isConfirmModalOpen}
        setIsConfirmModalOpen={setIsConfirmModalOpen}
        targetPath="/staffdashboard"
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default McqAssessment;
