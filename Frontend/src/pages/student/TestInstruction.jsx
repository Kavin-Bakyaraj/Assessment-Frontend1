import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import image from "../../assets/Test_Instruction.svg";
import { FaUser, FaEnvelope, FaPhoneAlt } from "react-icons/fa";
import { MdOutlinePublish } from "react-icons/md";
import Navbar from "./Navbar";
import { Skeleton } from "@mui/material";
import Questions from "../../assets/Questions.svg";
import Section from "../../assets/Section.svg";
import Total from "../../assets/total_marks.svg";
import Percentage from "../../assets/percentage.svg";
import { DoorFront, Login } from "@mui/icons-material";

const TestInstructions = () => {
  const [testDetails, setTestDetails] = useState(() => {
    const storedDetails = localStorage.getItem("testDetails");
    return storedDetails ? JSON.parse(storedDetails) : {};
  });

  const [currentTest, setCurrentTest] = useState(() => {
    const storedCurrentTest = localStorage.getItem("currentTest");
    return storedCurrentTest ? JSON.parse(storedCurrentTest) : null;
  });

  const [sections, setSections] = useState([]);
  const [guidelines, setGuidelines] = useState("");
  const [staffDetails, setStaffDetails] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { contestId } = useParams();
  const { assessment_type } = location.state || {};
  const [loading, setLoading] = useState(false);
  const API_BASE_URL =
    import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  const testConfiguration = {
    questions: 25,
    fullScreenMode: true,
    faceDetection: false,
    deviceRestriction: true,
    noiseDetection: false,
  };

  const testSettings = [
    {
      id: "fullScreen",
      title: "Full Screen Mode",
      description: "Force the test to run in full-screen mode.",
      enabled: currentTest?.fullScreenMode || false,
    },
    {
      id: "mobileAccess",
      title: "Mobile Access Restriction",
      description: "Restrict test access on mobile devices.",
      enabled: currentTest?.deviceRestriction || false,
    },
    {
      id: "resultVisibility",
      title: "Host Result Publishing",
      description: "Control when results are published.",
      enabled: currentTest?.resultVisibility === "Host Control",
    },
    {
      id: "shuffleQuestions",
      title: "Shuffling of Questions",
      description: "Randomize the order of questions.",
      enabled: currentTest?.shuffleQuestions || false,
    },
    {
      id: "shuffleOptions",
      title: "Shuffle Options",
      description: "Randomize the order of answer choices.",
      enabled: currentTest?.shuffleOptions || false,
    },
  ];

  useEffect(() => {
    const fetchSectionDetails = async () => {
      if (!contestId) return;
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/student/student_section_details/${contestId}/`
        );
        const data = await response.json();
        console.log("API Response:", data);

        if (data.sections) {
          const processedSections = data.sections.map((section) => ({
            ...section,
            duration: {
              hours: parseInt(section.duration?.hours || 0, 10),
              minutes: parseInt(section.duration?.minutes || 0, 10),
            },
          }));

          setSections(processedSections);
          localStorage.setItem(
            `sections_${contestId}`,
            JSON.stringify(processedSections)
          );
          setGuidelines(data.guidelines);

          if (data.staff_details) {
            setStaffDetails(data.staff_details);
          }

          setCurrentTest((prevTest) => {
            if (!prevTest) return prevTest;
            localStorage.setItem(
              `timingType_${contestId}`,
              data.timingType || "Overall"
            );
            localStorage.setItem(
              `totalDuration_${contestId}`,
              JSON.stringify(data.totalDuration || { hours: 0, minutes: 0 })
            );

            return {
              ...prevTest,
              timingType: data.timingType || "Overall",
              totalDuration: data.totalDuration || { hours: 0, minutes: 0 },
            };
          });
        }
      } catch (error) {
        console.error("Error fetching section details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSectionDetails();

    const storedSections = localStorage.getItem(`sections_${contestId}`);
    const storedTimingType = localStorage.getItem(`timingType_${contestId}`);
    const storedTotalDuration = localStorage.getItem(
      `totalDuration_${contestId}`
    );

    if (storedSections) {
      setSections(JSON.parse(storedSections));
    }

    if (storedTimingType && currentTest) {
      setCurrentTest((prev) => ({
        ...prev,
        timingType: storedTimingType,
      }));
    }

    if (storedTotalDuration && currentTest) {
      try {
        setCurrentTest((prev) => ({
          ...prev,
          totalDuration: JSON.parse(storedTotalDuration),
        }));
      } catch (e) {
        console.error("Error parsing stored total duration", e);
      }
    }
  }, [contestId, API_BASE_URL]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (window.history.state) {
        window.history.replaceState(null, "");
      }
    };
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      if (!loading) {
        navigate(-1);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loading, navigate]);

  const start_codingTest = async (contestId, studentId) => {
    try {
      const startTestResponse = await axios.post(
        `${API_BASE_URL}/api/start_test/`,
        {
          contest_id: contestId,
          student_id: studentId,
        }
      );

      console.log(
        "Fetched from start_test API:",
        startTestResponse.data.message
      );

      const saveReportResponse = await axios.post(
        `${API_BASE_URL}/api/save_coding_report/`,
        {
          contest_id: contestId,
          student_id: studentId,
        }
      );

      console.log(
        "Fetched from save_contest_report API:",
        saveReportResponse.data.message
      );
    } catch (error) {
      console.error("Error during API calls:", error);
      throw error;
    }
  };

  const start_mcqTest = async (contestId, studentId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/start_mcqtest/`, {
        contest_id: contestId,
        student_id: studentId,
      });
      console.log("Fetched from API:", response.data.message);

      let timingType = "Section";
      let totalDuration = { hours: 0, minutes: 0 };

      if (
        currentTest.sectionDetails === "Yes" &&
        sections &&
        sections.length > 0
      ) {
        const sectionHasDurations = sections.some((section) => {
          if (!section.duration) return false;

          if (typeof section.duration === "object") {
            return (
              parseInt(section.duration.hours || 0, 10) > 0 ||
              parseInt(section.duration.minutes || 0, 10) > 0
            );
          }
          return false;
        });

        if (sectionHasDurations) {
          timingType = "Section";
          const sectionDurations = sections.map((section) => {
            const hours = parseInt(section.duration?.hours || 0, 10);
            const minutes = parseInt(section.duration?.minutes || 0, 10);
            return {
              hours,
              minutes,
              totalSeconds: hours * 3600 + minutes * 60,
            };
          });

          localStorage.setItem(
            `sectionDurations_${contestId}`,
            JSON.stringify(sectionDurations)
          );
        } else {
          timingType = "Overall";
          const durationString = currentTest?.duration || "0 hours 0 minutes";
          const hoursMatch = durationString.match(/(\d+)\s*hours/);
          const minutesMatch = durationString.match(/(\d+)\s*minutes/);

          const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
          const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
          totalDuration = { hours, minutes };

          localStorage.setItem(
            `totalDuration_${contestId}`,
            JSON.stringify(totalDuration)
          );
          localStorage.setItem(
            `totalDurationSeconds_${contestId}`,
            (hours * 3600 + minutes * 60).toString()
          );
        }
      } else {
        timingType = "Overall";
        const durationString = currentTest?.duration || "0 hours 0 minutes";
        const hoursMatch = durationString.match(/(\d+)\s*hours/);
        const minutesMatch = durationString.match(/(\d+)\s*minutes/);

        const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
        totalDuration = { hours, minutes };

        localStorage.setItem(
          `totalDuration_${contestId}`,
          JSON.stringify(totalDuration)
        );
        localStorage.setItem(
          `totalDurationSeconds_${contestId}`,
          (hours * 3600 + minutes * 60).toString()
        );
      }

      setCurrentTest((prev) => ({
        ...prev,
        timingType,
        totalDuration,
      }));

      localStorage.setItem(`timingType_${contestId}`, timingType);
      console.log(`Set timing type for test ${contestId}: ${timingType}`);
      console.log(`Set total duration for test ${contestId}:`, totalDuration);

      if (currentTest.sectionDetails === "Yes") {
        navigate(`/section-based-mcq/${contestId}`, {
          state: {
            formData: {
              assessmentOverview: { sectionDetails: "Yes" },
              timingType: timingType,
            },
          },
        });
      } else {
        navigate(`/mcq/${contestId}`, {
          state: {
            contest_id: contestId,
            student_id: studentId,
            timingType: timingType,
          },
        });
      }
    } catch (error) {
      console.error("Error starting test:", error);
      throw error;
    }
  };

  const fetchMcqTests = async (regno) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/student/mcq-tests?regno=${regno}`,
        {
          withCredentials: true,
        }
      );

      const formattedTests = response.data.map((test) => {
        const { hours = 0, minutes = 0 } =
          test.testConfiguration?.duration || {};
        const duration = parseInt(hours) * 3600 + parseInt(minutes) * 60;
        const fullScreenMode = test.testConfiguration?.fullScreenMode || false;
        const faceDetection = test.testConfiguration?.faceDetection || false;
        const passPercentage = test.testConfiguration?.passPercentage || 0;

        localStorage.setItem(`testDuration_${test._id}`, duration);
        localStorage.setItem(`fullScreenMode_${test._id}`, fullScreenMode);
        localStorage.setItem(`faceDetection_${test._id}`, faceDetection);

        return {
          testId: test._id,
          name: test.assessmentOverview?.name || "Unknown Test",
          description:
            test.assessmentOverview?.description || "No description available.",
          starttime: test.assessmentOverview?.registrationStart || "No Time",
          endtime: test.assessmentOverview?.registrationEnd || "No Time",
          questions: parseInt(test.testConfiguration?.questions, 10) || 0,
          duration: `${hours} hours ${minutes} minutes`,
          passPercentage: passPercentage,
          assessment_type: "mcq",
          status: test.status,
          fullScreenMode,
          faceDetection,
          deviceRestriction: test.testConfiguration?.deviceRestriction || false,
          noiseDetection: test.testConfiguration?.noiseDetection || false,
          guidelines:
            test.assessmentOverview?.guidelines || "No guidelines available.",
          resultVisibility:
            test.testConfiguration?.resultVisibility || "Host Control",
          shuffleQuestions: test.testConfiguration?.shuffleQuestions || false,
          shuffleOptions: test.testConfiguration?.shuffleOptions || false,
          sectionDetails: test.assessmentOverview?.sectionDetails || "No",
          totalMarks: test.testConfiguration?.totalMarks || "0",
          noOfSections: test.no_of_section || "None",
          sectionName: test.sections?.sectionName || "None",
          fullScreenModeCount: test.testConfiguration?.fullScreenModeCount || 0,
          VisibleCount: test.visible_to ? test.visible_to.length : 0,
          staffID: test.staffId,
        };
      });

      return formattedTests;
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/studentlogin");
      } else {
        console.error("Failed to fetch test details");
        console.error("Error fetching test details:", err);
      }
    }
  };

  useEffect(() => {
    if (testDetails) {
      localStorage.setItem("testDetails", JSON.stringify(testDetails));
    }
    if (currentTest) {
      localStorage.setItem("currentTest", JSON.stringify(currentTest));
    }
  }, [testDetails, currentTest]);

  useEffect(() => {
    const studentId = localStorage.getItem("studentId");
    const fetchAndSetTestDetails = async () => {
      if (!studentId || !contestId) {
        console.error("Student ID or Contest ID is missing!");
        return;
      }

      try {
        const response = await fetchMcqTests(studentId);
        if (response && response.length > 0) {
          const parsedDetails = response.reduce((acc, test) => {
            acc[test.testId] = test;
            return acc;
          }, {});

          setTestDetails(parsedDetails);
          localStorage.setItem("testDetails", JSON.stringify(parsedDetails));

          if (parsedDetails[contestId]) {
            setCurrentTest(parsedDetails[contestId]);
          } else {
            console.error("Contest ID not found in test details!");
          }
        } else {
          console.error("No test details found for the student!");
        }
      } catch (error) {
        console.error("Error fetching test details:", error);
      }
    };

    fetchAndSetTestDetails();
  }, [contestId]);

// Add this to the handleStartTest function in TestInstruction.jsx

// Add this to your handleStartTest function

const handleStartTest = async () => {
  // Get studentId from localStorage
  const studentId = localStorage.getItem("studentId");
  if (!studentId) {
    console.error("Student ID not found in localStorage");
    return;
  }

  // Save the current time when the student starts the test
  const startTime = new Date().toISOString();
  localStorage.setItem(`startTime_${contestId}`, startTime);
  console.log(`Test start time saved: ${startTime}`);

  setLoading(true);
  try {
    if (assessment_type === "coding") {
      await start_codingTest(contestId, studentId);
      navigate(`/coding/${contestId}`, {
        state: { contest_id: contestId, student_id: studentId },
      });
    } else if (assessment_type === "mcq") {
      await start_mcqTest(contestId, studentId);
    }
  } catch (error) {
    console.error("Error starting test:", error);
  } finally {
    setLoading(false);
  }
};  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString(undefined, options);
  };

  console.log(currentTest);

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <Navbar />
      <div className="px-4 md:px-20">
        <main className="flex flex-col md:flex-row gap-4 pt-12 mb-4 items-stretch justify-stretch w-full">
          <section className="flex-1 flex flex-col items-stretch rounded-lg text-[#111933] gap-4">
            <div className="flex flex-col justify-center items-start bg-white rounded-xl shadow-md gap-4">
              <div className="p-6 pb-0">
                {loading ? (
                  <Skeleton variant="text" width={200} height={30} />
                ) : (
                  <p className="text-2xl font-semibold">{currentTest?.name}</p>
                )}
                {loading ? (
                  <Skeleton variant="text" width={400} height={20} />
                ) : (
                  <p className="text-md text-black break-words text-justify">
                    {currentTest?.description}
                  </p>
                )}
              </div>

              <div className="rounded-lg w-full flex items-start space-x-3 text-xs p-6 py-0">
                {loading ? (
                  <Skeleton variant="text" width={150} height={20} />
                ) : (
                  <p className="p-2 border-[#FFCC00] bg-[#FEF5DE] border rounded-full">
                    {" "}
                    {sections && "Section Based Test"}{" "}
                  </p>
                )}
                {loading ? (
                  <Skeleton variant="text" width={150} height={20} />
                ) : (
                  <p className="p-2 border-[#34D399] bg-[#E1F9F0] border rounded-full">
                    {" "}
                    {formatDate(currentTest?.starttime)}{" "}
                  </p>
                )}

                {loading ? (
                  <Skeleton variant="text" width={150} height={20} />
                ) : (
                  <p className="p-2 border-[#F87171] bg-[#FEEAEA] border rounded-full">
                    {" "}
                    {formatDate(currentTest?.endtime)}{" "}
                  </p>
                )}
              </div>

              <div className="border-t p-6 mt-2 w-full flex items-stretch border-gray-400">
                <div className="flex flex-col items-center flex-1 border-r border-gray-400">
                  <span>
                    <p className="text-xl font-semibold">
                      {" "}
                      {(() => {
                        console.log("Current test in renderer:", currentTest);

                        const timingType =
                          currentTest?.timingType ||
                          localStorage.getItem(`timingType_${contestId}`) ||
                          "Overall";

                        console.log("Timing type in renderer:", timingType);

                        if (timingType === "Section" && sections?.length > 0) {
                          const totalMinutes = sections.reduce(
                            (total, section) => {
                              const hours =
                                parseInt(section.duration?.hours || 0, 10) || 0;
                              const minutes =
                                parseInt(section.duration?.minutes || 0, 10) ||
                                0;
                              return total + hours * 60 + minutes;
                            },
                            0
                          );
                          const hours = Math.floor(totalMinutes / 60);
                          const minutes = totalMinutes % 60;
                          return `${
                            hours === 1 || hours === 0
                              ? `${hours} hr`
                              : `${hours} hrs`
                          } ${minutes} mins`;
                        } else {
                          if (
                            currentTest?.totalDuration &&
                            typeof currentTest.totalDuration === "object"
                          ) {
                            const hours = parseInt(
                              currentTest.totalDuration.hours || 0,
                              10
                            );
                            const minutes = parseInt(
                              currentTest.totalDuration.minutes || 0,
                              10
                            );
                            if (hours > 0 || minutes > 0) {
                              return `${
                                hours === 1 || hours === 0
                                  ? `${hours} hr`
                                  : `${hours} hrs`
                              } hrs ${minutes} mins`;
                            }
                          }

                          try {
                            const storedDuration = localStorage.getItem(
                              `totalDuration_${contestId}`
                            );
                            if (
                              storedDuration &&
                              storedDuration.includes("{")
                            ) {
                              const parsed = JSON.parse(storedDuration);
                              const hours = parseInt(parsed.hours || 0, 10);
                              const minutes = parseInt(parsed.minutes || 0, 10);
                              if (hours > 0 || minutes > 0) {
                                return `${
                                  hours === 1 || hours === 0
                                    ? `${hours} hr`
                                    : `${hours} hrs`
                                } ${minutes} mins`;
                              }
                            }
                          } catch (e) {
                            console.error("Error parsing stored duration:", e);
                          }

                          try {
                            const storedSeconds = localStorage.getItem(
                              `totalDurationSeconds_${contestId}`
                            );
                            if (storedSeconds) {
                              const totalSeconds = parseInt(storedSeconds, 10);
                              const hours = Math.floor(totalSeconds / 3600);
                              const minutes = Math.floor(
                                (totalSeconds % 3600) / 60
                              );
                              if (hours > 0 || minutes > 0) {
                                return `${
                                  hours === 1 || hours === 0
                                    ? `${hours} hr`
                                    : `${hours} hrs`
                                } ${minutes} mins`;
                              }
                            }
                          } catch (e) {
                            console.error("Error parsing stored seconds:", e);
                          }

                          if (typeof currentTest?.duration === "string") {
                            const hoursMatch =
                              currentTest.duration.match(/(\d+)\s*hours?/);
                            const minutesMatch =
                              currentTest.duration.match(/(\d+)\s*minutes?/);
                            const hours = hoursMatch
                              ? parseInt(hoursMatch[1], 10)
                              : 0;
                            const minutes = minutesMatch
                              ? parseInt(minutesMatch[1], 10)
                              : 0;
                            return `${
                              hours === 1 || hours === 0
                                ? `${hours} hr`
                                : `${hours} hrs`
                            } ${minutes} mins`;
                          }

                          return "0 hr 0 mins";
                        }
                      })()}{" "}
                    </p>
                    <p> Assessment Duration </p>
                  </span>
                </div>

                <div className="flex flex-col items-center flex-1 border-r border-gray-400">
                  <span>
                    <p className="text-xl font-semibold">
                      {" "}
                      {sections?.length > 0
                        ? sections.reduce(
                            (total, section) =>
                              total + (parseInt(section.numQuestions, 10) || 0),
                            0
                          )
                        : currentTest?.questions || 0}{" "}
                    </p>
                    <p> No of Questions </p>
                  </span>
                </div>

                <div className="flex flex-col items-center flex-1 border-r border-gray-400">
                  <span>
                    <p className="text-xl font-semibold">
                      {" "}
                      {currentTest?.totalMarks || 0}{" "}
                    </p>
                    <p> Total Mark </p>
                  </span>
                </div>

                <div className="flex flex-col items-center flex-1">
                  <span>
                    <p className="text-xl font-semibold">
                      {" "}
                      {currentTest?.passPercentage || 0}{" "}
                    </p>
                    <p> Pass Percentage </p>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-1">
              <section className="flex p-6 shadow-md flex-1 bg-[#ffffff] rounded-lg">
                <div className="flex-[2]">
                  <p className="text-2xl font-semibold text-[#111933] mb-2 pb-2 border-b border-gray-400 w-full">
                    Rules and Regulations
                  </p>
                  <p className="text-md font-semibold text-[#111933] mb-4">
                    Instructions: Read carefully; contact the Department for
                    clarifications.
                  </p>
                  <ul className="list-disc list-inside ml-2">
                    {guidelines?.split("\n").map((line, index) => (
                      <li
                        key={index}
                        className="text-md text-black break-words ml-3 text-justify"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>
          </section>

          <section className="flex flex-col items-stretch gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-md font-semibold">Test Setting</h2>
              <p className="text-sm text-gray-600 mb-4 border-b pb-4 border-gray-400">
                Security measures to ensure fair exam conduct
              </p>
              <div className="space-y-4">
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
                    <label className="relative inline-flex items-center cursor-default">
                      <input
                        type="checkbox"
                        checked={setting.enabled}
                        className="sr-only peer"
                        disabled
                      />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#111933] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-start bg-white text-[#111933] rounded-xl shadow-md p-4">
              <p className="text-[#111933] text-lg font-medium text-start w-full">
                Organizer's Details
              </p>
              <p className="pb-3 border-b border-gray-400 text-xs w-full">
                Contact information of the exam organizers.
              </p>
              <div className="flex flex-col space-y-7 w-full">
                <div className="flex mt-4 items-center">
                  <FaUser className="mr-2 text-gray-500" />
                  <label className="font-semibold mr-2">Name:</label>
                  <p>{staffDetails?.full_name || "N/A"}</p>
                </div>
                <div className="flex items-center">
                  <FaEnvelope className="mr-2 text-gray-500" />
                  <label className="font-semibold mr-2">Email:</label>
                  <p>{staffDetails?.email || "N/A"}</p>
                </div>
                <div className="flex items-center">
                  <FaPhoneAlt className="mr-2 text-gray-500" />
                  <label className="font-semibold mr-2">Mobile Number:</label>
                  <p>{staffDetails?.phone_no || "N/A"}</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {sections?.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="font-bold text-xl mb-2 text-[#111933]">
              Section Details
            </h1>
            <div className="border rounded-lg w-full border-gray-400">
              <table className="min-w-full bg-transparent rounded-lg overflow-hidden">
                <thead className="bg-[#F0F0F0] text-[#111933] py-2">
                  {[
                    "Section Name",
                    "No. of Questions",
                    "Duration",
                    "Mark Allotment",
                  ].map((title, index, array) => (
                    <th
                      key={index}
                      className={`relative font-normal py-3 my-2 px-6 text-center ${
                        index === 0
                          ? "rounded-tl-lg"
                          : index === 3
                          ? "rounded-tr-lg"
                          : ""
                      }`}
                    >
                      {title}
                      {index !== array.length - 1 && (
                        <span className="absolute h-full w-[1px] top-0 right-0 flex py-3">
                          {" "}
                          <span className="h-full w-full bg-gray-400"></span>{" "}
                        </span>
                      )}
                      {index !== 0 && (
                        <span className="absolute top-1/2 -translate-y-1/2 left-0 h-3/4 w-[1px] bg-gray-100"></span>
                      )}
                    </th>
                  ))}
                </thead>

                <tbody>
                  {sections?.map((section, index) => (
                    <tr
                      key={index}
                      className={`${
                        index !== 0 && "border-t"
                      } border-gray-300 hover:bg-gray-100`}
                    >
                      <td className="py-3 px-6 text-center">{section.name}</td>
                      <td className="py-3 px-6 text-center">
                        {section.numQuestions}
                      </td>
                      <td className="py-3 px-6 text-center">
                        {`${section.duration?.hours || 0} hrs ${
                          section.duration?.minutes || 0
                        } mins`}
                      </td>
                      <td className="py-3 px-6 text-center">
                        {section.mark_allotment}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-4 ">
          <span className="w-1/4"></span>
          <p className="w-2/4 text-center"> All The Best!! </p>
          <span className="w-1/4 flex justify-end items-center">
            <button
              onClick={handleStartTest}
              disabled={loading}
              className="px-7 p-2 rounded-lg bg-[#111933] border-[#111933] text-white border-[1px] hover:bg-[#12204b] flex items-center"
            >
              <span className="mr-2">Start Assessment</span>
              <Login fontSize="12" />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TestInstructions;
