import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../../components/staff/mcq/Header";
import Question from "../../../components/staff/mcq/Question";
import Sidebar from "../../../components/staff/mcq/Sidebar";
import useNoiseDetection from "../../../components/staff/mcq/useNoiseDetection";
import useFullScreenMode from "../../../components/staff/mcq/useFullScreenMode";
import useDeviceRestriction from "../../../components/staff/mcq/useDeviceRestriction";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import FaceDetectionComponent from "../../../components/staff/mcq/useVideoDetection";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import Swal from "sweetalert2"; // Import SweetAlert2

export default function Mcq_Assessment() {
  const { contestId } = useParams();
  const studentId = sessionStorage.getItem("studentId");
  const [currentTest, setCurrentTest] = useState(null);
  const navigate = useNavigate();
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://assessmentbackend-production.up.railway.app";
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState(() => {
    const storedAnswers = sessionStorage.getItem(
      `selectedAnswers_${contestId}`
    );
    return storedAnswers ? JSON.parse(storedAnswers) : {};
  });
  const [reviewStatus, setReviewStatus] = useState(() => {
    const storedReviewStatus = sessionStorage.getItem(
      `reviewStatus_${contestId}`
    );
    return storedReviewStatus ? JSON.parse(storedReviewStatus) : {};
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [faceDetection, setFaceDetection] = useState(() => {
    const storedFaceDetection = sessionStorage.getItem(
      `faceDetection_${contestId}`
    );
    return storedFaceDetection === "true";
  });
  const [faceDetectionCount, setFaceDetectionCount] = useState(() => {
    const storedCount = localStorage.getItem(`faceDetectionCount_${contestId}`);
    return storedCount ? parseInt(storedCount) : 0;
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
  const mediaStreamRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [noiseDetectionCount, setNoiseDetectionCount] = useState(0);
  const [showNoiseWarningModal, setShowNoiseWarningModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasFocus, setHasFocus] = useState(true);
  const lastActiveTime = useRef(Date.now());
  const lastWarningTime = useRef(Date.now());
  const [isFreezePeriodOver, setIsFreezePeriodOver] = useState(false);
  const [faceDetectionWarning, setFaceDetectionWarning] = useState("");
  const [keydownWarnings, setKeydownWarnings] = useState(0);
  const [reloadWarnings, setReloadWarnings] = useState(0);
  const [inspectWarnings, setInspectWarnings] = useState(0);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [showPopup, setShowPopup] = useState(false);
  const totalQuestions = questions.length;
  const studentEmail = localStorage.getItem("studentEmail") || "SNSGROUPS.COM";

  const handleFinishClick = () => {
    setShowPopup(true);
  };

  const disableAutoFullscreen = false;

  const warningLimits = {
    fullscreen: 3,
    tabSwitch: 1,
    noiseDetection: 2,
    faceDetection: 3,
  };

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
    const fetchQuestions = async () => {
      try {
        const sectionStatus = localStorage.getItem(`sections_${contestId}`);
        const isSectionTrue = sectionStatus === "true";

        const apiUrl = isSectionTrue
          ? `${API_BASE_URL}/api/mcq/sections/${contestId}/`
          : `${API_BASE_URL}/api/mcq/get_mcqquestions/${contestId}/`;

        const response = await axios.get(apiUrl);

        let parsedQuestions = [];
        if (isSectionTrue) {
          response.data.forEach((section) => {
            section.questions.forEach((question) => {
              parsedQuestions.push({
                ...question,
                sectionName: section.sectionName,
              });
            });
          });
        } else {
          parsedQuestions = response.data.questions || [];
        }

        const storedCurrentTest = JSON.parse(
          localStorage.getItem("currentTest")
        );
        setCurrentTest(storedCurrentTest);

        if (storedCurrentTest && storedCurrentTest.shuffleQuestions) {
          const shuffledQuestions = sessionStorage.getItem(
            `shuffledQuestions_${contestId}`
          );
          if (!shuffledQuestions) {
            const shuffled = parsedQuestions.sort(() => Math.random() - 0.5);
            sessionStorage.setItem(
              `shuffledQuestions_${contestId}`,
              JSON.stringify(shuffled)
            );
            setQuestions(shuffled);
          } else {
            setQuestions(JSON.parse(shuffledQuestions));
          }
        } else {
          setQuestions(parsedQuestions);
        }

        const { hours, minutes } = response.data.duration || {
          hours: 0,
          minutes: 0,
        };
        const totalDuration = parseInt(hours) * 3600 + parseInt(minutes) * 60;
        setDuration(totalDuration);

        const startTime = sessionStorage.getItem(`startTime_${contestId}`);
        if (startTime) {
          const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
          setRemainingTime(totalDuration - elapsedTime);
        } else {
          const newStartTime = Date.now();
          sessionStorage.setItem(`startTime_${contestId}`, newStartTime);
          setRemainingTime(totalDuration);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [contestId, studentId]);

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
    const storedFaceDetection = localStorage.getItem(
      `faceDetection_${contestId}`
    );
    setFaceDetection(storedFaceDetection === "true");
  }, [contestId]);

  const handleFaceDetection = (isDetected) => {
    setFaceDetection(isDetected);
    if (!isDetected) {
      setFaceDetectionWarning(
        "Face not detected. Please ensure you are visible to the camera."
      );

      const currentCount =
        parseInt(sessionStorage.getItem(`faceDetectionCount_${contestId}`)) ||
        0;
      const newCount = currentCount + 1;

      sessionStorage.setItem(
        `faceDetectionCount_${contestId}`,
        newCount.toString()
      );
      setFaceDetectionCount(newCount);

      console.log("Face detection count updated:", newCount);
    }
  };

  const handleAnswerSelect = (index, answer) => {
    setSelectedAnswers((prev) => ({ ...prev, [index]: answer }));
  };

  const handleReviewMark = (index) => {
    setReviewStatus((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const addWarning = (type) => {
    if (type === "fullscreen") {
      setFullscreenWarnings((prevWarnings) => {
        const newWarnings = prevWarnings + 1;
        sessionStorage.setItem(`fullscreenWarnings_${contestId}`, newWarnings);
        return newWarnings;
      });
    } else if (type === "tabSwitch") {
      setTabSwitchWarnings((prevWarnings) => {
        const newWarnings = prevWarnings + 1;
        sessionStorage.setItem(`tabSwitchWarnings_${contestId}`, newWarnings);
        return newWarnings;
      });
    }
  
    // Show the warning modal and keep it open until user takes action
    setShowWarningModal(true);
    
    // Clear any existing timeout to prevent premature closing
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    
    // We'll let the user manually close the warning by clicking the Return button
    // Don't set an auto-dismiss timeout here
  };

  const enforceFullScreen = async () => {
    try {
      if (!disableAutoFullscreen === false) {
      }
      if (!disableAutoFullscreen) {
        return;
      }
    } catch (err) {
      console.error("Error ignoring fullscreen:", err);
    }
  };

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
        isFullscreen ? true : false
      );
    };

    const preventReload = (e) => {
      if (!isTestFinished) {
        e.preventDefault();
        e.returnValue = "";
        return e.returnValue;
      }
    };

    const handleKeyDown = async (e) => {
      if (!isTestFinished && fullScreenMode) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          addWarning("fullscreen");
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

    window.addEventListener("beforeunload", preventReload);
    document.addEventListener("keydown", handleKeyDown, true);
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
    };
  }, [isTestFinished, contestId]);

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
  }, [fullScreenMode]);

  const { openDeviceRestrictionModal, handleDeviceRestrictionModalClose } =
    useDeviceRestriction(contestId);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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

  const noiseDetection = useNoiseDetection(contestId, handleNoiseDetection);
  const testName = currentTest?.name || "Default Test Name";
  const testDetails = JSON.parse(localStorage.getItem("currentTest"));

  useEffect(() => {
    const storedCurrentTest = JSON.parse(localStorage.getItem("currentTest"));
    setCurrentTest(storedCurrentTest);
  }, []);

  useEffect(() => {
    if (testDetails) {
      localStorage.setItem("currentTest", JSON.stringify(testDetails));
    }
  }, [testDetails]);

  const warningTimeoutRef = useRef(null);

  // Update the handleFinish function for better loading and submission handling
  const handleFinish = useCallback(async () => {
    if (loading || !questions.length) {
      console.error("Test is not fully initialized.");
      return;
    }

    try {
      // Set submitting state to show loading
      setIsSubmitting(true);

      const formattedAnswers = {};

      questions.forEach((question, index) => {
        if (question.sectionName) {
          if (!formattedAnswers[question.sectionName]) {
            formattedAnswers[question.sectionName] = {};
          }
          formattedAnswers[question.sectionName][question.text] =
            selectedAnswers[index] || "Not Attended";
        } else {
          formattedAnswers[question.text] =
            selectedAnswers[index] || "Not Attended";
        }
      });

      const resultVisibility = localStorage.getItem(
        `resultVisibility_${contestId}`
      );
      const ispublish = resultVisibility === "Immediate release";

      const storedFaceDetectionCount =
        parseInt(sessionStorage.getItem(`faceDetectionCount_${contestId}`)) ||
        0;

      let correctAnswers = 0;
      questions.forEach((question, index) => {
        if (selectedAnswers[index] === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const currentTest = JSON.parse(localStorage.getItem("currentTest"));
      const passPercentage =
        JSON.parse(localStorage.getItem("currentTest"))?.passPercentage || 50;

      const totalQuestions = questions.length;
      const percentage = (correctAnswers / totalQuestions) * 100;
      const grade = percentage >= passPercentage ? "Pass" : "Fail";

      const fullscreenWarning = sessionStorage.getItem(
        `fullscreenWarnings_${contestId}`
      );
      const noiseDetectionCount =
        sessionStorage.getItem(`noiseDetectionCount_${contestId}`) || 0;
      const faceWarning = sessionStorage.getItem(
        `faceDetectionCount_${contestId}`
      );

      // Get the current timestamp for accurate finish time
      const currentTime = new Date().toISOString();

      // Retrieve the start time from sessionStorage
      const startTime = sessionStorage.getItem(`startTime_${contestId}`);

      const payload = {
        contestId,
        studentId: localStorage.getItem("studentId"),
        answers: formattedAnswers,
        FullscreenWarning: fullscreenWarnings,
        NoiseWarning: noiseDetectionCount,
        FaceWarning: storedFaceDetectionCount,
        TabSwitchWarning: tabSwitchWarnings,
        KeydownWarning: keydownWarnings,
        ReloadWarning: reloadWarnings,
        InspectWarning: inspectWarnings,
        ispublish: ispublish,
        grade: grade,
        passPercentage: parseFloat(passPercentage) || 50,
        startTime: startTime
          ? new Date(parseInt(startTime)).toISOString()
          : null,
        finishTime: currentTime,
        resultVisibility: currentTest?.resultVisibility || "",
      };

      // Show loading indicator while submitting
      const loadingToast = Swal.fire({
        title: "Submitting Test",
        text: "Your test is being submitted. Please wait...",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Set test finished state to prevent multiple submissions
      setIsTestFinished(true);

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/mcq/submit_assessment/`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
            // Add timeout to ensure the request doesn't hang indefinitely
            timeout: 30000, // 30 seconds timeout
          }
        );

        // Close loading indicator only if we got a response
        Swal.close();

        if (response.status === 200) {
          // Safely exit fullscreen first to prevent UI issues
          try {
            if (document.fullscreenElement) {
              if (document.exitFullscreen) {
                await document.exitFullscreen();
              } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
              } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen();
              } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
              }
            }
          } catch (fsError) {
            console.warn("Error exiting fullscreen:", fsError);
          }

          // Clear all storage immediately to avoid issues with navigation
          sessionStorage.removeItem(`fullscreenWarnings_${contestId}`);
          sessionStorage.removeItem(`tabSwitchWarnings_${contestId}`);
          sessionStorage.removeItem(`keydownWarnings_${contestId}`);
          sessionStorage.removeItem(`reloadWarnings_${contestId}`);
          sessionStorage.removeItem(`inspectWarnings_${contestId}`);
          localStorage.removeItem(`faceDetection_${contestId}`);
          localStorage.removeItem(`fullScreenMode_${contestId}`);
          sessionStorage.removeItem(`selectedAnswers_${contestId}`);
          sessionStorage.removeItem(`reviewStatus_${contestId}`);
          sessionStorage.removeItem(`shuffledQuestions_${contestId}`);
          sessionStorage.removeItem(`startTime_${contestId}`);
          sessionStorage.removeItem(`noiseDetectionCount_${contestId}`);
          sessionStorage.removeItem(`FaceDetectionCount_${contestId}`);
          sessionStorage.removeItem(`faceDetectionCount_${contestId}`);

          // Show success message with minimum display time
          await Swal.fire({
            icon: "success",
            title: "Test Submitted Successfully!",
            text: "Your test has been submitted successfully.",
            confirmButtonText: '<span style="color: #ffffff;">OK</span>',
            confirmButtonColor: "#111933",
            timer: 10000, // 10 second minimum display
            timerProgressBar: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            willClose: () => {
              // Only navigate when the alert is about to close
              setTimeout(() => {
                navigate("/studentdashboard");
              }, 100);
            },
          });
        } else {
          // Handle non-200 responses
          throw new Error(`Unexpected response: ${response.status}`);
        }
      } catch (submissionError) {
        console.error("Error in submission:", submissionError);
        // Close any pending loading toasts
        Swal.close();

        // Show error message
        await Swal.fire({
          icon: "error",
          title: "Failed to Submit the Test",
          text: "There was an error submitting your test. Please try again.",
          confirmButtonText: '<span style="color: #ffffff;">OK</span>',
          confirmButtonColor: "#111933",
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        // Reset submission states to allow retry
        setIsSubmitting(false);
        setIsTestFinished(false);
      }
    } catch (error) {
      // This catches errors in the preparation phase
      console.error("Error preparing test submission:", error);

      // Reset states
      setIsTestFinished(false);
      setIsSubmitting(false);

      // Show error message
      Swal.fire({
        icon: "error",
        title: "Failed to Submit the Test",
        text: "There was an error preparing your test submission. Please try again.",
        confirmButtonText: '<span style="color: #ffffff;">OK</span>',
        confirmButtonColor: "#111933",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    }
  }, [
    contestId,
    questions,
    selectedAnswers,
    fullscreenWarnings,
    tabSwitchWarnings,
    keydownWarnings,
    reloadWarnings,
    inspectWarnings,
    faceDetectionCount,
    noiseDetectionCount,
    navigate,
    loading,
  ]);

  useEffect(() => {
    if (remainingTime > 0 && !loading) {
      const interval = setInterval(() => {
        setRemainingTime((prevTime) => Math.max(prevTime - 1, 0));
      }, 1000);
      return () => clearInterval(interval);
    } else if (remainingTime === 0 && !isTestFinished) {
      handleFinish();
    }
  }, [remainingTime, isTestFinished, handleFinish, loading]);

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
  }, [isTestFinished, fullScreenMode]);

  useEffect(() => {
    // Get current test settings
    const currentTest = JSON.parse(localStorage.getItem("currentTest"));
    const fullScreenLimit = parseInt(currentTest?.fullScreenModeCount) || 3;

    // Check if fullscreen warnings have reached the limit
    if (
      fullscreenWarnings >= fullScreenLimit &&
      !isSubmitting &&
      !isTestFinished
    ) {
      // Show a warning message that test will be submitted
      Swal.fire({
        title: "Warning Limit Exceeded",
        text: `You have exceeded the maximum allowed warnings (${fullScreenLimit}). Your test will be submitted automatically.`,
        icon: "warning",
        showConfirmButton: false,
        timer: 5000, // Show for 5 seconds
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then(() => {
        if (!isTestFinished && !isSubmitting) {
          handleFinish();
        }
      });
      return;
    }

    const allLimitsExceeded =
      fullscreenWarnings >= warningLimits.fullscreen &&
      tabSwitchWarnings >= warningLimits.tabSwitch &&
      noiseDetectionCount >= warningLimits.noiseDetection &&
      faceDetectionCount >= warningLimits.faceDetection;

    if (allLimitsExceeded && !isSubmitting && !isTestFinished) {
      Swal.fire({
        title: "Warning Limit Exceeded",
        text: "You have exceeded the maximum allowed warnings. Your test will be submitted automatically.",
        icon: "warning",
        showConfirmButton: false,
        timer: 5000, // Show for 5 seconds
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
        },
      }).then(() => {
        if (!isTestFinished && !isSubmitting) {
          handleFinish();
        }
      });
    }
  }, [
    fullscreenWarnings,
    tabSwitchWarnings,
    noiseDetectionCount,
    faceDetectionCount,
    handleFinish,
    warningLimits,
    isSubmitting,
    isTestFinished,
  ]);

  useEffect(() => {
    const initializeFullScreen = async () => {
      if (!isTestFinished) {
        try {
          await handleFullscreenReEntry();
        } catch (error) {
          console.error("Error initializing fullscreen:", error);
        }
      }
    };

    initializeFullScreen();
  }, []);

  const handleFullscreenReEntry = async () => {
    const currentTest = JSON.parse(localStorage.getItem("currentTest"));
    const isFullScreenEnabled = currentTest?.fullScreenMode === true;

    if (!isFullScreenEnabled) {
      setShowWarningModal(false);
      return;
    }

    // Clear the warning modal
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
      // If error occurs, try again after a short delay
      setTimeout(handleFullscreenReEntry, 500);
    }
  };

  useEffect(() => {
    const faceDetectionWarningTimeout = setTimeout(() => {
      if (faceDetectionWarning) {
        setFaceDetectionWarning("");
        setFaceDetection((prevCount) => {
          const newCount = prevCount + 1;
          localStorage.setItem(
            `faceDetectionCount_${contestId}`,
            newCount.toString()
          );
          return newCount;
        });
      }
    }, 30000);

    return () => clearTimeout(faceDetectionWarningTimeout);
  }, [faceDetectionWarning, contestId]);

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

  if (!questions || questions.length === 0) {
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
      <div className="lg:hidden absolute top-7 right-6 z-10">
        {isSidebarOpen ? (
          <X
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="cursor-pointer"
          />
        ) : (
          <Menu
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="cursor-pointer"
          />
        )}
      </div>
      <div className="flex-grow flex flex-col lg:flex-row w-full transition-all duration-300 ease-in-out">
        <div className="w-full lg:w-3/4 bg-white">
          <div className="border-b border-gray-300">
            <Header duration={remainingTime} />
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
          <div className="flex-grow relative ">
            <Question
              question={questions[currentIndex]}
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onAnswerSelect={handleAnswerSelect}
              selectedAnswers={selectedAnswers}
              onReviewMark={handleReviewMark}
              reviewStatus={reviewStatus}
              shuffleOptions={currentTest?.shuffleOptions}
            />
          </div>
        </div>
        <div
          className={`fixed top-20 right-0 h-full bg-white border-l border-gray-300 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          } lg:translate-x-0 lg:static lg:w-1/4 z-40`}
        >
          <div className="sticky top-6 p-4 sm:p-0">
            <Sidebar
              totalQuestions={questions.length}
              currentIndex={currentIndex}
              selectedAnswers={selectedAnswers}
              reviewStatus={reviewStatus}
              onFinish={handleFinish}
              onFinishClick={handleFinishClick}
              onQuestionClick={(index) => setCurrentIndex(index)}
              sections={questions.reduce((acc, question) => {
                const section = acc.find(
                  (s) => s.sectionName === question.sectionName
                );
                if (section) {
                  section.questions.push(question);
                } else {
                  acc.push({
                    sectionName: question.sectionName,
                    questions: [question],
                  });
                }
                return acc;
              }, [])}
            />
          </div>
        </div>
      </div>

      {showWarningModal && currentTest?.fullScreenMode === true && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-red-500 mb-4">
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
            <h3 className="text-xl text-[#111933] font-semibold text-center mb-4">
              Warning #{fullscreenWarnings + tabSwitchWarnings}
            </h3>
            <p className="text-[#111933] text-center mb-6">
              {tabSwitchWarnings > 0
                ? "You have switched tabs. Please return to the test tab to continue."
                : "You have exited fullscreen mode. Please return to fullscreen to continue the test."}
            </p>
            <button
              onClick={handleFullscreenReEntry}
              className="w-full py-3 bg-[#111933] text-white rounded-lg"
            >
              Return
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white px-4 sm:py-4 md:py-0 shadow-md sm:border-t-2 flex justify-between items-center z-50">
        {/* Previous button - left aligned */}
        <div className="flex items-center">
          {currentIndex > 0 && (
            <button
              className="bg-white text-[#111933] border border-[#111933] rounded-lg px-4 py-2 sm:px-4 sm:py-2 flex items-center gap-2 mb-4 sm:mb-0"
              onClick={handlePrevious}
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Previous</span>
            </button>
          )}
        </div>

        {/* Mobile: Finish button centered and fixed */}
        <div className="sm:hidden absolute left-1/2 transform -translate-x-1/2 bottom-4">
          <button
            className="bg-[#111933] font-medium text-base text-white px-4 py-2 rounded-lg"
            onClick={handleFinishClick}
          >
            <span>Finish</span>
          </button>
        </div>

        {/* Right side container with desktop layout */}
        <div className="flex items-center justify-end relative">
          {/* Desktop layout container with proper positioning */}
          <div className="hidden sm:flex items-center relative">
            {currentIndex < questions.length - 1 && (
              <button
                className="bg-[#111933] text-white px-8 py-2 rounded-lg flex items-center gap-2"
                onClick={handleNext}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={20} />
              </button>
            )}

            {/* Separator span - desktop only */}
            <span className="h-20 w-px mx-8 md:mr-[383px]"></span>

            <button
              className="bg-[#E1F9F0] border border-[#004434] text-[#004434] font-bold px-8 py-2 rounded-lg absolute right-0 sm:right-4 md:right-32"
              onClick={handleFinishClick}
            >
              <span>Finish</span>
            </button>
          </div>

          {/* Mobile: Next button on right */}
          <div className="sm:hidden">
            {currentIndex < questions.length - 1 && (
              <button
                className="bg-[#111933] text-white px-4 py-2 rounded-lg flex items-center gap-2 mb-4"
                onClick={handleNext}
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-[600px] p-6 rounded-xl shadow-lg">
            <h3 className="text-xl text-center font-bold mb-2">
              Confirm Finish
            </h3>
            <p className="text-center text-sm mb-4">
              You have gone through all the questions. <br />
              Either browse through them once again or finish your assessment.
            </p>

            {/* Question Status Grid */}
            <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-10 gap-2 mb-6">
                {Array.from({ length: totalQuestions }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium
                ${
                  selectedAnswers[idx]
                    ? "bg-[#c1f0c8] text-black"
                    : "border border-[#ffcc00] text-black"
                }`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="flex justify-between mb-2 mx-2">
              <p className="text-sm text-[#009516]">
                Attempted: {Object.keys(selectedAnswers).length}/
                {totalQuestions}
              </p>
              <p className="text-sm ml-5 text-[#ff6f2d]">
                Unattempted:{" "}
                {totalQuestions - Object.keys(selectedAnswers).length}
              </p>
              <p className="text-sm text-[#111933]">
                Marked for Review:{" "}
                {Object.values(reviewStatus).filter(Boolean).length}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-[#111933] h-2 rounded-full"
                style={{
                  width: `${
                    (Object.keys(selectedAnswers).length / totalQuestions) * 100
                  }%`,
                }}
              ></div>
            </div>

            {/* Completion Percentage */}
            <p className="text-center text-sm mb-4">
              {(
                (Object.keys(selectedAnswers).length / totalQuestions) *
                100
              ).toFixed(0)}
              % Completed
            </p>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                className="px-6 py-2 bg-#ffffff text-[#111933] border border-[#111933] rounded-lg"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
              <button
                className="px-6 py-2 bg-[#111933] text-white rounded-lg"
                onClick={() => {
                  setShowPopup(false);
                  handleFinish();
                }}
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-center mb-4">
              Submit Assessment
            </h3>
            <p className="text-gray-600 text-center mb-6">
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
                {/* Add loading overlay during submission */}
                {isSubmitting && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-xl font-medium">
                        Submitting your test...
                      </p>
                      <p className="text-gray-600 mt-2">
                        Please don't close this window
                      </p>
                    </div>
                  </div>
                )}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
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
            <p className="text-gray-600 text-center mb-6">
              Noise has been detected. Please ensure a quiet environment to
              continue the test.
            </p>
            <button
              onClick={() => setShowNoiseWarningModal(false)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
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
            <p className="text-gray-600 text-center mb-6">
              {faceDetectionWarning}
            </p>
            <button
              onClick={() => setFaceDetectionWarning("")}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
          {isSubmitting && (
            <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-[1000]">
              <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-xl font-medium">Submitting your test...</p>
                <p className="text-gray-600 mt-2">
                  Please don't close this window
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
