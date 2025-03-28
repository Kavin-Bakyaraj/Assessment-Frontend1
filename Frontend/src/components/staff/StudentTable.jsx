import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Pagination,
  IconButton,
  Alert,
  CircularProgress
} from "@mui/material";
import axios from "axios";
import { FaCheckCircle } from "react-icons/fa";
import { IoCloseCircleOutline } from "react-icons/io5";
import {
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';

// Define yearMapping for year conversion
const yearMapping = {
  "I": "1st Year",
  "II": "2nd Year",
  "III": "3rd Year",
  "IV": "4th Year"
};

const StudentTable = ({
  students: initialStudents = [],
  selectedStudents,
  setSelectedStudents,
  filters,
  setFilters,
  sortConfig,
  setSortConfig,
  page,
  setPage,
  rowsPerPage = 6,
  openFilterDialog,
  setOpenFilterDialog,
  testDetails = {}
}) => {
  console.log(filters.collegename);

  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const fixedRowsPerPage = 6;

  const [staffInfo, setStaffInfo] = useState({
    role: "Staff",
    department: [],
    college: ""
  });
  console.log("staffInfo", staffInfo)
  useEffect(() => {
    const fetchStudentsData = async () => {
      setLoading(true);
      setError(null);

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const response = await axios.get(`${API_BASE_URL}/studentprofile/`, {
          withCredentials: true
        });

        if (response.data && response.data.students) {
          setAllStudents(response.data.students);

          let deptData = response.data.staffDepartment;
          if (!deptData) {
            deptData = [];
          } else if (!Array.isArray(deptData)) {
            deptData = [deptData];
          }
          console.log("filters", filters)
          setStaffInfo({
            role: response.data.staffRole || "Staff",
            department: deptData || [],
            college: (response.data.staffCollege || "").toLowerCase(),
          });
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Failed to load students. Please try again later.");

        if (initialStudents && initialStudents.length > 0) {
          setAllStudents(initialStudents);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsData();
  }, []);

  useEffect(() => {
    const applyFilters = () => {
      if (!allStudents || allStudents.length === 0) {
        setFilteredStudents([]);
        return;
      }

      let filtered = [...allStudents];

      if (filters.dept && filters.dept.length > 0) {
        filtered = filtered.filter(student =>
          filters.dept.some(dept =>
            student.dept?.toLowerCase() === dept?.toLowerCase()
          )
        );
      } else if (staffInfo.role !== 'Admin' && staffInfo.role !== 'Principal' && staffInfo.department.length > 0) {
        filtered = filtered.filter(student =>
          staffInfo.department.some(dept =>
            student.dept?.toLowerCase() === dept?.toLowerCase()
          )
        );
      }

      if (filters.collegename && filters.collegename.length > 0 && staffInfo.role === 'Admin') {
        filtered = filtered.filter(student =>
          filters.collegename.some(college =>
            student.collegename?.toLowerCase() === college?.toLowerCase()
          )
        );
      }

      if (filters.year) {
        filtered = filtered.filter(student => student.year === filters.year);
      }

      if (searchQuery.trim() !== "") {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (student) =>
            student.name?.toLowerCase().includes(lowerQuery) ||
            student.regno?.toLowerCase().includes(lowerQuery)
        );
      }

      setFilteredStudents(filtered);
      setPage(0);
    };

    applyFilters();
  }, [allStudents, filters, searchQuery, setPage, staffInfo]);

  // Add this effect to save selected students' data to sessionStorage whenever the selection changes
// Update the useEffect for saving selected students

useEffect(() => {
  if (!selectedStudents || selectedStudents.length === 0) {
    // Do NOT clear storage when no selections - we'll clear on modal close instead
    return;
  }

  // Filter the allStudents array to get only the selected students' data
  const selectedStudentData = allStudents
    .filter(student => selectedStudents.includes(student.regno))
    .map(student => ({
      regno: student.regno,
      email: student.email,
      name: student.name
    }));

  // Store in localStorage
  localStorage.setItem('selectedStudentEmails', JSON.stringify(selectedStudentData));
}, [selectedStudents, allStudents]);

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

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedStudents = useMemo(() => {
    let sortableStudents = [...filteredStudents];
    if (sortConfig.key) {
      sortableStudents.sort((a, b) => {
        if (!a[sortConfig.key]) return 1;
        if (!b[sortConfig.key]) return -1;

        if (a[sortConfig.key].toLowerCase() < b[sortConfig.key].toLowerCase()) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key].toLowerCase() > b[sortConfig.key].toLowerCase()) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableStudents;
  }, [filteredStudents, sortConfig]);

  const handleFilterDialogOpen = () => {
    setOpenFilterDialog(true);
  };

  const handleFilterDialogClose = () => {
    setOpenFilterDialog(false);
  };

  const applyFilters = () => {
    setOpenFilterDialog(false);
  };
  

  const clearFilters = () => {
    setFilters({
      collegename: [],
      dept: [],
      year: ""
    });
    setOpenFilterDialog(false);
  };

  

  const toggleFilter = (filterType, value) => {
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters };

      if (filterType === "dept") {
        if (staffInfo.role !== 'Admin') {
          return updatedFilters; // Staff cannot change department filters
        }

        if (!Array.isArray(updatedFilters[filterType])) {
          updatedFilters[filterType] = [];
        }

        const valueIndex = updatedFilters[filterType].findIndex(
          item => item.toLowerCase() === value.toLowerCase()
        );

        if (valueIndex >= 0) {
          updatedFilters[filterType] = [
            ...updatedFilters[filterType].slice(0, valueIndex),
            ...updatedFilters[filterType].slice(valueIndex + 1)
          ];
        } else {
          updatedFilters[filterType] = [...updatedFilters[filterType], value];
        }
      } else if (filterType === "collegename") {
        if (staffInfo.role !== 'Admin') {
          return updatedFilters; // Staff cannot change college filters
        }

        if (!Array.isArray(updatedFilters[filterType])) {
          updatedFilters[filterType] = [];
        }

        const valueIndex = updatedFilters[filterType].findIndex(
          item => item.toLowerCase() === value.toLowerCase()
        );

        if (valueIndex >= 0) {
          updatedFilters[filterType] = [
            ...updatedFilters[filterType].slice(0, valueIndex),
            ...updatedFilters[filterType].slice(valueIndex + 1)
          ];
        } else {
          updatedFilters[filterType] = [...updatedFilters[filterType], value];
        }
      } else if (filterType === "year") {
        updatedFilters[filterType] = updatedFilters[filterType] === value ? "" : value;
      }

      return updatedFilters;
    });
  };

  const normalizeString = (str) => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const handlePageChange = (event, value) => {
    setPage(value - 1);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="300px"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={40} sx={{ color: "#111933" }} />
        <Typography variant="body1">Loading students data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" }, // Stack on mobile, row on sm+
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" }, // Align left on mobile, center on sm+
          gap: { xs: 1, sm: 0 }, // Add gap on mobile
          px: { xs: 1, sm: 0 }, // Reduce padding on mobile
        }}
      >
        <DialogTitle
          sx={{
            mt: { xs: 0, sm: -1 }, // Adjust margin-top for mobile
            marginLeft: { xs: 0, sm: "-19px" }, // Remove negative margin on mobile
            fontSize: { xs: "1.25rem", sm: "1.5rem" }, // Smaller title on mobile
            padding: { xs: '0', sm: "25px" }
          }}
        >
          Select Students
        </DialogTitle>

        <div className="flex gap-2">
          <TextField
            placeholder="Search students..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: "text-gray-500" }} />,
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                padding: { xs: "0 4px", sm: "2px 8px" }, // Reduce padding on mobile
                ml: { xs: 0, sm: 55 }, // Remove margin-left on mobile
                mt: { xs: 0, sm: 2 }, // Adjust margin-top
                color: "rgb(107 114 128)",
                fontSize: { xs: "0.875rem", sm: "1rem" }, // Smaller font on mobile
                width: { xs: "100%", sm: "390px" }, // Full width on mobile, fixed on sm+
              },
              "& .MuiInputBase-input": {
                paddingLeft: { xs: "32px", sm: "40px" }, // Adjust padding for icon
                paddingRight: "12px",
                lineHeight: "1.25rem",
              },
            }}
          />

          <Button
            variant="outlined"
            onClick={handleFilterDialogOpen}
            sx={{
              borderColor: "#111933",
              backgroundColor: "#111933",
              mt: { xs: 0, sm: 2 }, // Adjust margin-top
              color: "#fff",
              "&:hover": {
                color: "#111933",
                borderColor: "#111933",
                backgroundColor: "#fff",
              },
              width: { sm: "auto" }, // Full width on mobile
              py: 1, // Consistent padding
            }}
          >
            <span className="hidden sm:flex">Filter</span>
            <FilterListIcon className="sm:ml-2" />
          </Button>
        </div>
      </Box>

      {/* Second row: The "hello" span */}
      <Box
        sx={{
          mb: 3,
          mt: { xs: 1, sm: -2 }, // Adjust margin-top
          ml: { xs: 1, sm: 1 },
          mr: { xs: 1, sm: 5 },
          fontSize: { xs: "0.875rem", sm: "1rem" }, // Smaller text on mobile
        }}
      >
        <span>Select the students who are all need to be assigned to this assessment.</span>
      </Box>

      {filteredStudents.length === 0 ? (
        <Box
          sx={{
            p: { xs: 2, sm: 4 }, // Reduce padding on mobile
            textAlign: "center",
            border: "1px solid #e0e0e0",
            borderRadius: 1,
          }}
        >
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }} // Smaller text on mobile
          >
            No students found matching the current filters.
          </Typography>
        </Box>
      ) : (
        <>
          <div className="overflow-x-auto">
            <TableContainer component={Paper} sx={{ border: "1px solid grey" }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: "", color: "white" }}>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ width: "40px", minWidth: "40px" }}>
                      <Checkbox
                        indeterminate={
                          selectedStudents.length > 0 &&
                          selectedStudents.length < filteredStudents.length
                        }
                        checked={
                          filteredStudents.length > 0 &&
                          selectedStudents.length === filteredStudents.length
                        }
                        onChange={handleSelectAll}
                        sx={{
                          color: "grey-500",
                          "&.Mui-checked": {},
                          "&.MuiCheckbox-indeterminate": {
                            color: "grey-500",
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        cursor: "pointer",
                        color: "#111933",
                        minWidth: "120px",
                        position: "relative",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          right: { xs: 0, sm: 50 },
                          top: "25%",
                          height: "50%",
                          width: "1px",
                          backgroundColor: "#111933",
                        },
                        padding: { xs: "8px", sm: "16px" },
                      }}
                      onClick={() => requestSort("name")}
                    >
                      Name{" "}
                      {sortConfig.key === "name" && (
                        sortConfig.direction === "asc" ? (
                          <FontAwesomeIcon icon={faSortUp} className="ml-2" />
                        ) : (
                          <FontAwesomeIcon icon={faSortDown} className="ml-2" />
                        )
                      )}
                      {sortConfig.key !== "name" && <FontAwesomeIcon icon={faSort} className="ml-2" />}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        color: "#111933",
                        minWidth: "140px",
                        position: "relative",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          right: { xs: 0, sm: 50 },
                          top: "25%",
                          height: "50%",
                          width: "1px",
                          backgroundColor: "#111933",
                        },
                        padding: { xs: "8px", sm: "16px" },
                      }}
                      onClick={() => requestSort("regno")}
                    >
                      Registration Number
                      {sortConfig.key === "regno" && (
                        sortConfig.direction === "asc" ? (
                          <FontAwesomeIcon icon={faSortUp} className="ml-2" />
                        ) : (
                          <FontAwesomeIcon icon={faSortDown} className="ml-2" />
                        )
                      )}
                      {sortConfig.key !== "regno" && <FontAwesomeIcon icon={faSort} className="ml-2" />}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        cursor: "pointer",
                        color: "#111933",
                        minWidth: "120px",
                        position: "relative",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          right: { xs: 0, sm: 50 },
                          top: "25%",
                          height: "50%",
                          width: "1px",
                          backgroundColor: "#111933",
                        },
                        padding: { xs: "8px", sm: "16px" },
                      }}
                      onClick={() => requestSort("dept")}
                    >
                      Department{" "}
                      {sortConfig.key === "dept" && (
                        sortConfig.direction === "asc" ? (
                          <FontAwesomeIcon icon={faSortUp} className="ml-2" />
                        ) : (
                          <FontAwesomeIcon icon={faSortDown} className="ml-2" />
                        )
                      )}
                      {sortConfig.key !== "dept" && <FontAwesomeIcon icon={faSort} className="ml-2" />}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        cursor: "pointer",
                        color: "#111933",
                        minWidth: "120px",
                        position: "relative",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          right: { xs: 0, sm: 50 },
                          top: "25%",
                          height: "50%",
                          width: "1px",
                          backgroundColor: "#111933",
                        },
                        padding: { xs: "8px", sm: "16px" },
                      }}
                      onClick={() => requestSort("collegename")}
                    >
                      College Name{" "}
                      {sortConfig.key === "collegename" && (
                        sortConfig.direction === "asc" ? (
                          <FontAwesomeIcon icon={faSortUp} className="ml-2" />
                        ) : (
                          <FontAwesomeIcon icon={faSortDown} className="ml-2" />
                        )
                      )}
                      {sortConfig.key !== "collegename" && <FontAwesomeIcon icon={faSort} className="ml-2" />}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        cursor: "pointer",
                        color: "#111933",
                        width: "80px",
                        minWidth: "80px",
                        padding: { xs: "8px", sm: "16px" },
                      }}
                    >
                      Year
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedStudents
                    .slice(page * fixedRowsPerPage, page * fixedRowsPerPage + fixedRowsPerPage)
                    .map((student) => (
                      <TableRow key={student.regno} hover>
                        <TableCell padding="checkbox" sx={{ width: "40px", minWidth: "40px" }}>
                          <Checkbox
                            checked={selectedStudents.includes(student.regno)}
                            onChange={() => handleStudentSelect(student.regno)}
                            disabled={testDetails?.visible_to?.includes(student.regno) || false}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: "120px", padding: { xs: "8px", sm: "16px" } }}>
                          {student.name}
                        </TableCell>
                        <TableCell sx={{ minWidth: "140px", padding: { xs: "8px", sm: "16px" } }}>
                          {student.regno}
                        </TableCell>
                        <TableCell sx={{ minWidth: "120px", padding: { xs: "8px", sm: "16px" } }}>
                          {student.dept}
                        </TableCell>
                        <TableCell sx={{ minWidth: "120px", padding: { xs: "8px", sm: "16px" } }}>
                          {student.collegename}
                        </TableCell>
                        <TableCell sx={{ width: "80px", minWidth: "80px", padding: { xs: "8px", sm: "16px" } }}>
                          {student.year}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          <div className="flex justify-center mt-6">
            <Pagination
              count={Math.ceil(filteredStudents.length / fixedRowsPerPage)}
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
        </>
      )}

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
            color: "#111933",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: { xs: 1, sm: 2 },
            pb: { xs: 0.5, sm: 1 },
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          Filter Options
          <IconButton onClick={handleFilterDialogClose} sx={{ color: "#111933" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 2 }, pt: { xs: 0, sm: 0 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              fontWeight: "bold",
              color: "#111933",
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            Department
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.5, sm: 1 }, mb: 2 }}>
            {["AI&ML", "IT", "CSE", "AI&DS", "Mech", "EEE", "ECE", "CSD", "CST", "AERO", "MCT", "CIVIL", "Others"].map(
              (dept) => (
                <Chip
                  key={dept}
                  label={dept}
                  size="small"
                  clickable
                  onClick={() => toggleFilter("dept", dept)}
                  sx={{
                    cursor: "pointer",
                    backgroundColor: Array.isArray(staffInfo.department) && staffInfo.department.some(d => normalizeString(d) === normalizeString(dept)) ? "#111933" : "#fff",
                    color: Array.isArray(staffInfo.department) && staffInfo.department.some(d => normalizeString(d) === normalizeString(dept)) ? "#fff" : "#202224",

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
              )
            )}
          </Box>

          <Typography
            variant="h6"
            sx={{
              mt: 2,
              mb: 1,
              fontWeight: "bold",
              color: "#111933",
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            Institution
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.5, sm: 1 }, mb: 2 }}>
            {["SNSCT", "SNSCE", "SNS Spine", "SNS Nursing", "SNS Pharmacy", "SNS Health Science", "SNS Academy", "SNS Physiotherapy"].map(
              (college) => (
                <Chip
                  key={college}
                  label={college}
                  size="small"
                  clickable
                  onClick={() => toggleFilter("collegename", college)}
                  sx={{
                    cursor: "pointer",
                    backgroundColor: staffInfo.college.toLowerCase() === college.toLowerCase() ? "#111933" : "#fff",
                    color: staffInfo.college.toLowerCase() === college.toLowerCase() ? "#fff" : "#202224",
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
              )
            )}
          </Box>

          <Typography
            variant="h6"
            sx={{
              mt: 2,
              mb: 1,
              fontWeight: "bold",
              color: "#111933",
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            Year
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 0.5, sm: 1 }, mb: 0 }}>
            {["I", "II", "III", "IV"].map((year) => (
              <Chip
                key={year}
                label={year}
                size="small"
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
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1, sm: 2 }, pt: { xs: 0.5, sm: 1 }, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1, sm: 4 } }}>
          <Button
            onClick={clearFilters}
            variant="outlined"
            sx={{
              color: "#111933",
              borderColor: "#111933",
              borderRadius: '10px',
              width: { xs: "100%", sm: "196px" },
              height: "40px",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
              gap: "8px",
              "&:hover": {
                backgroundColor: "#fff",
                color: "#111933",
              },
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
              width: { xs: "100%", sm: "196px" },
              height: "40px",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
              gap: "8px",
              "&:hover": {},
            }}
          >
            Apply Filters
            <div className="rounded-full border border-white">
              <FaCheckCircle className="text-white" />
            </div>
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
};

export default StudentTable;
