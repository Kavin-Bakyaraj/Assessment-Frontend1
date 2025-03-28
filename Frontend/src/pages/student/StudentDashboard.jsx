import React, { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  Typography,
  Box,
  Container,
  Grid,
  Pagination,
} from "@mui/material";
import { styled } from "@mui/material";
import { FaSearch } from "react-icons/fa";
import TestCard from "./TestCard";
import axios from "axios";
import NoExams from "../../assets/testno.png";
import Award from "../../assets/AwardNew.png";
import backgroundImage from "../../assets/pattern.png";
import { useTestContext } from "./TestContext";
import image from "../../assets/student.svg";
import { useSearchParams } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const StyledTabs = styled(Tabs)({
  backgroundColor: "#ffff",
  borderRadius: "8px",
  "& .MuiTabs-indicator": {
    backgroundColor: "#111933",
    height: "2px",
    borderRadius: "2px",
  },
});

const StyledTab = styled(Tab)({
  textTransform: "none",
  fontSize: "16px",
  marginLeft: "6px",
  fontWeight: "600",
  color: "#64748b",
  padding: "12px 24px",
  "&.Mui-selected": {
    color: "#111933",
  },
  "&:hover": {
    backgroundColor: "#f1f5f9",
    borderRadius: "6px",
  },
});

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const DashboardHeader = styled(Box)(({ theme }) => ({
  borderRadius: "16px",
  padding: "48px",
  marginBottom: "17px",
  marginLeft: "-3%",
  width: "106%",
  color: "white",
  [theme.breakpoints.down("sm")]: {
    padding: "24px",
    marginBottom: "16px",
    marginLeft: 0,
    width: "100%",
  },
}));

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [openTests, setOpenTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [mcqTests, setMcqTests] = useState([]);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState({
    name: "",
    regno: "",
    email: "",
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 9;

  const fetchStudentData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/student/profile/`, {
        withCredentials: true,
      });
      const { name, regno, studentId, email } = response.data;
      setStudentData({ name, regno, studentId, email });

      localStorage.setItem("studentEmail", email);
      localStorage.setItem("studentName", name);

      const [openTestsData, mcqTestsData, codingReportsData, mcqReportsData] =
        await Promise.all([
          fetchOpenTests(regno),
          fetchMcqTests(regno),
          fetchCodingReports(),
          fetchMcqReports(),
        ]);

      const completedContestIds = new Set(
        codingReportsData
          .filter((report) => report.status === "Completed")
          .map((report) => report.contest_id)
      );
      const completedMcqTestIds = new Set(
        mcqReportsData
          .filter((report) => report.status === "Completed")
          .map((report) => report.contest_id)
      );
      const now = new Date();

      const allCompletedTests = [
        ...openTestsData.filter(
          (test) =>
            completedContestIds.has(test.contestId) ||
            now > new Date(test.endtime) ||
            test.Overall_Status === "closed"
        ),
        ...mcqTestsData.filter(
          (test) =>
            completedMcqTestIds.has(test.testId) ||
            now > new Date(test.endtime) ||
            test.Overall_Status === "closed"
        ),
      ];

      const completedTestIds = allCompletedTests.map(
        (test) => test.contestId || test.testId
      );
      const publishStatusResponse = await fetchPublishStatus(completedTestIds);

      const completedTestsWithPublishStatus = allCompletedTests.map((test) => {
        const testId = test.contestId || test.testId;
        return { ...test, ispublish: publishStatusResponse[testId] || false };
      });

      const ongoingCodingTests = openTestsData.filter(
        (test) =>
          !completedContestIds.has(test.contestId) &&
          now <= new Date(test.endtime) &&
          test.Overall_Status !== "closed"
      );

      const ongoingMcqTests = mcqTestsData.filter(
        (test) =>
          !completedMcqTestIds.has(test.testId) &&
          now <= new Date(test.endtime) &&
          test.Overall_Status !== "closed"
      );

      setOpenTests(ongoingCodingTests);
      setMcqTests(ongoingMcqTests);
      setCompletedTests(completedTestsWithPublishStatus);
    } catch (error) {
      console.error("Error fetching student data:", error);
    }
  };

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/student/profile/`, {
          withCredentials: true,
        });
        setStudentData(response.data);
  
        // Show password reset popup if `setpassword` is false
        if (!response.data.setpassword) {
          setShowPasswordPopup(true);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };
  
    fetchStudentProfile();
  }, []);
  
  // Handle password update
  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
  
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/student/set_new_password/`,
        { email: studentData.email, new_password: newPassword },
        { withCredentials: true }
      );
  
      toast.success("Password updated successfully! Please log in again.");
      setShowPasswordPopup(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };
  

  const fetchPublishStatus = async (testIds) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/student/check-publish-status/`,
        { testIds },
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching publish status:", error);
      return {};
    }
  };

  const fetchOpenTests = async (regno) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/student/tests?regno=${regno}`,
        {
          withCredentials: true,
        }
      );

      const formattedTests = response.data
        .map((test) => {
          const { hours, minutes } = test.testConfiguration.duration;
          const duration = parseInt(hours) * 3600 + parseInt(minutes) * 60;
          const fullScreenMode = test.testConfiguration.fullScreenMode;
          const faceDetection = test.testConfiguration.faceDetection;
          const deviceRestriction = test.testConfiguration.deviceRestriction;
          const noiseDetection = test.testConfiguration.noiseDetection;
          const fullScreenModeCount =
            test.testConfiguration.fullScreenModeCount;
          const passPercentage = test.testConfiguration?.passPercentage || "0";

          localStorage.setItem(`testDuration_${test.contestId}`, duration);
          localStorage.setItem(
            `fullScreenMode_${test.contestId}`,
            fullScreenMode
          );
          localStorage.setItem(
            `faceDetection_${test.contestId}`,
            faceDetection
          );
          localStorage.setItem(
            `deviceRestriction_${test.contestId}`,
            deviceRestriction
          );
          localStorage.setItem(
            `noiseDetection_${test.contestId}`,
            noiseDetection
          );
          localStorage.setItem(
            `fullScreenModeCount_${test.contestId}`,
            fullScreenModeCount
          );
          localStorage.setItem(`passPercentage_${test._id}`, passPercentage);

          return {
            contestId: test.contestId,
            name: test.assessmentOverview?.name || "Unknown Test",
            description:
              test.assessmentOverview?.description ||
              "No description available.",
            starttime: test.assessmentOverview?.registrationStart || "No Time",
            endtime: test.assessmentOverview?.registrationEnd || "No Time",
            problems: parseInt(test.testConfiguration?.questions, 10) || 0,
            assessment_type: "coding",
          };
        })
        .reverse();

      return formattedTests;
    } catch (error) {
      console.error("Error fetching open tests:", error);
      return [];
    }
  };

  const { testDetails, setTestDetails } = useTestContext();

  const fetchMcqTests = async (regno) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/student/mcq-tests?regno=${regno}`,
        {
          withCredentials: true,
        }
      );

      const formattedTests = response.data
        .map((test) => {
          const durationConfig = test.testConfiguration?.duration;
          const hours = parseInt(durationConfig?.hours || "0", 10);
          const minutes = parseInt(durationConfig?.minutes || "0", 10);
          const duration = hours * 3600 + minutes * 60;

          const fullScreenMode =
            test.testConfiguration?.fullScreenMode || false;
          const faceDetection = test.testConfiguration?.faceDetection || false;
          const deviceRestriction =
            test.testConfiguration?.deviceRestriction || false;
          const noiseDetection =
            test.testConfiguration?.noiseDetection || false;
          const fullScreenModeCount =
            test.testConfiguration?.fullScreenModeCount || 0;
          const faceDetectionCount =
            test.testConfiguration?.faceDetectionCount || 0;
          const noiseDetectionCount =
            test.testConfiguration?.noiseDetectionCount || 0;
          const passPercentage = test.testConfiguration?.passPercentage || "0";

          const resultVisibility =
            test.testConfiguration?.resultVisibility || "Unknown";

          if (test.testConfiguration) {
            setTestDetails((prevState) => ({
              ...prevState,
              [test._id]: {
                duration,
                fullScreenMode,
                faceDetection,
                deviceRestriction,
                noiseDetection,
                resultVisibility,
                fullScreenModeCount,
                faceDetectionCount,
                noiseDetectionCount,
                passPercentage,
              },
            }));
          }

          return {
            testId: test._id,
            name: test.assessmentOverview?.name || "Unknown Test",
            description:
              test.assessmentOverview?.description ||
              "No description available.",
            starttime: test.assessmentOverview?.registrationStart || "No Time",
            endtime: test.assessmentOverview?.registrationEnd || "No Time",
            questions: parseInt(test.testConfiguration?.questions || "0", 10),
            assessment_type: "mcq",
            duration: test.testConfiguration?.duration,
            status: test.status || "Unknown",
            Overall_Status: test.Overall_Status || null,
          };
        })
        .reverse();

      return formattedTests;
    } catch (error) {
      console.error("Error fetching MCQ tests:", error);
      return [];
    }
  };

  const fetchCodingReports = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/student/coding-reports/`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching coding reports:", error);
      return [];
    }
  };

  const fetchMcqReports = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/student/mcq-reports/`,
        {
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching MCQ reports:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  useEffect(() => {
    const hasRefreshed = localStorage.getItem("hasRefreshed");

    if (!hasRefreshed) {
      const timer = setTimeout(() => {
        localStorage.setItem("hasRefreshed", "true");
        window.location.reload();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
    setSearchParams({ page: "1", tab: newValue.toString() });
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    setSearchParams({ page: value.toString(), tab: activeTab.toString() });
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(1);
    setSearchParams({ page: "1", tab: activeTab.toString() });
  };

  const filteredOpenTests = openTests.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMcqTests = mcqTests.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompletedTests = completedTests.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPaginatedItems = (items) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page"));
    const tabFromUrl = Number(searchParams.get("tab"));
    if (pageFromUrl && pageFromUrl !== page) {
      setPage(pageFromUrl);
    }
    if (tabFromUrl !== undefined && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen px-2 md:px-2 bg-[#f4f6ff86]">
       <div>
       {/* Password Reset Popup */}
       <Dialog open={showPasswordPopup} maxWidth="sm" fullWidth>
         <DialogTitle>Set Your New Password</DialogTitle>
         <DialogContent>
           <TextField
             label="New Password"
             type="password"
             fullWidth
             variant="outlined"
             value={newPassword}
             onChange={(e) => setNewPassword(e.target.value)}
             margin="dense"
           />
         </DialogContent>
         <DialogActions>
           <Button onClick={handleUpdatePassword} color="primary" variant="contained" disabled={loading}>
             {loading ? "Updating..." : "Update Password"}
           </Button>
         </DialogActions>
       </Dialog>
     </div>
      <Container maxWidth="full" className="py-1 px-1 sm:px-4">
        <DashboardHeader className="mt-3 w-full">
          <div
            className="bg-white/90 rounded-xl pl-4 flex flex-col sm:flex-row items-center mb-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          >
            <div className="bg-blue rounded-full flex-shrink-0 mr-4">
              <img src={Award} className="h-10 w-10 bg-blue" alt="Award" />
            </div>
            <div className="flex items-center flex-grow">
              <div>
                <Typography
                  variant="h5"
                  className="font-semibold text-[#111933]"
                >
                  Welcome, {studentData.name}!
                </Typography>
                <Typography variant="h6" className="text-[#111933]">
                  Registration Number: {studentData.regno}
                </Typography>
              </div>
            </div>
            <div className="flex items-center ml-4">
              <img src={image} alt="Student" className="w-[300px] p-4" />
            </div>
          </div>
        </DashboardHeader>

        <Box className="bg-white rounded-xl shadow-sm  mb-16 mr-1 ml-1">
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            mb={4}
          >
            <StyledTabs
              value={activeTab}
              onChange={handleTabChange}
              marginLeft="1%"
            >
              <StyledTab label="Assigned to you" />
              <StyledTab label="Completed/Closed" />
            </StyledTabs>
            <div className="relative mt-4 md:mt-7 mr-6 w-full md:w-auto">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
                className="border-2 rounded-lg py-2 pl-10 pr-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full"
              />
            </div>
          </Box>

          <Box className="mt-6 md:p-6  sm:p-4">
            {activeTab === 0 && (
              <>
                <Typography
                  variant="h6"
                  className="font-bold text-gray-900 mb-8"
                  sx={{ marginBottom: "2rem !important", marginLeft: "0%" }}
                >
                  Active Assessments
                </Typography>
                <Grid container spacing={2}>
                  {getPaginatedItems([
                    ...filteredOpenTests,
                    ...filteredMcqTests,
                  ]).map((test) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={test.contestId || test.testId}
                    >
                      <TestCard
                        test={test}
                        assessment_type={test.assessment_type}
                        isCompleted={false}
                        studentId={studentData.studentId}
                      />
                    </Grid>
                  ))}
                  {filteredOpenTests.length === 0 &&
                    filteredMcqTests.length === 0 && (
                      <Box className="flex flex-col items-center justify-center py-12 w-full">
                        <img
                          src={NoExams}
                          alt="No Exams"
                          className="mb-6 w-48 h-48"
                        />
                        <Typography
                          variant="h6"
                          className="font-medium text-gray-900"
                        >
                          No tests found for this search query
                        </Typography>
                      </Box>
                    )}
                </Grid>
                {filteredOpenTests.length > 0 || filteredMcqTests.length > 0 ? (
                  <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination
                      count={Math.ceil(
                        (filteredOpenTests.length + filteredMcqTests.length) /
                          itemsPerPage
                      )}
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
                  </Box>
                ) : null}
              </>
            )}
            {activeTab === 1 && (
              <>
                <Typography
                  variant="h6"
                  className="font-bold text-gray-900 mb-8"
                  sx={{ marginBottom: "2rem !important", marginLeft: "0%" }}
                >
                  Completed Assessments
                </Typography>
                <Grid container spacing={2}>
                  {getPaginatedItems(filteredCompletedTests).map((test) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={test.contestId || test.testId}
                    >
                      <TestCard
                        test={test}
                        assessment_type={test.assessment_type}
                        isCompleted={true}
                        studentId={studentData.studentId}
                        isPublished={test.ispublish}
                      />
                    </Grid>
                  ))}
                  {filteredCompletedTests.length === 0 && (
                    <Box className="flex flex-col items-center justify-center py-12 w-full">
                      <img
                        src={NoExams}
                        alt="No Exams"
                        className="mb-6 w-48 h-48"
                      />
                      <Typography
                        variant="h6"
                        className="font-medium text-gray-900"
                      >
                        No completed assessments yet
                      </Typography>
                    </Box>
                  )}
                </Grid>
                {filteredCompletedTests.length > 0 ? (
                  <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination
                      count={Math.ceil(
                        filteredCompletedTests.length / itemsPerPage
                      )}
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
                  </Box>
                ) : null}
              </>
            )}
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default StudentDashboard;
