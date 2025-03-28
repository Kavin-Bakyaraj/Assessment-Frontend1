import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import SectionBasedHeader from "../../../components/staff/mcq/SectionBasedHeader";
import SectionBasedQuestion from "../../../components/staff/mcq/SectionBasedQuestion";
import SectionBasedSidebar from "../../../components/staff/mcq/SectionBasedSidebar";
import useDeviceRestriction from "../../../components/staff/mcq/useDeviceRestriction";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import FaceDetectionComponent from "../../../components/staff/mcq/useVideoDetection";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import Swal from "sweetalert2";
import { isMobile, isTablet } from "react-device-detect"; // Make sure to install this package if not already

export default function SectionBasedMcqAssessment() {
  const { contestId } = useParams();
  const studentId = sessionStorage.getItem("studentId");
  const navigate = useNavigate();
  const [timingType, setTimingType] = useState("Section");
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [sections, setSections] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState(() => {
    const storedAnswers = sessionStorage.getItem(
      `selectedAnswers_${contestId}`
    );
    return storedAnswers
      ? JSON.parse(storedAnswers)
      : Array.from({ length: 0 }, () => ({}));
  });
  const [isDeviceRestricted, setIsDeviceRestricted] = useState(false);
  const [submittedSections, setSubmittedSections] = useState(() => {
    const storedSubmitted = sessionStorage.getItem(
      `submittedSections_${contestId}`
    );
    return storedSubmitted
      ? JSON.parse(storedSubmitted)
      : Array(sections.length).fill(false);
  });
  const [reviewStatus, setReviewStatus] = useState(() => {
    const storedReviewStatus = sessionStorage.getItem(
      `reviewStatus_${contestId}`
    );
    return storedReviewStatus
      ? JSON.parse(storedReviewStatus)
      : Array.from({ length: 0 }, () => ({}));
  });
  const studentEmail = localStorage.getItem("studentEmail") || "SNSGROUPS.COM";
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalDuration, setTotalDuration] = useState(0);
  const [sectionRemainingTimes, setSectionRemainingTimes] = useState(() => {
    const storedTimes = sessionStorage.getItem(
      `sectionRemainingTimes_${contestId}`
    );
    return storedTimes
      ? JSON.parse(storedTimes)
      : Array(sections.length).fill(0);
  });
  const currentTest = JSON.parse(localStorage.getItem("currentTest"));
  const [faceDetection, setFaceDetection] = useState(() => {
    const storedFaceDetection = localStorage.getItem(
      `faceDetection_${contestId}`
    );
    return storedFaceDetection === "true";
  });
  const [fullScreenMode, setFullScreenMode] = useState(() => {
    const currentTest = JSON.parse(localStorage.getItem("currentTest"));
    return currentTest?.fullScreenMode === true;
  });
  const [fullscreenWarnings, setFullscreenWarnings] = useState(() => {
    return (
      Number(sessionStorage.getItem(`fullscreenWarnings_${contestId}`)) || 0
    );
  });
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(() => {
    return (
      Number(sessionStorage.getItem(`tabSwitchWarnings_${contestId}`)) || 0
    );
  });

  const [isTestFinished, setIsTestFinished] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [noiseDetectionCount, setNoiseDetectionCount] = useState(0);
  const [showNoiseWarningModal, setShowNoiseWarningModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [expandedSectionIndex, setExpandedSectionIndex] = useState(null);
  const [hasFocus, setHasFocus] = useState(true);
  const lastActiveTime = useRef(Date.now());
  const lastWarningTime = useRef(Date.now());
  const [isFreezePeriodOver, setIsFreezePeriodOver] = useState(false);
  const [faceDetectionWarning, setFaceDetectionWarning] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const disableAutoFullscreen = false;

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    // Check device restriction settings
    const currentTest = JSON.parse(localStorage.getItem("currentTest"));
    const isDeviceRestrictionEnabled = currentTest?.deviceRestriction === true;

    // If restriction is enabled and user is on mobile/tablet
    if (isDeviceRestrictionEnabled && (isMobile || isTablet)) {
      setIsDeviceRestricted(true);

      // Show warning modal that will redirect to dashboard
      Swal.fire({
        icon: "warning",
        title: "Device Restriction",
        text: "This test cannot be taken on a mobile or tablet device. Please use a desktop or laptop computer.",
        confirmButtonText: "Return to Dashboard",
        allowOutsideClick: false,
        allowEscapeKey: false,
        confirmButtonColor: "#111933",
      }).then(() => {
        navigate("/studentdashboard");
      });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const apiUrl = `${API_BASE_URL}/api/mcq/sections/${contestId}/`;
        const response = await axios.get(apiUrl);
        console.log("API Response:", response.data);

        // Parse sections from API response
        let parsedSections = response.data.map((section) => ({
          sectionName: section.sectionName,
          questions: section.questions,
          duration: section.duration, // Keep original duration object
        }));

        console.log("Parsed sections:", parsedSections);

        // Get timing type from localStorage
        const storedTimingType = localStorage.getItem(
          `timingType_${contestId}`
        );
        const testTimingType = storedTimingType || "Section"; // Default to Section timing
        console.log("Test timing type:", testTimingType);
        setTimingType(testTimingType);

        // Calculate durations based on timing type
        let totalDuration = 0;
        let sectionDurations = [];

        if (testTimingType === "Overall") {
          // OVERALL TIMING MODE
          // Get test details from localStorage
          const currentTest = JSON.parse(localStorage.getItem("currentTest"));

          // Try to get overall duration from localStorage
          const storedTotalDuration = localStorage.getItem(
            `totalDuration_${contestId}`
          );

          if (storedTotalDuration && parseInt(storedTotalDuration) > 0) {
            totalDuration = parseInt(storedTotalDuration);
            console.log(
              "Using overall duration from localStorage:",
              totalDuration
            );
          } else {
            // Parse from test config
            const durationString = currentTest?.duration || "0 hours 0 minutes";
            const hoursMatch = durationString.match(/(\d+)\s*hours/);
            const minutesMatch = durationString.match(/(\d+)\s*minutes/);

            const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
            const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

            totalDuration = hours * 3600 + minutes * 60;

            // If zero, use default
            if (totalDuration === 0) totalDuration = 1800; // 30 minutes default

            localStorage.setItem(
              `totalDuration_${contestId}`,
              totalDuration.toString()
            );
            console.log("Calculated overall duration:", totalDuration);
          }

          // Distribute time evenly among sections
          const timePerSection = Math.floor(
            totalDuration / parsedSections.length
          );
          sectionDurations = Array(parsedSections.length).fill(timePerSection);
          console.log("Time per section in overall mode:", timePerSection);
        } else {
          // SECTION-BASED TIMING MODE
          // Parse section durations from the API data
          sectionDurations = parsedSections.map((section, index) => {
            // Log raw duration for debugging
            console.log(`Raw duration for section ${index}:`, section.duration);

            let hours = 0;
            let minutes = 0;

            if (section.duration) {
              if (typeof section.duration === "object") {
                // Direct properties from API like {hours: "1", minutes: "0"}
                hours = parseInt(section.duration.hours || "0", 10);
                minutes = parseInt(section.duration.minutes || "0", 10);
              } else if (typeof section.duration === "string") {
                // Try to parse from string format
                const hoursMatch = section.duration.match(/(\d+)\s*h/i);
                const minutesMatch = section.duration.match(/(\d+)\s*m/i);
                hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
                minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
              }
            }

            const sectionDuration = hours * 3600 + minutes * 60;

            console.log(`Parsed section ${index} duration:`, {
              hours,
              minutes,
              totalSeconds: sectionDuration,
            });

            // If section duration is zero, use a reasonable default
            return sectionDuration > 0 ? sectionDuration : 300; // 5 minutes default
          });

          console.log("Section durations:", sectionDurations);

          // Calculate total duration as sum of section durations
          totalDuration = sectionDurations.reduce(
            (sum, duration) => sum + duration,
            0
          );
          console.log("Total duration (sum of sections):", totalDuration);
        }

        setSections(parsedSections);
        setTotalDuration(totalDuration);

        // Initialize section remaining times from session storage or new values
        const storedTimes = sessionStorage.getItem(
          `sectionRemainingTimes_${contestId}`
        );

        let initialRemainingTimes;
        if (storedTimes) {
          const parsedStoredTimes = JSON.parse(storedTimes);
          // Check if stored times are all zero or invalid
          const allZero = parsedStoredTimes.every((time) => time <= 0);

          if (allZero) {
            // If all stored times are zero, use the new durations
            console.log(
              "All stored section times were zero, using calculated durations"
            );
            initialRemainingTimes = sectionDurations;
          } else {
            // Otherwise use the stored times
            initialRemainingTimes = parsedStoredTimes;
            console.log("Using stored section times:", initialRemainingTimes);
          }
        } else {
          // No stored times, use the calculated durations
          initialRemainingTimes = sectionDurations;
        }

        console.log("Initial section remaining times:", initialRemainingTimes);
        setSectionRemainingTimes(initialRemainingTimes);

        sessionStorage.setItem(
          `sectionRemainingTimes_${contestId}`,
          JSON.stringify(initialRemainingTimes)
        );

        // Initialize total remaining time
        const storedTotalTime = sessionStorage.getItem(
          `totalTimeLeft_${contestId}`
        );
        if (storedTotalTime) {
          const parsedTime = JSON.parse(storedTotalTime);
          if (parsedTime <= 0) {
            // If stored time is zero, use the calculated total
            setRemainingTime(totalDuration);
            sessionStorage.setItem(
              `totalTimeLeft_${contestId}`,
              JSON.stringify(totalDuration)
            );
          } else {
            setRemainingTime(parsedTime);
          }
        } else {
          sessionStorage.setItem(
            `startTime_${contestId}`,
            Date.now().toString()
          );
          setRemainingTime(totalDuration);
          sessionStorage.setItem(
            `totalTimeLeft_${contestId}`,
            JSON.stringify(totalDuration)
          );
        }

        // Initialize section times for sidebar display
        sessionStorage.setItem(
          `sectionTimes_${contestId}`,
          JSON.stringify(
            parsedSections.map((section, index) => ({
              remainingTime: initialRemainingTimes[index],
              isActive: index === currentSectionIndex,
              isFinished: initialRemainingTimes[index] === 0,
              isSubmitted: false,
            }))
          )
        );

        // Initialize submitted sections
        const storedSubmitted = sessionStorage.getItem(
          `submittedSections_${contestId}`
        );
        setSubmittedSections(
          storedSubmitted
            ? JSON.parse(storedSubmitted)
            : Array(parsedSections.length).fill(false)
        );

        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [API_BASE_URL, contestId, studentId, currentSectionIndex]);

  useEffect(() => {
    sessionStorage.setItem(
      `selectedAnswers_${contestId}`,
      JSON.stringify(selectedAnswers)
    );
    sessionStorage.setItem(
      `reviewStatus_${contestId}`,
      JSON.stringify(reviewStatus)
    );
  }, [selectedAnswers, reviewStatus, contestId]);

  useEffect(() => {
    localStorage.setItem(`faceDetection_${contestId}`, faceDetection);
  }, [faceDetection, contestId]);

  useEffect(() => {
    sessionStorage.setItem(
      `sectionRemainingTimes_${contestId}`,
      JSON.stringify(sectionRemainingTimes)
    );
  }, [sectionRemainingTimes, contestId]);

  const handleFaceDetection = (isDetected) => {
    setFaceDetection(isDetected);
    if (!isDetected) {
      setFaceDetectionWarning(
        "Face not detected. Please ensure you are visible to the camera."
      );
    }
  };

  const handleAnswerSelect = (sectionIndex, questionIndex, answer) => {
    setSelectedAnswers((prev) => {
      // Ensure prev is an array
      const newAnswers = Array.isArray(prev) ? [...prev] : [];
      newAnswers[sectionIndex] = {
        ...newAnswers[sectionIndex],
        [questionIndex]: answer,
      };
      return newAnswers;
    });
  };
  
  const handleReviewMark = (sectionIndex, questionIndex) => {
    setReviewStatus((prev) => {
      // Ensure prev is an array
      const newReviewStatus = Array.isArray(prev) ? [...prev] : [];
      newReviewStatus[sectionIndex] = {
        ...newReviewStatus[sectionIndex],
        [questionIndex]: !newReviewStatus[sectionIndex]?.[questionIndex],
      };
      return newReviewStatus;
    });
  };
  

  const addWarning = useCallback(
    (type) => {
      const currentTime = Date.now();
      if (currentTime - lastWarningTime.current < 100) {
        return;
      }
      lastWarningTime.current = currentTime;

      if (type === "fullscreen" || type === "tabSwitch") {
        const combinedWarnings = fullscreenWarnings + tabSwitchWarnings + 1;
        setFullscreenWarnings((prevWarnings) => {
          const newWarnings =
            type === "fullscreen" ? prevWarnings + 1 : prevWarnings;
          sessionStorage.setItem(
            `fullscreenWarnings_${contestId}`,
            newWarnings
          );
          return newWarnings;
        });
        setTabSwitchWarnings((prevWarnings) => {
          const newWarnings =
            type === "tabSwitch" ? prevWarnings + 1 : prevWarnings;
          sessionStorage.setItem(`tabSwitchWarnings_${contestId}`, newWarnings);
          return newWarnings;
        });
        setShowWarningModal(true);
      }
    },
    [contestId, fullscreenWarnings, tabSwitchWarnings]
  );

  const actuallyEnforceFullScreen = async () => {
    try {
      const element = document.documentElement;
      if (
        !document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement
      ) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error("Error requesting fullscreen mode:", error);
    }
  };

  useEffect(() => {
    const currentTest = JSON.parse(localStorage.getItem("currentTest"));
    const isFullScreenEnabled = currentTest?.fullScreenMode === true;

    if (!isTestFinished && isFullScreenEnabled) {
      (async () => {
        try {
          await actuallyEnforceFullScreen();
        } catch (error) {
          console.error("Error initializing fullscreen:", error);
        }
      })();
    }

    const onFullscreenChange = async () => {
      const isFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      if (!isFullscreen && !isTestFinished && isFullScreenEnabled) {
        addWarning("fullscreen");
        await actuallyEnforceFullScreen();
      }
      setFullScreenMode(isFullscreen);
      localStorage.setItem(
        `fullScreenMode_${contestId}`,
        isFullscreen ? "true" : "false"
      );
    };

    const preventReload = (e) => {
      if (!isTestFinished) {
        e.preventDefault();
        e.returnValue = "";
        addWarning("tabSwitch");
        return e.returnValue;
      }
    };

    const handleKeyDown = async (e) => {
      const currentTest = JSON.parse(localStorage.getItem("currentTest"));
      const isFullScreenEnabled = currentTest?.fullScreenMode === true;

      if (!isTestFinished && fullScreenMode) {
        if (
          e.key === "Escape" &&
          !disableAutoFullscreen &&
          isFullScreenEnabled
        ) {
          e.preventDefault();
          e.stopPropagation();
          addWarning("fullscreen");
          await actuallyEnforceFullScreen();
          return false;
        }
        if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
          e.preventDefault();
          e.stopPropagation();
          addWarning("tabSwitch");
          return false;
        }
        if (e.altKey && e.key === "Tab") {
          e.preventDefault();
          addWarning("tabSwitch");
          return false;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "w") {
          e.preventDefault();
          addWarning("tabSwitch");
          return false;
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "W") {
          e.preventDefault();
          addWarning("tabSwitch");
          return false;
        }
        if (e.altKey && e.key === "F4") {
          e.preventDefault();
          addWarning("tabSwitch");
          return false;
        }
        if (e.ctrlKey && e.altKey && e.key === "Delete") {
          e.preventDefault();
          addWarning("tabSwitch");
          return false;
        }
        if (e.key === "Meta" || e.key === "OS") {
          e.preventDefault();
          addWarning("tabSwitch");
          return false;
        }
        if (e.ctrlKey && e.shiftKey && e.key === "I") {
          e.preventDefault();
          addWarning("tabSwitch");
          return false;
        }
      }
    };

    const handleClick = async () => {
      const currentTest = JSON.parse(localStorage.getItem("currentTest"));
      const isFullScreenEnabled = currentTest?.fullScreenMode === true;

      if (!isTestFinished && isFullScreenEnabled && !fullScreenMode) {
        await actuallyEnforceFullScreen();
      }
    };

    window.addEventListener("beforeunload", preventReload);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("click", handleClick);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onFullscreenChange
      );
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange);
      document.removeEventListener("click", handleClick);
    };
  }, [
    isTestFinished,
    contestId,
    fullScreenMode,
    addWarning,
    disableAutoFullscreen,
  ]);

  useEffect(() => {
    if (!disableAutoFullscreen && !isTestFinished && fullScreenMode) {
      (async () => {
        try {
          await actuallyEnforceFullScreen();
        } catch (error) {
          console.error("Error initializing fullscreen:", error);
        }
      })();
    }
  }, [fullScreenMode, disableAutoFullscreen, isTestFinished]);

  const { openDeviceRestrictionModal, handleDeviceRestrictionModalClose } =
    useDeviceRestriction(contestId);

  // Add this useEffect (keep your other effects)

  // Sync submittedSections with sectionTimes on component mount
  useEffect(() => {
    if (sections.length > 0) {
      // Ensure submittedSections array has the correct length
      if (submittedSections.length !== sections.length) {
        const correctedSubmissions = submittedSections.slice(
          0,
          sections.length
        );
        // Extend the array if needed
        while (correctedSubmissions.length < sections.length) {
          correctedSubmissions.push(false);
        }
        setSubmittedSections(correctedSubmissions);

        // Make sure session storage is updated
        sessionStorage.setItem(
          `submittedSections_${contestId}`,
          JSON.stringify(correctedSubmissions)
        );
      }

      // Make sure sectionTimes has the isSubmitted flag properly set
      const sectionTimes = JSON.parse(
        sessionStorage.getItem(`sectionTimes_${contestId}`) || "[]"
      );
      let needsUpdate = false;

      for (let i = 0; i < sections.length; i++) {
        if (!sectionTimes[i]) {
          sectionTimes[i] = {
            remainingTime: sectionRemainingTimes[i] || 0,
            isActive: i === currentSectionIndex,
            isFinished: false,
            isSubmitted: submittedSections[i] || false,
          };
          needsUpdate = true;
        } else if (sectionTimes[i].isSubmitted !== submittedSections[i]) {
          sectionTimes[i].isSubmitted = submittedSections[i];
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        sessionStorage.setItem(
          `sectionTimes_${contestId}`,
          JSON.stringify(sectionTimes)
        );
      }
    }
  }, [
    sections,
    submittedSections,
    contestId,
    currentSectionIndex,
    sectionRemainingTimes,
  ]);

  const handleNext = () => {
    const currentSection = sections[currentSectionIndex];
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      if (currentSectionIndex < sections.length - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
        setCurrentQuestionIndex(0);
      }
    }
  };
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      if (currentSectionIndex > 0) {
        setCurrentSectionIndex(currentSectionIndex - 1);
        setCurrentQuestionIndex(
          sections[currentSectionIndex - 1].questions.length - 1
        );
      }
    }
  };

  const handleNoiseDetection = () => {
    setNoiseDetectionCount((prevCount) => {
      const newCount = prevCount + 1;
      sessionStorage.setItem(`noiseDetectionCount_${contestId}`, newCount);
      return newCount;
    });
    setShowNoiseWarningModal(true);
  };

  const handleFinish = useCallback(
    async (isTimerExpired = false) => {
      if (loading || !sections.length) {
        console.error("Test is not fully initialized.");
        return;
      }

      if (!isTimerExpired && !isTestFinished) {
        // Show confirmation modal only if the timer hasn't expired
        setShowConfirmModal(true);
        return;
      }

      try {
        setIsSubmitting(true); // Add this to show loading state

        const formattedAnswers = {};

        sections.forEach((section, sectionIndex) => {
          formattedAnswers[section.sectionName] = {};
          section.questions.forEach((question, questionIndex) => {
            formattedAnswers[section.sectionName][question.text] =
              selectedAnswers[sectionIndex]?.[questionIndex] || "notattended";
          });
        });

        const resultVisibility = localStorage.getItem(
          `resultVisibility_${contestId}`
        );
        const isPublish = resultVisibility === "Immediate release";

        let correctAnswers = 0;
        sections.forEach((section) => {
          section.questions.forEach((question, questionIndex) => {
            if (
              selectedAnswers[currentSectionIndex]?.[questionIndex] ===
              question.correctAnswer
            ) {
              correctAnswers++;
            }
          });
        });

        const passPercentage =
          parseFloat(sessionStorage.getItem(`passPercentage_${contestId}`)) ||
          50;

        const totalQuestions = sections.reduce(
          (total, section) => total + section.questions.length,
          0
        );
        const percentage = (correctAnswers / totalQuestions) * 100;
        const grade = percentage >= passPercentage ? "Pass" : "Fail";

        const fullscreenWarning = sessionStorage.getItem(
          `fullscreenWarnings_${contestId}`
        );
        const faceWarning = sessionStorage.getItem(
          `faceDetectionCount_${contestId}`
        );

        // Get the current timestamp
        const currentTime = new Date().toISOString().replace('Z', '');
        const startTime = new Date(localStorage.getItem(`startTime_${contestId}`)).getTime();
            const finishTime = new Date().getTime();
            const durationInSeconds = Math.floor((finishTime - startTime) / 1000);


        const payload = {
          contestId,
          studentId: localStorage.getItem("studentId"),
          answers: formattedAnswers,
          FullscreenWarning: fullscreenWarnings,
          NoiseWarning: noiseDetectionCount,
          FaceWarning: faceWarning,
          TabSwitchWarning: tabSwitchWarnings,
          isPublish: isPublish,
          grade: grade,
          startTime: new Date(startTime).toISOString(),
          finishTime: new Date(finishTime).toISOString(),
          durationInSeconds: durationInSeconds,
          passPercentage: passPercentage,
          resultVisibility: currentTest?.resultVisibility || "",
        };

        // Important: Set finished state before API call to prevent double submissions
        setIsTestFinished(true);
        localStorage.setItem(`testFinished_${contestId}`, "true");

        // First show the submission is in progress
        let loadingToast = null;
        if (isTimerExpired) {
          // If timer expired, show a message that the test is being submitted
          loadingToast = Swal.fire({
            title: "Submitting Test",
            text: "Your test is being submitted automatically...",
            icon: "info",
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });
        }

        // Make the API call
        const response = await axios.post(
          `${API_BASE_URL}/api/mcq/submit_assessment/`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );

        // Close the loading toast if it exists
        if (loadingToast) {
          Swal.close();
        }

        // Clean up storage first to prevent issues with navigation
        sessionStorage.removeItem(`fullscreenWarnings_${contestId}`);
        sessionStorage.removeItem(`tabSwitchWarnings_${contestId}`);
        sessionStorage.removeItem(`keydownWarnings_${contestId}`);
        sessionStorage.removeItem(`reloadWarnings_${contestId}`);
        sessionStorage.removeItem(`inspectWarnings_${contestId}`);
        sessionStorage.removeItem(`totalTimeLeft_${contestId}`);
        sessionStorage.removeItem(`sectionTimes_${contestId}`);

        // Show success message for at least 10 seconds before redirecting
        await Swal.fire({
          icon: "success",
          title: "Test Submitted Successfully!",
          text: "Your test has been submitted successfully.",
          confirmButtonText: '<span style="color: #ffffff;">OK</span>',
          confirmButtonColor: "#111933",
          timer: 10000, // 10 seconds
          timerProgressBar: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        });

        // Navigate after the timer completes
        navigate("/studentdashboard");
      } catch (error) {
        console.error("Error submitting test:", error);

        // Check if the test has already been marked as finished
        if (localStorage.getItem(`testFinished_${contestId}`) === "true") {
          // If already marked as finished, just show a redirect message
          Swal.fire({
            icon: "info",
            title: "Redirecting...",
            text: "Your test has already been submitted. Redirecting to dashboard.",
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
          }).then(() => {
            navigate("/studentdashboard");
          });
        } else {
          // Show error message only if test wasn't already submitted
          Swal.fire({
            icon: "error",
            title: "Failed to Submit Test",
            text: "There was an error submitting your test. Please try again.",
            confirmButtonText: '<span style="color: #ffffff;">OK</span>',
            confirmButtonColor: "#111933",
          });

          // Reset test finished state since submission failed
          setIsTestFinished(false);
          localStorage.removeItem(`testFinished_${contestId}`);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      contestId,
      sections,
      selectedAnswers,
      fullscreenWarnings,
      tabSwitchWarnings,
      noiseDetectionCount,
      navigate,
      API_BASE_URL,
      loading,
      isTestFinished,
      currentSectionIndex,
      currentTest,
    ]
  );

  // Replace the existing timer useEffect (around line 631)
  // Add this useEffect for the central timer (around line 631)
  useEffect(() => {
    const disableRightClick = (e) => {
      e.preventDefault();
    };
    const disableTextSelection = (e) => {
      e.preventDefault();
    };
    const disableCopyPaste = (e) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", disableRightClick);
    document.addEventListener("selectstart", disableTextSelection);
    document.addEventListener("copy", disableCopyPaste);
    document.addEventListener("cut", disableCopyPaste);
    document.addEventListener("paste", disableCopyPaste);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("selectstart", disableTextSelection);
      document.removeEventListener("copy", disableCopyPaste);
      document.removeEventListener("cut", disableCopyPaste);
      document.removeEventListener("paste", disableCopyPaste);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isTestFinished && fullScreenMode) {
        e.preventDefault();
        e.returnValue = "";
        addWarning("tabSwitch");
        return "";
      }
    };
    const handleBlur = () => {
      if (!isTestFinished && fullScreenMode) {
        setHasFocus(false);
        addWarning("tabSwitch");
      }
    };
    const handleFocus = () => {
      setHasFocus(true);
    };
    const handleVisibilityChange = () => {
      if (!isTestFinished && fullScreenMode) {
        if (document.hidden) {
          const currentTime = Date.now();
          if (currentTime - lastActiveTime.current > 500) {
            addWarning("tabSwitch");
          }
        }
        lastActiveTime.current = Date.now();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const focusCheckInterval = setInterval(() => {
      if (!isTestFinished && !document.hasFocus() && fullScreenMode) {
        addWarning("tabSwitch");
      }
    }, 1000);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(focusCheckInterval);
    };
  }, [isTestFinished, fullScreenMode, addWarning]);

  const warningLimits = useMemo(() => {
    const currentTest = JSON.parse(localStorage.getItem("currentTest"));
    const fullScreenModeCount = parseInt(
      currentTest?.fullScreenModeCount || "3",
      10
    );

    return {
      fullscreen: fullScreenModeCount, // Use the value from currentTest
      tabSwitch: 1,
      noiseDetection: 2,
      faceDetection: 3,
    };
  }, []);

  const handleSectionSubmit = (sectionIndex) => {
    // Confirm with the user
    Swal.fire({
      title: "Submit Section?",
      text: `Are you sure you want to submit ${sections[sectionIndex].sectionName}? You won't be able to modify your answers after submission.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, submit it!",
    }).then((result) => {
      if (result.isConfirmed) {
        // Save the current section's answers to session storage
        const sectionAnswers = selectedAnswers[sectionIndex] || {};
        const sectionReviewStatus = reviewStatus[sectionIndex] || {};

        // Store in session storage with section-specific keys
        sessionStorage.setItem(
          `sectionAnswers_${contestId}_${sectionIndex}`,
          JSON.stringify(sectionAnswers)
        );
        sessionStorage.setItem(
          `sectionReview_${contestId}_${sectionIndex}`,
          JSON.stringify(sectionReviewStatus)
        );

        // Update the submittedSections state
        setSubmittedSections((prev) => {
          const updated = [...prev];
          updated[sectionIndex] = true;
          sessionStorage.setItem(
            `submittedSections_${contestId}`,
            JSON.stringify(updated)
          );

          // Update section times in session storage with submission status
          const sectionTimes = JSON.parse(
            sessionStorage.getItem(`sectionTimes_${contestId}`) || "[]"
          );
          if (sectionTimes[sectionIndex]) {
            sectionTimes[sectionIndex].isSubmitted = true;
            sessionStorage.setItem(
              `sectionTimes_${contestId}`,
              JSON.stringify(sectionTimes)
            );
          }

          // Dispatch a custom event for the sidebar to pick up
          const event = new CustomEvent("sectionSubmitted", {
            detail: {
              submittedSectionIndex: sectionIndex,
              nextSectionIndex:
                sectionIndex < sections.length - 1 ? sectionIndex + 1 : null,
            },
          });
          window.dispatchEvent(event);

          return updated;
        });

        // Show success message and navigate
        Swal.fire({
          icon: "success",
          title: "Section Submitted",
          text: `${sections[sectionIndex].sectionName} has been submitted successfully!`,
          confirmButtonColor: "#111933",
        }).then(() => {
          // Navigate to the next section if available
          if (sectionIndex < sections.length - 1) {
            setCurrentSectionIndex(sectionIndex + 1);
            setCurrentQuestionIndex(0);
          }
        });
      }
    });
  };
  // Replace your timer useEffect with this one
  useEffect(() => {
    if (isTestFinished || loading) return;
    sessionStorage.setItem(`mainTimerActive_${contestId}`, "true");

    console.log("Starting timer with type:", timingType);

    const interval = setInterval(() => {
      if (timingType === "Overall") {
        // OVERALL TIMING MODE - one central timer
        setRemainingTime((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(interval);
            handleFinish(true); // Directly call handleFinish with isTimerExpired = true
            return 0;
          }

          const newTime = prevTime - 1;
          sessionStorage.setItem(
            `totalTimeLeft_${contestId}`,
            JSON.stringify(newTime)
          );

          // Calculate how much time each section should get
          const sectionCount = sections.length;
          if (sectionCount > 0) {
            // Update section times (for display purposes only in overall mode)
            setSectionRemainingTimes((prevTimes) => {
              const newSectionTimes = [...prevTimes];

              // Find active section(s) that haven't been submitted
              const activeSections = [];
              for (let i = 0; i < sectionCount; i++) {
                if (!submittedSections[i]) {
                  activeSections.push(i);
                }
              }

              // If we have active sections, decrease their time
              if (activeSections.length > 0) {
                // Focus time decrease on the current section
                if (!submittedSections[currentSectionIndex]) {
                  newSectionTimes[currentSectionIndex] = Math.max(
                    0,
                    newSectionTimes[currentSectionIndex] - 1
                  );
                } else {
                  // If current section is submitted, decrease time in first non-submitted section
                  const nextActive = activeSections[0];
                  newSectionTimes[nextActive] = Math.max(
                    0,
                    newSectionTimes[nextActive] - 1
                  );
                }

                sessionStorage.setItem(
                  `sectionRemainingTimes_${contestId}`,
                  JSON.stringify(newSectionTimes)
                );

                // Update section times for sidebar display
                const sectionTimes = JSON.parse(
                  sessionStorage.getItem(`sectionTimes_${contestId}`) || "[]"
                );
                for (let i = 0; i < sectionCount; i++) {
                  if (sectionTimes[i]) {
                    sectionTimes[i].remainingTime = newSectionTimes[i];
                    sectionTimes[i].isFinished = newSectionTimes[i] <= 0;
                  }
                }
                sessionStorage.setItem(
                  `sectionTimes_${contestId}`,
                  JSON.stringify(sectionTimes)
                );
              }

              return newSectionTimes;
            });
          }

          return newTime;
        });
      } else {
        // SECTION-BASED TIMING MODE - each section has its own timer

        // Try to find an unsubmitted section with remaining time
        const activeUnsubmittedSectionIndex = sections.findIndex(
          (_, index) =>
            !submittedSections[index] && sectionRemainingTimes[index] > 0
        );

        // Only proceed if we have an active section to run timer for
        if (activeUnsubmittedSectionIndex !== -1) {
          setSectionRemainingTimes((prevTimes) => {
            const newTimes = [...prevTimes];

            // Decrement timer for the ACTIVE section (not necessarily the current viewed section)
            if (newTimes[activeUnsubmittedSectionIndex] > 0) {
              newTimes[activeUnsubmittedSectionIndex]--;

              console.log(
                `Section ${activeUnsubmittedSectionIndex} time remaining:`,
                newTimes[activeUnsubmittedSectionIndex]
              );

              // When time reaches exactly zero, auto-submit section without confirmation
              if (newTimes[activeUnsubmittedSectionIndex] === 0) {
                console.log(
                  `Section ${activeUnsubmittedSectionIndex} time expired, auto-submitting...`
                );

                // Use setTimeout to prevent state update conflicts
                setTimeout(() => {
                  const sectionAnswers =
                    selectedAnswers[activeUnsubmittedSectionIndex] || {};
                  const sectionReviewStatus =
                    reviewStatus[activeUnsubmittedSectionIndex] || {};

                  // Store answers in session storage
                  sessionStorage.setItem(
                    `sectionAnswers_${contestId}_${activeUnsubmittedSectionIndex}`,
                    JSON.stringify(sectionAnswers)
                  );
                  sessionStorage.setItem(
                    `sectionReview_${contestId}_${activeUnsubmittedSectionIndex}`,
                    JSON.stringify(sectionReviewStatus)
                  );

                  // Update the submittedSections state
                  setSubmittedSections((prev) => {
                    const updated = [...prev];
                    updated[activeUnsubmittedSectionIndex] = true;
                    sessionStorage.setItem(
                      `submittedSections_${contestId}`,
                      JSON.stringify(updated)
                    );
                    return updated;
                  });

                  // Update section times in session storage
                  const sectionTimes = JSON.parse(
                    sessionStorage.getItem(`sectionTimes_${contestId}`) || "[]"
                  );

                  if (sectionTimes[activeUnsubmittedSectionIndex]) {
                    sectionTimes[
                      activeUnsubmittedSectionIndex
                    ].isSubmitted = true;
                    sectionTimes[
                      activeUnsubmittedSectionIndex
                    ].isFinished = true;
                    sessionStorage.setItem(
                      `sectionTimes_${contestId}`,
                      JSON.stringify(sectionTimes)
                    );
                  }

                  // Find the next unsubmitted section
                  const nextUnsubmittedIndex = sections.findIndex(
                    (_, index) =>
                      index > activeUnsubmittedSectionIndex &&
                      !submittedSections[index]
                  );

                  // Show notification that section time ended and it's auto-submitted
                  Swal.fire({
                    title: "Section Time Ended",
                    text: `The time for ${sections[activeUnsubmittedSectionIndex].sectionName} has ended. This section has been automatically submitted.`,
                    icon: "info",
                    confirmButtonColor: "#111933",
                  }).then(() => {
                    // Navigate to next section after user acknowledges the message
                    if (nextUnsubmittedIndex !== -1) {
                      setCurrentSectionIndex(nextUnsubmittedIndex);
                      setCurrentQuestionIndex(0);
                    }
                  });

                  // Dispatch custom event
                  const event = new CustomEvent("sectionSubmitted", {
                    detail: {
                      submittedSectionIndex: activeUnsubmittedSectionIndex,
                      nextSectionIndex:
                        activeUnsubmittedSectionIndex < sections.length - 1
                          ? activeUnsubmittedSectionIndex + 1
                          : null,
                      autoSubmitted: true,
                    },
                  });
                  window.dispatchEvent(event);
                }, 10);
              }
            }

            // Update session storage with new times
            sessionStorage.setItem(
              `sectionRemainingTimes_${contestId}`,
              JSON.stringify(newTimes)
            );

            // Update section times for sidebar display
            const sectionTimes = JSON.parse(
              sessionStorage.getItem(`sectionTimes_${contestId}`) || "[]"
            );
            sectionTimes.forEach((sectionTime, index) => {
              if (sectionTime) {
                sectionTime.remainingTime = newTimes[index];
                sectionTime.isFinished = newTimes[index] === 0;
              }
            });
            sessionStorage.setItem(
              `sectionTimes_${contestId}`,
              JSON.stringify(sectionTimes)
            );

            // Recalculate total time as the sum of all section times
            const totalRemaining = newTimes.reduce(
              (sum, time) => sum + (time || 0),
              0
            );
            setRemainingTime(totalRemaining);
            sessionStorage.setItem(
              `totalTimeLeft_${contestId}`,
              JSON.stringify(totalRemaining)
            );

            if (totalRemaining <= 0) {
              handleFinish(true); // Directly call handleFinish with isTimerExpired = true
            }

            return newTimes;
          });
        } else {
          // Check if there are ANY unsubmitted sections, even with zero time
          const anyUnsubmittedSection = submittedSections.findIndex(
            (isSubmitted) => !isSubmitted
          );

          if (
            anyUnsubmittedSection !== -1 &&
            sectionRemainingTimes[anyUnsubmittedSection] === 0
          ) {
            // Found an unsubmitted section with zero time - auto submit it
            console.log(
              `Found unsubmitted section ${anyUnsubmittedSection} with zero time, auto-submitting...`
            );
            setTimeout(() => {
              const sectionAnswers =
                selectedAnswers[anyUnsubmittedSection] || {};
              const sectionReviewStatus =
                reviewStatus[anyUnsubmittedSection] || {};

              // Store answers in session storage
              sessionStorage.setItem(
                `sectionAnswers_${contestId}_${anyUnsubmittedSection}`,
                JSON.stringify(sectionAnswers)
              );
              sessionStorage.setItem(
                `sectionReview_${contestId}_${anyUnsubmittedSection}`,
                JSON.stringify(sectionReviewStatus)
              );

              // Update the submittedSections state
              setSubmittedSections((prev) => {
                const updated = [...prev];
                updated[anyUnsubmittedSection] = true;
                sessionStorage.setItem(
                  `submittedSections_${contestId}`,
                  JSON.stringify(updated)
                );
                return updated;
              });

              // Update section times in session storage
              const sectionTimes = JSON.parse(
                sessionStorage.getItem(`sectionTimes_${contestId}`) || "[]"
              );

              if (sectionTimes[anyUnsubmittedSection]) {
                sectionTimes[anyUnsubmittedSection].isSubmitted = true;
                sectionTimes[anyUnsubmittedSection].isFinished = true;
                sessionStorage.setItem(
                  `sectionTimes_${contestId}`,
                  JSON.stringify(sectionTimes)
                );
              }

              // Find the next unsubmitted section
              const nextUnsubmittedIndex = sections.findIndex(
                (_, index) =>
                  index > anyUnsubmittedSection && !submittedSections[index]
              );

              // Show notification that section time ended and it's auto-submitted
              Swal.fire({
                title: "Section Time Ended",
                text: `The time for ${sections[anyUnsubmittedSection].sectionName} has ended. This section has been automatically submitted.`,
                icon: "info",
                confirmButtonColor: "#111933",
              }).then(() => {
                // Navigate to next section after user acknowledges the message
                if (nextUnsubmittedIndex !== -1) {
                  setCurrentSectionIndex(nextUnsubmittedIndex);
                  setCurrentQuestionIndex(0);
                }
              });

              // Dispatch custom event
              const event = new CustomEvent("sectionSubmitted", {
                detail: {
                  submittedSectionIndex: anyUnsubmittedSection,
                  nextSectionIndex:
                    anyUnsubmittedSection < sections.length - 1
                      ? anyUnsubmittedSection + 1
                      : null,
                  autoSubmitted: true,
                },
              });
              window.dispatchEvent(event);
            }, 10);
          }
        }
      }
    }, 1000);

    return () => {
      console.log("Clearing timer interval");
      clearInterval(interval);
    };
  }, [
    isTestFinished,
    loading,
    timingType,
    sections,
    submittedSections,
    currentSectionIndex,
    contestId,
    handleFinish,
    selectedAnswers,
    reviewStatus,
    sectionRemainingTimes,
  ]);

  const autoSubmitExpiredSection = (sectionIndex) => {
    if (sectionIndex < 0 || sectionIndex >= sections.length) return;

    console.log(`Auto-submitting section ${sectionIndex} due to time expiry`);

    // Save the current section's answers to session storage
    const sectionAnswers = selectedAnswers[sectionIndex] || {};
    const sectionReviewStatus = reviewStatus[sectionIndex] || {};

    // Store in session storage with section-specific keys
    sessionStorage.setItem(
      `sectionAnswers_${contestId}_${sectionIndex}`,
      JSON.stringify(sectionAnswers)
    );
    sessionStorage.setItem(
      `sectionReview_${contestId}_${sectionIndex}`,
      JSON.stringify(sectionReviewStatus)
    );

    // Update the submittedSections state
    setSubmittedSections((prev) => {
      const updated = [...prev];
      updated[sectionIndex] = true;
      sessionStorage.setItem(
        `submittedSections_${contestId}`,
        JSON.stringify(updated)
      );
      return updated;
    });

    // Update section times in session storage with submission status
    const sectionTimes = JSON.parse(
      sessionStorage.getItem(`sectionTimes_${contestId}`) || "[]"
    );

    if (sectionTimes[sectionIndex]) {
      sectionTimes[sectionIndex].isSubmitted = true;
      sectionTimes[sectionIndex].isFinished = true;
      sessionStorage.setItem(
        `sectionTimes_${contestId}`,
        JSON.stringify(sectionTimes)
      );
    }

    // Dispatch custom event for proper updates across components
    const event = new CustomEvent("sectionSubmitted", {
      detail: {
        submittedSectionIndex: sectionIndex,
        nextSectionIndex:
          sectionIndex < sections.length - 1 ? sectionIndex + 1 : null,
        autoSubmitted: true,
      },
    });
    window.dispatchEvent(event);

    // Find the next unsubmitted section
    const nextUnsubmittedIndex = sections.findIndex(
      (_, index) => index > sectionIndex && !submittedSections[index]
    );

    // Show notification that section time ended and it's auto-submitted
    Swal.fire({
      title: "Section Time Ended",
      text: `The time for ${sections[sectionIndex].sectionName} has ended. This section has been automatically submitted.`,
      icon: "info",
      confirmButtonColor: "#111933",
    }).then(() => {
      // Navigate to next section after user acknowledges the message
      if (nextUnsubmittedIndex !== -1) {
        setCurrentSectionIndex(nextUnsubmittedIndex);
        setCurrentQuestionIndex(0);
      }
    });
  };

  // Add a new state to track when auto-submission is in progress
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  useEffect(() => {
    // Get current test settings
    const currentTest = JSON.parse(localStorage.getItem("currentTest"));
    const fullScreenModeCount = parseInt(
      currentTest?.fullScreenModeCount || "3",
      10
    );

    // Check if fullscreen warnings exceed the limit and auto-submission isn't already in progress
    if (
      fullscreenWarnings >= fullScreenModeCount &&
      !isAutoSubmitting &&
      !isTestFinished
    ) {
      // Prevent multiple auto-submissions
      setIsAutoSubmitting(true);

      // Display warning message that test will be submitted
      Swal.fire({
        title: "Warning Limit Exceeded",
        text: `You've exceeded the maximum allowed warnings (${fullScreenModeCount}). Your test will be submitted automatically.`,
        icon: "warning",
        showConfirmButton: false,
        timer: 3000, // Show for 10 seconds
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then(() => {
        // After the 10 seconds, submit the test if not already submitted
        if (!isTestFinished) {
          handleFinish(true);
        }
      });
    }

    // Also check other warning combinations as before
    const allLimitsExceeded =
      tabSwitchWarnings >= warningLimits.tabSwitch &&
      noiseDetectionCount >= warningLimits.noiseDetection &&
      parseInt(sessionStorage.getItem(`faceDetectionCount_${contestId}`)) >=
        warningLimits.faceDetection;

    if (allLimitsExceeded && !isAutoSubmitting && !isTestFinished) {
      setIsAutoSubmitting(true);

      Swal.fire({
        title: "Warning Limit Exceeded",
        text: "You've exceeded the maximum allowed warnings. Your test will be submitted automatically.",
        icon: "warning",
        showConfirmButton: false,
        timer: 10000, // Show for 10 seconds
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then(() => {
        // After the 10 seconds, submit the test if not already submitted
        if (!isTestFinished) {
          handleFinish(true);
        }
      });
    }
  }, [
    fullscreenWarnings,
    tabSwitchWarnings,
    noiseDetectionCount,
    handleFinish,
    contestId,
    warningLimits,
    isTestFinished,
    isAutoSubmitting,
  ]);

  const handleFullscreenReEntry = async () => {
    const currentTest = JSON.parse(localStorage.getItem("currentTest"));
    const isFullScreenEnabled = currentTest?.fullScreenMode === true;

    if (!isFullScreenEnabled) {
      setShowWarningModal(false);
      return;
    }

    setShowWarningModal(false);
    const element = document.documentElement;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
    } catch (error) {
      console.error("Error entering fullscreen mode:", error);
      setTimeout(handleFullscreenReEntry, 500);
    }
  };

  // Add this useEffect in your SectionBasedMcqAssessment.jsx component
  // Add this useEffect in your SectionBasedMcqAssessment.jsx component
  useEffect(() => {
    const handleSectionTimeEnded = (event) => {
      const { sectionIndex } = event.detail;

      // Show notification that section time ended and it's auto-submitted
      Swal.fire({
        title: "Section Time Ended",
        text: `The time for ${sections[sectionIndex].sectionName} has ended. This section has been automatically submitted.`,
        icon: "info",
        confirmButtonColor: "#111933",
      });

      // Note: The actual submission is already handled in the sidebar component
    };

    window.addEventListener("sectionTimeEnded", handleSectionTimeEnded);

    return () => {
      window.removeEventListener("sectionTimeEnded", handleSectionTimeEnded);
    };
  }, [sections]);
  // Add this useEffect after your other useEffects to properly handle section submission state changes:

  // Effect to update sidebar state when submittedSections changes
  useEffect(() => {
    if (!loading && sections.length > 0) {
      // When submittedSections state changes, ensure it's reflected in the sidebar
      const sectionTimes = JSON.parse(
        sessionStorage.getItem(`sectionTimes_${contestId}`) || "[]"
      );

      // Make sure sectionTimes array is properly initialized
      if (sectionTimes.length !== sections.length) {
        // Initialize section times if not properly set up
        for (let i = 0; i < sections.length; i++) {
          if (!sectionTimes[i]) {
            sectionTimes[i] = {
              remainingTime: sectionRemainingTimes[i] || 0,
              isActive: i === currentSectionIndex,
              isFinished: false,
              isSubmitted: submittedSections[i] || false,
            };
          }
        }
      }

      // Update the submission status for each section
      submittedSections.forEach((isSubmitted, index) => {
        if (sectionTimes[index]) {
          sectionTimes[index].isSubmitted = isSubmitted;
        }
      });

      // Save updated section times to session storage
      sessionStorage.setItem(
        `sectionTimes_${contestId}`,
        JSON.stringify(sectionTimes)
      );
    }
  }, [
    submittedSections,
    loading,
    sections,
    contestId,
    sectionRemainingTimes,
    currentSectionIndex,
  ]);

  useEffect(() => {
    const isFinished =
      localStorage.getItem(`testFinished_${contestId}`) === "true";
    if (isFinished) {
      navigate("/studentdashboard");
    }
  }, [contestId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-xl text-gray-700 mb-4">No questions available</p>
          <button
            onClick={() => navigate("/studentdashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isDeviceRestricted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <svg
            className="mx-auto h-16 w-16 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-gray-700">
            Device Not Supported
          </h2>
          <p className="mt-2 text-gray-600">
            This test cannot be accessed on a mobile or tablet device.
            <br />
            Please use a desktop or laptop computer.
          </p>
          <button
            onClick={() => navigate("/studentdashboard")}
            className="mt-6 px-6 py-3 bg-[#111933] text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-60px)] text-xs sm:text-sm md:text-base flex flex-col lg:flex-row"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        pointerEvents: !hasFocus ? "none" : "auto",
        filter: !hasFocus ? "blur(5px)" : "none",
      }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onKeyDown={(e) => e.preventDefault()}
    >
      <meta
        httpEquiv="Content-Security-Policy"
        content="frame-ancestors 'none'"
      ></meta>
      <div className="flex-grow flex flex-col lg:flex-row">
        <div className="w-full lg:w-3/4 bg-white flex flex-col ">
          <div>
            <SectionBasedHeader
              contestId={contestId}
              totalDuration={totalDuration}
              sectionRemainingTime={
                sectionRemainingTimes[currentSectionIndex] || 0
              }
              timingType={timingType}
            />
            <div className="lg:hidden absolute top-7 right-6 z-50">
              <div
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="z-50 cursor-pointer"
              >
                {isMobileSidebarOpen ? (
                  <X
                    onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    className="cursor-pointer"
                  />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </div>
            </div>

            <div className="absolute inset-0 pointer-events-none z-[5] grid grid-cols-5 md:grid-cols-7 gap-2 pt-20 pr-4 opacity-10">
              {[...Array(window.innerWidth < 768 ? 25 : 35)].map((_, index) => (
                <div key={index} className="flex items-center justify-center">
                  <div className="transform -rotate-45 text-black text-xs sm:text-sm md:text-base font-semibold select-none">
                    {studentEmail}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-grow relative border-t border-gray-300">
              <SectionBasedQuestion
                sections={sections}
                currentSectionIndex={currentSectionIndex}
                currentQuestionIndex={currentQuestionIndex}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onFinish={handleFinish}
                onAnswerSelect={handleAnswerSelect} // Changed from handleAnswerChange to match your existing function
                selectedAnswers={selectedAnswers}
                onReviewMark={handleReviewMark}
                reviewStatus={reviewStatus}
                sectionTimes={JSON.parse(
                  sessionStorage.getItem(`sectionTimes_${contestId}`) || "[]"
                )}
                submittedSections={submittedSections}
              />
            </div>
          </div>
        </div>
        <div
          className={`fixed top-20 right-0 h-full bg-white border-l border-gray-300 transform transition-transform duration-300 ease-in-out ${
            isMobileSidebarOpen ? "translate-x-0" : "translate-x-full"
          } lg:translate-x-0 lg:static z-40`}
        >
          <div className="sticky top-6 p-4 sm:p-0">
            <SectionBasedSidebar
              sections={sections}
              currentSectionIndex={currentSectionIndex}
              currentQuestionIndex={currentQuestionIndex}
              selectedAnswers={selectedAnswers}
              reviewStatus={reviewStatus}
              onQuestionClick={(sectionIndex, questionIndex) => {
                setCurrentSectionIndex(sectionIndex);
                setCurrentQuestionIndex(questionIndex);
              }}
              contestId={contestId}
              timingType={timingType} // Add this prop
              totalDuration={totalDuration} // Add this prop
              onSectionSubmit={handleSectionSubmit} // Add this prop for section submission
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 px-2 py-2 shadow-md flex items-center z-50">
        {/* Left side - Previous button */}
        <div className="flex items-center">
          {currentQuestionIndex > 0 &&
            !submittedSections[currentSectionIndex] && (
              <button
                className="bg-white text-[#111933] border border-[#111933] rounded-lg px-4 py-2 flex items-center gap-2 sm:ml-11 mb-4 sm:mb-0"
                onClick={handlePrevious}
                disabled={submittedSections[currentSectionIndex]}
              >
                <ChevronLeft size={20} />
                <span className="hidden sm:block">Previous</span>
              </button>
            )}
        </div>

        {/* Middle section - Centering Submit Button */}
        <div className="flex-1 flex justify-center">
          {!submittedSections[currentSectionIndex] && (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg mb-4 sm:mb-0"
              onClick={() => handleSectionSubmit(currentSectionIndex)}
            >
              Submit Section
            </button>
          )}
        </div>

        {/* Right side container with responsive layout */}
        <div className="flex items-center justify-end relative">
          {/* Desktop layout */}
          <div className="hidden sm:flex items-center relative">
            {/* Next button for desktop */}
            {currentQuestionIndex <
              sections[currentSectionIndex]?.questions.length - 1 &&
              !submittedSections[currentSectionIndex] && (
                <button
                  className="bg-[#111933] text-white px-4 py-2 mr-44 rounded-lg flex items-center gap-2"
                  onClick={handleNext}
                >
                  <span>Next</span>
                  <ChevronRight size={20} />
                </button>
              )}

            {/* Finish button for desktop */}
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-lg mr-36"
              onClick={() => setShowPopup(true)}
              disabled={isSubmitting}
            >
              Finish
            </button>
          </div>

          {/* Mobile: Next and Finish buttons */}
          <div className="sm:hidden flex items-center">
            {/* Next button for mobile */}
            {currentQuestionIndex <
              sections[currentSectionIndex]?.questions.length - 1 &&
              !submittedSections[currentSectionIndex] && (
                <button
                  className="bg-[#111933] text-white px-4 py-2 rounded-lg flex items-center gap-2 mb-4 mr-4"
                  onClick={handleNext}
                >
                  <ChevronRight size={20} />
                </button>
              )}

            {/* Finish button for mobile */}
            <button
              className="bg-red-500 text-white px-4 py-2 rounded-lg mb-4"
              onClick={() => setShowPopup(true)}
              disabled={isSubmitting}
            >
              Finish
            </button>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-[600px] p-6 rounded-xl shadow-lg">
            <h3 className="text-xl text-center font-bold mb-2">
              {currentSectionIndex === sections.length - 1
                ? "Submit Final Assessment"
                : "Confirm Finish"}
            </h3>
            <p className="text-center text-sm mb-4">
              {currentSectionIndex === sections.length - 1
                ? "You are about to submit your final assessment. Are you sure?"
                : "You still have sections remaining. Are you sure you want to finish your test now?"}
            </p>
            <h3 className="text-xl text-center font-bold mb-2">
              Confirm Finish
            </h3>
            <p className="text-center text-sm mb-4">
              You have gone through all the questions. <br />
              Either browse through them once again or finish your assessment.
            </p>
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-6">
                <div
                  className="flex justify-between items-center mb-2 cursor-pointer"
                  onClick={() =>
                    setExpandedSectionIndex(
                      expandedSectionIndex === sectionIndex
                        ? null
                        : sectionIndex
                    )
                  }
                >
                  <h4 className="text-[#111933] font-semibold flex items-center">
                    {section.sectionName}
                    <svg
                      className={`ml-2 transition-transform ${
                        expandedSectionIndex === sectionIndex
                          ? "rotate-180"
                          : "rotate-0"
                      }`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 10L12 15L17 10"
                        stroke="#111933"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </h4>
                </div>
                {expandedSectionIndex === sectionIndex && (
                  <div className="mt-2">
                    <div className="grid grid-cols-6 gap-2 mb-2">
                      {section.questions.map((_, questionIndex) => (
                        <div
                          key={questionIndex}
                          className={`py-[6px] flex items-center justify-center rounded-md text-black ${
                            selectedAnswers[sectionIndex]?.[questionIndex]
                              ? "bg-[#c1f0c8]"
                              : reviewStatus[sectionIndex]?.[questionIndex]
                              ? "bg-[#ffe078]"
                              : "border border-[#ffe078]"
                          }`}
                        >
                          {questionIndex + 1}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm text-[#009516]">
                        Attempted:{" "}
                        {
                          Object.keys(selectedAnswers[sectionIndex] || {})
                            .length
                        }
                        /{section.questions.length}
                      </p>
                      <p className="text-sm text-[#E4AD00]">
                        Unattempted:{" "}
                        {section.questions.length -
                          Object.keys(selectedAnswers[sectionIndex] || {})
                            .length}
                      </p>
                      <p className="text-sm text-[#E31A00]">
                        Marked for Review:{" "}
                        {
                          Object.values(
                            reviewStatus[sectionIndex] || {}
                          ).filter(Boolean).length
                        }
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-[#111933] h-2 rounded-full"
                        style={{
                          width: `${
                            (Object.keys(selectedAnswers[sectionIndex] || {})
                              .length /
                              section.questions.length) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-center text-sm">
                      {(
                        (Object.keys(selectedAnswers[sectionIndex] || {})
                          .length /
                          section.questions.length) *
                        100
                      ).toFixed(0)}
                      % Completed
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-between mt-4">
              <button
                className="border bg-[#bfbfbf] text-white px-6 py-2 rounded-lg"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
              <button
                className="bg-red-500 text-white px-6 py-2 rounded-lg"
                onClick={handleFinish}
              >
                {currentSectionIndex === sections.length - 1
                  ? "Submit Final Assessment"
                  : "Finish Test"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
            <div className="text-red-600 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
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
            <h3 className="text-xl font-semibold text-center mb-4">Warning</h3>
            <p className="text-gray-700 mb-6">
              You have {fullscreenWarnings + tabSwitchWarnings} warnings. Please
              return to fullscreen to continue the test.
            </p>
            <button
              onClick={handleFullscreenReEntry}
              className="bg-[#111933] text-white px-6 py-2 rounded-lg"
            >
              Return
            </button>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-center mb-4">
              Submit Assessment
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to submit your assessment? This action
              cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleFinish();
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={openDeviceRestrictionModal}
        onClose={handleDeviceRestrictionModalClose}
        aria-labelledby="device-restriction-modal-title"
        aria-describedby="device-restriction-modal-description"
      >
        <DialogTitle id="device-restriction-modal-title">
          {"Device Restriction"}
        </DialogTitle>
        <DialogContent>
          <DialogContent id="device-restriction-modal-description">
            This test cannot be taken on a mobile or tablet device.
          </DialogContent>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeviceRestrictionModalClose} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {showNoiseWarningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
            <div className="text-red-600 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
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
            <h3 className="text-xl font-semibold text-center mb-4">
              Noise Detected
            </h3>
            <p className="text-gray-700 mb-6">
              Noise has been detected. Please ensure a quiet environment to
              continue the test.
            </p>
            <button
              onClick={() => setShowNoiseWarningModal(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {faceDetection && (
        <FaceDetectionComponent
          contestId={contestId}
          onWarning={handleFaceDetection}
        />
      )}

      {faceDetectionWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full mx-4">
            <div className="text-red-600 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
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
            <h3 className="text-xl font-semibold text-center mb-4">
              Face Detection Warning
            </h3>
            <p className="text-gray-700 mb-6">{faceDetectionWarning}</p>
            <button
              onClick={() => setFaceDetectionWarning("")}
              className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}