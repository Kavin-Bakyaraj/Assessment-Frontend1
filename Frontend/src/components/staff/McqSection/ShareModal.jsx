import React, { useState, useEffect } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmailIcon from "@mui/icons-material/Email";
import { FaWhatsapp } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

const ShareModal = ({ open, onClose, shareLink, selectedStudents = [], testName = "Assessment" }) => {
  const [copied, setCopied] = useState(false);
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
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
    
    // Check localStorage first
    try {
      const storedData = localStorage.getItem('selectedStudentEmails');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log("Found data in localStorage:", parsedData);
        
        if (Array.isArray(parsedData)) {
          // Filter to only include emails for currently selected students
          const emails = parsedData
            .filter(student => selectedStudents.includes(student.regno))
            .map(student => student.email)
            .filter(Boolean); // Remove any undefined/null emails
          
          console.log(`Found ${emails.length} email(s) from localStorage for ${selectedStudents.length} selected student(s)`);
          
          if (emails.length > 0) {
            setStudentEmails(emails);
            setIsLoading(false);
            return;
          } else {
            // If no matching emails found, we'll need to fetch from API
            console.log("No matching emails found in localStorage, will fetch from API");
          }
        }
      } else {
        console.log("No student email data found in localStorage");
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }
    
    // If we get here, we need to fetch from API
    const fetchStudentEmails = async () => {
      if (selectedStudents.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("Fetching student emails from API");
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${API_BASE_URL}/studentprofile/`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`API returned status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.students) {
          // Filter students by registration numbers and extract emails
          const emails = data.students
            .filter(student => selectedStudents.includes(student.regno))
            .map(student => student.email)
            .filter(Boolean); // Remove any undefined/null emails
          
          console.log(`Found ${emails.length} email(s) from API for ${selectedStudents.length} selected student(s)`);
          
          // Save all student data to localStorage
          const selectedStudentData = data.students
            .filter(student => selectedStudents.includes(student.regno))
            .map(student => ({
              regno: student.regno,
              email: student.email,
              name: student.name
            }));
          localStorage.setItem('selectedStudentEmails', JSON.stringify(selectedStudentData));
          
          setStudentEmails(emails);
        } else {
          console.error("Invalid API response format:", data);
          throw new Error("Invalid response format from server");
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 sec
  };
  
  const handleEmailShare = () => {
    if (studentEmails.length === 0) {
      console.warn("No student emails available to share");
      setErrorMessage("No valid student emails found for the selected students");
      return;
    }
    
    console.log("Sharing email with:", studentEmails);
    
    // Prepare email content
    const subject = encodeURIComponent(`Invitation to take ${testName}`);
    const body = encodeURIComponent(
      `Hello,\n\nYou have been invited to take part in an assessment. Please use the following link to access it:\n\n${shareLink}\n\nRegards,\n${staffEmail || 'Assessment Team'}`
    );
    
    // Create mailto link with all student emails
    const toEmails = studentEmails.join(',');
    const mailtoLink = `mailto:${toEmails}?subject=${subject}&body=${body}`;
    
    // Open email client
    window.open(mailtoLink, '_blank');
    setShowEmailSuccess(true);
    setTimeout(() => setShowEmailSuccess(false), 2000);
  };

  // Create a handleClose function to clear localStorage on close
  const handleClose = () => {
    // Clear the localStorage when closing the modal
    localStorage.removeItem('selectedStudentEmails');
    // Call the original onClose function
    onClose();
  };

  if (!open) return null; // Prevent rendering when closed

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-xl text-center">
        {/* Title */}
        <h2 className="text-xl font-semibold mb-6 text-[#111933]">Share Assessment Link</h2>

        {/* Share Options */}
        <div className="flex justify-center mb-6 gap-8">
          {/* WhatsApp Share Button - Modern Icon */}
          <button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${testName}: ${shareLink}`)}`, "_blank")}
            className="flex flex-col items-center"
          >
            <div className="bg-[#25D366] hover:bg-[#128C7E] transition-colors duration-300 w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-lg">
              <FaWhatsapp className="text-white text-3xl" />
            </div>
            <span className="text-sm text-gray-700">WhatsApp</span>
          </button>

          {/* Email Share Button */}
          {/* <button
            onClick={handleEmailShare}
            className="flex flex-col items-center"
            disabled={isLoading}
          >
            <div className={`${isLoading ? 'bg-gray-400' : 'bg-[#EA4335] hover:bg-[#D93025]'} transition-colors duration-300 w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-lg`}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <EmailIcon className="text-white text-3xl" />
              )}
            </div>
            <span className="text-sm text-gray-700">Email</span>
          </button> */}
        </div>

        {/* Link Input + Copy Button */}
        <div className="flex items-center border border-[#111933] rounded-lg overflow-hidden bg-white mb-4 px-3 py-3">
          <input
            type="text"
            value={shareLink}
            readOnly
            className="w-full text-sm text-[#111933] bg-transparent outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-300"
            title="Copy link"
          >
            <ContentCopyIcon fontSize="medium" className="text-[#111933]" />
          </button>
        </div>

        {/* Notification Messages */}
        <div className="h-6 mb-4">
          {copied && <p className="text-green-600 text-sm">✅ Link copied to clipboard!</p>}
          {showEmailSuccess && <p className="text-green-600 text-sm">✅ Email client opened!</p>}
          {errorMessage && <p className="text-red-600 text-sm">❌ {errorMessage}</p>}
        </div>

        {/* Student Email Count */}
        <div className="mb-4">
          {isLoading ? (
            <p className="text-sm text-gray-600">Loading student emails...</p>
          ) : studentEmails.length > 0 ? (
            <p className="text-sm text-gray-600">
              {studentEmails.length} student email{studentEmails.length !== 1 ? 's' : ''} will receive this assessment
            </p>
          ) : selectedStudents.length > 0 ? (
            <p className="text-sm text-amber-600">No valid email addresses found for selected students</p>
          ) : null}
        </div>

        {/* Close Button */}
        <div className="flex justify-center">
          <button
            onClick={handleClose}
            className="bg-[#111933] text-white px-5 py-2 rounded-lg hover:bg-opacity-90 transition-colors duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;