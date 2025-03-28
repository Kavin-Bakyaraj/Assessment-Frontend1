import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import CopyIcon from '@mui/icons-material/FileCopy';
import WhatsAppIcon from '../../../assets/icons/wp.png';
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import EmailIcon from '@mui/icons-material/Email'; // Import EmailIcon

const ShareModal = ({ open, onClose, shareLink, selectedStudents = [], testName = "Assessment" }) => {
  const [finalLink, setFinalLink] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [studentEmails, setStudentEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Get staff email from JWT token
  useEffect(() => {
    const getStaffEmail = () => {
      try {
        // Get token from cookies
        const token = Cookies.get('access_token') || localStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          // Extract email from the decoded token
          if (decoded && decoded.email) {
            setStaffEmail(decoded.email);
          }
        }
      } catch (error) {
        console.error("Error decoding JWT token:", error);
      }
    };

    getStaffEmail();
  }, []);

  // Get student emails from localStorage when modal opens
  useEffect(() => {
    if (!open) return;

    setIsLoading(true);
    setErrorMessage("");

    console.log("Modal opened, checking for student emails in localStorage");
    console.log("Selected students:", selectedStudents);

    // Directly check if selectedStudents array is empty
    if (!selectedStudents || selectedStudents.length === 0) {
      console.log("No students selected");
      setIsLoading(false);
      return;
    }

    // Try to get emails from localStorage first
    const storedData = localStorage.getItem('selectedStudentEmails');
    console.log("Raw stored data:", storedData);

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log("Parsed localStorage data:", parsedData);

        // Simpler approach: extract all emails from localStorage and match by regno
        if (Array.isArray(parsedData)) {
          // Create a map of regno to email for quick lookup
          const emailMap = {};
          parsedData.forEach(student => {
            if (student.regno && student.email) {
              emailMap[student.regno] = student.email;
            }
          });

          console.log("Email map created:", emailMap);

          // Get emails for currently selected students
          const emails = selectedStudents
            .map(regno => emailMap[regno])
            .filter(Boolean);

          console.log("Selected student emails found:", emails);

          if (emails.length > 0) {
            setStudentEmails(emails);
            setIsLoading(false);
            return;
          } else {
            setErrorMessage("Selected students don't have email addresses in our system");
          }
        }
      } catch (error) {
        console.error("Error parsing localStorage data:", error);
      }
    }

    // Fallback to API request if localStorage didn't have what we need
    const fetchStudentEmails = async () => {
      console.log("Fetching student emails from API");
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${API_BASE_URL}/studentprofile/`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`API returned status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API response:", data);

        if (data && data.students) {
          // Create a map of student registration numbers to emails
          const studentMap = {};
          data.students.forEach(student => {
            if (student.regno) {
              studentMap[student.regno] = student;
            }
          });

          console.log("Created student map:", studentMap);

          // Extract emails
          const emails = [];
          const studentDataForStorage = [];

          selectedStudents.forEach(regno => {
            if (studentMap[regno] && studentMap[regno].email) {
              emails.push(studentMap[regno].email);
              studentDataForStorage.push({
                regno: regno,
                email: studentMap[regno].email,
                name: studentMap[regno].name || ''
              });
            }
          });

          console.log("Emails found from API:", emails);

          // Save to localStorage for future use (even if empty)
          localStorage.setItem('selectedStudentEmails', JSON.stringify(studentDataForStorage));

          if (emails.length > 0) {
            setStudentEmails(emails);
          } else {
            setErrorMessage("Selected students don't have email addresses in our system");
          }
        } else {
          throw new Error("Invalid API response format");
        }
      } catch (error) {
        console.error("Error fetching student emails:", error);
        setErrorMessage("Failed to fetch student emails. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentEmails();
  }, [open, selectedStudents]);

  useEffect(() => {
    if (shareLink) {
      // Extract the contestId part from the shareLink
      const parts = shareLink.split('/');
      const contestId = parts[parts.length - 1];

      // Create the complete URL with the correct domain
      const baseUrl = window.location.origin; // This gets the current domain
      const fullLink = `${baseUrl}/testinstructions/${contestId}`;
      setFinalLink(fullLink);
    }
  }, [shareLink]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(finalLink).then(() => {
      setSnackbarOpen(true);
    }).catch((err) => {
      console.error('Failed to copy link: ', err);
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const getWhatsAppShareLink = () => {
    const message = `Join this assessment: ${finalLink}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const handleEmailShare = () => {
    if (studentEmails.length === 0) {
      console.warn("No student emails available for sending");
      setErrorMessage("No valid student emails found for the selected students");
      return;
    }

    // Prepare email content
    const subject = encodeURIComponent(`Invitation to take ${testName}`);
    const body = encodeURIComponent(
      `Hello,\n\nYou have been invited to take part in an assessment. Please use the following link to access it:\n\n${finalLink}\n\nRegards,\n${staffEmail || 'Assessment Team'}`
    );

    // Create mailto link with all student emails
    const toEmails = studentEmails.join(',');
    const mailtoLink = `mailto:${toEmails}?subject=${subject}&body=${body}`;

    // Open email client
    window.location.href = mailtoLink;
    //setShowEmailSuccess(true);
    //setTimeout(() => setShowEmailSuccess(false), 2000);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          style: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        <DialogContent
          sx={{
            backgroundColor: '#f9faff',
            borderRadius: '12px',
            boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.15)',
            p: 4,
            textAlign: 'center',
          }}
        >
          <DialogTitle sx={{ color: '#111933', fontWeight: 'bold', fontSize: '30px' }}>Share Link</DialogTitle>
          <Box display="flex" justifyContent="center" mb={2}>
            <IconButton
              onClick={() => window.open(getWhatsAppShareLink(), "_blank")}
              disabled={!finalLink}
            >
              <img src={WhatsAppIcon} className='w-16 h-16' alt="WhatsApp" />
            </IconButton>
            <IconButton
              onClick={handleEmailShare}
              disabled={isLoading || studentEmails.length === 0}
            >
              <EmailIcon className="text-white text-3xl" />
            </IconButton>
          </Box>
          <Box display="flex" alignItems="center" mb={2}>
            <TextField
              fullWidth
              value={finalLink || "Generating link..."}
              InputProps={{
                readOnly: true,
              }}
              sx={{
                '& .MuiInputBase-root': {
                  color: '#111933',
                  borderRadius: '8px',
                },
              }}
            />
            <IconButton onClick={handleCopyLink} sx={{ ml: 2 }} disabled={!finalLink}>
              <CopyIcon sx={{
                color: '#111933'
              }} />
            </IconButton>
          </Box>
          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              backgroundColor: '#111933',
              '&:hover': {
                backgroundColor: '#1a2346',
              }
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareModal;