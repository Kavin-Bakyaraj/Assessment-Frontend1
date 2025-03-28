import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  DialogActions,
  Typography,
  Grid,
  Box,
  Pagination,
  Skeleton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TestCard from "../../components/staff/TestCard";
import CreateTestCard from "../../components/staff/CreaTestCard";
import api from "../../axiosConfig";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { format } from "date-fns-tz";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import notest from "../../assets/testno.png";
import dashboard2 from "../../assets/dashboard2.svg";
import dashboard4 from "../../assets/dashboard4.svg";
import Test_Created from "../../assets/test_created.svg";
import Live from "../../assets/Live.svg";
import Upcoming from "../../assets/upcoming.svg";
import graph from "../../assets/graph.svg";
import { formatInTimeZone } from "date-fns-tz";
import mcq from "../../assets/mcq.png";
import code from "../../assets/code.png";
import bg from "../../assets/bgpattern.svg";
import Cookies from "js-cookie";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [stats, setStats] = useState({
    totalTests: 0,
    students: 0,
    liveTests: 0,
    completedTests: 0,
    upcomingTest: 0,
  });

  const [tests, setTests] = useState([]);
  const [mcqTests, setMcqTests] = useState([]);
  const [activeFilter, setActiveFilter] = useState(
    () => searchParams.get("filter") || "All"
  ); // Initialize from URL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(() => Number(searchParams.get("page")) || 1);
  const [clickCount, setClickCount] = useState(0);
  const [showToggle, setShowToggle] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [contestResponse, studentStatsResponse, mcqResponse] =
        await Promise.all([
          api.get("/contests", { withCredentials: true }),
          api.get("/students/stats", { withCredentials: true }),
          api.get("/mcq", { withCredentials: true }),
        ]);
      const codingTests = contestResponse?.data?.contests || [];
      const mcqAssessments = mcqResponse?.data?.assessments || [];

      const reversedCodingTests = [...codingTests].reverse();
      const reversedMcqTests = [...mcqAssessments].reverse();

      const totalTests = codingTests.length + mcqAssessments.length;
      const liveTests = [...codingTests, ...mcqAssessments].filter(
        (test) => test.status === "Live"
      ).length;
      const completedTests = [...codingTests, ...mcqAssessments].filter(
        (test) =>
          test.status === "Completed" ||
          test.status === "Closed" ||
          test.overall_status === "closed" ||
          (test.testEndDate && new Date(test.testEndDate) < new Date())
      ).length;
      const upcomingTests = [...codingTests, ...mcqAssessments].filter(
        (test) => test.status === "Upcoming"
      ).length;

      setStats({
        totalTests,
        students: studentStatsResponse?.data?.total_students || 0,
        liveTests,
        completedTests,
        upcomingTest: upcomingTests,
      });

      setTests(reversedCodingTests);
      setMcqTests(reversedMcqTests);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch test data. Please try again later.");
      toast.error("Failed to fetch test data. Please try again later.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      navigate("/stafflogin");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const state = location.state;
    if (state && state.testStatus === "closed") {
      fetchData();
    }
  }, [location, fetchData]);

  const filteredTests = useMemo(() => {
    const allTests = [...tests, ...mcqTests].map((test) => {
      const currentUTC = new Date(
        formatInTimeZone(new Date(), "Asia/Kolkata", "yyyy-MM-dd'T'HH:mm:ss'Z'")
      ).getTime();
      const startUTC = new Date(test.registrationStart).getTime();
      const endUTC = new Date(test.endDate).getTime();

      let status;
      if (
        test.status === "Completed" ||
        test.status === "Closed" ||
        test.overall_status === "closed"
      ) {
        status = "Completed";
      } else if (currentUTC < startUTC) {
        status = "Upcoming";
      } else if (currentUTC >= startUTC && currentUTC <= endUTC) {
        status = "Live";
      } else {
        status = "Completed";
      }

      return { ...test, currentStatus: status };
    });

    if (activeFilter === "All") {
      return allTests.filter((test) =>
        (test.assessmentName || test.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    return allTests.filter(
      (test) =>
        test.currentStatus === activeFilter &&
        (test.assessmentName || test.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [tests, mcqTests, activeFilter, searchQuery]);

  useEffect(() => {
    const calculateTestCounts = () => {
      const allTests = [...tests, ...mcqTests];
      const liveTests = allTests.filter((test) => {
        const currentUTC = new Date(
          formatInTimeZone(
            new Date(),
            "Asia/Kolkata",
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          )
        ).getTime();
        const startUTC = new Date(test.registrationStart).getTime();
        const endUTC = new Date(test.endDate).getTime();
        return (
          currentUTC >= startUTC &&
          currentUTC <= endUTC &&
          test.status !== "Completed" &&
          test.status !== "Closed" &&
          test.overall_status !== "closed"
        );
      }).length;

      const completedTests = allTests.filter((test) => {
        const currentUTC = new Date(
          formatInTimeZone(
            new Date(),
            "Asia/Kolkata",
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          )
        ).getTime();
        const endUTC = new Date(test.endDate).getTime();
        return (
          currentUTC > endUTC ||
          test.status === "Completed" ||
          test.status === "Closed" ||
          test.overall_status === "closed"
        );
      }).length;

      const upcomingTests = allTests.filter((test) => {
        const currentUTC = new Date(
          formatInTimeZone(
            new Date(),
            "Asia/Kolkata",
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          )
        ).getTime();
        const startUTC = new Date(test.registrationStart).getTime();
        return (
          currentUTC < startUTC &&
          test.status !== "Completed" &&
          test.status !== "Closed" &&
          test.overall_status !== "closed"
        );
      }).length;

      setStats((prevStats) => ({
        ...prevStats,
        liveTests,
        completedTests,
        upcomingTest: upcomingTests,
      }));
    };

    calculateTestCounts();
  }, [tests, mcqTests]);

  const getItemsPerPage = useCallback(() => {
    return activeFilter === "All" ? 8 : 9;
  }, [activeFilter]);

  const paginatedTests = useMemo(() => {
    const currentItemsPerPage = getItemsPerPage();
    return filteredTests.slice(
      (page - 1) * currentItemsPerPage,
      page * currentItemsPerPage
    );
  }, [filteredTests, page, getItemsPerPage]);

  const filterTests = useCallback(
    (status) => {
      setActiveFilter(status);
      setPage(1);
      setSearchParams({ page: "1", filter: status }); // Include filter in URL
    },
    [setSearchParams]
  );

  const handleModalClose = () => setIsModalOpen(false);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
    setSearchParams({ page: "1", filter: activeFilter }); // Preserve filter
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    setSearchParams({ page: value.toString(), filter: activeFilter }); // Preserve filter
  };

  const handleTestCardClick = (contestId) => {
    navigate(`/test/${contestId}`, {
      state: { fromPage: page, fromFilter: activeFilter },
    });
  };

  useEffect(() => {
    const state = location.state;
    if (state && state.toastMessage) {
      toast.success(state.toastMessage);
      window.history.replaceState({}, document.title);
    }
    const pageFromUrl = Number(searchParams.get("page"));
    const filterFromUrl = searchParams.get("filter");
    if (pageFromUrl && pageFromUrl !== page) {
      setPage(pageFromUrl);
    }
    if (filterFromUrl && filterFromUrl !== activeFilter) {
      setActiveFilter(filterFromUrl);
    }
  }, [location, searchParams]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleOverallStatsClick = () => {
    setClickCount((prevCount) => {
      const newCount = prevCount + 1;
      if (newCount === 15) {
        setShowToggle(true);
      }
      return newCount;
    });
  };

  const toggleDropdown = () => {
    if (isMobile) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };
  const userName = (Cookies.get("username") || "username").toUpperCase();

  return (
    <div
      className={`min-h-screen p-16 md:px-1 -mx-1 py-20 bg-[#ecf2fe] bg-cover bg-top`}
      style={{
        backgroundColor: "#ecf2fe",
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition:"top",
      }}
    >
      <div className="mt-10">
      <ToastContainer />
      <spam className="md:mx-20 font-bold text-2xl mt-10 text-[#111933]">
        WELCOME, {userName.toUpperCase()}
      </spam>
      <spam className="text-lg md:mx-20 text-gray-600 mb-2 flex">
        Your academic insights are here!
      </spam>

      <div className="bg-white md:mx-16 rounded-2xl p-6 mt-5">
        <div
          className="flex justify-between items-center cursor-default"
          onClick={toggleDropdown}
        >
          <h2 className="text-3xl text-[#111933] pb-5 font-bold">
            Overall Stats
          </h2>
          {isMobile && (
            <button className="text-[#fff] p-2 rounded-lg mb-6 bg-[#111933] focus:outline-none">
              {isDropdownOpen ? "Hide" : "Show"} Stats
            </button>
          )}
        </div>

        {(isDropdownOpen || !isMobile) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: "Test Created",
                value: stats.totalTests,
                icon: Test_Created,
              },
              { title: "Live Test", value: stats.liveTests, icon: Live },
              {
                title: "Completed Test",
                value: stats.completedTests,
                icon: dashboard4,
              },
              {
                title: "Upcoming Test",
                value: stats.upcomingTest,
                icon: Upcoming,
              },
              {
                title: "Total Students",
                value: stats.students,
                icon: dashboard2,
              },
            ].map(({ title, value, icon }, index) => (
              <div
                key={index}
                className="relative bg-white border-2 rounded-lg shadow-lg p-4 w-full hover:shadow-xl transition duration-300"
              >
                <div className="absolute -top-5 -right-4 flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md">
                  <div className="flex items-center justify-center w-6 h-10 rounded-full overflow-hidden">
                    <img src={icon} alt={title} />
                  </div>
                </div>
                <div className="flex flex-col items-start justify-between h-full">
                  <div>
                    {isLoading ? (
                      <Skeleton variant="text" width={35} height={30} />
                    ) : (
                      <p className="text-2xl font-medium text-[#111933]">
                        {value}
                      </p>
                    )}
                    {isLoading ? (
                      <Skeleton variant="text" width={100} height={30} />
                    ) : (
                      <p className="text-[#111933] text-md font-medium mt-1 whitespace-nowrap">
                        {title}
                      </p>
                    )}
                  </div>
                  <div className="h-16 -mt-8">
                    <img
                      src={graph}
                      alt="Graph"
                      className="w-full h-36 ml-16"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`max-w-full mx-auto px-10 ${isDarkMode ? "text-white" : ""}`}
      >
        <div className="flex flex-col md:flex-row flex-wrap -mx-2 justify-between mt-10 items-center mb-10">
          <div className="flex flex-wrap text-base gap-4 md:ml-5 md:mb-0">
            {["All", "Live", "Completed", "Upcoming"].map((status) => (
              <button
                key={status}
                className={`mx-2 md:mx-4 mb-2 md:mb-0 ${
                  activeFilter === status
                    ? "border-b-2 border-yellow-500 text-black font-extrabold text-lg"
                    : "text-gray-600 hover:text-gray-900 font-bold"
                } ${isDarkMode ? "text-white" : ""}`}
                onClick={() => filterTests(status)}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative mx-4 md:mr-7 md:mx-0 mb-5 md:mb-0 w-full md:w-1/4">
            <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
              className={`border-2 rounded-lg py-2 pl-12 pr-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full`}
            />
          </div>
        </div>

        <div
          className={`max-w-full md:ml-4 md:mr-4 grid rounded-2xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4 sm:p-5 md:p-9 gap-3 sm:gap-4 md:gap-5 ${
            isDarkMode ? "bg-black" : "bg-white"
          }`}
        >
          {activeFilter === "All" && searchQuery === "" && <CreateTestCard />}
          {isLoading ? (
            Array.from({ length: getItemsPerPage() }).map((_, index) => (
              <TestCard key={index} isLoading={true} isDarkMode={isDarkMode} />
            ))
          ) : paginatedTests.length > 0 ? (
            paginatedTests.map((test) => (
              <TestCard
                key={test._id}
                contestId={test.contestId}
                title={test.name}
                type={test.type}
                date={format(new Date(test.endDate), "MM/dd/yyyy")}
                time={formatInTimeZone(
                  new Date(test.endDate),
                  "UTC",
                  "hh:mm a"
                )}
                stats={{
                  Assigned: test.assignedCount || 0,
                  "Yet to Complete": Math.max(
                    (test.assignedCount || 0) - (test.completedCount || 0),
                    0
                  ),
                  Completed: test.completedCount || 0,
                }}
                registrationStart={test.registrationStart}
                endDate={test.endDate}
                status={test.status}
                isDarkMode={isDarkMode}
                onClick={() => handleTestCardClick(test.contestId)}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-8">
              <img
                src={notest}
                alt="No tests found"
                className="h-48 sm:h-64 object-contain"
              />
              <p
                className={`${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                } text-base sm:text-lg mt-4`}
              >
                No tests found
              </p>
            </div>
          )}
          <div className="col-span-full flex justify-center mt-6 w-full">
            {filteredTests.length > 0 && (
              <div className="w-full flex justify-center mt-6">
                <Pagination
                  count={Math.ceil(filteredTests.length / getItemsPerPage())}
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
          </div>
        </div>
      </div>

      <Dialog
        open={isModalOpen}
        onClose={handleModalClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            padding: "16px",
            backgroundColor: isDarkMode ? "gray-800" : "white",
            color: isDarkMode ? "white" : "black",
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" align="center" fontWeight="bold">
            Select Test Type
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleModalClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  height: "250px",
                  border: "1px solid #E0E0E0",
                  borderRadius: "24px",
                  cursor: "pointer",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    backgroundColor: "#f9faff",
                    transform: "scale(1.05)",
                    boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.15)",
                  },
                  backgroundColor: isDarkMode ? "gray-800" : "white",
                  color: isDarkMode ? "white" : "black",
                }}
                onClick={() => {
                  navigate("/mcq/details");
                  handleModalClose();
                }}
              >
                <img
                  src={mcq}
                  alt="Skill Assessment"
                  style={{ maxWidth: "80px", margin: "0 auto" }}
                />
                <Typography variant="h6" mt={3}>
                  Skill Assessment
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Evaluations to test knowledge and skills across different
                  topics
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  height: "250px",
                  border: "1px solid #E0E0E0",
                  borderRadius: "24px",
                  cursor: "pointer",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    backgroundColor: "#f9faff",
                    transform: "scale(1.05)",
                    boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.15)",
                  },
                  backgroundColor: isDarkMode ? "gray-800" : "white",
                  color: isDarkMode ? "white" : "black",
                }}
                onClick={() => {
                  navigate("/coding/details");
                  handleModalClose();
                }}
              >
                <img
                  src={code}
                  alt="Code Contest"
                  style={{ maxWidth: "80px", margin: "0 auto" }}
                />
                <Typography variant="h6" mt={3}>
                  Code Contest
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Challenges to assess programming and problem-solving skills
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", mt: 3 }}>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ textAlign: "center", width: "100%", marginBottom: "16px" }}
          >
            You can select a test type to proceed or close the dialog.
          </Typography>
        </DialogActions>
      </Dialog>

      {showToggle && (
        <button
          className="fixed bottom-4 right-4 bg-[#000a7500] text-transparent p-2 rounded-full"
          onClick={toggleDarkMode}
        >
          Toggle
        </button>
      )}
    </div>
    </div>
  );
};

export default Dashboard;
