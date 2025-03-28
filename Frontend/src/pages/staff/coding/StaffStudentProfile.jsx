import React, { useState, useRef, useEffect } from "react";
import { Pagination } from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { IoCloseCircleOutline } from "react-icons/io5";
import { FaCheckCircle } from "react-icons/fa";
import { Typography, Box, Chip, Skeleton } from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import bg from "../../../assets/bgpattern.svg";

const normalizeString = (str) => {
  if (!str) return "";
  return str.toString().replace(/[&]/g, "").toLowerCase();
};

const StaffStudentProfile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(
    () => Number(searchParams.get("page")) || 1
  );
  const [studentsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [staffDepartment, setStaffDepartment] = useState([]);
  const [staffRole, setStaffRole] = useState("");
  const [staffCollege, setStaffCollege] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [collegeFilter, setCollegeFilter] = useState([]);
  const [yearFilter, setYearFilter] = useState([]);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const dataFetchedRef = useRef(false);

  const yearMapping = {
    I: "1st Year",
    II: "2nd Year",
    III: "3rd Year",
    IV: "4th Year",
  };

  useEffect(() => {
    localStorage.setItem("departmentFilter", JSON.stringify(departmentFilter));
  }, [departmentFilter]);

  useEffect(() => {
    localStorage.setItem("collegeFilter", JSON.stringify(collegeFilter));
  }, [collegeFilter]);

  useEffect(() => {
    localStorage.setItem("yearFilter", JSON.stringify(yearFilter));
  }, [yearFilter]);

  useEffect(() => {
    // Only fetch data if it hasn't been fetched before
    if (dataFetchedRef.current) return;
  
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching students data...");
        const response = await fetch(`${API_BASE_URL}/studentprofile/`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        if (!response.ok) {
          if (response.status === 401) {
            toast.error("Session expired. Please login again.");
            navigate("/stafflogin");
            return;
          }
          throw new Error("Failed to fetch students");
        }
  
        const data = await response.json();
        console.log("API Response:", data);
  
        if (Array.isArray(data.students)) {
          setStudents(data.students);
          
          // Ensure staffDepartment is always an array
          if (data.staffDepartment) {
            // If it's already an array, use it
            if (Array.isArray(data.staffDepartment)) {
              setStaffDepartment(data.staffDepartment);
            } 
            // If it's a string, convert it to an array with one element
            else if (typeof data.staffDepartment === 'string') {
              setStaffDepartment([data.staffDepartment]);
            } 
            // Otherwise initialize as empty array
            else {
              setStaffDepartment([]);
            }
          } else {
            setStaffDepartment([]);
          }
          
          setStaffRole(data.staffRole || "");
          setStaffCollege(data.staffCollege || "");
  
          // Set initial department filter to empty array for all roles
          setDepartmentFilter([]);
  
          // Mark data as fetched
          dataFetchedRef.current = true;
        } else {
          console.error("Invalid data format received:", data);
          toast.error("Invalid data received from server");
          setStudents([]);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error(error.message || "Failed to fetch students");
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchStudents();
  }, [API_BASE_URL, navigate]);

// Update the department matching logic in the filteredStudents function

const filteredStudents = students
  .filter((student) => {
    const searchLower = normalizeString(searchTerm);
    const matchesSearch =
      searchLower === "" ||
      normalizeString(student.name).includes(searchLower) ||
      normalizeString(student.regno).includes(searchLower) ||
      normalizeString(student.dept || student.department).includes(
        searchLower
      ) ||
      normalizeString(student.collegename || student.college_name).includes(
        searchLower
      );

    const studentDept = student.dept || "";
    const studentCollege = student.collegename || "";

    let matchesDepartment;
    if (departmentFilter.length === 0) {
      // If no department filter is applied, non-admin staff should only see students from their departments
      if (staffRole === "Admin" || staffRole === "Principal") {
        matchesDepartment = true; // Admin/Principal can see all departments if no filter is applied
      } else {
        // Make sure staffDepartment is treated as an array
        if (!Array.isArray(staffDepartment)) {
          // If it's a string, check if student department matches it
          matchesDepartment = typeof staffDepartment === 'string' && 
            normalizeString(studentDept).includes(normalizeString(staffDepartment));
        } else {
          // Normal array check
          matchesDepartment = staffDepartment.some((dept) =>
            normalizeString(studentDept).includes(normalizeString(dept))
          );
        }
      }
    } else {
      // If a department filter is applied, only show students from the selected departments
      matchesDepartment = departmentFilter.some((filter) =>
        normalizeString(studentDept).includes(normalizeString(filter))
      );
    }

    // Rest of your filter logic remains unchanged
    const matchesCollege =
      staffRole === "Admin"
        ? collegeFilter.length === 0 ||
        collegeFilter.some((filter) =>
          normalizeString(studentCollege).includes(normalizeString(filter))
        )
        : normalizeString(studentCollege).includes(
          normalizeString(staffCollege)
        );

    const matchesYear =
      yearFilter.length === 0 || yearFilter.includes(student.year);

    return (
      matchesSearch && matchesDepartment && matchesCollege && matchesYear
    );
  })

    .sort((a, b) => {
      const searchLower = normalizeString(searchTerm);

      // If no search term or sort key, apply default sortConfig
      if (!searchLower && sortConfig.key) {
        const getFieldValue = (obj, key) => {
          if (key === "dept") return obj.department || obj.dept;
          if (key === "collegename") return obj.college_name || obj.collegename;
          return obj[key];
        };
        const aValue = getFieldValue(a, sortConfig.key);
        const bValue = getFieldValue(b, sortConfig.key);
        const isAsc = sortConfig.direction === "ascending" ? 1 : -1;
        if (typeof aValue === "string" && typeof bValue === "string") {
          return (
            isAsc * aValue.toLowerCase().localeCompare(bValue.toLowerCase())
          );
        }
        return isAsc * (aValue < bValue ? -1 : 1);
      }

      // Prioritize names starting with search term
      const aStartsWith = normalizeString(a.name).startsWith(searchLower);
      const bStartsWith = normalizeString(b.name).startsWith(searchLower);

      if (aStartsWith && !bStartsWith) return -1; // a comes first
      if (!aStartsWith && bStartsWith) return 1; // b comes first

      // If both or neither start with the search term, sort alphabetically by name
      return normalizeString(a.name).localeCompare(normalizeString(b.name));
    });

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / studentsPerPage)
  );

  const yearCounts = ["I", "II", "III", "IV"].reduce((acc, year) => {
    acc[year] = students.filter((student) => student.year === year).length;
    return acc;
  }, {});

  const handleFilterDialogOpen = () => {
    setOpenFilterDialog(true);
  };

  const applyFilters = () => {
    setOpenFilterDialog(false);
    setSearchParams({ page: currentPage.toString() });
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setDepartmentFilter([]);
    setCollegeFilter([]);
    setYearFilter([]);
    setOpenFilterDialog(false);
    setSearchParams({ page: "1" });
  };

  const handleFilterDialogClose = () => {
    setOpenFilterDialog(false);
  };

  const toggleFilter = (filterType, value) => {
    if (filterType === "dept" && staffDepartment.includes(value)) {
      setDepartmentFilter((prevFilters) => {
        const newFilters = prevFilters.includes(value)
          ? prevFilters.filter((filter) => filter !== value)
          : [...prevFilters, value];
        setSearchParams({ page: "1" });
        return newFilters;
      });
    } else if (filterType === "collegename" && staffRole === "Admin") {
      setCollegeFilter((prevFilters) => {
        const newFilters = prevFilters.includes(value)
          ? prevFilters.filter((filter) => filter !== value)
          : [...prevFilters, value];
        setSearchParams({ page: "1" });
        return newFilters;
      });
    } else if (filterType === "year") {
      setYearFilter((prevFilters) => {
        const newFilters = prevFilters.includes(value)
          ? prevFilters.filter((filter) => filter !== value)
          : [...prevFilters, value];
        setSearchParams({ page: "1" });
        return newFilters;
      });
    }
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    setSearchParams({ page: page.toString() });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSearchParams({ page: "1" });
  };

  const handleViewReport = (regno) => {
    // Use registration_number or regno based on what's available
    navigate(`/studentstats/${regno}`, { state: { fromPage: currentPage } });
  };

  useEffect(() => {
    const pageFromUrl = Number(searchParams.get("page"));
    if (pageFromUrl && pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [searchParams, currentPage]);

  const areFiltersApplied = () => {
    if (staffRole !== "Admin" && staffRole !== "Principal") {
      return collegeFilter.length > 0 || yearFilter.length > 0;
    }
    return (
      departmentFilter.length > 0 ||
      collegeFilter.length > 0 ||
      yearFilter.length > 0
    );
  };

  if (isLoading) {
    return (
      <div
        className="bg-[#ecf2fe] py-10 md:px-2 px-5 rounded-lg shadow-md"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="p-6 ml-16 mr-14 min-h-screen">
          <h1 className="text-2xl font-bold text-[#111933] mb-4">
            Academic Profile Management
          </h1>

          <p className="text-[#111933] mb-6">
            A comprehensive platform for analyzing and overseeing profiles
            across academic cohorts.
          </p>

          {/* Table skeleton */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="relative rounded-3xl">
                <input
                  type="text"
                  placeholder="Search..."
                  className="border-2 rounded-lg py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#111933",
                    color: "#fff",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span style={{ marginRight: "8px" }}>Filter</span>
                  <FilterListIcon />
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#111933",
                    color: "#fff",
                    borderRadius: "10px",
                    "&:hover": {
                      backgroundColor: "#fff",
                      color: "#111933",
                    },
                  }}
                >
                  <ClearIcon className="mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden">
              <div className="grid grid-cols-6 gap-4 p-4 bg-[#F0F0F0] text-[#111933] font-medium">
                <p className="flex items-center cursor-pointer">Name</p>
                <p className="flex items-center justify-left cursor-pointer">Register Number</p>
                <p className="flex items-center justify-left cursor-pointer">Department</p>
                <p className="flex items-center justify-left cursor-pointer">College Name</p>
                <p className="flex items-center justify-left cursor-pointer">Year</p>
                <p className="flex justify-left ml-2">Report</p>
              </div>

              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <div key={item} className="grid grid-cols-6 gap-4 p-4 border-t">
                  {[1, 2, 3, 4, 5, 6].map((cell) => (
                    <Skeleton
                      key={cell}
                      variant="text"
                      width="80%"
                      height={24}
                      className="mx-auto"
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <Skeleton
                variant="rectangular"
                width={300}
                height={40}
                sx={{ borderRadius: "16px" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div
      className="bg-[#ecf2fe] py-16 md:px-2 px-5 rounded-lg shadow-md"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="md:p-6 md:ml-16 md:mr-14 min-h-screen mt-10">
        <h1 className="text-2xl font-bold text-[#111933] mb-4">
          Academic Profile Management
        </h1>

        <p className="text-[#111933] mb-6">
          A comprehensive platform for analyzing and overseeing profiles across
          academic cohorts.
        </p>

        {/* <div className="grid grid-cols-2 mb-11 mt-11 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {Object.entries(yearCounts).map(([year, count]) => (
            <div
              key={year}
              className="relative bg-white rounded-lg mb-4 shadow-lg p-6 max-w-[250px] mx-auto w-full flex flex-col items-center hover:shadow-xl transition duration-300"
            >
              <div className="absolute -top-5 -right-5 flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-md">
                <div className="flex items-center justify-center w-11 h-11 bg-yellow-500 rounded-full">
                  <SchoolIcon sx={{ color: "#111933" }} />
                </div>
              </div>
              <p className="text-gray-700 text-lg font-medium mt-2"><span className="font-bold">{year} Year's </span></p>
              <p className="text-3xl font-bold text-[#111933]">{count}</p>
            </div>
          ))}
        </div> */}

        <div className="bg-white md:p-6 rounded-xl shadow-lg ">
          <div className="p-3 md:p-6 border border-gray-300 rounded-xl">
            <div className="md:flex justify-between items-center mb-6">
              <div className="flex-1 text-[#111933] mb-4 md:mb-0">
                <p className="font-bold text-lg mb-2">All Student List</p>
                <p className="text-sm">
                  A detailed table for managing and reviewing student profiles
                  across academic batches.
                </p>
              </div>
              <div className="flex flex-1 justify-between items-center gap-x-2 md:gap-x-5">
                <div className="relative rounded-3xl flex-1">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="border-2 text-sm rounded-lg py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleFilterDialogOpen}
                    variant="contained"
                    sx={{
                      backgroundColor: "#111933",
                      color: "#fff",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span className="mr-2 hidden md:block">Filter</span>
                    <FilterListIcon />
                  </Button>
                  {areFiltersApplied() && (
                    <Button
                      onClick={clearFilters}
                      variant="contained"
                      sx={{
                        backgroundColor: "#111933",
                        color: "#fff",
                        borderRadius: "10px",
                        "&:hover": {
                          backgroundColor: "#fff",
                          color: "#111933",
                        },
                      }}
                    >
                      <ClearIcon className="mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl text-xs md:text-base border overflow-x-auto">
              <table className="bg-white rounded-xl border w-full table-auto min-w-[800px]">
                <thead>
                  <tr className="bg-[#F0F0F0] text-[#111933] font-semibold border-b">
                    <th
                      className="py-4 md:px-6 text-left cursor-pointer min-w-[150px] md:min-w-[200px] max-w-full"
                      onClick={() => requestSort("name")}
                    >
                      Name
                      {sortConfig.key === "name" ? (
                        sortConfig.direction === "ascending" ? (
                          <FontAwesomeIcon icon={faSortUp} className="ml-3" />
                        ) : (
                          <FontAwesomeIcon icon={faSortDown} className="ml-3" />
                        )
                      ) : (
                        <FontAwesomeIcon icon={faSort} className="ml-3" />
                      )}
                    </th>
                    <th
                      className="py-4 md:px-6 text-left cursor-pointer min-w-[150px] md:min-w-[200px] max-w-full"
                      onClick={() => requestSort("regno")}
                    >
                      Register Number
                      {sortConfig.key === "regno" ? (
                        sortConfig.direction === "ascending" ? (
                          <FontAwesomeIcon icon={faSortUp} className="ml-3" />
                        ) : (
                          <FontAwesomeIcon icon={faSortDown} className="ml-3" />
                        )
                      ) : (
                        <FontAwesomeIcon icon={faSort} className="ml-3" />
                      )}
                    </th>
                    <th
                      className="py-4 md:px-6 text-center cursor-pointer min-w-[150px] md:min-w-[200px] max-w-full"
                      onClick={() => requestSort("dept")}
                    >
                      Department
                      {sortConfig.key === "dept" ? (
                        sortConfig.direction === "ascending" ? (
                          <FontAwesomeIcon icon={faSortUp} className="ml-3" />
                        ) : (
                          <FontAwesomeIcon icon={faSortDown} className="ml-3" />
                        )
                      ) : (
                        <FontAwesomeIcon icon={faSort} className="ml-3" />
                      )}
                    </th>
                    <th
                      className="py-4 md:px-6 text-center cursor-pointer min-w-[150px] md:min-w-[200px] max-w-full"
                      onClick={() => requestSort("collegename")}
                    >
                      College Name
                      {sortConfig.key === "collegename" ? (
                        sortConfig.direction === "ascending" ? (
                          <FontAwesomeIcon icon={faSortUp} className="ml-3" />
                        ) : (
                          <FontAwesomeIcon icon={faSortDown} className="ml-3" />
                        )
                      ) : (
                        <FontAwesomeIcon icon={faSort} className="ml-3" />
                      )}
                    </th>
                    <th
                      className="py-4 md:px-6 text-center cursor-pointer min-w-[150px] md:min-w-[200px] max-w-full"
                      onClick={() => requestSort("year")}
                    >
                      Year
                      {sortConfig.key === "year" ? (
                        sortConfig.direction === "ascending" ? (
                          <FontAwesomeIcon icon={faSortUp} className="ml-3" />
                        ) : (
                          <FontAwesomeIcon icon={faSortDown} className="ml-3" />
                        )
                      ) : (
                        <FontAwesomeIcon icon={faSort} className="ml-3" />
                      )}
                    </th>
                    <th className="py-4 md:px-6 text-center min-w-[150px] md:min-w-[200px] max-w-full">
                      Report
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center text-gray-500 py-4"
                      >
                        No students found
                      </td>
                    </tr>
                  ) : (
                    currentStudents.map((student) => (
                      <tr
                        key={student.regno || student.registration_number}
                        className="border-t bg-white hover:bg-[#ECF2FE]"
                      >
                        <td className="py-2 px-1 md:py-4 md:px-6 text-left capitalize min-w-0 truncate">
                          {student.name}
                        </td>
                        <td className="py-2 px-1 md:py-4 md:px-6 text-left min-w-0 truncate">
                          {student.regno}
                        </td>
                        <td className="py-2 px-1 md:py-4 md:px-6 text-center uppercase min-w-0 truncate">
                          {student.department || student.dept}
                        </td>
                        <td className="py-2 px-1 md:py-4 md:px-6 text-center uppercase min-w-0 truncate">
                          {student.college_name || student.collegename}
                        </td>
                        <td className="py-2 px-1 md:py-4 md:px-6 text-center min-w-0">
                          {student.year}
                        </td>
                        <td className="py-2 px-1 md:py-4 md:px-6 flex justify-center">
                          <Button
                            onClick={() =>
                              handleViewReport(
                                student.regno || student.registration_number
                              )
                            }
                          >
                            <DescriptionIcon sx={{ color: "#111933" }} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {filteredStudents.length > 0 && (
            <div className="flex justify-center py-3 md:mt-6 md:p-0">
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                shape="circular"
                color="primary"
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#111933",
                    "&.Mui-selected": {
                      backgroundColor: "#111933",
                      color: "#fff",
                    },
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Filter dialog remains unchanged */}
        <Dialog
          open={openFilterDialog}
          onClose={handleFilterDialogClose}
          fullWidth
          maxWidth="md"
          PaperProps={{
            style: {
              width: "730px",
              height: "660px",
              borderRadius: 26,
              backgroundColor: "#fff",
            },
          }}
          BackdropProps={{
            className: "fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm",
          }}
          TransitionProps={{ unmountOnExit: true }}
        >
          <DialogTitle
            sx={{
              fontWeight: "bold",
              mb: 1,
              color: "#111933",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Filter Options
            <IconButton
              onClick={handleFilterDialogClose}
              sx={{ color: "#111933" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ paddingTop: 0, paddingBottom: 0 }}>
            <Typography
              variant="h6"
              sx={{ mb: 1, fontWeight: "bold", color: "#111933" }}
            >
              Institution
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {[
                "SNSCT",
                "SNSCE",
                "SNS Spine",
                "SNS Nursing",
                "SNS Pharmacy",
                "SNS Health Science",
                "SNS Academy",
                "SNS Physiotherapy",
              ].map((college) => (
                <Chip
                  key={college}
                  label={college}
                  clickable
                  onClick={() => toggleFilter("collegename", college)}
                  sx={{
                    cursor: "pointer",
                    backgroundColor:
                      staffCollege === college ? "#111933" : "#fff",
                    color: staffCollege === college ? "#fff" : "#202224",
                    width: "140px",
                    height: "35px",
                    display: "flex",
                    border: "1px solid #202224",
                    fontSize: "18px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "17px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                />
              ))}
            </Box>

            <Typography
              variant="h6"
              sx={{ mt: 2, mb: 1, fontWeight: "bold", color: "#111933" }}
            >
              Year
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {Object.keys(yearMapping).map((year) => (
                <Chip
                  key={year}
                  label={yearMapping[year]}
                  clickable
                  onClick={() => toggleFilter("year", year)}
                  sx={{
                    cursor: "pointer",
                    backgroundColor: yearFilter.includes(year)
                      ? "#111933"
                      : "#fff",
                    color: yearFilter.includes(year) ? "#fff" : "#111933",
                    width: "140px",
                    height: "35px",
                    display: "flex",
                    border: "1px solid #202224",
                    fontSize: "18px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "17px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    "&:hover": {
                      backgroundColor: "#111933",
                      color: "#fff",
                    },
                  }}
                />
              ))}
            </Box>
{/* Department chips */}
<Typography
  variant="h6"
  sx={{ mt: 2, mb: 1, fontWeight: "bold", color: "#111933" }}
>
  Department
</Typography>
<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
  {Array.isArray(staffDepartment) ? (
    staffDepartment.map((dept) => (
      <Chip
        key={dept}
        label={typeof dept === 'string' ? dept.toUpperCase() : ''}
        clickable
        onClick={() => toggleFilter("dept", dept)}
        sx={{
          cursor: "pointer",
          backgroundColor: departmentFilter.includes(dept)
            ? "#111933"
            : "#fff",
          color: departmentFilter.includes(dept)
            ? "#fff"
            : "#111933",
          width: "140px",
          height: "35px",
          display: "flex",
          border: "1px solid #202224",
          fontSize: "18px",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "17px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      />
    ))
  ) : (
    <p>No departments available</p>
  )}
</Box>
            <p className="text-gray-500">*You can choose multiple Order type</p>
          </DialogContent>
          <DialogActions
            sx={{
              display: "flex",
              justifyContent: "center",
              paddingTop: 0,
              paddingBottom: 5,
              gap: 4,
            }}
          >
            <Button
              onClick={clearFilters}
              variant="outlined"
              sx={{
                color: "#111933",
                borderColor: "#111933",
                borderRadius: "10px",
                fontSize: "16px",
                width: "196px",
                height: "40px",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                gap: "8px",
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
                borderRadius: "10px",
                width: "196px",
                height: "40px",
                fontSize: "16px",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                gap: "8px",
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
      </div>
    </div>
  );
};

export default StaffStudentProfile;